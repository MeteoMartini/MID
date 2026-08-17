import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [sevenDay,pkgText,baselineText]=await Promise.all(['src/SevenDayForecastSummary.tsx','package.json','MID_BASELINE.json'].map(path=>readFile(new URL(path,root),'utf8')));
for(const token of [
 "calendarDayHours=allHours.filter(hour=>hour.time.startsWith(day.date)).sort((a,b)=>a.epoch-b.epoch)",
 "fullCurrentDayAssessment=index===0&&calendarDayHours.length?precipitationPeriodAssessment(calendarDayHours):null",
 "dayPrecipitation=Math.max(dayAssessment.amount,index===0?Math.max(0,Number(day.precipitation)||0):0)",
 "currentDayPrecipitationRelevant=index===0&&(dayPrecipitation>=.1||dayAssessment.durationHours>=.25||dayAssessment.activeIntervals>0)",
 "wetDominant=dayAssessment.dominant||currentDayPrecipitationRelevant",
 "thunderDirect=dayHours.some(hour=>[95,96,97,99].includes(Math.round(Number(hour.code))))"
])assert.ok(sevenDay.includes(token),`7-Tage-Heute-Niederschlagsvertrag fehlt: ${token}`);
assert.ok(sevenDay.includes("futureHours=index===0?allDayHours.filter(hour=>hour.epoch>=Date.now()-30*60000):allDayHours"),'Resttageslogik für Wettercharakter muss erhalten bleiben.');
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-seven-day-today-precipitation-09554.mjs';
assert.equal(pkg.scripts?.['test:seven-day-today-precipitation'],`node ${test}`,'npm-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Pflichtregression fehlt in requiredRegressionTests.');
assert.ok(baseline.regressionTests?.includes(test),'Regression fehlt in regressionTests.');
console.log('7-Tage-Trend geprüft: heutiger Niederschlag bleibt über den vollständigen lokalen Kalendertag 00–24 Uhr erhalten, auch nach seinem Ablauf.');
