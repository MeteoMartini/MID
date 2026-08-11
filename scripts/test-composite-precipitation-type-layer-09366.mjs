import {readFile} from 'node:fs/promises';
const [radarPanel,standalone,worker,app,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
  readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const forbid=(label,text,token)=>{if(text.includes(token))failures.push(`${label} enthält weiterhin unerwünschten Pfad: ${token}`)};

// Seit v0.9.39.5 ist die Komposit-Niederschlagsart ausschließlich beobachtungsgebundene Radar-/Modellfusion.
for(const token of [
  'showPrecipitationType',
  'precipitationTypeOpacity',
  "import('./RadarModelPrecipTypeOverlay')",
  'Niederschlagsart · Radar+Modell',
  'OPERA-CIRRUS-Echomaske + frischestes geeignetes Rapid-/Regionalmodell als radar-/modellgestützte Phasenklassifikation',
  'verwendet ausschließlich die Fusion aus beobachteter OPERA-CIRRUS-Echofläche'
]) need('RadarPanel',radarPanel,token);
for(const token of [
  "import('./CompositeHymecNgOverlay')",
  "from './CompositeHymecNgSource'",
  "from './HymecNgSource'",
  "import('./HymecNgOverlay')",
  'DWD HymecNG als direkte Radarklassifikation',
  'dwd-precipitation-type-image',
  'Niederschlagsart · DWD WN'
]) forbid('Aktiver RadarPanel-Pfad',radarPanel,token);

// Das eigenständige DWD-Originalbild bleibt eine getrennte Ansicht und darf nicht als Komposit-Phasenlayer recycelt werden.
need('Standalone DWD-Originalbild',standalone,'Wolken + Niederschlagsart');
need('Standalone DWD-Originalbild',standalone,"'dwd-precipitation-type-image'");

// Radar-/Modellfusion braucht einen eigenen zeitnahen Workerpfad.
for(const token of ['precipitation-phase-grid','wet_bulb_temperature_2m','snowfall_height','freezing_level_height'])need('Worker-Phasenraster',worker,token);
need('App-Kompositquellen',app,'OPERA CIRRUS');
need('Baseline',baseline,'scripts/test-composite-precipitation-type-layer-09366.mjs');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;
if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('Komposit-Niederschlagsart-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Kompositbild nutzt für Niederschlagsart ausschließlich beobachtete OPERA-Echos + dynamisches Rapid-/Regionalmodell; HymecNG/WN sind kein aktiver Komposit-Fallback.');
