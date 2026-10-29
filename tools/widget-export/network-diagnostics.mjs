// Metadata-only CDP network observations for MID widget captures.
// Request IDs and complete URLs are ephemeral; reports contain no URL, path,
// query, headers, cookies, bodies, coordinates or endpoint-derived strings.
const ALLOWED_TYPES=new Set(['Document','Fetch','XHR','Script','Stylesheet','Image','Font','Other']);
const CLASSES=['mid-origin','open-meteo','dwd','external','non-http'];
function sourceClass(input){
  try{
    const url=new URL(String(input||'')),host=url.hostname.toLowerCase();
    if(url.protocol!=='https:'&&url.protocol!=='http:')return 'non-http';
    if(host==='midwx.app'||host==='www.midwx.app')return 'mid-origin';
    if(host==='open-meteo.com'||host.endsWith('.open-meteo.com'))return 'open-meteo';
    if(host==='dwd.de'||host.endsWith('.dwd.de'))return 'dwd';
    return 'external';
  }catch{return 'non-http'}
}
function statusClass(status){
  if(!Number.isInteger(status)||status<100||status>599)return 'unknown';
  if(status===429)return 'rate-limited';
  return `${Math.floor(status/100)}xx`;
}
function failureClass(params){
  if(params?.canceled===true)return 'canceled';
  if(params?.blockedReason||params?.corsErrorStatus)return 'blocked-or-cors';
  const value=String(params?.errorText||'');
  if(/TIMEOUT|TIMED_OUT/i.test(value))return 'network-timeout';
  if(/DNS|NAME_NOT_RESOLVED|NAME_RESOLUTION/i.test(value))return 'dns';
  if(/CONNECTION|INTERNET_DISCONNECTED|NETWORK_CHANGED|ADDRESS_UNREACHABLE/i.test(value))return 'connection';
  if(/CERT|SSL|TLS/i.test(value))return 'tls';
  return 'other-network-failure';
}
function resourceType(value){return ALLOWED_TYPES.has(value)?value:'Other'}
function positiveDuration(start,end){return Number.isFinite(start)&&Number.isFinite(end)&&end>=start?Math.round((end-start)*1000):null}
export function createWidgetNetworkDiagnostics({limit=400}={}){
  const entries=new Map(),rows=new Map(CLASSES.map(k=>[k,{started:0,completed:0,failed:0,pending:0,status:{},errors:{},maxDurationMs:null}]));
  let seen=0,truncated=false,orphanEvents=0;
  const boundedLimit=Number.isInteger(limit)?Math.max(1,Math.min(2000,limit)):400;
  const row=category=>rows.get(category)||rows.get('non-http');
  function addCounter(object,key){object[key]=(object[key]||0)+1}
  function addStatus(entry,status){if(entry.statusRecorded)return;entry.statusRecorded=true;addCounter(row(entry.category).status,statusClass(status))}
  function finish(entry,timestamp,failed,reason){
    if(!entry)return;
    const group=row(entry.category);
    group.pending=Math.max(0,group.pending-1);
    if(failed){group.failed++;addCounter(group.errors,reason)}
    else group.completed++;
    const duration=positiveDuration(entry.startedAt,timestamp);
    if(duration!==null)group.maxDurationMs=Math.max(group.maxDurationMs??0,duration);
  }
  function observe(method,params={}){
    const id=typeof params.requestId==='string'&&params.requestId.length<=200?params.requestId:null;
    if(!id)return;
    if(method==='Network.requestWillBeSent'){
      if(entries.has(id)){
        const prev=entries.get(id);
        addStatus(prev,params.redirectResponse?.status);
        finish(prev,params.timestamp,false,'');
        entries.delete(id);
      }
      seen++;
      if(entries.size>=boundedLimit){truncated=true;return}
      const category=sourceClass(params.request?.url),record={category,startedAt:Number(params.timestamp),statusRecorded:false};
      entries.set(id,record);const group=row(category);group.started++;group.pending++;
      return;
    }
    const entry=entries.get(id);if(!entry){orphanEvents++;return}
    if(method==='Network.responseReceived'){addStatus(entry,params.response?.status);return}
    if(method==='Network.loadingFinished'){finish(entry,params.timestamp,false,'');entries.delete(id);return}
    if(method==='Network.loadingFailed'){
      finish(entry,params.timestamp,true,failureClass(params));
      entries.delete(id);
    }
  }
  function snapshot(){
    const groups=Object.fromEntries(CLASSES.map(category=>{
      const value=row(category);
      return [category,{started:value.started,completed:value.completed,failed:value.failed,pending:value.pending,status:{...value.status},errors:{...value.errors},maxDurationMs:value.maxDurationMs}];
    }));
    return {schema:1,source:'chromium-cdp-network',captureWindow:'network-enabled-before-navigation',observedRequests:seen,truncated,orphanEvents,groups};
  }
  return {observe,snapshot};
}
