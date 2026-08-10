import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../src/deviceSync.ts',import.meta.url),'utf8');
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const failures=[];
const need=(token)=>{if(!source.includes(token))failures.push(`Parser-Schutz fehlt: ${token}`)};
need("if(/^[A-Za-z0-9_-]{32,}$/.test(raw))");
need("hashParams.get(DEVICE_SYNC_HASH_KEY)||url.searchParams.get(DEVICE_SYNC_HASH_KEY)");
need("raw.match(/^mid-sync:(.+)$/i)");
need("return'';");
if(source.includes("raw.replace(/^mid-sync:/i,'')"))failures.push('Unsicherer Whole-URL-Fallback ist weiterhin vorhanden.');
if(!app.includes("if(consumeDeviceSyncTransferFromLocation()){setSettingsSection('sync');setSettingsOpen(true)}"))failures.push('Expliziter Sync-Transfer öffnet den Synchronisationsbereich nicht mehr.');

// Verhaltensprobe derselben Parserregeln: normale Start-/Update-URLs müssen leer bleiben.
const normalise=value=>String(value||'').replace(/[^A-Za-z0-9_-]/g,'');
const parse=value=>{
 const raw=String(value||'').trim();if(!raw)return'';
 const decode=candidate=>{try{return normalise(decodeURIComponent(candidate))}catch{return normalise(candidate)}};
 try{const url=new URL(raw,'https://www.midwx.app/'),hashParams=new URLSearchParams(url.hash.replace(/^#/,'')),explicit=hashParams.get('mid-sync')||url.searchParams.get('mid-sync')||'';if(explicit)return decode(explicit)}catch{}
 const marked=raw.match(/(?:^|[?#&])mid-sync=([^&#]+)/i)?.[1]||raw.match(/^mid-sync:(.+)$/i)?.[1]||'';
 if(marked)return decode(marked);
 if(/^[A-Za-z0-9_-]{32,}$/.test(raw))return normalise(raw);
 return'';
};
const key='AbCdEf0123456789_abcdefghijklmnopqrstuvwxyz-XYZ';
for(const value of [
 'https://www.midwx.app/',
 'https://www.midwx.app/?mid-refresh=0.9.38.0&_mid_reload=1786360000000',
 'https://www.midwx.app/?mid-update=0.9.38.1',
 'https://www.midwx.app/?mid-rollback=1786360000000',
 'https://www.midwx.app/#mid-section-current'
])if(parse(value)!=='')failures.push(`Normale Start-URL wird als Sync-Code fehlinterpretiert: ${value}`);
for(const value of [`https://www.midwx.app/#mid-sync=${key}`,`https://www.midwx.app/?mid-sync=${key}`,`mid-sync:${key}`,key])if(parse(value)!==key)failures.push(`Expliziter Sync-Code wird nicht korrekt erkannt: ${value}`);
if(failures.length){console.error('Geräte-Sync-Startpfad fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('App-Neustart bleibt in der Wetteransicht; nur explizite mid-sync-Transfers öffnen den Synchronisationspfad.');
