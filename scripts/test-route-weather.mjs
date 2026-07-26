import {readFile} from 'node:fs/promises';

const [app,panel,route,styles]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/RouteWeatherPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/routeWeather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);

const failures=[];
for(const token of [
 "const LazyRouteWeather=lazy(()=>import('./RouteWeatherPanel'));",
 'title="Routenwetter"',
 'summary="Schematische Strecke, Windpfeile und Einschränkungsbewertung"',
 '<LazyRouteWeather start={loc} defaultProfile={routeWeatherSettings.defaultProfile} sampleMinutes={routeWeatherSettings.sampleMinutes}/>'
])if(!app.includes(token))failures.push(`App-Integration fehlt: ${token}`);

for(const token of [
 'Schematische Route mit MID-Plausibilisierung',
 'aria-label="Kartenmodus Routenwetter"',
 ">Linie<",
 ">Segmente<",
 ">Korridor<",
 'Fachliche Grenzen',
 'Einschränkungsbewertung',
 'Luftlinien-Schema zwischen Start und Ziel – keine Navigationsroute.'
])if(!panel.includes(token))failures.push(`Routenwetter-UI fehlt: ${token}`);

for(const token of [
 'precipitationParts({',
 'temperature:hour.temperature',
 'const displayCode=precipitation.displayCode',
 "precipitation.type==='none'?label(displayCode):precipitation.weatherLabel",
 'export async function loadRouteWeather',
 'Schematische Route als Luftlinie zwischen Start und Ziel',
 'formatRouteWind'
])if(!route.includes(token))failures.push(`Routenwetter-Logik fehlt: ${token}`);

for(const token of [
 '.route-weather-card',
 '.route-mode-toggle',
 '.route-weather-map',
 '.route-level-critical',
 '.route-checkpoint-list'
])if(!styles.includes(token))failures.push(`Routenwetter-Styling fehlt: ${token}`);

if(failures.length){
 console.error('Routenwetter-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Routenwetter geprüft: UI-Integration, Plausibilisierung, Kartenmodi, Windpfeile und Einschränkungsbewertung sind vorhanden.');
