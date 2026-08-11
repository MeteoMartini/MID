import {readFile} from 'node:fs/promises';
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const failures=[];
const safe='<RadarNowcastTimeline radar={radarAnalysis} timezone={displayTimezone}/>';
if(!app.includes(safe))failures.push(`Nullsichere Nowcast-Zeitzone fehlt: ${safe}`);
if(app.includes('<RadarNowcastTimeline radar={radarAnalysis} timezone={w.timezone}/>'))failures.push('Nicht-nullgesicherter Zugriff auf w.timezone ist wieder vorhanden.');
if(!app.includes('radarDisplaySettings.showProbabilityTimeline&&radarAnalysis&&radarSignalDetected(radarAnalysis)'))failures.push('Bedingte Nowcast-Einblendung fehlt.');
if(failures.length){console.error('Radar-Nowcast-Nullbarkeitsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Radar-Nowcast-Nullbarkeit geprüft: ausgewählte app-weite Zeitbasis wird während des initialen Ladens nullsicher übergeben.');
