import {readFile,access} from 'node:fs/promises';
const [panel,worker,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(where,text,token)=>{if(!text.includes(token))failures.push(`${where}: fehlt ${token}`)};
const reject=(where,text,token)=>{if(text.includes(token))failures.push(`${where}: unerwünscht ${token}`)};
for(const token of [
 'snapshotToken=satelliteUntimed?`latest:${revision}`:`snapshot:${iso}`',
 'time:iso',
 'der amtliche DWD-3h-Satellitenstand bleibt bis zum nächsten regulären Termin zulässig.',
 "import('./RadarModelPrecipTypeOverlay')"
])need('RadarPanel',panel,token);
for(const token of [
 'onHymecStatus=useCallback',
 'onStatus={onHymecStatus}',
 'hymecMeta?.fresh!==false',
 "import('./CompositeHymecNgOverlay')",
 "from './CompositeHymecNgSource'",
 'satelliteRenderBlend=withAdjacentPreload'
])reject('RadarPanel',panel,token);
for(const obsolete of ['../src/CompositeHymecNgSource.ts','../src/CompositeHymecNgOverlay.tsx']){
 try{await access(new URL(obsolete,import.meta.url));failures.push(`Obsoleter aktiver HymecNG-Kompositpfad ist noch vorhanden: ${obsolete}`)}catch{}
}
for(const token of [
 'const SATELLITE_MAX_AGE_MINUTES=75',
 'const DWD_SATELLITE_MAX_AGE_MINUTES=210',
 'latest>=now-maxAgeMinutes*60000',
 'latestOnly:false',
 'latestOnly:true',
 'timeVerified:false'
])need('Worker-Satellit',worker,token);
need('Baseline',baseline,'scripts/test-hymecng-satellite-snapshot-09383.mjs');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('HymecNG-Rückbau-/Satelliten-Snapshot-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Aktiver HymecNG-Kompositpfad ist entfernt; zeitgestempelter Satellit mit kontrolliertem DWD-Latest-Fallback bleibt geschützt.');
