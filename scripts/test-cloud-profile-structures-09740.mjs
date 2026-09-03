import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [cockpit,skybar,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/detailSkyBar.ts',import.meta.url),'utf8'),
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
 'data-mid-skybar="profile"',
 'profileSkyBarSegments=detailSkyBarSegments(',
 "className:'high'",
 "className:'mid'",
 "className:'low'",
 'className={`cloud-opacity-band ${row.className}`}',
 'const cloudCellGeometry=',
 'cloudBand=cloudCellGeometry(item)',
 'x={cloudBand.x}',
 'width={cloudBand.width}',
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

assert.ok(cockpit.includes('const fraction=clamp(Number(value)||0,0,100)/100'),'H/M/L-Grauintensität muss direkt aus 0..100-%-Bedeckung skaliert werden.');
for(const token of ['#ffc229','#aeb3b9','const weatherStripVisuals=','const baseSkyVisual=','const precipitationOverlayVisual=','const precipitationKind=','const precipBandWidth=','const precipBaseColor=','const sampleIntervalSeconds=','const sunVisualShare=','return [...baseSegments,...precipSegments]'])assert.ok(skybar.includes(token),`Gemeinsame farbreine Gesamt-Skybar fehlt: ${token}`);
assert.ok(!skybar.includes('const precipSunColor=')&&!skybar.includes('color-mix(in srgb'),'Skybar-Farben dürfen Sonne/Bewölkung und Niederschlag nicht mischen.');
for(const forbidden of ['Sonnenschein/Klarheit · Stufe','Gesamtbewölkung · Stufe',"layer:'sun'","layer:'cloud'",'underlayColor','underlayStrokeWidth'])assert.ok(!skybar.includes(forbidden),`Alter Single-/Drei-Layer-Skybarvertrag muss entfernt sein: ${forbidden}`);
assert.ok(!cockpit.includes("rows=[{key:'total',className:'total',y:cloudTop"),'Gesamtbewölkung darf nicht mehr als viertes Grauzellenband gerendert werden.');
assert.equal(JSON.parse(pkg).version,JSON.parse(baseline).releaseVersion,'Release-/Baseline-Version müssen synchron sein.');
console.log('24-h-Wolkenprofil: gemeinsame Tagesansicht-Skybar für Gesamt sowie kontinuierliche H/M/L-Graubänder ohne Prozentachse geprüft.');
