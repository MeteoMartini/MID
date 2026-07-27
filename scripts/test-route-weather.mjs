import {readFile} from 'node:fs/promises';
const [app,panel,route]=await Promise.all([
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/RouteWeatherPanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/routeWeather.ts',import.meta.url),'utf8')
]);
const failures=[];
for(const token of ["LazyRouteWeather",'title="Routenwetter"','ROUTE_WEATHER_SETTINGS_KEY','routeWeatherSettings.enabled'])if(app.includes(token))failures.push(`Routenwetter ist noch aktiv eingebunden: ${token}`);
for(const token of ['RouteWeatherPanel','Route analysieren'])if(!panel.includes(token))failures.push(`Vorläufig stillgelegte Routenwetterquelle fehlt: ${token}`);
for(const token of ['export async function loadRouteWeather','formatRouteWind'])if(!route.includes(token))failures.push(`Vorläufig stillgelegte Routenwetterlogik fehlt: ${token}`);
if(failures.length){console.error('Routenwetter-Stilllegung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Routenwetter ist aus Dashboard und Einstellungen entfernt; Quellmodule bleiben für eine spätere Reaktivierung erhalten.');
