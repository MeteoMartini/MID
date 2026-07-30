import {readFile} from 'node:fs/promises';

const [worker,radar,app,opera,weather,composite,styles]=await Promise.all([
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/OperaRasterSource.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/CompositeData.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const requireTokens=(label,text,tokens)=>{for(const token of tokens)if(!text.includes(token))failures.push(`${label}: ${token}`)};

requireTokens('Saisonale Worker-Echoauswertung',worker,[
 'function seasonalEchoProfile(',"'winter-sensitive'","'summer-filter'",'wet_bulb_temperature_2m','siteThreshold','nearbyThreshold','motionThreshold','anchorThreshold','seasonalEchoLabel'
]);
requireTokens('Meteorologischer Zugvektor',worker,[
 'function radarMeteorologicalContext(','wind_speed_925hPa','wind_speed_850hPa','wind_speed_700hPa','wind_speed_500hPa','function steeringMotionFromContext(','function hybridRadarMotion(','KONRAD3D+Schwerpunktströmung','motionDirectionConvention:\'towards\''
]);
requireTokens('Nowcast-Objekt-API',worker,["mode==='nowcastmix-points'",'dwdLightningPoints(lat,lon)',"'dwd-nowcastmix-lightning'"]);
requireTokens('Komposit-Option',radar,[
 'showNowcastObjects:boolean','label="K3D / MIX"','nowcastButtonDetail=`${k3dButtonState} · ${mixButtonState}`','function KonradNowcastObjects(','loadNowcastMixPoints(','visibleNowcastMix','<MemoKonradNowcastObjects data={thunder}'
]);
requireTokens('Wiederhergestellte Zugpfeile',radar,[
 'motionAvailable=showRadar&&Number.isFinite(motionDirection)&&Number.isFinite(motionSpeed)&&motionSpeed>=2','showMotion=showMotionOverlay&&motionAvailable','displayMotionAnchors=motionAnchors','showMotionField=showMotion&&displayMotionAnchors.length>0','confidence={analysis?.motionConfidence||\'low\'}',"confidence==='low'?'5 4':''"
]);
requireTokens('App-Schwellen',app,['function radarSiteThreshold(','function radarNearbyThreshold(','seasonalEchoLabel']);
requireTokens('OPERA-Saisonprofil',opera,['function operaSeasonalEchoProfile(','winter-sensitive','summer-filter','echoProfile.siteThreshold','echoProfile.anchorThreshold','seasonalEchoLabel:echoProfile.label']);
requireTokens('Radar-Typvertrag',weather,['seasonalEchoProfile?:','steeringDirectionDeg?:number','forecastLatitude?:number','motionDirectionDeg?:number']);
requireTokens('Frontend-Workerclient',composite,["loadNowcastMixPoints","'nowcastmix-points'"]);
requireTokens('Objekt-Styling',styles,['.konrad-track','.mid-konrad-marker{','.mid-nowcastmix-marker{','.mid-motion-arrow-marker.low']);

// Saisonale Schwellen müssen schwache Echos im Winter sensibler behandeln als im Sommer.
try{
 const start=worker.indexOf('function seasonalEchoProfile('),end=worker.indexOf('async function radarMeteorologicalContext',start),snippet=worker.slice(start,end);
 const {seasonalEchoProfile}=new Function(`${snippet};return{seasonalEchoProfile}`)();
 const winter=seasonalEchoProfile(50,Date.UTC(2026,0,15),{}),summer=seasonalEchoProfile(50,Date.UTC(2026,6,15),{}),snowySummer=seasonalEchoProfile(50,Date.UTC(2026,6,15),{wetBulb:0.5,snowfall:.2});
 if(winter.mode!=='winter-sensitive'||summer.mode!=='summer-filter')failures.push(`Saisonprofile falsch: ${JSON.stringify({winter,summer})}`);
 if(!(winter.siteThreshold<summer.siteThreshold&&winter.nearbyThreshold<summer.nearbyThreshold&&winter.anchorThreshold<summer.anchorThreshold))failures.push('Winterschwellen sind nicht empfindlicher als Sommerschwellen.');
 if(snowySummer.mode!=='winter-sensitive')failures.push('Explizites winterliches Hydrometeorsignal übersteuert das Kalenderprofil nicht.');
}catch(error){failures.push(`Funktionaler Saisonprofiltest nicht ausführbar: ${error instanceof Error?error.message:String(error)}`)}

// Ein einheitlicher Westwind (meteorologisch 270°) muss als Zug nach Osten (ca. 90°) erscheinen.
try{
 const start=worker.indexOf('function vectorFromTowards('),end=worker.indexOf('function radarMotionFromFrames(',start),snippet=worker.slice(start,end);
 const api=new Function(`${snippet};return{steeringMotionFromContext,hybridRadarMotion}`)(),steering=api.steeringMotionFromContext({cape:80,weatherCode:3,levels:[{level:925,speed:30,directionFrom:270},{level:850,speed:40,directionFrom:270},{level:700,speed:45,directionFrom:270},{level:500,speed:50,directionFrom:270}]},1),resolved=api.hybridRadarMotion({},steering,null);
 if(!Number.isFinite(resolved.motionDirectionDeg)||Math.abs(resolved.motionDirectionDeg-90)>5)failures.push(`Schwerpunktströmung zeigt nicht nach Osten: ${JSON.stringify(resolved)}`);
 if(resolved.motionDirectionConvention!=='towards')failures.push('Schwerpunktströmung ist nicht als Zielrichtung gekennzeichnet.');
}catch(error){failures.push(`Funktionaler Schwerpunktströmungstest nicht ausführbar: ${error instanceof Error?error.message:String(error)}`)}

if(failures.length){console.error('Saisonale Radar-/Zugvektor-/Nowcastobjekt-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Saisonale Radarbewertung, meteorologischer Hybrid-Zugvektor, wiederhergestellte Pfeile sowie optionale KONRAD3D-/NowCastMIX-Objekte sind geprüft.');
