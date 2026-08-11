import {readFile} from 'node:fs/promises';
const [overlay,legend,symbols,pkg,baseline,worker]=await Promise.all([
  readFile(new URL('../src/RadarModelPrecipTypeOverlay.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/radarColorTables.ts',import.meta.url),'utf8'),
  readFile(new URL('../src/precipitationTypeSymbols.ts',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'),
  readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,snippet)=>{if(!text.includes(snippet))failures.push(`${label}: ${snippet}`)};
for(const token of ['explicitHail=[96,99].includes(code)','explicitSnowGrains=[77].includes(code)','precipitationTypeSymbolSvg(item.phase)','Layer aktiv · aktuell keine festen/gemischten Niederschlagsarten im sichtbaren Ausschnitt']) need('Overlay',overlay,token);
for(const token of ["label:'Graupel / Eiskörner'","label:'Hagel'"]) need('Legend',legend,token);
for(const token of ["graupel:{label:'Graupel / Eiskörner'","'snow-grains':{label:'Schneekörner'","hail:{label:'Hagel'","phase==='graupel'","phase==='snow-grains'","phase==='hail'",'<polygon','stroke="currentColor"']) need('Meteorologische SVG-Symbolik',symbols,token);
const version=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion,workerVersion=worker.match(/const WORKER_VERSION='([^']+)'/)?.[1];
if(version!==baselineVersion||version!==workerVersion)failures.push(`Versionsabweichung: ${version}/${baselineVersion}/${workerVersion}`);
if(failures.length){console.error('Radar-Niederschlagsart-Symbolerweiterung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Radar-Niederschlagsart: Layerstatus und meteorologische SVG-Symbole für Schnee/Schneekörner/Mischphase/Gefrieren/Graupel/Hagel geschützt.');
