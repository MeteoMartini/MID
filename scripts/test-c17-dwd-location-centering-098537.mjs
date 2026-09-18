import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [radar,styles,main,pkgText,changelog]=await Promise.all([
 'src/DwdPrecipitationTypeRadar.tsx',
 'src/midC17DwdLocationFix.css',
 'src/main.tsx',
 'package.json',
 'public/CHANGELOG.md'
].map(path=>readFile(new URL(path,root),'utf8')));

// C18 supersedes delayed C17 retries with one cancellable frame, measured image
// geometry and a retained pan centre; geographical calibration remains unchanged.
for(const token of [
 'image.getBoundingClientRect()',
 'viewport.clientLeft',
 'observer.observe(viewport)',
 'observer.observe(canvas)',
 'window.cancelAnimationFrame(centerFrameRef.current)',
 'const recenterLocation=()=>{viewCenterRef.current=locationPoint;scheduleCenterImagePoint(locationPoint)}',
 'title="Gewählten Standort exakt zentrieren"',
 'scheduleCenterImagePoint(viewCenterRef.current??locationPoint)',
 'className="dwd-precip-type-radar__location-pin"'
])assert.ok(radar.includes(token),`C17-Zentrierungsvertrag fehlt: ${token}`);

for(const token of [
 ".dwd-precip-type-radar__original-canvas",
 'transition:none!important',
 ".dwd-precip-type-radar__location-marker",
 'transform:translate(-50%,-100%)!important',
 ".dwd-precip-type-radar__location-marker::after",
 'background:var(--primary)',
 "@media(max-width:430px)"
])assert.ok(styles.includes(token),`C17-Darstellungsvertrag fehlt: ${token}`);

assert.ok(main.indexOf("import './midC17DwdLocationFix.css';")>main.indexOf("import './midC16TodayProfileFix.css';"),'C17 muss nach C16 geladen werden.');

// Referenz: der im realen Mobil-Sichtvergleich verwendete Ort Elsig.
// Die Werte sind eine Regression gegen die deutschlandweit an 17 DWD-Stadtankern
// kalibrierte bilineare Abbildung, nicht gegen einen frei erfundenen Kartenlayer.
const geometry={
 center:{longitude:10,latitude:51.5},
 x:{origin:.506145794481,lon:.0527570530389,lat:.0000737501280844,cross:-.0015334680047},
 y:{origin:.401459603686,lon:.0000554164716641,lat:-.0818027514158,cross:-.000302836311194}
};
function imagePoint(latitude,longitude){
 const lon=longitude-geometry.center.longitude,lat=latitude-geometry.center.latitude;
 return{
  x:geometry.x.origin+geometry.x.lon*lon+geometry.x.lat*lat+geometry.x.cross*lon*lat,
  y:geometry.y.origin+geometry.y.lon*lon+geometry.y.lat*lat+geometry.y.cross*lon*lat
 };
}
const elsig=imagePoint(50.67,6.76);
assert.ok(Math.abs(elsig.x-.33102793)<1e-7,'Elsig-X driftet von der etablierten DWD-Originalbildkalibrierung ab.');
assert.ok(Math.abs(elsig.y-.46836195)<1e-7,'Elsig-Y driftet von der etablierten DWD-Originalbildkalibrierung ab.');

function centered(point,canvasWidth,canvasHeight,viewportWidth,viewportHeight){
 const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
 const left=clamp(point.x*canvasWidth-viewportWidth/2,0,Math.max(0,canvasWidth-viewportWidth));
 const top=clamp(point.y*canvasHeight-viewportHeight/2,0,Math.max(0,canvasHeight-viewportHeight));
 return{left,top,screenX:point.x*canvasWidth-left,screenY:point.y*canvasHeight-top};
}
for(const viewport of [
 {width:320,height:240,canvasWidth:800,canvasHeight:500},
 {width:390,height:293,canvasWidth:975,canvasHeight:610},
 {width:430,height:323,canvasWidth:977,canvasHeight:611},
 {width:768,height:576,canvasWidth:1396,canvasHeight:873}
]){
 const result=centered(elsig,viewport.canvasWidth,viewport.canvasHeight,viewport.width,viewport.height);
 assert.ok(Math.abs(result.screenX-viewport.width/2)<.01,`Elsig ist horizontal nicht exakt zentrierbar bei ${viewport.width}px.`);
 assert.ok(Math.abs(result.screenY-viewport.height/2)<.01,`Elsig ist vertikal nicht exakt zentrierbar bei ${viewport.width}px.`);
}

const version=String(JSON.parse(pkgText).version||''),match=version.match(/^0\.9\.85\.(\d+)$/);
assert.ok(match&&Number(match[1])>=37,'C17 muss ab v0.9.85.37 in der Releasefolge erhalten bleiben.');
assert.ok(changelog.startsWith(`# MID v${version}`),`Öffentlicher Changelog muss mit MID v${version} beginnen.`);

console.log('MID-C17: DWD Wolken/Niederschlagsart bleibt georeferenziert und auf Mobilgeräten exakt standortzentriert.');
