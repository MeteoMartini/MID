import {readFile} from 'node:fs/promises';

const [app,precip,meteogram,route,worker]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/precipitation.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/MeteogramPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/routeWeather.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8')
]);
const failures=[];
const detailOrder=app.indexOf('<span><small>Taupunkt / Feuchte</small><b>{detailDegree(currentHour.dewPoint)}');
const windOrder=app.indexOf('<span><small>Wind / Böen</small>',detailOrder);
if(detailOrder<0||windOrder<0||detailOrder>=windOrder)failures.push('Tagesdetail-Tooltip ordnet Taupunkt/Feuchte nicht vor Wind/Böen ein.');
// The v0.9.85.455 intentional NoData contract changes only the value
// formatter, not the required ordering of dew point before humidity or
// the Wind / Böen row. Preserve the original UI ordering regression.
const tooltip='<span><small>Taupunkt / Feuchte</small><b>{detailDegree(currentHour.dewPoint)} · {Number.isFinite(currentHour.humidity)?`\${Math.round(currentHour.humidity)} %`:"–"}</b></span>';
if(!app.includes(tooltip))failures.push('Tagesdetail-Tooltip muss Taupunkt vor Feuchte darstellen und fehlende Werte explizit als – markieren.');
const helper="const detailDegree=(value:number)=>Number.isFinite(value)?`\${Math.round(value)}°`:'–';";
if(!app.includes(helper))failures.push('Taupunkt muss nur endliche Werte runden und Missing als – zeigen; NaN/Infinity dürfen nicht angezeigt werden.');
// Protect the source's actual finite-only degree expression rather than
// reviving the old Math.round(NaN) bug to satisfy a historical literal.
const match=app.match(/const detailDegree=\(value:number\)=>([^;]+);/);
if(match){
 try{
  const formatter=new Function('value','return '+match[1]);
  for(const [value,expected] of [[0,'0°'],[-2.6,'-3°'],[NaN,'–'],[Infinity,'–'],[-Infinity,'–']])
   if(formatter(value)!==expected)failures.push('Taupunkt-Formatter verletzt Finite/NoData-Grenze für '+String(value));
 }catch(error){failures.push('Taupunkt-Formatter kann nicht geprüft werden: '+String(error))}
}else failures.push('Taupunkt-Formatter fehlt.');

for(const token of [
 "label:'Wind / Böen'",
 "detail:`${formatWeatherValue(windDirection,'windDirection')}° · ${cardinalDirection(windDirection)}`",
 "info:metricMore(`Richtung ${formatWeatherValue(windDirection,'windDirection')}° · ${sourceFor(['windSpeed','windDirection','windGust']"
]) if(!app.includes(token))failures.push(`Aktuelle Windkachel fehlt: ${token}`);
if(!app.includes('{wind(displayWindSpeed,unit)} · {wind(displayWindGust,unit)}')&&!app.includes('{wind(windSpeed,unit)} · {wind(windGust,unit)}'))failures.push('Aktuelle Windkachel zeigt Wind/Böen nicht im erwarteten Format oder ohne Normalisierung an.');
for(const token of ['dewPoint?:number','cloudBaseHft?:number','ceilingHft?:number','estimatedCloudBaseHft','baseHft<=3000','precipitationSampleIntervalSeconds(h)/3600','rate<=.5&&showerRate<.08','total<=.5'])
 if(!precip.includes(token))failures.push(`Zentrale Niederschlagsplausibilisierung fehlt: ${token}`);
for(const [name,text] of [['App',app],['Meteogramm',meteogram],['Routenwetter',route]])if(!text.includes('dewPoint:'))failures.push(`${name} übergibt den Taupunkt nicht an die zentrale Plausibilisierung.`);
for(const token of ['pushVisibleLocationName','pushLocationPhrases','am Standort','bei ${name}','body:thunderPushBody(result,favorite)'])if(!worker.includes(token))failures.push(`Push-Ortsbezug fehlt: ${token}`);
if(worker.includes('hat am Favoriten begonnen')||worker.includes('nähert sich dem Favoriten'))failures.push('Generischer Favoriten-Ortstext ist im Worker verblieben.');
if(failures.length){console.error('Detail/Wind/Niederschlag/Push-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Detailfelder, kompakte Windkarte mit Quelle hinter (i), Stratus-Plausibilisierung und ortsbezogene Push-Texte geprüft.');
