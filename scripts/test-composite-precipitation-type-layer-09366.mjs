import {readFile} from 'node:fs/promises';
const [radarPanel,standalone,hymecSource,legacyHymecSource,legacyHymecOverlay,worker,app,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/CompositeHymecNgSource.ts',import.meta.url),'utf8'),
  readFile(new URL('../src/HymecNgSource.ts',import.meta.url),'utf8'),
  readFile(new URL('../src/HymecNgOverlay.tsx',import.meta.url),'utf8'),
  readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const forbid=(label,text,token)=>{if(text.includes(token))failures.push(`${label} enthält weiterhin unerwünschten Pfad: ${token}`)};

// Kompositbild: echter HymecNG-Layer statt recyceltem WN/Cloud-PNG.
for(const token of [
  'showPrecipitationType',
  'precipitationTypeOpacity',
  "import('./CompositeHymecNgOverlay')",
  "from './CompositeHymecNgSource'",
  'Niederschlagsart',
  'DWD HymecNG als direkte Radarklassifikation'
]) need('RadarPanel',radarPanel,token);
for(const token of [
  'dwd-precipitation-type-image',
  'Niederschlagsart · DWD WN',
  'WN-Originalprodukt'
]) forbid('RadarPanel',radarPanel,token);


// Historische Rekonstruktionsmodule bleiben absichtlich dormant; der aktive Layer darf sie nicht importieren.
for(const token of ["from './HymecNgSource'","import('./HymecNgOverlay')"]) forbid('Aktiver RadarPanel-Pfad',radarPanel,token);
need('Legacy-HymecNG-Quelle bleibt vorhanden',legacyHymecSource,'HymecNG');
need('Legacy-HymecNG-Overlay bleibt vorhanden',legacyHymecOverlay,'HymecNgOverlay');

// Standalone-Karte darf den expliziten DWD-Originalbildpfad weiter haben.
need('Standalone DWD-Originalbild',standalone,'Wolken + Niederschlagsart');
need('Standalone DWD-Originalbild',standalone,"'dwd-precipitation-type-image'");

// HymecNG muss nativ georeferenziert und aktiv freigegeben sein.
need('HymecNG-Quelle',worker,"product:'HymecNG'");
need('HymecNG-Quelle',worker,'classificationVerified:true');
need('HymecNG-Quelle',worker,'Aktueller DWD-HymecNG-HDF5-Snapshot');
need('HymecNG-Georeferenzierung',hymecSource,'HYMEC_NG_CLASSES');
need('HymecNG-Georeferenzierung',hymecSource,'MID verwendet keinen Legacy-/Kugel-Fallback');
need('HymecNG-Georeferenzierung',hymecSource,'projectWgs84');
forbid('HymecNG-Georeferenzierung',hymecSource,'+a=6370040');
forbid('HymecNG-Georeferenzierung',hymecSource,'+b=6370040');

need('App-Kompositquellen',app,'Kompositbild: DWD-RV/PX250/HymecNG, EUMETNET OPERA/ORD, RainViewer, EUMETSAT MTG-FCI/LI und DWD-NowCastMIX;');
need('Baseline',baseline,'scripts/test-composite-precipitation-type-layer-09366.mjs');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;
if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('Komposit-Niederschlagsart-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
need('Radar-Modell-Fallback',radarPanel,"import('./RadarModelPrecipTypeOverlay')");
need('Radar-Modell-Fallback',radarPanel,'OPERA-Echomaske + ICON-D2 als radar-/modellgestützte Phasenklassifikation');
console.log('Kompositbild nutzt DWD HymecNG primär und OPERA + ICON-D2 als beobachtungsgebundenen Niederschlagsarten-Fallback.');
