import {readFile} from 'node:fs/promises';

const [radar,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

need('RadarMeta WorkerPayload-Kompatibilität',radar,'type RadarMeta={error?:string;');
need('RadarPointInfo WorkerPayload-Kompatibilität',radar,'type RadarPointInfo={error?:string;');
need('RadarMeta Fetch',radar,"fetchWorkerJson<RadarMeta>('dwd-precipitation-type-meta'");
need('RadarPoint Fetch',radar,"fetchWorkerJson<RadarPointInfo>('dwd-precipitation-type-info'");
need('Package-Test',pkg,'test:dwd-radar-worker-payload-buildfix');
need('Baseline-Test',baseline,'scripts/test-dwd-radar-worker-payload-buildfix-09221.mjs');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;
if(pv!==bv)failures.push(`Versionen nicht synchron: package ${pv}, baseline ${bv}`);

if(failures.length){
  console.error('DWD-Radar WorkerPayload Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('DWD-Radar WorkerPayload-Typen und Buildfix erfolgreich geprüft.');
