import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [cockpit,styles,main,pkgRaw,baselineRaw]=await Promise.all([
  read('src/ForecastCockpit.tsx'),
  read('src/midC18ForecastRows.css'),
  read('src/main.tsx'),
  read('package.json'),
  read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const testPath='scripts/test-mid-18-2-5-e-forecast-rows-098583.mjs';

assert.equal(pkg.version,'0.9.85.83','Arbeitspaket E muss MID v0.9.85.83 sein.');
assert.ok(cockpit.includes('function MidForecastRow({active,compact,detail}')&&cockpit.match(/<MidForecastRow key=/g)?.length===2,'7- und 14-Tage müssen dieselbe MidForecastRow-Familie verwenden.');

assert.ok(cockpit.includes('data-mid-forecast-list="seven"')&&cockpit.includes('data-mid-forecast-row="seven"'),'7-Tage muss die gemeinsame Forecast-Row-Struktur verwenden.');
assert.ok(!cockpit.includes('expandedDate')&&!cockpit.includes('setExpandedDate'),'7-Tage darf keinen unabhängigen Stunden-/Detailöffnungszustand mehr besitzen.');
assert.ok(cockpit.includes('isExpanded=Boolean(hourlyDetail&&selected.date===day.date)'),'Nur der ausgewählte 7-Tage-Tag darf inline erweitert sein.');
assert.ok(cockpit.includes('data-mid-forecast-detail="seven"'),'7-Tage-Detail muss direkt inline unter der ausgewählten Zeile liegen.');

assert.ok(cockpit.includes('data-mid-forecast-list="fourteen"')&&cockpit.includes('data-mid-forecast-row="fourteen"'),'14-Tage muss dieselbe Forecast-Row-Familie verwenden.');
assert.ok(cockpit.includes('isActive=selected?.date===item.date'),'14-Tage darf nur die ausgewählte Zeile erweitern.');
assert.ok(cockpit.includes('data-mid-forecast-detail="fourteen"'),'14-Tage-Detail muss direkt inline unter der ausgewählten Zeile liegen.');
assert.ok(!cockpit.includes('{selected?<div className="cockpit-focus-card fourteen">'),'Separates 14-Tage-Detailpanel außerhalb der Zeile muss entfernt bleiben.');

for(const token of [
  'cockpit-day-temp-track',
  'cockpit-day-skybar',
  'cockpit-day-rain',
  'cockpit-day-wind',
  'cockpit-fourteen-temp-track',
  'cockpit-fourteen-skybar',
  'cockpit-fourteen-row precipitation',
  'cockpit-fourteen-row wind'
]) assert.ok(cockpit.includes(token),`Forecast-Row-Inhalt fehlt: ${token}`);

assert.ok(cockpit.includes("skybarDisplayMode={skybarDisplayMode}"),'7-/14-Tage müssen denselben Skybar-Anzeigemodus respektieren.');
assert.ok(cockpit.includes("displayHours.filter(hour=>hour.time.startsWith(item.date)).slice(0,24)"),'14-Tage-Skybar muss bestehende kanonische Stundenwerte ohne neue Datenquelle verwenden.');

for(const token of [
  '.mid-forecast-row',
  '.mid-forecast-row-detail',
  '.cockpit-seven-grid>.cockpit-day.mid-forecast-row',
  '.cockpit-fourteen-card.mid-forecast-row',
  '@media(max-width:1100px)',
  '@media(max-width:720px)',
  '@media(max-width:430px)',
  '@media(max-width:850px) and (orientation:landscape)',
  'prefers-reduced-motion'
]) assert.ok(styles.includes(token),`Responsive E-Designregel fehlt: ${token}`);

assert.ok(styles.includes('grid-auto-flow:row!important')&&styles.includes('overflow:visible!important'),'Forecast-Listen dürfen nicht als horizontale Kartenkarussells fortbestehen.');
assert.ok(main.indexOf("import './midC18ForecastRows.css';")>main.indexOf("import './midC18TodayProfile.css';"),'E-Designlayer muss nach dem D/D.2-Profil-Layer geladen werden.');

for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite']){
  assert.ok((baseline[key]||[]).includes(testPath),`${testPath} fehlt in ${key}`);
}
for(const file of [testPath,'src/midC18ForecastRows.css','MID_E_FORECAST_ROWS_0.9.85.83.md']){
  assert.ok((baseline.requiredFiles||[]).includes(file),`${file} fehlt in requiredFiles`);
}

console.log('MID v0.9.85.83 · Arbeitspaket E: gemeinsame responsive 7-/14-Tage-ForecastRows mit genau einer Inline-Erweiterung geschützt.');
