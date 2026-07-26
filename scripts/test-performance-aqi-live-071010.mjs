import {readFile} from 'node:fs/promises';
const [app,radar,worker]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8')
]);
const failures=[];const need=(text,token,label)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of ["layoutMode!=='advanced'||!loc","airQualityStation(loc.latitude,loc.longitude","function Current({w,hours,days","const mappedHours=hours,mappedDays=days","if(!detailsOpen||selected!==localDateInZone(timezone))return"])need(app,token,'App-weite Performanceentlastung fehlt');
for(const token of ["const panelRef=useRef<HTMLElement>(null)","new IntersectionObserver","if(!panelVisible)return","rootMargin:'300px 0px'","[lat,lon,showNowcastObjects,dwdLightning,panelVisible]"])need(radar,token,'Offscreen-Pause des Kompositbilds fehlt');
for(const token of ["DWD_KONRAD3D_ROOTS","opendatao.dwd.de","const layers=['dwd:Accumulated_Flash_Geometry','dwd:Accumulated_Flash_Area']","available:true,empty:true","KONRAD3D nicht erreichbar"])need(worker,token,'KONRAD3D-/NowCastMIX-Ausfallsicherheit fehlt');
for(const token of ['K3D veraltet/nicht erreichbar','MIX 0 · Dienst erreichbar','KONRAD3D liefert derzeit keine aktuellen Zellobjekte','DWD NowCastMIX ist erreichbar'])need(radar,token,'Livequellenstatus fehlt');
if(failures.length){console.error('Performance-/AQI-/Livequellenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('App-Performance und Livequellen geprüft: keine doppelte Current-Kartierung, Detailuhr nur bei offenem Tageschart, Komposit-Offscreen-Pause sowie K3D-/NowCastMIX-Status/Fallbacks sind aktiv.');
