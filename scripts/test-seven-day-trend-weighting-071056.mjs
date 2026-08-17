import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const sevenDay=readFileSync(new URL('../src/SevenDayForecastSummary.tsx',import.meta.url),'utf8');
assert.match(sevenDay,/const SEVEN_DAY_TREND_WEIGHTS=\[1\.8,1\.5,1\.25,1,\.82,\.68,\.55\]/,'die ersten Prognosetage werden nicht erkennbar stärker gewichtet');
assert.match(sevenDay,/type SevenDayWeatherRegime='sunny'\|'mixed'\|'cloudy'\|'wet'\|'storm'\|'snow'/,'der Trend unterscheidet Bewölkungs- und Niederschlagsregime nicht ausreichend');
assert.match(sevenDay,/denseCloudText=\/stark bewölkt\|meist bewölkt\|bedeckt\|trüb\//,'stark bzw. meist bewölkte Tage müssen Vorrang vor bloßer Sonnenscheindauer haben');
assert.match(sevenDay,/sunShare=Math\.max\(0,Math\.min\(1,sunHours\/Math\.max\(1,sevenDayDaylightHours\(day\)\)\)\)/,'Sonnenscheindauer muss relativ zur Tageslänge bewertet werden');
for(const token of ["if(max>=40)return'extreme-hot'","if(max>=35)return'very-hot'","if(max>=30)return'hot'","if(max>=25)return'summer'","if(max<0)return'ice'","tropicalNight:followingNightIsTropical(day,nextDay,allHours)"]){assert.ok(sevenDay.includes(token),`DWD-Kenntag fehlt: ${token}`)}
assert.match(sevenDay,/climateDelta:climate&&Number\.isFinite\(climate\.maxMean\)/,'Abweichung vom Klimamittel wird nicht einbezogen');
assert.match(sevenDay,/trendHours=\[\.\.\.dayHours,\.\.\.followingNightHours\]/,'Warnsignale müssen ausschließlich aus dem Tag und der ersten Folgenacht stammen');
assert.match(sevenDay,/hazards=summarizeDwdWarnings\(trendHours,elevation\)/,'markante DWD-nahe Warnsignale werden im Trend nicht geprüft');
assert.match(sevenDay,/weatherClauses=supplementalClause\?clauses\.slice\(0,2\):clauses\.slice\(0,3\)/,'markante Hazards oder Folgenachtereignisse erhalten keinen garantierten Platz im Kurztext');
assert.match(app,/const climateRequested=forecastDisplaySettings\.showSevenDaySummary\|\|ensembleRequested/,'Klimamittel wird für den 7-Tage-Trend nicht bedarfsgerecht geladen');
assert.match(app,/<SevenDayForecastSummary days=\{forecastDays\} hours=\{hours\} climate=\{climate\} elevation=\{elevation\}\/>/,'Klimamittel und Höhenlage werden nicht an den Trend übergeben');
console.log('7-Tage-Trend geprüft: frühe Tage priorisiert, DWD-Kenntage/Klimamittel/Hazards und tatsächlicher Bewölkungsverlauf berücksichtigt.');
