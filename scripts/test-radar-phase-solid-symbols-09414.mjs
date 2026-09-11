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
for(const token of ['explicitHail=[89,90].includes(code)','explicitGraupelHail=[96,99].includes(code)','explicitIceCrystals=code===76','explicitSnowGrains=code===77','explicitSnowStars=code===78','explicitIcePellets=code===79','precipitationTypeSymbolSvg(item.phase)','Layer aktiv · aktuell keine festen/gemischten Niederschlagsarten im sichtbaren Ausschnitt']) need('Overlay',overlay,token);
for(const token of ["label:'Graupel'","label:'Hagel'"]) need('Legend',legend,token);
for(const token of ["graupel:{label:'Graupel'","'snow-grains':{label:'Schneegriesel'","'snow-stars':{label:'Vereinzelte Schneesterne'","'ice-crystals':{label:'Eisnadeln'","'ice-pellets':{label:'Eiskörner'","hail:{label:'Hagel'","'graupel-hail':{label:'Graupel oder Hagel'","phase==='graupel-hail'","phase==='graupel'","phase==='snow-grains'","phase==='snow-stars'","phase==='ice-crystals'","phase==='ice-pellets'","phase==='hail'",'<polygon','stroke="currentColor"']) need('Meteorologische SVG-Symbolik',symbols,token);
const version=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion,workerVersion=worker.match(/const WORKER_VERSION='([^']+)'/)?.[1];
if(version!==baselineVersion||version!==workerVersion)failures.push(`Versionsabweichung: ${version}/${baselineVersion}/${workerVersion}`);
if(failures.length){console.error('Radar-Niederschlagsart-Symbolerweiterung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Radar-Niederschlagsart: Layerstatus und meteorologische SVG-Symbole für Schnee/Schneegriesel/Schneesterne/Eisnadeln/Eiskörner/Mischphase/Gefrieren/Graupel/Hagel geschützt.');
