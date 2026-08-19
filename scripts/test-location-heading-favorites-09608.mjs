import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [radar,styles,pkgText,baselineText]=await Promise.all(['src/RadarPanel.tsx','src/styles.css','package.json','MID_BASELINE.json'].map(path=>readFile(new URL(path,root),'utf8')));
for(const token of [
 'function locationHeadingIcon(heading:number|null)',
 'radar-location-marker actual-location',
 'function selectedPlaceIcon()',
 'radar-selected-place-marker',
 'actualLocation?locationHeadingIcon(deviceHeading.heading):selectedPlaceIcon()',
 'useDeviceHeading(actualLocation)',
 'if(actualLocation&&deviceHeading.heading===null)',
 "actualLocation&&(deviceHeading.heading!==null"
]) assert.ok(radar.includes(token),`Standort-/Favoriten-Vertrag fehlt: ${token}`);
assert.ok(!radar.includes("showBearing?' actual-location':' selected-location'"),'Favoriten dürfen nicht mehr denselben Standortmarker-Vertrag verwenden.');
assert.ok(!radar.includes('radar-location-marker selected-location'),'Favoriten dürfen keinen Standortmarker erhalten.');
for(const token of ['.radar-selected-place-div-icon','.radar-selected-place-marker','.radar-location-bearing']) assert.ok(styles.includes(token),`Marker-Styling fehlt: ${token}`);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-location-heading-favorites-09608.mjs';
assert.equal(pkg.scripts?.['test:location-heading-favorites'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test),'Pflichtregression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regression fehlt.');
console.log('Standortmarker geschützt: Sichtrichtung nur am echten Gerätestandort; Favoriten/manuelle Orte erhalten ausschließlich eine neutrale Ortsmarkierung.');
