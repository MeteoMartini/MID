import {readFile} from 'node:fs/promises';

const [app,radar,px,projection,styles,worker,pkg,baseline]=await Promise.all([
 'src/App.tsx','src/RadarPanel.tsx','src/Px250Overlay.tsx','src/radarProjection.ts','src/styles.css','worker/metar-proxy.js','package.json','MID_BASELINE.json'
].map(path=>readFile(new URL(`../${path}`,import.meta.url),'utf8')));
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
const forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: unerlaubt ${token}`)};

for(const token of [
 'actualLocation={Boolean(loc!.autolocated)}'
])need('Standortübergabe',app,token);
for(const token of [
 'actualLocation=false',
 'useDeviceHeading(actualLocation)',
 'locationHeadingIcon(actualLocation?deviceHeading.heading:null,actualLocation)',
 "showBearing?' actual-location':' selected-location'",
 "actualLocation?'Aktueller Standort':'Gewählter Ort'",
 'function chaikinContour(',
 "type==='isoheights'?3:2",
 "modelLines!=='off'&&dominantModelFrame&&<Pane name=\"mid-model-lines\"",
 'name="mid-lightning-points"',
 "fillOpacity:.72*lightningOpacity/100",
 'name="mid-motion-arrows"',
 'point.x>margin&&point.x<size.x-margin',
 'Number(anchor.rate)>=Math.max(.2',
 'const pxDisplayAvailable=highResolution&&pxFresh;',
 'showPxAtTime=showRadar&&pxDisplayAvailable',
 '<LazyPx250Overlay meta={pxMeta} opacity={radarOpacity/100}'
])need('Kompositbild',radar,token);
forbid('Kompositbild',radar,'[{lat,lon,rate:Number(analysis?.peakRate)');
for(const token of [
 'const DWD_PX250_ROOTS=[',
 "'https://opendatao.dwd.de/weather/radar/sites/px250'",
 'item.ageMinutes>45',
 'ageMinutes>55',
 'for(let row=1;row<rows-1;row++)',
 'for(let column=1;column<columns-1;column++)'
])need('Worker',worker,token);
for(const token of [
 'function findDataset(file:H5File):DatasetSelection',
 "for(let dataset=1;dataset<=5;dataset++)",
 "for(let data=1;data<=6;data++)",
 'ImageQuadLayer id="px250-image"',
 'zIndex={430}',
 'canvas.toDataURL'
])need('PX250',px,token);
need('PX250-Projektion',projection,"new RegExp(`(?:^|\\\\s)\\\\+${name}=([^\\\\s]+)`");
for(const token of [
 '.maplibre-mid-lightning-points-pane',
 '.maplibre-mid-motion-arrows-pane',
 '.radar-location-marker.selected-location',
 '.mid-motion-arrow-marker .core{stroke:rgba(255,255,255,.88)'
])need('Darstellung',styles,token);
need('Package-Test',pkg,'test:composite-visibility-quality');
need('Baseline-Test',baseline,'scripts/test-composite-visibility-quality-08251.mjs');

if(failures.length){console.error('Komposit-Sichtbarkeits-/Qualitätsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Standortmarker, geglättete Modelllinien, PX250, sichtbare Blitzpunkte und randfreie dezente Zugpfeile geprüft.');
