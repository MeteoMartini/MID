import {readFile} from 'node:fs/promises';

const [radar,cockpit,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};

for(const token of [
 'function mercatorLatitude(latitude:number)',
 "export function dwdPrecipitationTypeImagePosition",
 "transform:`translate(-${position.x.toFixed(6)}%, -${position.y.toFixed(6)}%)`",
 'PRECIPITATION_TYPE_LEGEND',
 "label:'großer Hagel'",
 "label:'kleiner Hagel'",
 "label:'Graupel'",
 "label:'gefrierender Regen'",
 "label:'gefr. Sprühregen'",
 "label:'Schnee'",
 "label:'Schneeregen'",
 "label:'Regen'",
 "label:'Sprühregen'",
 "label:'nicht klassifizierbar'",
 "label:'kein Niederschlag'",
 'Legende der Niederschlagsarten anzeigen'
])need('DWD-Radar',radar,token);
need('Radar-Bildtransform',styles,'.dwd-precip-type-radar__image{position:absolute');
need('Radar-Legende',styles,'.dwd-precip-type-radar__legend{');
for(const token of [
 'className="cockpit-meteogram-pro__svg-weather"',
 'x={item.x-11}',
 'y={item.weatherY}',
 'weatherY=clamp(tempY-38-(index%2?7:0),chartTop+4,chartBottom-34)'
])need('Meteogramm',cockpit,token);
reject('Meteogramm',cockpit,'cockpit-meteogram-pro__overlay weather');
const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;
if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: ${packageVersion} / ${baselineVersion}`);
if(failures.length){console.error('DWD-Radar-/Meteogramm-Ausrichtung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD-Radar-Verortung, (i)-Legende und SVG-synchrone Meteogramm-Piktogramme erfolgreich geprüft.');
