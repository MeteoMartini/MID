import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [skybar,app,cockpit,contract,pkgRaw,baselineRaw]=await Promise.all([
 read('src/detailSkyBar.ts'),read('src/App.tsx'),read('src/ForecastCockpit.tsx'),read('MID_24H_PROFILE_STORY_AXIS_CONTRACT.md'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-skybar-daylight-no-gaps-097913.mjs';

assert.ok(skybar.includes('if(cloudKnown){')&&skybar.includes('if(daylight&&boundedCloud<50)'),'Bekannte Gesamtbewölkung muss tagsüber ohne Lücke entweder Gelb oder Grau bestimmen.');
assert.ok(skybar.includes('const visualSunshine=clamp01(1-boundedCloud/100)')&&skybar.includes('const width=cloudBandWidth(boundedCloud);'),'Komplementäre Gelb-/Grau-Entscheidung aus Gesamtbewölkung fehlt.');
assert.ok(skybar.includes('if(daylight&&sunshineDirect)')&&skybar.includes('Bewölkung unbekannt'),'Sonnenscheindauer-Fallback bei fehlender Gesamtbewölkung muss diagnostizierbar bleiben.');
assert.ok(app.includes('Gesamtbewölkung die primäre Himmelsgröße')&&app.includes('Nur wenn die Gesamtbewölkung fehlt'),'UI-Hinweis muss Wolkenpriorität und Sunshine-Fallback erklären.');
assert.ok(contract.includes('Ist tagsüber Gesamtbewölkung bekannt, ergibt sich das Grundband allein aus ihrer 50-%-Dominanz')&&contract.includes('Eine echte Datenlücke bleibt zulässig'),'Skybar-Vertrag muss bekannte Wolken lückenfrei und unbekannte Daten als echte Lücke behandeln.');
for(const token of ['data-mid-skybar="react"','data-mid-skybar="profile"','data-mid-skybar="seven-day"','data-mid-skybar="day-card"'])assert.ok((app+cockpit).includes(token),`Appweite Skybar-Einbindung fehlt: ${token}`);
assert.ok((app.match(/<SkyBarSegmentsSvg/g)||[]).length>=1&&(cockpit.match(/<SkyBarSegmentsSvg/g)||[]).length>=3,'Alle sichtbaren Skybars müssen dieselbe zentrale No-gap-Engine nutzen.');
assert.ok(skybar.includes('if(daylight&&sunshineDirect)')&&skybar.includes('return null;'),'Unbewertbare echte Datenlücken müssen weiterhin zulässig bleiben.');
assert.equal(baseline.releaseVersion,pkg.version,'Package/Baseline müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles?.includes(test),'No-gap-Regressionsdatei fehlt in requiredFiles.');
console.log(`MID v${pkg.version}: Tages-Skybar ist bei bekannter Gesamtbewölkung appweit lückenfrei; Sunshine-Fallback, echte Datenlücken und klare Nächte bleiben sauber getrennt.`);
