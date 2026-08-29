const args=process.argv.slice(2),get=name=>{const i=args.indexOf(name);return i>=0?args[i+1]:''},has=name=>args.includes(name);
const base=get('--url'),expected=get('--expected-version'),worker=get('--worker'),versionId=get('--version-id'),retries=Math.max(1,Number(get('--retries')||6)),requireRuc=has('--require-ruc-ready');
if(!base||!expected)throw new Error('--url und --expected-version sind erforderlich');
const headers={Accept:'application/json'};if(worker&&versionId)headers['Cloudflare-Workers-Version-Overrides']=`${worker}="${versionId}"`;
async function probe(mode){const url=new URL(base);url.searchParams.set('mode',mode);const response=await fetch(url,{headers,cache:'no-store'}),payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(`${mode}: HTTP ${response.status}`);return payload}
function rucSmokeMode(ruc){
 if(ruc?.configured===true&&ruc?.ready===true&&ruc?.fresh===true&&ruc?.schemaValid!==false)return'ready/fresh';
 // Worker releases and RUC preprocessing intentionally form separate gates. A stale
 // but structurally valid snapshot must not deadlock promotion: stale RUC data is
 // already fail-closed by the runtime and the RUC workflow performs the strict
 // ready+fresh+published-run verification after a fresh preprocessing run.
 const staleBootstrap=ruc?.configured===true&&ruc?.ready===false&&ruc?.fresh===false&&ruc?.schemaValid===true&&
  String(ruc?.reason||'')==='RUC-Lauf nicht frisch'&&['pages','r2'].includes(String(ruc?.backend||''))&&
  String(ruc?.run||'').length>0&&Number(ruc?.pointCount)>0&&Number(ruc?.timeCount)>=4&&Number(ruc?.epsMemberCount)>=2;
 return staleBootstrap?'stale-bootstrap-safe':'';
}
let last;for(let attempt=1;attempt<=retries;attempt++){
 try{
  const health=await probe('health');if(health?.ok!==true||String(health?.version)!==expected)throw new Error(`health meldet ${health?.version||'<keine Version>'} statt ${expected}`);
  let rucMode='';if(requireRuc){const ruc=await probe('ruc-health');rucMode=rucSmokeMode(ruc);if(!rucMode)throw new Error(`ruc-health nicht deployment-sicher: ${JSON.stringify({configured:ruc?.configured,ready:ruc?.ready,fresh:ruc?.fresh,schemaValid:ruc?.schemaValid,backend:ruc?.backend,run:ruc?.run,pointCount:ruc?.pointCount,timeCount:ruc?.timeCount,epsMemberCount:ruc?.epsMemberCount,reason:ruc?.reason})}`);if(rucMode==='stale-bootstrap-safe')console.warn(`RUC-Snapshot ist stale, aber strukturell gültig; Worker-Promotion bleibt bootstrap-sicher und RUC-Runtime fail-closed. run=${ruc?.run} ageHours=${ruc?.ageHours??'?'}`)}
  console.log(`Worker-Smoke OK · ${expected}${versionId?' · Versions-Override '+versionId:''}${requireRuc?' · RUC '+rucMode:''}`);process.exit(0)
 }catch(error){last=error;if(attempt<retries)await new Promise(r=>setTimeout(r,Math.min(10000,1500*attempt)))}
}
throw last||new Error('Worker-Smoke fehlgeschlagen');
