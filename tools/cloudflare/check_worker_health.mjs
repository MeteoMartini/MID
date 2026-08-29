const args=process.argv.slice(2),get=name=>{const i=args.indexOf(name);return i>=0?args[i+1]:''},has=name=>args.includes(name);
const base=get('--url'),expected=get('--expected-version'),worker=get('--worker'),versionId=get('--version-id'),retries=Math.max(1,Number(get('--retries')||6)),requireRuc=has('--require-ruc-ready');
if(!base||!expected)throw new Error('--url und --expected-version sind erforderlich');
const headers={Accept:'application/json'};if(worker&&versionId)headers['Cloudflare-Workers-Version-Overrides']=`${worker}="${versionId}"`;
async function probe(mode){const url=new URL(base);url.searchParams.set('mode',mode);const response=await fetch(url,{headers,cache:'no-store'}),payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(`${mode}: HTTP ${response.status}`);return payload}
let last;for(let attempt=1;attempt<=retries;attempt++){
 try{const health=await probe('health');if(health?.ok!==true||String(health?.version)!==expected)throw new Error(`health meldet ${health?.version||'<keine Version>'} statt ${expected}`);if(requireRuc){const ruc=await probe('ruc-health');if(!(ruc?.configured===true&&ruc?.ready===true&&ruc?.fresh===true))throw new Error(`ruc-health nicht ready/fresh: ${JSON.stringify({configured:ruc?.configured,ready:ruc?.ready,fresh:ruc?.fresh,reason:ruc?.reason})}`)}console.log(`Worker-Smoke OK · ${expected}${versionId?' · Versions-Override '+versionId:''}${requireRuc?' · RUC ready/fresh':''}`);process.exit(0)}catch(error){last=error;if(attempt<retries)await new Promise(r=>setTimeout(r,Math.min(10000,1500*attempt)))}
}
throw last||new Error('Worker-Smoke fehlgeschlagen');
