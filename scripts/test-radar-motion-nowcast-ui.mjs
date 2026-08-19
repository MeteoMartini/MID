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
requireTokens('Radar-Typen',weather,['export type RadarMotionAnchor','export type RadarNowcastFrame','nowcastSeries?:RadarNowcastFrame[]','motionAnchors?:RadarMotionAnchor[]','steeringCloudCenterHpa?:number','steeringProfileMode?:']);
requireTokens('Worker-Bewegungsfeld',worker,['function precipitationAnchors(','async function dwdMotionField(','motionAnchors','motionAnchorCount','nowcastSeries=frames.map']);
requireTokens('OPERA-Bewegungsfeld',opera,['sampleOperaMotionField','function operaMotionSeries(','motionAnchors:latestField.anchors','nowcastSeries']);
requireTokens('Kompositbild',radar,['function PrecipitationMotionTrack({site','upstreamBearing=(resolved.direction+180)%360','const trackKm=Math.max(.5,resolved.speed*MOTION_AXIS_LEAD_MINUTES/60)','showMotionField=showMotion','<MemoPrecipitationMotionTrack site={[lat,lon]}','function motionTrackGraphicIcon(','mid-motion-track-graphic','<Marker pane="mid-motion-labels" position={geometry.trackMid} icon={motionTrackGraphicIcon','Zeitpfeil {Math.round(motionDirection)}°','steeringCloudCenterHpa','mid-motion-labels']);
requireTokens('Nowcast-Einstellung',app,["const RADAR_DISPLAY_SETTINGS_KEY='mid:radarDisplaySettings'",'type RadarDisplaySettings={showProbabilityTimeline:boolean}','function storedRadarDisplaySettings()','Radar-Nowcast-Leiste','radarDisplaySettings.showProbabilityTimeline','<RadarNowcastTimeline radar={radarAnalysis}']);
requireTokens('Nowcast-Zeitachse',app,['function RadarNowcastTimeline(','radar-nowcast-track','radar-nowcast-now','radar-nowcast-wet','<small>2-h-Summe</small><strong>{radarAmountLabel(forecastAmount)} mm</strong>']);
requireTokens('Darstellung',styles,['.settings-toggle-card{','.radar-nowcast-strip{','.radar-nowcast-track{','.radar-nowcast-now{','.radar-nowcast-wet{','.mid-motion-track-graphic{','.composite-map-interaction{']);
if(radar.includes('PrecipitationMotionArrows lat={lat} lon={lon}'))failures.push('Kompositbild verwendet noch ausschließlich die drei Standortpfeile.');
if(radar.includes('radar-motion-chip')||radar.includes('radar-site-motion-label'))failures.push('Das entfernte textliche Zugrichtungs-Overlay ist wieder aktiv.');
if(failures.length){console.error('Radar-Bewegungsfeld/Nowcast-Leiste fehlerhaft:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Radar-Bewegungsfeld und optionale Nowcast-Leiste geprüft: flächige Echoanker, freier Standortstatus, Einstellungspersistenz und −1/+2-h-Zeitachse sind vorhanden.');
