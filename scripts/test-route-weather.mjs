import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [app,panel,core,styles]=await Promise.all([
  readFile(path.join(root,'src','App.tsx'),'utf8'),
  readFile(path.join(root,'src','RouteWeatherPanel.tsx'),'utf8'),
  readFile(path.join(root,'src','routeWeather.ts'),'utf8'),
  readFile(path.join(root,'src','styles.css'),'utf8')
]);
const failures=[];
const required={
 app:[
  "const ROUTE_WEATHER_SETTINGS_KEY='mid:routeWeatherSettings';",
  'type RouteWeatherSettings={enabled:boolean;defaultProfile:RouteProfile;sampleMinutes:number};',
  "const LazyRouteWeather=lazy(()=>import('./RouteWeatherPanel'));",
  "layoutMode==='advanced'&&routeWeatherSettings.enabled",
  'id="route-weather" title="Routenwetter"',
  '<strong>Erweiterte Funktionen</strong>',
  '<strong>Routenwetter</strong>',
  '<b>Routenwetter im Dashboard anzeigen</b>',
  'value={routeWeatherSettings.defaultProfile}',
  'value={routeWeatherSettings.sampleMinutes}'
 ],
 panel:[
  'export default function RouteWeatherPanel',
  'type="datetime-local"',
  'Routenwetter berechnen',
  'Aktueller Dashboard-Ort',
  'Fortbewegung',
  'Auto',
  'Fahrrad',
  'Zu Fuß',
  'route-weather-timeline',
  '<RouteSketch geometry={result.geometry} points={result.points}/>'
 ],
 core:[
  "routed-car/route/v1/driving",
  "routed-bike/route/v1/driving",
  "routed-foot/route/v1/driving",
  "timeformat:'unixtime'",
  "models:'best_match'",
  'Math.min(9,requested)',
  'departureEpoch+durationSeconds*1000*progress',
  "if(horizon>7*86400000)",
  "signals.push('Gewitter möglich')",
  "signals.push('Schnee/Glätte möglich')"
 ],
 styles:[
  '.advanced-feature-group>summary{',
  '.route-weather-panel{',
  '.route-weather-form{',
  '.route-weather-timeline{',
  '.route-sketch-line{'
 ]
};
for(const[name,tokens]of Object.entries(required)){const text={app,panel,core,styles}[name];for(const token of tokens)if(!text.includes(token))failures.push(`${name}: ${token}`)}
if(app.includes("layoutMode==='standard'&&routeWeatherSettings.enabled"))failures.push('Routenwetter darf nicht im Standardmodus gerendert werden.');
if(failures.length){console.error('Routenwetter-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Routenwetter geprüft: nur im Erweiterten Modus, eigenes Untermenü, OSRM-Route, zeitbezogene Best-Match-Prüfpunkte und mobile Ergebnisdarstellung sind vorhanden.');
