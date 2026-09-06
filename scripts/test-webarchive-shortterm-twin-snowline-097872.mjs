import fs from 'node:fs';
import assert from 'node:assert/strict';
const cockpit=fs.readFileSync('src/ForecastCockpit.tsx','utf8');
const twin=fs.readFileSync('src/ForecastVerificationPanel.tsx','utf8');
const app=fs.readFileSync('src/App.tsx','utf8');
assert.ok(cockpit.includes('return point.offsetMinutes>0||duration>=5'),'90-min strip must suppress sub-5-minute residual slot');
assert.ok(twin.includes('function displayLocalWeights')&&twin.includes("const key=`${weight.independenceGroup||''}::${weight.label.trim().toLowerCase()}`"),'twin display must merge duplicate model labels within one independence group');
assert.ok(twin.includes('displayLocalWeights(item.weights).slice(0,4)'),'twin UI must render normalized display weights');
for(const token of [
 "timingResolved=strongWindows.length>0",
 "probability=timingResolved?(window?Math.max(0,Number(window.probability)||0):0):dayProbability",
 "precipBands=(()=>",
 "Niederschlagstag · Zeitpunkt nicht aufgelöst",
 "cutoffDate=lastHourly?mountainLocalDateKey(lastHourly,timezone):''",
 "startHour:Math.max(window.startHour,cutoffHour)",
 "danach 6-h-Fenster bzw. Tageswahrscheinlichkeit"
])assert.ok(app.includes(token),`snowline precipitation contract missing: ${token}`);
assert.ok(!app.includes("probability=Math.max(Number.isFinite(dayProbability)?dayProbability:0,Number.isFinite(windowProbability)?windowProbability:0)"),'daily probability must not activate every sub-day snowline point');
console.log('MID v0.9.78.72: Webarchiv-Punkte 90 min, Wetterzwilling-Doppelanzeige und Schneefallgrenzen-Niederschlag regressionsgeschützt.');
