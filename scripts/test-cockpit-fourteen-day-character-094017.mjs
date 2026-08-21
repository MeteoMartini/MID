import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cockpit=fs.readFileSync(path.join(root,'src/ForecastCockpit.tsx'),'utf8');
const ensemble=fs.readFileSync(path.join(root,'src/EnsemblePanel.tsx'),'utf8');
const precipitation=fs.readFileSync(path.join(root,'src/precipitation.ts'),'utf8');
for(const token of [
 'function ensembleSeries(ensemble:EnsembleDay[],days:Day[],climate:ClimateDay[],hours:Hour[]=[]){',
 'const hoursByDate=new Map<string,Hour[]>()',
 'character=bestDay?dayWeatherCharacter(bestDay,dayHours):null',
 'weatherCode=character?.code??bestDay?.code??3',
 'weatherLabel=character?dayWeatherCharacterText(character):weatherCodeLabel(weatherCode)',
 'function FourteenDayHorizon({ensemble,days,hours,scenarios,climate',
 'ensembleSeries(ensemble,days,climate,hours)',
 '<FourteenDayHorizon ensemble={ensemble} days={days} hours={hours}',
 '<Droplets size={12}/><span>Niederschlag</span></label>'
])assert.ok(cockpit.includes(token),`14-Tage-Cockpit-Vertrag fehlt: ${token}`);
for(const token of [
 'character=dayWeatherCharacter(day,dayHours)',
 'precipitationVisualDescriptor(day.code,bestPrecipitation,bestPrecipitationProbability,dayHours)'
])assert.ok(ensemble.includes(token),`Referenz der bestehenden 14-Tage-Ensemblelogik fehlt: ${token}`);
for(const token of [
 'drizzlePlausible(h,total)',
 "type=drizzlePlausible(h,total)?'drizzle':convectiveLean?'showers':'rain'",
 "else if(codedType==='rain')type=convectiveLean?'showers':'rain'"
])assert.ok(precipitation.includes(token),`Zentrale Sprühregen-/Konvektivlogik fehlt: ${token}`);
assert.ok(!cockpit.includes('<Droplets size={12}/> Regen</label>'),'14-Tage-Cockpit verwendet weiterhin die irreführende pauschale Bezeichnung „Regen“.');
console.log('14-Tage-Cockpit nutzt Tagescharakter, Sprühregen-Plausibilisierung und Konvektivniederschlagslogik appweit konsistent.');
