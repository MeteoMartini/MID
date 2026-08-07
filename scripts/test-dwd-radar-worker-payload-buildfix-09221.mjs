import {readFile} from 'node:fs/promises';
const [radar,hymec,worker,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),readFile(new URL('../src/HymecNgSource.ts',import.meta.url),'utf8'),readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),readFile(new URL('../package.json',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of ['type RadarMeta={observedAt?:string;','type PointInspection={loading:boolean;',"response.headers.get('x-mid-radar-at')","response.headers.get('x-mid-satellite-at')","fetchWorkerJson<RadarPointInfo>('dwd-precipitation-type-info'"])need('Frontend-Payload',radar,token);
for(const token of ['export type HymecNgMeta={','export type HymecNgSample={',"fetchWorkerJson<HymecNgMeta>('dwd-hymecng-meta'"])need('Dormantes HymecNG-Payload',hymec,token);
for(const token of ["mode==='dwd-hymecng-file'","mode==='dwd-hymecng-meta'",'async function dwdHymecNgMetadata(request)','async function dwdHymecNgFileResponse(request)',"headers.set('x-mid-radar-at',sourceTimes.radarAt)","headers.set('x-mid-satellite-at',sourceTimes.satelliteAt)"])need('Worker-Payload',worker,token);
need('Package-Test',pkg,'test:dwd-radar-worker-payload-buildfix');need('Baseline-Test',baseline,'scripts/test-dwd-radar-worker-payload-buildfix-09221.mjs');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: package ${pv}, baseline ${bv}`);
if(failures.length){console.error('DWD Originalbild-/WorkerPayload Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD-Originalbild-Header, Bildpunkt-Payload und dormant erhaltene HymecNG-Payloads erfolgreich geprüft.');
