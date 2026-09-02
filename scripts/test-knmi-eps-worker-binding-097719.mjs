import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {knmiEpsRollingArchivePlan,knmiEpsTarCacheHealth} from '../worker/metar-proxy.js';

const latest=Date.parse('2026-09-02T08:00:00Z');
const indexed=Array.from({length:6},(_,age)=>{
 const init=new Date(latest-age*3600000).toISOString();
 return{
  filename:`HARM43_V1_P4A_${init.slice(0,13).replace(/[-T:]/g,'')}.tar`,
  temporaryDownloadUrl:`https://download.example/${age}?sig=short-lived`,
  cacheSource:age===0?'kv':'memory',
  record:{
   initialTimes:[init],
   entries:Array.from({length:61},(_,lead)=>({name:`HA43_BATCH${age}_${init.slice(0,13).replace(/[-T:]/g,'')}_${String(lead).padStart(5,'0')}_GB`,dataOffset:512+lead*100000,byteLength:900+lead,leadHours:lead}))
  }
 };
});
const plan=knmiEpsRollingArchivePlan(indexed,54);
assert.equal(plan.schema,'mid.knmi.harmonie-eps.rolling-manifest.v1');
assert.equal(plan.latestInitialization,'2026-09-02T08:00:00.000Z');
assert.equal(plan.memberCount,30);assert.equal(plan.forecastHours,54);assert.equal(plan.archives.length,6);
assert.deepEqual(plan.archives[0].members,[1,2,3,4,5]);
assert.deepEqual(plan.archives[5].members,[26,27,28,29,30]);
assert.equal(plan.archives[0].entries[0].validLeadHours,0,'Neuester 5er-Batch beginnt direkt bei +0 h.');
assert.equal(plan.archives[5].entries[0].leadHours,5,'Ältester 5er-Batch muss für gemeinsamen +0-h-Zeitpunkt fünf lokale Leadstunden abschneiden.');
assert.equal(plan.archives[5].entries[0].validLeadHours,0);
assert.ok(plan.archives.every(archive=>archive.entries.at(-1).validLeadHours===54),'Alle sechs Batches müssen denselben 0–54-h-Gültigkeitshorizont liefern.');
assert.ok(plan.archives.every(archive=>archive.rangePacks.length>=1&&archive.rangePacks.every(pack=>pack.parts<=16)),'Range-Manifest muss den produktiven max-16-Multi-Range-Vertrag verwenden.');
assert.ok(plan.archives.every(archive=>archive.rangePacks.reduce((sum,pack)=>sum+pack.parts,0)===archive.entries.length),'Range-Packs müssen alle und nur die gewählten TAR-Einträge adressieren.');

assert.throws(()=>knmiEpsRollingArchivePlan(indexed.filter((_,index)=>index!==2),54),/unterschiedliche Initialisierungen|6/,'Ein lückenhaftes 30-Member-Rolling-Ensemble muss fail-closed bleiben.');
const gapped=indexed.map((row,index)=>index===3?{...row,record:{...row.record,initialTimes:[new Date(latest-4*3600000).toISOString()]}}:row);
assert.throws(()=>knmiEpsRollingArchivePlan(gapped,54),/lückenlos|unterschiedliche Initialisierungen/,'Nicht stündlich lückenlose Archive dürfen nicht zu scheinbaren 30 unabhängigen Membern werden.');

const kv={get(){},put(){}},env={MID_PUSH_SUBSCRIPTIONS:kv,MID_KNMI_API_KEY:'secret',MID_KNMI_HARMONIE_EPS_POINT_ENDPOINT:'https://decoder.example/knmi'};
const health=knmiEpsTarCacheHealth(env);assert.equal(health.productionReady,true);assert.equal(health.openDataConfigured,true);assert.equal(health.decoderConfigured,true);assert.match(health.rollingPolicy,/sechs/i);assert.match(health.decoderPolicy,/dekodiert kein GRIB/i);

const [cacheSource,coreSource,envExample,setup,cost]=await Promise.all([
 readFile(new URL('../worker-src/05-knmi-eps-cache.js',import.meta.url),'utf8'),
 readFile(new URL('../worker-src/00-core-observations.js',import.meta.url),'utf8'),
 readFile(new URL('../.env.example',import.meta.url),'utf8'),
 readFile(new URL('../MID_REGIONAL_ENSEMBLE_ADAPTER_SETUP.md',import.meta.url),'utf8'),
 readFile(new URL('../MID_COST_GOVERNANCE_CONTRACT.md',import.meta.url),'utf8')
]);
for(const token of ["KNMI_EPS_ROLLING_BATCHES=6","KNMI_EPS_MEMBERS_PER_BATCH=5","KNMI_EPS_MAX_VALID_LEAD_HOURS=54","schema:'mid.knmi.harmonie-eps.point-decode-request.v1'","method:'POST'","Range:`bytes=${start}-${end}`","response.status!==206","^bytes\\\\s+${start}-${end}/"])assert.ok(cacheSource.includes(token),`Produktive Worker-Anbindung fehlt: ${token}`);
assert.ok(coreSource.includes("model==='knmi_harmonie_arome_cy43_eps'&&knmiEpsProductionConfigured(env)"),'Ensemble-Proxy muss den produktiven KNMI-Pfad vor dem Legacyadapter benutzen.');
assert.ok(!/eccodes|codes_grib|grib_new|wgrib/i.test(cacheSource),'Cloudflare Worker darf weiterhin keinen GRIB-Decoder enthalten.');
assert.match(envExample,/MID_KNMI_API_KEY/);assert.match(setup,/Rolling-Manifest|rolling-manifest/i);assert.match(cost,/kein kostenpflichtiger VPS/i);
console.log('KNMI HARMONIE EPS Worker-Anbindung: Open-Data-Orchestrierung, 6×5 Rolling-Member, 0–54-h-Alignment, Cache-/Range-Manifest und externer Decodervertrag geprüft.');
