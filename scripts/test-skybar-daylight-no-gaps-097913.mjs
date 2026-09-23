import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [skybar,app,cockpit,contract,pkgRaw,baselineRaw]=await Promise.all([
 read('src/detailSkyBar.ts'),read('src/App.tsx'),read('src/ForecastCockpit.tsx'),read('MID_24H_PROFILE_STORY_AXIS_CONTRACT.md'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-skybar-daylight-no-gaps-097913.mjs';

assert.ok(skybar.includes('if(cloudKnown){')&&skybar.includes('if(daylight&&sunshineDirect){')&&skybar.includes('if(daylight&&!sunshineDirect){'),'Bekannte Gesamtbewölkung muss starke Bewölkung grau darstellen; unter 50 % bleiben direkte Sonnenscheindauer und Wolkenlücken-Fallback getrennt.');
assert.ok(skybar.includes('const openSkyShare=clamp01(1-boundedCloud/100)')&&skybar.includes('const cloudWidth=cloudBandWidth(boundedCloud);')&&skybar.includes('Sonnenscheindauer nicht verfügbar'),'Wolkenlücken-Fallback und graues Bewölkungsband müssen getrennt und provenance-ehrlich bleiben.');
assert.ok(skybar.includes('if(daylight&&sunshineDirect)')&&skybar.includes('Bewölkung unbekannt'),'Sonnenscheindauer-Fallback bei fehlender Gesamtbewölkung muss diagnostizierbar bleiben.');
assert.ok(app.includes('Gesamtbewölkung und Sonnenscheindauer werden als getrennte meteorologische Größen ausgewertet')&&app.includes('Wolkenlücken-Darstellung'),'UI-Hinweis muss direkte Sonnenscheindauer und Wolkenlücken-Fallback unterscheiden.');
assert.ok(contract.includes('direkt verfügbare Sonnenscheindauer Vorrang')&&contract.includes('Wolkenlücken-Fallback')&&contract.includes('Eine echte Datenlücke bleibt zulässig'),'Skybar-Vertrag muss direkte Sonnenscheindauer, Wolkenlücken-Fallback und echte Datenlücken getrennt halten.');
for(const token of ['data-mid-skybar="react"','data-mid-skybar="profile"','data-mid-skybar="seven-day"','data-mid-skybar="day-card"'])assert.ok((app+cockpit).includes(token),`Appweite Skybar-Einbindung fehlt: ${token}`);
assert.ok((app.match(/<SkyBarSegmentsSvg/g)||[]).length>=1&&(cockpit.match(/<SkyBarSegmentsSvg/g)||[]).length>=3,'Alle sichtbaren Skybars müssen dieselbe zentrale No-gap-Engine nutzen.');
assert.ok(skybar.includes('if(daylight&&sunshineDirect)')&&skybar.includes('return null;'),'Unbewertbare echte Datenlücken müssen weiterhin zulässig bleiben.');
assert.equal(baseline.releaseVersion,pkg.version,'Package/Baseline müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles?.includes(test),'No-gap-Regressionsdatei fehlt in requiredFiles.');
console.log(`MID v${pkg.version}: Tages-Skybar trennt direkte Sonnenscheindauer, Wolkenlücken-Fallback, Bewölkung und echte Datenlücken appweit.`);
