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
assert.ok(app.includes("index===0&&Number.isFinite(temp)?temp:Number(hour.temperature)"),'Der linke Jetzt-Anker muss zur angezeigten aktuellen Temperatur passen.');
assert.ok(app.includes("currentThreadDelta="),'12-h-Trend braucht eine explizite Temperaturänderung.');
assert.ok(app.includes("currentThreadTrendLabel="),'12-h-Trend braucht eine Richtungs-/Delta-Aussage.');
assert.ok(app.includes("minimumSpan={4}"),'Die Sparkline muss mindestens 4 K Darstellungsbereich verwenden, damit kleine Änderungen nicht übertrieben werden.');
assert.ok(app.includes("Taupunkt / Feuchte</small><b>{Math.round(dew)} °C</b><em>{Math.round(hum)} %</em>"),'Taupunkt muss primär, relative Feuchte sekundär bleiben.');

assert.ok(design.includes("minimumSpan=4"),'MidWeatherThread braucht einen wissenschaftlich konservativen Mindestbereich.');
assert.ok(design.includes("span=Math.max(Math.max(.1,minimumSpan),rawRange*1.18)"),'Vertikalskala muss kleine Temperaturspannen begrenzen.');
assert.ok(design.includes("guideY=y(first.value)"),'Referenzlinie muss dem aktuellen Wert entsprechen statt einer bedeutungslosen festen Mitte.');
assert.ok(design.includes("points.forEach((value,index)=>"),'Stundenlücken müssen explizit verarbeitet werden.');
assert.ok(design.includes("if(segment.length){segments.push(segment.join(' '));segment=[]}"),'Fehlende Stunden müssen die Linie unterbrechen statt visuell interpoliert zu werden.');
assert.ok(design.includes("segments.map((path,index)=><path"),'Getrennte reale Segmente müssen separat gerendert werden.');

assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
console.log('MID Design 2.0.1: 12-h-Temperaturtrend ist zeitlich ehrlich, am aktuellen Wert verankert und visuell nicht überzeichnet.');
