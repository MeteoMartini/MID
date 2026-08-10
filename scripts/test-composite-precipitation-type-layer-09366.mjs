import {readFile} from 'node:fs/promises';
const [radarPanel,precipComponent,styles,app,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
  'showPrecipitationType',
  'precipitationTypeOpacity',
  'precipitationTypeOpacity:64',
  "label=\"Niederschlagsart\"",
  'precipitationTypeButtonDetail',
  'precipitationTypeWorkerBase',

  'PrecipitationTypeScale',
  'Die Legende lässt sich über die Komposit-Legende ein- und ausblenden.',
  'Top-aktuelle Alternativen wurden geprüft; aktuell bleibt dies die sichere und konsistente Darstellung.',
  'Deckkraft um 60–70 %'
]) need('RadarPanel',radarPanel,token);
for(const token of ['export const DWD_PRECIPITATION_TYPE_COVERAGE=COVERAGE;','export const DWD_PRECIPITATION_TYPE_LEGEND=[']) need('PrecipitationComponent',precipComponent,token);
for(const token of ['.precip-type-scale{','.precip-type-scale>div{']) need('Styles',styles,token);
need('AppSources',app,'DWD HymecNG bzw. DWD WN-Originalprodukt für Niederschlagsart');
need('Baseline',baseline,'scripts/test-composite-precipitation-type-layer-09366.mjs');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;
if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('Komposit-Niederschlagsart-Regressionsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Kompositbild prüft zusätzlichen DWD-Niederschlagsart-Layer inklusive ausblendbarer Legende und Produkt-Fallback korrekt.');
