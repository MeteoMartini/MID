const token=String(process.env.CLOUDFLARE_API_TOKEN||'').trim();
const configuredZone=String(process.env.MID_CLOUDFLARE_ZONE_ID||'').trim();
const zoneName='midwx.app';
const recordName='www.midwx.app';

if(!token)throw new Error('CLOUDFLARE_API_TOKEN fehlt für die Same-Origin-DNS-Prüfung.');
const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};

async function cf(path,init={}){
 const response=await fetch('https://api.cloudflare.com/client/v4'+path,{...init,headers:{...headers,...(init.headers||{})}});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok||payload?.success===false){
  const detail=(payload?.errors||[]).map(item=>item?.message).filter(Boolean).join('; ')||'unbekannter Cloudflare-Fehler';
  throw new Error(path+' HTTP '+response.status+': '+detail);
 }
 return payload?.result;
}

async function resolveZone(){
 if(configuredZone)return configuredZone;
 const rows=await cf('/zones?name='+encodeURIComponent(zoneName)+'&status=active&per_page=50');
 const matches=(Array.isArray(rows)?rows:[]).filter(row=>String(row?.name||'').toLowerCase()===zoneName&&String(row?.status||'')==='active');
 if(matches.length!==1)throw new Error('Cloudflare-Zone '+zoneName+' konnte nicht eindeutig bestimmt werden. Optional MID_CLOUDFLARE_ZONE_ID setzen.');
 return String(matches[0].id||'');
}

const zone=await resolveZone();
if(!/^[0-9a-f]{20,}$/i.test(zone))throw new Error('Ungültige Cloudflare-Zone-ID.');

async function records(){
 const result=await cf('/zones/'+encodeURIComponent(zone)+'/dns_records?name='+encodeURIComponent(recordName)+'&per_page=100');
 return Array.isArray(result)?result:[];
}

let rows=await records();
const addressRecords=rows.filter(row=>String(row?.name||'').toLowerCase()===recordName&&['CNAME','A','AAAA'].includes(String(row?.type||'').toUpperCase()));
const cnames=addressRecords.filter(row=>String(row?.type||'').toUpperCase()==='CNAME');
if(addressRecords.length!==1||cnames.length!==1){
 throw new Error(recordName+' muss genau einen bestehenden CNAME und keine parallelen A/AAAA-Records besitzen; gefunden: '+addressRecords.map(row=>String(row?.type||'?')+':'+String(row?.content||'')).join(', '));
}
const before=cnames[0];
if(before?.proxiable===false)throw new Error(recordName+' ist laut Cloudflare nicht proxyfähig.');
const id=String(before?.id||''),content=String(before?.content||''),name=String(before?.name||''),type=String(before?.type||'');
if(!id||!content||name.toLowerCase()!==recordName||type.toUpperCase()!=='CNAME')throw new Error('Bestehender www-CNAME ist unvollständig oder unerwartet.');

let changed=false;
if(before?.proxied!==true){
 await cf('/zones/'+encodeURIComponent(zone)+'/dns_records/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({proxied:true})});
 changed=true;
 rows=await records();
}
const after=rows.find(row=>String(row?.id||'')===id);
if(!after)throw new Error('www-CNAME konnte nach der Änderung nicht erneut gelesen werden.');
if(String(after?.name||'')!==name||String(after?.type||'')!==type||String(after?.content||'')!==content){
 throw new Error('Fail-closed: Name, Typ oder Ziel des bestehenden www-CNAME haben sich unerwartet verändert.');
}
if(after?.proxied!==true)throw new Error('Cloudflare-Proxy für '+recordName+' ist nach dem Schreibvorgang nicht aktiv.');

if(process.env.GITHUB_OUTPUT){
 const fs=await import('node:fs/promises');
 await fs.appendFile(process.env.GITHUB_OUTPUT,'changed='+(changed?'true':'false')+'\nrecord_id='+id+'\n');
}
console.log('Cloudflare-Proxy bestätigt: '+recordName+' · CNAME-Ziel unverändert · proxied=true'+(changed?' (aktiviert)':' (bereits aktiv)')+'.');
