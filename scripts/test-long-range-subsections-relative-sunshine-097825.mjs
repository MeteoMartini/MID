import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const [panel,trend,cockpit,styles]=await Promise.all([readFile('src/LongRangePanel.tsx','utf8'),readFile('src/SubseasonalTrendPanel.tsx','utf8'),readFile('src/ForecastCockpit.tsx','utf8'),readFile('src/styles-src/30-modern.css','utf8')]);
for(const token of ['WITTERUNGSTREND','SAISONVORHERSAGEN','weather-trend-subsection','seasonal-forecast-subsection'])assert.ok(panel.includes(token),`Untersektion fehlt: ${token}`);
assert.ok(trend.includes('Tag 15–46 · Wochenentwicklung'),'Witterungstrend muss in der eigenen Untersektion ohne doppelte Überschrift stehen.');
for(const token of ['RELATIVE_SUN_RAYS','daylightSecondsForFourteenDay','relativeSunshineShare','RelativeSunshineIcon','intensity=.42+ratio*.58','sun-base sun-ray','sunshineShare*100'])assert.ok(cockpit.includes(token),`Relative 14d-Sonnendarstellung fehlt: ${token}`);
assert.ok(cockpit.includes('P10–P90 {sunshineHoursLabel(item.sunshineDurationLow)}–{sunshineHoursLabel(item.sunshineDurationHigh)}'),'P10–P90-Text der 14d-Sonnenzeile muss unverändert erhalten bleiben.');
const sunCss=styles.slice(styles.indexOf('.cockpit-relative-sun{'),styles.indexOf('.cockpit-fourteen-sunshine>span'));assert.ok(sunCss.includes('.sun-ray{shape-rendering:geometricPrecision}')&&!sunCss.includes('vector-effect:non-scaling-stroke')&&styles.includes('.long-range-subsection'),'Designvertrag für eine vollständige, unverzerrte relative Sonne und Untersektionen fehlt.');
console.log('MID: getrennte Trends-14d+-Untersektionen und relative Sonnenscheindauer in der 14d-Übersicht geschützt.');
