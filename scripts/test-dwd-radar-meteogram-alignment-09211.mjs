import {readFile} from 'node:fs/promises';
const [radar,map,cockpit,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),readFile(new URL('../src/DwdPrecipitationMap.tsx',import.meta.url),'utf8'),readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),readFile(new URL('../src/styles.css',import.meta.url),'utf8'),readFile(new URL('../package.json',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};
for(const token of ['LazyDwdPrecipitationMap','dwd-precip-type-radar__map-shell','Standortmarker direkt aus WGS84-Koordinaten'])need('DWD-Panel',radar,token);
for(const token of ['Marker position={[latitude,longitude]}','center={[latitude,longitude]} zoom={7}','<HymecNgOverlay'])need('DWD-Karte',map,token);
for(const token of ['DWD_DIRECT_IMAGE','radarCropWindow','dwdPrecipitationTypeImagePosition'])reject('Alte Bildausrichtung',radar,token);
reject('Kurzfristkompass',cockpit,'Kurzfristkompass');
for(const token of ['className="cockpit-meteogram-pro__svg-weather"','x={item.x-11}','y={item.weatherY}','weatherY=clamp(tempY-38-(index%2?7:0),chartTop+4,chartBottom-34)','chartWidth=Math.max(1040,chartViewportWidth)'])need('Meteogramm',cockpit,token);
need('Map-CSS',styles,'.dwd-precip-type-radar__leaflet');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('DWD-Karten-/Meteogramm-Ausrichtung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD WGS84-Karte und 24-h-Meteogramm-Ausrichtung erfolgreich geprüft.');
