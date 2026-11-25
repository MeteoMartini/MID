// MID RUC deterministic 0..27h *directory-only* coverage probe.
// Not GRIB admission, does not publish, does not query EPS, does not amend Fast 0..6h.
// This QA tool is intentionally disjoint from the signed live Pages/Worker publisher.
export const FIELDS=["T_2M","TD_2M","RELHUM_2M","PMSL","U_10M","V_10M","VMAX_10M","TOT_PREC","CLCT","CLCL","CAPE_ML","CIN_ML"];
const MAX_INDEX_BYTES=2_000_000;
const MAX_PAGES_BYTES=900_000_000;
const DWD_ORIGIN='https://opendata.dwd.de';
const DWD_PATH=new RegExp('^/weather/nwp/v1/m/icon-d2-ruc/p/(?:'+FIELDS.join('|')+')/r/(20\\d\\d-\\d\\d-\\d\\dT\\d\\d:00)/s/$');
function canonicalDirectory(value){
  if(typeof value!=='string')throw Error('invalid DWD original directory URL');
  let base;
  try{base=new URL(value)}catch{throw Error('invalid DWD original directory URL')}
  const match=DWD_PATH.exec(base.pathname);
  if(base.origin!==DWD_ORIGIN||base.username||base.password||base.search||base.hash||
     value!==DWD_ORIGIN+base.pathname||value!==base.href||!match)
    throw Error('noncanonical DWD original directory URL');
  const epoch=Date.parse(match[1]+':00Z');
  if(!Number.isFinite(epoch)||new Date(epoch).toISOString().slice(0,16)!==match[1])
    throw Error('invalid UTC directory run');
  return base;
}
export async function readOriginalIndex(response,directoryUrl){
  canonicalDirectory(directoryUrl);
  if(response.status!==200||response.redirected||response.url!==directoryUrl||!response.body)
    throw Error('noncanonical DWD index response');
  const encoding=response.headers.get('content-encoding');
  const length=response.headers.get('content-length');
  const transfer=response.headers.get('transfer-encoding');
  if(encoding!==null&&encoding!=='identity')throw Error('unexpected DWD content encoding');
  if(length!==null&&(!/^[0-9]{1,10}$/.test(length)||Number(length)>MAX_INDEX_BYTES||transfer!==null))
    throw Error('untrusted DWD Content-Length');
  if(length===null&&transfer!=='chunked')throw Error('unverified DWD framing');
  const expected=length===null?null:Number(length);
  const reader=response.body.getReader();
  const decoder=new TextDecoder('utf-8',{fatal:true});
  let total=0,html='';
  try{
    for(;;){
      const {done,value}=await reader.read();
      if(done)break;
      if(!(value instanceof Uint8Array))throw Error('invalid DWD body chunk');
      total+=value.byteLength;
      if(total>MAX_INDEX_BYTES||(expected!==null&&total>expected))throw Error('DWD index byte limit exceeded');
      html+=decoder.decode(value,{stream:true});
    }
    if(expected!==null&&total!==expected)throw Error('incomplete DWD Content-Length');
    return html+decoder.decode();
  }catch(error){
    try{await reader.cancel();}catch{}
    throw error;
  }finally{reader.releaseLock();}
}

export function parseHourlyIndex(html,directoryUrl){
  if(typeof html!=='string'||Buffer.byteLength(html,'utf8')>MAX_INDEX_BYTES)throw Error('untrusted DWD index');
  const base=canonicalDirectory(directoryUrl);
  const leads=[];
  // The original directory listing is a bounded HTML document. Tokenize
  // complete tags, not substrings in data-href, quoted attributes or comments.
  const tags=/<!--[\s\S]*?(?:-->|$)|<\/?[A-Za-z][A-Za-z0-9:-]*(?:[^<>"']|"[^"]*"|'[^']*')*>/g;
  const inert=new Set(['script','style','textarea','title','xmp','iframe','noembed','noframes','noscript','template','plaintext']);
  let raw=null;
  for(const hit of html.matchAll(tags)){
    const tag=hit[0],name=/^<(\/?)([A-Za-z][A-Za-z0-9:-]*)(?=[\t\n\f\r />])/.exec(tag);
    if(!name)continue;
    const kind=name[2].toLowerCase();
    if(raw){if(name[1]&&kind===raw)raw=null;continue;}
    if(name[1])continue;
    if(inert.has(kind)){raw=kind;continue;}
    if(kind!=='a')continue;
    const attrs=tag.slice(name[0].length,-1);
    const token=/[\t\n\f\r ]+([^\t\n\f\r "'<>/=]+)(?:[\t\n\f\r ]*=[\t\n\f\r ]*(?:"([^"]*)"|'([^']*)'|([^\t\n\f\r "'=<>\x60]+)))?/gy;
    let pos=0,link=null,seen=false;
    while(pos<attrs.length){
      if(/^[\t\n\f\r ]*\/?$/.test(attrs.slice(pos)))break;
      token.lastIndex=pos;
      const attr=token.exec(attrs);
      if(!attr)throw Error('malformed DWD anchor attributes');
      pos=token.lastIndex;
      if(attr[1].toLowerCase()!=='href')continue;
      if(seen)throw Error('ambiguous DWD anchor href');
      seen=true;link=attr[2]??attr[3]??attr[4]??null;
    }
    if(!link)continue;
    // Only a canonical filename, exact absolute URL or exact root-relative
    // path from this directory is original evidence. Never normalize aliases.
    const file=link.startsWith(base.href)?link.slice(base.href.length):
      link.startsWith(base.pathname)?link.slice(base.pathname.length):link;
    const candidate=/^PT(\d{3})H00M\.grib2(?:\.bz2)?$/.exec(file);
    if(!candidate)continue;
    const hour=Number(candidate[1]);
    if(hour>27)continue;
    if(leads.includes(hour))throw Error('duplicate DWD original lead');
    leads.push(hour);
  }
  if(raw)throw Error('unclosed inert DWD HTML element');
  if(!leads.length)throw Error('no advertised hourly DWD originals');
  return leads.sort((a,b)=>a-b);
}
export function qualifyHorizon({run,observedAt,fieldHours,siteBytes=null,siteBudgetBytes=MAX_PAGES_BYTES}){
  if(typeof run!=='string'||!/^20\d\d-\d\d-\d\dT\d\d:00$/.test(run))throw Error('invalid UTC run');
  if(typeof observedAt!=='string'||!/^20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(observedAt))throw Error('invalid UTC observation time');
  const epoch=Date.parse(run+':00Z'),clock=Date.parse(observedAt);
  const canonicalObservation=observedAt.length===20?observedAt.slice(0,-1)+'.000Z':observedAt;
  if(!Number.isFinite(epoch)||!Number.isFinite(clock)||new Date(epoch).toISOString().slice(0,16)!==run||new Date(clock).toISOString()!==canonicalObservation)throw Error('invalid source/observation time');
  const ageMinutes=(clock-epoch)/60000;
  if(ageMinutes>240||ageMinutes < -5)throw Error('run outside original 4h freshness window');
  if(!fieldHours||typeof fieldHours!=='object'||Array.isArray(fieldHours))throw Error('untrusted field inventory');
  let commonH=27;
  for(const field of FIELDS){
    const hours=fieldHours[field];
    if(!Array.isArray(hours)||!hours.length||hours.length>28||hours.some(h=>!Number.isInteger(h)||h<0||h>27)||new Set(hours).size!==hours.length)throw Error('missing/invalid '+field+' inventory');
    const present=new Set(hours);
    let contiguous=-1;
    for(let i=0;i<=27;i++){if(!present.has(i))break;contiguous=i;}
    if(contiguous<0)throw Error('missing lead 0 in '+field+' inventory');
    commonH=Math.min(commonH,contiguous);
  }
  if(!Number.isSafeInteger(siteBudgetBytes)||siteBudgetBytes<=0||siteBudgetBytes>MAX_PAGES_BYTES)throw Error('untrusted site budget');
  if(siteBytes!==null&&(!Number.isSafeInteger(siteBytes)||siteBytes<0||siteBytes>siteBudgetBytes))throw Error('untrusted site byte count');
  const extraRawBytes=commonH>6?(commonH-6)*FIELDS.length*2*542_040:0;
  return {schema:'mid.ruc.deterministic-directory-coverage.v1',run,observedAt,ageMinutes,
    candidateHorizonHours:commonH,hasOriginalFastPrefix:commonH>=6,
    deterministicFields:FIELDS.length,spatialPointsExpected:542_040,
    additionalDeterministicRawBytes:extraRawBytes,
    siteBytesAssumed:siteBytes,siteBudgetBytes,
    remainingPagesBytes:siteBytes===null?null:siteBudgetBytes-siteBytes,
    rawAppendWouldFit:siteBytes===null?null:siteBytes+extraRawBytes<siteBudgetBytes,
    epsRequired:false,gribAdmitted:false,siteBytesVerified:false,
    publicationAuthorized:false,evidence:'DWD 12-field public directory inventory ONLY; GRIB/bitmap/physical-value/rollback/budget gate still mandatory'};
}

// Bounded read-only invocation: node tools/ruc/ruc_extended_directory_coverage.mjs 2026-11-23T08:00 [siteBytes]
if(process.argv[1]?.endsWith('/ruc_extended_directory_coverage.mjs')){
 const run=process.argv[2],siteText=process.argv[3];
 if(siteText!==undefined&&!/^\d+$/.test(siteText))throw Error('invalid siteBytes');
 if(!/^20\d\d-\d\d-\d\dT\d\d:00$/.test(run||''))throw Error('explicit canonical DWD run required');
 const fieldHours={};
 const base='https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/';
 for(let start=0;start<FIELDS.length;start+=3){
  await Promise.all(FIELDS.slice(start,start+3).map(async field=>{
   const directoryUrl=base+field+'/r/'+run+'/s/';
   canonicalDirectory(directoryUrl);
   const response=await fetch(directoryUrl,{signal:AbortSignal.timeout(12000),redirect:'error',headers:{Accept:'text/html','Accept-Encoding':'identity','User-Agent':'MID-data-RUC-deterministic-directory-probe/1.0'}});
   if(!response.ok)throw Error(field+' original DWD index HTTP '+response.status);
   fieldHours[field]=parseHourlyIndex(await readOriginalIndex(response,directoryUrl),directoryUrl);
  }));
 }
 const siteBytes=siteText===undefined?null:Number(siteText);
 const report=qualifyHorizon({run,observedAt:new Date().toISOString(),fieldHours,siteBytes});
 process.stdout.write(JSON.stringify(report)+'\n');
}
