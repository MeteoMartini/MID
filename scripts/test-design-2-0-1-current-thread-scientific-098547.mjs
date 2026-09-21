import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,design,pkgRaw,baselineRaw]=await Promise.all([
  readFile('src/App.tsx','utf8'),
  readFile('src/MidDesign.tsx','utf8'),
  readFile('package.json','utf8'),
  readFile('MID_BASELINE.json','utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-design-2-0-1-current-thread-scientific-098547.mjs';

assert.ok(app.includes("currentThreadSeries=hours.slice(Math.max(0,currentHourIndex),Math.max(0,currentHourIndex)+13)"),'12-h-Reihe muss 13 feste Stundenpositionen behalten.');
assert.ok(!app.includes("currentThreadSeries=hours.slice(Math.max(0,currentHourIndex),Math.max(0,currentHourIndex)+13).filter"),'Fehlende Stunden dürfen nicht durch Herausfiltern zeitlich zusammengeschoben werden.');
assert.ok(app.includes("currentThreadTemperatures=currentThreadSeries.map(hour=>Number(hour.temperature))"),'Der 12-h-Trend muss ausschließlich die kanonisch lokal angepasste Stundenreihe verwenden.');
assert.ok(!app.includes("index===0&&Number.isFinite(temp)?temp:Number(hour.temperature)"),'Ein isolierter beobachteter Startwert darf nicht mehr in eine anders korrigierte Reihe gemischt werden.');
assert.ok(app.includes("function currentTemperatureTrendSummary(values:number[])"),'12-h-Trend braucht eine robuste Verlaufsauswertung.');
assert.ok(app.includes("danach ↗")&&app.includes("danach ↘")&&app.includes("↕ wechselhaft"),'Richtungswechsel müssen als mehrphasiger Verlauf statt bloß Endwert minus Startwert beschrieben werden.');
assert.ok(app.includes("currentThreadTrendLabel=currentTemperatureTrendSummary(currentThreadTemperatures)"),'Sichtbarer Trend muss aus der robusten Verlaufsauswertung stammen.');
assert.ok(app.includes("minimumSpan={4}"),'Die Sparkline muss mindestens 4 K Darstellungsbereich verwenden, damit kleine Änderungen nicht übertrieben werden.');
assert.ok(app.includes("Taupunkt / Feuchte</small><b>{Math.round(dew)} °C</b><em>{Math.round(hum)} %</em>"),'Taupunkt muss primär, relative Feuchte sekundär bleiben.');

assert.ok(design.includes("minimumSpan=4"),'MidWeatherThread braucht einen wissenschaftlich konservativen Mindestbereich.');
assert.ok(design.includes("span=Math.max(Math.max(.1,minimumSpan),rawRange*1.18)"),'Vertikalskala muss kleine Temperaturspannen begrenzen.');
assert.ok(design.includes("guideY=y(first.value)"),'Referenzlinie muss dem aktuellen Wert entsprechen statt einer bedeutungslosen festen Mitte.');
assert.ok(design.includes("points.forEach((value,index)=>"),'Stundenlücken müssen explizit verarbeitet werden.');
assert.ok(design.includes("if(segment.length){segments.push(segment.join(' '));segment=[]}"),'Fehlende Stunden müssen die Linie unterbrechen statt visuell interpoliert zu werden.');
assert.ok(design.includes("segments.map((path,index)=><path"),'Getrennte reale Segmente müssen separat gerendert werden.');

assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
console.log('MID Design 2.0.1 / D.2: 12-h-Temperaturtrend ist zeitlich ehrlich, hyperlokal konsistent und visuell nicht überzeichnet.');
