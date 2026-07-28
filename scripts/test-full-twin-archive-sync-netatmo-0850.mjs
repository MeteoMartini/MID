import {readFile} from 'node:fs/promises';
const [sync,verification,worker,stationUi,station]=await Promise.all([
 readFile(new URL('../src/deviceSync.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/ConnectedStationSettings.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/connectedStation.ts',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,tokens)=>{for(const token of tokens)if(!text.includes(token))failures.push(`${label}: ${token}`)};
need('Vollarchiv-Export',verification,['exportForecastVerificationArchive','importForecastVerificationArchive','readAllArchiveDbEntries','waitForForecastVerificationArchiveWrites','mid-weather-twin-archive']);
need('Client-Synchronisation',sync,['pushWeatherTwinArchive','pullWeatherTwinArchive','device-sync-archive-chunk-push','device-sync-archive-commit','device-sync-archive-manifest','device-sync-archive-chunk-pull','vollständigem Wetterzwilling-Langzeitarchiv']);
need('Worker-Archiv',worker,['DEVICE_SYNC_ARCHIVE_MAX_CHUNKS','deviceSyncArchiveChunkPush','deviceSyncArchiveCommit','deviceSyncArchiveManifest','deviceSyncArchiveChunkPull',"'device-sync-archive'"]);
need('Netatmo-Diagnose',worker,['function netatmoMissing(','missing:netatmoMissing(env)']);
need('Netatmo-UI',stationUi,['Worker-Einrichtung erforderlich','Fehlend erkannt:','status?.configured===false']);
need('Netatmo-Statusvertrag',station,['missing?:string[]','requires?:string[]']);

class MemoryKv{
 constructor(){this.map=new Map()}
 async put(key,value){this.map.set(String(key),String(value))}
 async get(key,options){const value=this.map.get(String(key));if(value===undefined)return null;if(options?.type==='json')return JSON.parse(value);return value}
 async delete(key){this.map.delete(String(key))}
 async list({prefix='' }={}){return{keys:[...this.map.keys()].filter(key=>key.startsWith(prefix)).map(name=>({name})),list_complete:true}}
}
try{
 const module=await import(`../worker/metar-proxy.js?archive-sync-test=${Date.now()}`),kv=new MemoryKv(),env={MID_PUSH_SUBSCRIPTIONS:kv},origin='https://meteomartini.github.io',syncKey='abcdefghijklmnopqrstuvwxYZ012345',revision='revision123456';
 const post=async(mode,body)=>{const response=await module.default.fetch(new Request(`https://mid.test/?mode=${mode}`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)}),env),data=await response.json();return{response,data}};
 for(const [index,chunk] of ['abcDEF_123','ghiJKL_456'].entries()){const {response,data}=await post('device-sync-archive-chunk-push',{syncKey,revision,index,total:2,chunk});if(!response.ok||!data.ok)throw new Error(`Chunk ${index} abgelehnt: ${JSON.stringify(data)}`)}
 const commit=await post('device-sync-archive-commit',{syncKey,revision,iv:'abcdefghijklmnop',chunks:2,bytes:20,updatedAt:'2026-07-28T12:00:00.000Z',deviceId:'device-1'});if(!commit.response.ok||!commit.data.ok)throw new Error(`Commit fehlgeschlagen: ${JSON.stringify(commit.data)}`);
 const manifest=await post('device-sync-archive-manifest',{syncKey});if(!manifest.response.ok||manifest.data.revision!==revision||manifest.data.chunks!==2)throw new Error(`Manifest falsch: ${JSON.stringify(manifest.data)}`);
 const pulled=await post('device-sync-archive-chunk-pull',{syncKey,revision,index:1});if(!pulled.response.ok||pulled.data.chunk!=='ghiJKL_456')throw new Error(`Archivteil falsch: ${JSON.stringify(pulled.data)}`);
 const netatmo=await post('netatmo-status',{connectionId:'abcdefghijklmnopqrstuvwxyz123456'});if(!netatmo.response.ok||netatmo.data.configured!==false||!netatmo.data.missing?.includes('NETATMO_CLIENT_ID')||!netatmo.data.redirectUri)throw new Error(`Netatmo-Diagnose falsch: ${JSON.stringify(netatmo.data)}`);
}catch(error){failures.push(`Funktionaler Worker-Test: ${error instanceof Error?error.message:String(error)}`)}
if(failures.length){console.error('Vollarchiv-/Netatmo-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Vollständige verschlüsselte Wetterzwilling-Langzeitsicherung und Netatmo-Einrichtungsdiagnose sind geprüft.');
