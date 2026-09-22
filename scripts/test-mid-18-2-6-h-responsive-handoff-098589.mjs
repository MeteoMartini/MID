import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [forecast,meteogram,water,styles,main]=await Promise.all([
  read('src/ForecastCockpit.tsx'),
  read('src/MeteogramPanel.tsx'),
  read('src/WaterSportsPanel.tsx'),
  read('src/midC18WorkPackageH.css'),
  read('src/main.tsx'),
]);

// 7-Tage-Produktion: echte Tagesbuttons bleiben bedienbar; die Detailfläche wird
// weiterhin nur für den ausgewählten Tag erzeugt und durch H nach der Liste angeordnet.
for(const token of [
  'function MidForecastRow',
  'data-mid-forecast-list="seven"',
  'data-mid-forecast-row="seven"',
  'data-mid-forecast-detail="seven"',
  'onClick={()=>chooseDay(day.date)}',
  'aria-expanded={hourlyDetail?isExpanded:undefined}',
  'SevenDayCurveOverview'
]) assert.ok(forecast.includes(token),`7-Tage-Interaktionsvertrag fehlt: ${token}`);

assert.ok(main.includes("import './midC18WorkPackageH.css';"),'Arbeitspaket-H-CSS muss geladen werden.');
const gImport=main.indexOf("import './midC18WorkPackageG.css';");
const hImport=main.indexOf("import './midC18WorkPackageH.css';");
assert.ok(gImport>=0&&hImport>gImport,'H muss als finale UI-Schicht nach G geladen werden.');

for(const token of [
  ".cockpit-seven-grid[data-mid-forecast-list='seven']",
  'grid-template-columns:minmax(0,1fr)!important',
  'order:1!important',
  'order:2!important',
  'grid-column:1/-1!important',
  'overflow-x:clip!important',
  '@media(min-width:1101px)',
  '@media(min-width:721px) and (max-width:1100px)',
  '@media(max-width:720px)',
  '@media(max-width:430px)',
  '@media(max-width:850px) and (orientation:landscape)'
]) assert.ok(styles.includes(token),`H-Responsivevertrag fehlt: ${token}`);

// H darf die sieben Tageskarten nie wieder als sieben Desktop-/Landscape-Spalten erzwingen.
assert.ok(!styles.includes('repeat(var(--cockpit-day-count),minmax(0,1fr))'),'H darf die 7-Tage-Liste nicht wieder in sieben Spalten aufziehen.');
assert.ok(!styles.includes('grid-template-columns:repeat(7'),'H darf keine feste Sieben-Spalten-Tagesliste einführen.');

// H.2c-Mapping: vorhandene produktive Meteogramm- und Tide-/Wasserflächen bleiben
// funktional erhalten; H schützt lediglich Breite, Touchziele und lokale Scrollbereiche.
for(const token of [
  'className="card meteogram-card open"',
  'className="meteogram-controls"',
  'className="meteogram-export-stage"',
  'Download',
  'Aktualisieren'
]) assert.ok(meteogram.includes(token),`Meteogramm-Vertrag fehlt: ${token}`);

for(const token of [
  'data-mid-view="water"',
  'className={`water-forecast-matrix',
  'className="water-matrix-summary"',
  'aria-expanded={open}',
  'className="mountain-matrix-scroll water-matrix-scroll"',
  'tideEventsForDate',
  'TideSparkline'
]) assert.ok(water.includes(token),`Wasser-/Tide-Vertrag fehlt: ${token}`);

for(const token of [
  '.meteogram-card',
  '.meteogram-controls',
  '.water-sports',
  '.water-forecast-matrix',
  '.water-matrix-scroll',
  'overflow-x:auto!important',
  'overscroll-behavior-inline:contain!important',
  'min-height:44px!important'
]) assert.ok(styles.includes(token),`H.2c-Layoutvertrag fehlt: ${token}`);

console.log('MID v0.9.85.89+: Arbeitspaket H – 7-Tage-Detailfluss sowie responsive Meteogramm-/Tide-Verträge geschützt.');
