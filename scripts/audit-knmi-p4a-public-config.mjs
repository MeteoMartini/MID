/**
 * Read-only, credential-free diagnostic of MID's publicly exposed KNMI P4a
 * configuration flags. Never requests ensemble-proxy, mutates bindings or
 * handles secrets.
 *
 * Usage: node scripts/audit-knmi-p4a-public-config.mjs
 * Exit 0: consistent configuration snapshot (NOT retirement authorization).
 * Exit 2: unverified, inaccessible, stale or inconsistent snapshot.
 */
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const BASE='https://www.midwx.app/api/mid-worker';
const MODEL='knmi_harmonie_arome_cy43_eps';
const SCHEMA='mid.knmi.p4a-public-config-audit.v1';
const isBool=value=>typeof value==='boolean';

export function classifyKnmiPublicStatus(cache,capabilities,health,expectedVersion){
 if(!cache||!capabilities||!health||typeof expectedVersion!=='string'||!expectedVersion)throw new Error('Unvollständiger öffentlicher KNMI-Nachweis');
 if([cache,capabilities,health].some(row=>row.version!==expectedVersion))throw new Error('Worker-Version stimmt nicht mit dem erwarteten Stable-Stand überein');
 if(cache.schema!=='mid.knmi.harmonie-eps.tar-index.v1'||capabilities.ok!==true||health.ok!==true)throw new Error('KNMI-Health-/Capabilities-Schema nicht bestätigt');
 const model=capabilities.models?.[MODEL];
 const flags=[cache.configured,cache.openDataConfigured,cache.decoderConfigured,cache.productionReady,model?.configured];
 if(!flags.every(isBool))throw new Error('Notwendige KNMI-Konfigurationsflags fehlen');
 if(cache.productionReady!==(cache.openDataConfigured&&cache.decoderConfigured))throw new Error('Widersprüchliche KNMI-Produktionsbereitschaft');
 if(model.configured!==cache.decoderConfigured)throw new Error('Widerspruch zwischen KNMI-Decoder- und Regionalensemble-Konfiguration');
 const provider=health.providers;
 if(!isBool(provider?.['KNMI HARMONIE EPS point adapter'])||!isBool(provider?.['KNMI HARMONIE EPS productive cache']))throw new Error('KNMI-Providerstatus fehlt im allgemeinen Worker-Health');
 if(provider['KNMI HARMONIE EPS point adapter']!==model.configured||provider['KNMI HARMONIE EPS productive cache']!==cache.configured)throw new Error('Widerspruch zwischen KNMI-Providerstatus und spezifischen Health-Flags');
 const ts=Date.parse(health.timestamp||'');
 if(!Number.isFinite(ts)||Math.abs(Date.now()-ts)>10*60*1000)throw new Error('Worker-Health-Zeitstempel fehlt oder ist nicht frisch');
 let configuration='decoder-not-configured';
 if(cache.decoderConfigured&&cache.openDataConfigured)configuration='manifest-decoder-configured';
 else if(cache.decoderConfigured)configuration='legacy-point-adapter-configured';
 return {
  schema:SCHEMA,checkedAt:new Date().toISOString(),workerVersion:expectedVersion,
  configuration,
  flags:{p4aDecoderConfigured:cache.decoderConfigured,p4aOpenDataKeyConfigured:cache.openDataConfigured,p4aManifestConfigured:cache.productionReady,p4aAdapterConfigured:model.configured,sharedKvBindingConfigured:cache.configured},
  verifiedEndToEndData:false,retirementAuthorized:false,
  note:'Öffentliche Konfigurationsflags belegen keinen erfolgreichen P4a-Datenabruf oder historische Nichtnutzung. KNMI Aviation kann denselben Open-Data-Key nutzen; KV ist mit Push geteilt. Kein automatischer Rückbau.'
 };
}

async function getJson(mode,fetchFn){
 const url=new URL(BASE);url.searchParams.set('mode',mode);
 const response=await fetchFn(url,{method:'GET',headers:{Accept:'application/json'},redirect:'error',cache:'no-store',signal:AbortSignal.timeout(9000)});
 if(response.status!==200)throw new Error(mode+': HTTP '+response.status);
 if(!String(response.headers.get('content-type')||'').toLowerCase().includes('application/json'))throw new Error(mode+': kein JSON-Content-Type');
 const bytes=await response.text();
 if(bytes.length>100000)throw new Error(mode+': unplausible Antwortlänge');
 try{return JSON.parse(bytes)}catch{throw new Error(mode+': JSON unlesbar')}
}

export async function auditKnmiPublicConfiguration(expectedVersion,fetchFn=fetch){
 const [cache,capabilities,health]=await Promise.all(['knmi-eps-cache-health','ensemble-capabilities','health'].map(mode=>getJson(mode,fetchFn)));
 return classifyKnmiPublicStatus(cache,capabilities,health,expectedVersion);
}

const invoked=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(invoked){
 try{
  const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  const result=await auditKnmiPublicConfiguration(pkg.version);
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
 }catch(error){
  process.stderr.write('KNMI-P4a-Public-Health: nicht verifizierbar ('+(error instanceof Error?error.message:String(error))+'). Keine Löschfreigabe.\n');
  process.exitCode=2;
 }
}
