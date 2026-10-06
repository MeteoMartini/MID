const token=String(process.env.CLOUDFLARE_API_TOKEN||'').trim();
const worker=String(process.env.MID_CLOUDFLARE_WORKER_NAME||'').trim();
const configuredZone=String(process.env.MID_CLOUDFLARE_ZONE_ID||'').trim();
const zoneName='midwx.app';
const pattern='www.midwx.app/api/mid-worker*';
if(!token)throw new Error('CLOUDFLARE_API_TOKEN fehlt für die Same-Origin-Route.');
if(!worker)throw new Error('MID_CLOUDFLARE_WORKER_NAME fehlt für die Same-Origin-Route.');
const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
async function cf(path,init={}){const response=await fetch('https://api.cloudflare.com/client/v4'+path,{...init,headers:{...headers,...(init.headers||{})}}),payload=await response.json().catch(()=>({}));if(!response.ok||payload?.success===false){const detail=(payload?.errors||[]).map(item=>item?.message).filter(Boolean).join('; ')||'unbekannter Cloudflare-Fehler';throw new Error(path+' HTTP '+response.status+': '+detail)}return payload?.result}
async function resolveZone(){if(configuredZone)return configuredZone;const rows=await cf('/zones?name='+encodeURIComponent(zoneName)+'&status=active&per_page=50');const matches=(Array.isArray(rows)?rows:[]).filter(row=>String(row?.name||'').toLowerCase()===zoneName&&String(row?.status||'')==='active');if(matches.length!==1)throw new Error('Cloudflare-Zone '+zoneName+' konnte nicht eindeutig bestimmt werden. Optional MID_CLOUDFLARE_ZONE_ID setzen; keine DNS-Rechte werden angefordert.');return String(matches[0].id||'')}
const zone=await resolveZone();if(!/^[0-9a-f]{20,}$/i.test(zone))throw new Error('Ungültige Cloudflare-Zone-ID.');
async function routes(){const result=await cf('/zones/'+encodeURIComponent(zone)+'/workers/routes');return Array.isArray(result)?result:[]}
let rows=await routes(),exact=rows.find(row=>String(row?.pattern||'')===pattern);
if(exact&&String(exact?.script||'')!==worker)throw new Error('Same-Origin-Route '+pattern+' zeigt bereits auf einen anderen Worker ('+String(exact?.script||'<leer>')+'). Fail-closed: bestehende Route wird nicht überschrieben.');
if(!exact){await cf('/zones/'+encodeURIComponent(zone)+'/workers/routes',{method:'POST',body:JSON.stringify({pattern,script:worker})});rows=await routes();exact=rows.find(row=>String(row?.pattern||'')===pattern)}
if(!exact||String(exact?.script||'')!==worker)throw new Error('Same-Origin-Route wurde nach dem Schreiben nicht SHA-/zielgenau bestätigt.');
if(process.env.GITHUB_OUTPUT)await (await import('node:fs/promises')).appendFile(process.env.GITHUB_OUTPUT,'zone_id='+zone+'\nroute_id='+String(exact.id||'')+'\npattern='+pattern+'\n');
console.log('Same-Origin-Route bestätigt: '+pattern+' -> '+worker+'. DNS, TLS und andere Routes wurden nicht verändert.');
