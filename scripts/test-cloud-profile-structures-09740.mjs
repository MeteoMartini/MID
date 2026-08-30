import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [cockpit,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

for(const token of [
 "type CloudProfileKey='cloud'|'lowCloud'|'midCloud'|'highCloud'",
 'function shortTermCloudOpacity(value:number)',
 'function shortTermCloudCellGradient(',
 'leftSource=previous?',
 'rightSource=next?',
 "className:'total'",
 "className:'high'",
 "className:'mid'",
 "className:'low'",
 'className={`cloud-opacity-band ${row.className}`}',
 'x={item.columnLeft}',
 'width={item.columnWidth+.25}',
 'stopColor="var(--profile-cloud)"',
 '>Gesamt</text>',
 '>H</text>',
 '>M</text>',
 '>L</text>',
 'Wolken Gesamt · H/M/L',
 'Wolken gesamt / hoch / mittel / tief + UVI'
])assert.ok(cockpit.includes(token),`24-h-Wolkenband fehlt: ${token}`);

for(const token of [
 '--profile-cloud:#6f7d88',
 '.cockpit-weather-profile .cloud-opacity-band{',
 '.cockpit-weather-profile .cloud-opacity-band.total{',
 'repeating-linear-gradient(180deg',
 'var(--profile-cloud)'
])assert.ok(styles.includes(token),`Wolkenband-CSS fehlt: ${token}`);

for(const forbidden of [
 'SvgProfileCloudStructure',
 'cloud-cell-frame',
 'cloud-structure',
 'selected-cloud-values',
 '--profile-cloud-high',
 '--profile-cloud-mid',
 '--profile-cloud-low',
 'Wolken (%)'
])assert.ok(!cockpit.includes(forbidden)&&!styles.includes(forbidden),`Alter Wolken-/Achsenvertrag muss entfernt sein: ${forbidden}`);

assert.ok(cockpit.includes('const fraction=clamp(Number(value)||0,0,100)/100'),'Grauintensität muss direkt aus 0..100-%-Bedeckung skaliert werden.');
assert.equal(JSON.parse(pkg).version,JSON.parse(baseline).releaseVersion,'Release-/Baseline-Version müssen synchron sein.');
console.log('24-h-Wolkenprofil: vier kontinuierliche Gesamt/H/M/L-Graubänder ohne Prozentachse geprüft.');
