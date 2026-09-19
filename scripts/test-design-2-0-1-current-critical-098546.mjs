import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,design,css,main,pkgRaw,baselineRaw]=await Promise.all([
 readFile('src/App.tsx','utf8'),
 readFile('src/MidDesign.tsx','utf8'),
 readFile('src/midDesign201CurrentCritical.css','utf8'),
 readFile('src/main.tsx','utf8'),
 readFile('package.json','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-design-2-0-1-current-critical-098546.mjs';

assert.ok(app.includes("hours.slice(Math.max(0,currentHourIndex),Math.max(0,currentHourIndex)+13)"),'12-h-Faden muss Jetzt bis +12 h mit 13 Stundenpunkten abdecken.');
assert.ok(app.includes('Temperaturtrend · {currentThreadHorizon} h'),'Aussagekräftige dynamische 12-h-Beschriftung fehlt.');
assert.ok(app.includes('current-weather-thread-axis'),'Zeit-/Temperaturachse für den 12-h-Faden fehlt.');
assert.ok(app.includes('hourDisplayClock(currentThreadMid,w.timezone)'),'Mittlerer Zeitanker fehlt.');
assert.ok(app.includes('hourDisplayClock(currentThreadEnd,w.timezone)'),'Endzeitanker fehlt.');
assert.ok(app.includes('<small>Taupunkt / Feuchte</small><b>{Math.round(dew)} °C</b><em>{Math.round(hum)} %</em>'),'Taupunkt muss in der Hauptansicht vor relativer Feuchte stehen.');
assert.ok(app.includes("dryNow=probability<10&&!radarSignalDetected(radar)&&!thunderInfo&&!heavyRainInfo"),'Trockener Nowcast braucht einen kompakten Darstellungszustand.');
assert.ok(app.includes('if(downDistance>=64){setBottomBarHidden(true);downDistance=0}'),'Bottom-Bar muss auf Abwärtsscrollen früher ausblenden.');
assert.ok(app.includes('if(upDistance>=40){setBottomBarHidden(false);upDistance=0}'),'Bottom-Bar darf bei minimalem Gegenscrollen nicht sofort zurückspringen.');

assert.ok(design.includes('className="mid-weather-thread-current"'),'Der markierte Messpunkt muss explizit Jetzt repräsentieren.');
assert.ok(design.includes('cx={x(first.index)}'),'Jetzt-Markierung muss am ersten realen Stundenwert liegen.');
assert.ok(design.includes('className="mid-weather-thread-end"'),'Endpunkt muss getrennt von Jetzt dargestellt werden.');
assert.ok(!design.includes('<circle cx="100"'),'Der alte irreführende Messpunkt am +12-h-Ende darf nicht zurückkehren.');

for(const token of [
 ".current-weather-thread-head",
 ".current-weather-thread-axis",
 ".mid-weather-thread-current",
 ".mid-weather-thread-end",
 ".current-nowcards.dry .current-precip-panel",
 ".uvi-card",
 ".air-quality-card",
 ".sunshine-card",
 ".sun-moon-card",
 ".place-warning-status",
 ".dashboard-section-quick.dashboard-bottom-tabs.is-scroll-hidden"
])assert.ok(css.includes(token),`Kritische Mobile-QA-Regel fehlt: ${token}`);

assert.ok(!/letter-spacing\s*:\s*-\.(?:0[3-9]|[1-9])em/i.test(css),'Aggressive negative Laufweite darf nicht zurückkehren.');
assert.ok(main.includes("import './midDesign201CurrentCritical.css';"),'Critical-Polish-CSS fehlt im Produktionsentry.');
assert.ok(main.indexOf("import './midDesign201CurrentCritical.css';")>main.indexOf("import './midDesign201MobileQa.css';"),'Critical-Polish muss nach der bisherigen iPhone-QA geladen werden.');

assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}`);
assert.ok(baseline.requiredFiles?.includes(test),`${test} fehlt in requiredFiles`);

console.log('MID: kritische iPhone-QA, Taupunkt-Priorität, 12-h-Faden mit echten Zeitankern, kompakter Dry-Nowcast und Bottom-Bar-Verhalten geprüft.');
