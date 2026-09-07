import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [skybar,app,cockpit,contract,pkgRaw,baselineRaw]=await Promise.all([
 read('src/detailSkyBar.ts'),read('src/App.tsx'),read('src/ForecastCockpit.tsx'),read('MID_24H_PROFILE_STORY_AXIS_CONTRACT.md'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-skybar-daylight-no-gaps-097913.mjs';

assert.ok(skybar.includes("const regularCloudWidth=cloudBandWidth(cloud),daylightFallback=daylight&&sunshineDirect&&sunshineShare<=.5&&regularCloudWidth<=0;"),'Tages-Fallback für nicht dominierenden Sonnenschein fehlt.');
assert.ok(skybar.includes("const width=regularCloudWidth>0?regularCloudWidth:daylightFallback?skybarThickness(level):0;"),'Tages-Fallback muss ein sichtbares Grundband erzeugen.');
assert.ok(skybar.includes("Tages-Fallback bei ≤50 % Sonnenschein"),'Fallback muss diagnostizierbar im Segmenttitel bleiben.');
assert.ok(skybar.includes("const cloudLabel=Number.isFinite(cloud)?`${cloud.toFixed(0)} %`:'unbekannt';"),'Fehlende Gesamtbewölkung darf im Tages-Fallback nicht zu NaN-Text führen.');
assert.ok(app.includes('Damit tagsüber bei vorhandener Himmelsinformation keine Lücke entsteht'),'UI-Hinweis muss die No-gap-Garantie erklären.');
assert.ok(app.includes('unter 50 % Bewölkung ein graues Mindestband'),'UI-Hinweis muss die Wolkenschwelle JSX-sicher ausschreiben.');
assert.ok(!app.includes('gleichzeitig <50 % Bewölkung'),'Rohe <50-%-Schreibweise darf im JSX-Hinweis nicht erneut einen Parserfehler auslösen.');
assert.ok(contract.includes('**No-gap-Garantie am Tage:**')&&contract.includes('Am Tage darf ein Slot mit verfügbarer Sonnenschein- oder Bewölkungsinformation nicht leer bleiben.'),'Skybar-Vertrag muss die Tages-No-gap-Regel festschreiben.');
for(const token of ['data-mid-skybar="react"','data-mid-skybar="profile"','data-mid-skybar="seven-day"','data-mid-skybar="day-card"'])assert.ok((app+cockpit).includes(token),`Appweite Skybar-Einbindung fehlt: ${token}`);
assert.ok((app.match(/<SkyBarSegmentsSvg/g)||[]).length>=1&&(cockpit.match(/<SkyBarSegmentsSvg/g)||[]).length>=3,'Alle sichtbaren Skybars müssen dieselbe zentrale No-gap-Engine nutzen.');
assert.ok(skybar.includes("if(width<=0)return null;"),'Unbewertbare echte Datenlücken müssen weiterhin zulässig bleiben.');
assert.equal(baseline.releaseVersion,pkg.version,'Package/Baseline müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles?.includes(test),'No-gap-Regressionsdatei fehlt in requiredFiles.');
console.log(`MID v${pkg.version}: Tages-Skybar ist appweit lückenfrei für bewertbare Sonne/Wolken-Slots; echte Datenlücken und klare Nächte bleiben zulässig.`);
