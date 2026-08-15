import {readFileSync} from 'node:fs';
const cockpit=readFileSync(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const pictograms=readFileSync(new URL('../src/WeatherPictogram.tsx',import.meta.url),'utf8');
const failures=[];
for(const token of [
 "buildShortTermForecast(minutes15,hours,timezone,Date.now(),anchor,radarNowcast)",
 "shortTermAnchor?:ShortTermAnchor",
 "Bis auf Weiteres trocken · ${gustPart}",
 "cockpit-local-badge",
 "<WeatherPictogram code={item.weatherCode}",
 "<InlineWindArrow direction={item.direction}",
 "<InlineWindArrow direction={selected.direction}"
]) if(!cockpit.includes(token))failures.push(`Forecast-Cockpit-Vertrag fehlt: ${token}`);
for(const token of [
 "shortTermAnchor=useMemo(()=>w?shortTermAnchorFromCurrent(st,w.current,Date.now(),w.elevation??loc?.elevation):undefined",
 "applyHyperlocalForecastHours(core.hours,shortTermAnchor,Date.now(),twinHours)",
 "displayMinutes15=useMemo(()=>finalizeForecastMinute15(minutes15,twinHours,displayHours,{radar:radarAnalysis,localAnchor:shortTermAnchor})",
 "<ShortTermForecast key={id} minutes15={displayMinutes15} hours={displayHours}"
]) if(!app.includes(token))failures.push(`App-Datenpfad fehlt: ${token}`);
for(const kind of ["'clear'","'mostly-clear'","'partly-cloudy'","'cloudy'","'fog'","'rime-fog'","'drizzle'","'freezing-drizzle'","'rain'","'freezing-rain'","'showers'","'sleet'","'snow'","'snow-grains'","'snow-showers'","'thunder'","'thunder-hail'"]) if(!pictograms.includes(kind))failures.push(`Piktogrammtyp fehlt: ${kind}`);
if(/kein Niederschlag voraussichtlich markant/i.test(cockpit))failures.push('Alte unpräzise Kurzfristformulierung ist noch enthalten.');
if(failures.length){console.error('Hyperlokal-/Kurzfrist-/Piktogramm-Regression fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Hyperlokale Ultra-/Kurzfrist, präzise Zusammenfassung, 14-Tage-Piktogramme und Windpfeile geprüft.');
