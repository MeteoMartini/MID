import {readFile} from 'node:fs/promises';

const [app,precip,meteogram,route,worker]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/precipitation.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/MeteogramPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/routeWeather.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8')
]);
const failures=[];
const detailOrder=app.indexOf('<small>Taupunkt / Feuchte</small>');
const windOrder=app.indexOf('<small>Wind / Böen</small>',detailOrder);
if(detailOrder<0||windOrder<0||detailOrder>=windOrder)failures.push('Tagesdetail-Tooltip ordnet Taupunkt/Feuchte nicht vor Wind/Böen ein.');
if(!app.includes('<b>{Math.round(currentHour.dewPoint)}° · {Math.round(currentHour.humidity)} %</b>'))failures.push('Tagesdetail-Tooltip zeigt Taupunkt und Feuchte nicht in der gewünschten Reihenfolge.');
for(const token of ["label:'Wind / Böen'","detail:`Richtung ${Math.round(windDirection)}°"])
 if(!app.includes(token))failures.push(`Aktuelle Windkachel fehlt: ${token}`);
if(!app.includes('{wind(displayWindSpeed,unit)} · {wind(displayWindGust,unit)}')&&!app.includes('{wind(windSpeed,unit)} · {wind(windGust,unit)}'))failures.push('Aktuelle Windkachel zeigt Wind/Böen nicht im erwarteten Format oder ohne Normalisierung an.');
for(const token of ['dewPoint?:number','cloudBaseHft?:number','ceilingHft?:number','estimatedCloudBaseHft','baseHft<=3000','total<=.6','total<=.5'])
 if(!precip.includes(token))failures.push(`Zentrale Niederschlagsplausibilisierung fehlt: ${token}`);
for(const [name,text] of [['App',app],['Meteogramm',meteogram],['Routenwetter',route]])if(!text.includes('dewPoint:'))failures.push(`${name} übergibt den Taupunkt nicht an die zentrale Plausibilisierung.`);
for(const token of ['pushVisibleLocationName','pushLocationPhrases','am Standort','bei ${name}','body:thunderPushBody(result,favorite)'])if(!worker.includes(token))failures.push(`Push-Ortsbezug fehlt: ${token}`);
if(worker.includes('hat am Favoriten begonnen')||worker.includes('nähert sich dem Favoriten'))failures.push('Generischer Favoriten-Ortstext ist im Worker verblieben.');
if(failures.length){console.error('Detail/Wind/Niederschlag/Push-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Detailfelder, aktuelle Windkachel, appweite Stratus-Plausibilisierung und ortsbezogene Push-Texte geprüft.');
