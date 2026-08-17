import {readFile} from 'node:fs/promises';

const [app,radar,css]=await Promise.all([
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const requireToken=(source,token,label)=>{if(!source.includes(token))failures.push(`${label}: ${token}`)};

requireToken(app,'function LocalClock(','isolierte Ortszeit fehlt');
requireToken(app,'const MemoCurrent=memo(Current);','Hauptkarten-Memoisierung fehlt');
requireToken(app,'const MemoForecast=memo(Forecast);','Vorhersage-Memoisierung fehlt');
requireToken(app,'const MemoLazyRadar=memo(LazyRadar);','Radar-Memoisierung fehlt');
requireToken(app,"now-lastRun<45000",'Radar-Fokusabrufe werden nicht entdoppelt');
requireToken(app,"now-lastRun<60000",'Starkregen-Abrufe werden nicht entdoppelt');
if(app.includes('setClockTick')||app.includes('setInterval(()=>setClockTick'))failures.push('Die gesamte App wird weiterhin durch einen globalen Uhrentakt neu gerendert.');

requireToken(radar,'preferCanvas','Leaflet-Canvasrenderer fehlt');
requireToken(radar,'const MemoPrecipitationMotionTrack=memo(PrecipitationMotionTrack);','Verlagerungs-Zugspur ist nicht memoisiert');
requireToken(radar,'const MemoKonradNowcastObjects=memo(KonradNowcastObjects);','KONRAD3D-Objekte sind nicht memoisiert');
requireToken(radar,'const visibleLightning=useMemo','Blitzfilter wird bei jedem Render vollständig neu berechnet');
requireToken(radar,"document.visibilityState==='hidden'",'Radar-Hintergrundabrufe werden nicht pausiert');
if(radar.includes('setInterval(()=>setNowMs(Date.now()),30000)'))failures.push('Das komplette Kompositbild wird weiterhin alle 30 Sekunden neu gerendert.');

for(const token of ['@media (hover:none),(pointer:coarse)','backdrop-filter:none!important','.radar-motion-arrow','.card,.top{box-shadow:0 8px 24px'])requireToken(css,token,'Mobile Rendering-Entlastung fehlt');

if(failures.length){
 console.error(`Responsivitätsregression v0.7.100.3:\n- ${failures.join('\n- ')}`);
 process.exit(1);
}
console.log('Responsivität v0.7.100.3 geprüft: isolierte Uhr, memoisiertes Dashboard, entdoppelte Live-Abrufe, Leaflet-Canvas und mobile Effektentlastung sind aktiv.');
