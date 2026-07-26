import {readFile} from 'node:fs/promises';
const [app,radar,weather,opera,worker,styles]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/OperaRasterSource.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const requireTokens=(label,text,tokens)=>{for(const token of tokens)if(!text.includes(token))failures.push(`${label}: ${token}`)};
requireTokens('Radar-Typen',weather,['export type RadarMotionAnchor','export type RadarNowcastFrame','nowcastSeries?:RadarNowcastFrame[]','motionAnchors?:RadarMotionAnchor[]']);
requireTokens('Worker-Bewegungsfeld',worker,['function precipitationAnchors(','async function dwdMotionField(','motionAnchors','motionAnchorCount','nowcastSeries=frames.map']);
requireTokens('OPERA-Bewegungsfeld',opera,['sampleOperaMotionField','function operaMotionSeries(','motionAnchors:latestField.anchors','nowcastSeries']);
requireTokens('Kompositbild',radar,['function PrecipitationMotionArrows({anchors','motionAnchors=Array.isArray(analysis?.motionAnchors)','showMotionField=showMotion&&motionAnchors.length>0','<PrecipitationMotionArrows anchors={motionAnchors}','className="radar-site-motion-label"','Zug nach {Math.round(motionDirection)}°']);
requireTokens('Nowcast-Einstellung',app,["const RADAR_DISPLAY_SETTINGS_KEY='mid:radarDisplaySettings'",'type RadarDisplaySettings={showProbabilityTimeline:boolean}','function storedRadarDisplaySettings()','Radar-Nowcast-Leiste','radarDisplaySettings.showProbabilityTimeline','<RadarNowcastTimeline radar={radarAnalysis}']);
requireTokens('Nowcast-Zeitachse',app,['function RadarNowcastTimeline(','radar-nowcast-track','radar-nowcast-now','radar-nowcast-wet','−1 h bis +2 h']);
requireTokens('Darstellung',styles,['.settings-toggle-card{','.radar-nowcast-strip{','.radar-nowcast-track{','.radar-nowcast-now{','.radar-nowcast-wet{','.radarmap .radar-motion-chip{','.leaflet-tooltip.radar-site-motion-label{']);
if(radar.includes('PrecipitationMotionArrows lat={lat} lon={lon}'))failures.push('Kompositbild verwendet noch ausschließlich die drei Standortpfeile.');
if(failures.length){console.error('Radar-Bewegungsfeld/Nowcast-Leiste fehlerhaft:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Radar-Bewegungsfeld und optionale Nowcast-Leiste geprüft: flächige Echoanker, freier Standortstatus, Einstellungspersistenz und −1/+2-h-Zeitachse sind vorhanden.');
