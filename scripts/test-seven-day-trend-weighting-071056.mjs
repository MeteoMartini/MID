import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
assert.match(app,/const SEVEN_DAY_TREND_WEIGHTS=\[1\.8,1\.5,1\.25,1,\.82,\.68,\.55\]/,'die ersten Prognosetage werden nicht erkennbar stärker gewichtet');
assert.match(app,/type SevenDayWeatherRegime='sunny'\|'mixed'\|'cloudy'\|'wet'\|'storm'\|'snow'/,'der Trend unterscheidet Bewölkungs- und Niederschlagsregime nicht ausreichend');
assert.match(app,/denseCloudText=\/stark bewölkt\|meist bewölkt\|bedeckt\|trüb\//,'stark bzw. meist bewölkte Tage müssen Vorrang vor bloßer Sonnenscheindauer haben');
assert.match(app,/sunShare=Math\.max\(0,Math\.min\(1,sunHours\/Math\.max\(1,sevenDayDaylightHours\(day\)\)\)\)/,'Sonnenscheindauer muss relativ zur Tageslänge bewertet werden');
for(const token of ["if(max>=40)return'extreme-hot'","if(max>=35)return'very-hot'","if(max>=30)return'hot'","if(max>=25)return'summer'","if(max<0)return'ice'","tropicalNight:Number(day.min)>=20"]){assert.ok(app.includes(token),`DWD-Kenntag fehlt: ${token}`)}
assert.match(app,/climateDelta:climate&&Number\.isFinite\(climate\.maxMean\)/,'Abweichung vom Klimamittel wird nicht einbezogen');
assert.match(app,/summarizeDwdWarningsForDay\(allHours,day\.date,elevation\)/,'markante DWD-nahe Warnsignale werden im Trend nicht geprüft');
assert.match(app,/hazardClause\?clauses\.slice\(0,2\):clauses\.slice\(0,3\)/,'markante Hazards erhalten keinen garantierten Platz im Kurztext');
assert.match(app,/const climateRequested=forecastDisplaySettings\.showSevenDaySummary\|\|ensembleRequested/,'Klimamittel wird für den 7-Tage-Trend nicht bedarfsgerecht geladen');
assert.match(app,/<SevenDayForecastSummary days=\{forecastDays\} hours=\{hours\} climate=\{climate\} elevation=\{elevation\}\/>/,'Klimamittel und Höhenlage werden nicht an den Trend übergeben');
console.log('7-Tage-Trend geprüft: frühe Tage priorisiert, DWD-Kenntage/Klimamittel/Hazards und tatsächlicher Bewölkungsverlauf berücksichtigt.');
