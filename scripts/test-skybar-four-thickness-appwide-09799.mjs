import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [skybar,precipitation,renderer,app,cockpit,styles,contract,pkgRaw,baselineRaw]=await Promise.all([
 read('src/detailSkyBar.ts'),read('src/precipitation.ts'),read('src/SkyBarSegments.tsx'),read('src/App.tsx'),read('src/ForecastCockpit.tsx'),read('src/styles-src/30-modern.css'),read('MID_24H_PROFILE_STORY_AXIS_CONTRACT.md'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-skybar-four-thickness-appwide-09799.mjs';

assert.ok(skybar.includes('const SKYBAR_THICKNESS_STEPS=[2.4,3.6,4.8,6.0] as const'),'Vier klar getrennte Skybar-Dicken fehlen.');
for(const threshold of ['if(value<.625)return 0;','if(value<.75)return 1;','if(value<.875)return 2;','return 3;'])assert.ok(skybar.includes(threshold),`50–100-%-Vierstufen-Schwelle fehlt: ${threshold}`);
assert.ok(skybar.includes('thicknessLevel:1|2|3|4;')&&skybar.includes('thicknessLevel:skybarThicknessLevel(level)'),'Skybar-Segmente müssen ihre tatsächlich verwendete Stufe 1–4 mitführen.');
assert.ok(skybar.includes('precipitationIntensityDescriptor')&&precipitation.includes("if(rateMmh<=.5)return result(1,'leicht'")&&precipitation.includes("if(rateMmh<=4)return result(2,'mäßig'")&&precipitation.includes("return result(3,'stark'")&&precipitation.includes('tenMinuteMm=rateMmh/6')&&precipitation.includes("return result(4,'sehr stark'"),'Niederschlag muss typabhängig die amtlich vorhandenen DWD-Intensitätsstufen nutzen; Stufe 4 ist für sehr starke Schauer verfügbar.');
assert.ok(!precipitation.includes('amount<15')&&!precipitation.includes('amount>=15')&&!precipitation.includes('rateMmh>=15'),'Dauerregen darf keine künstliche vierte Intensitätsklasse erhalten.');
assert.ok(renderer.includes('data-skybar-level={segment.thicknessLevel}'),'Renderer muss die wirksame Dickenstufe für DOM-/Screenshot-Diagnose ausgeben.');
for(const token of ['data-mid-skybar="react"','data-mid-skybar="profile"','data-mid-skybar="seven-day"','data-mid-skybar="day-card"'])assert.ok((app+cockpit).includes(token),`Appweite Skybar-Einbindung fehlt: ${token}`);
assert.ok((app.match(/<SkyBarSegmentsSvg/g)||[]).length>=1&&(cockpit.match(/<SkyBarSegmentsSvg/g)||[]).length>=3,'Alle sichtbaren Skybars müssen denselben zentralen Renderer nutzen.');
assert.ok(cockpit.includes('y="7.4" width="98" height="1.2" rx="0.6"')&&styles.includes('.cockpit-day-skybar-rail{fill:color-mix(in srgb,var(--text) 7%,transparent)}'),'7-Tage-Tageskarte darf die vier Dickenstufen nicht durch eine dicke Grundschiene optisch nivellieren.');
assert.ok(contract.includes('`2.4 / 3.6 / 4.8 / 6.0` SVG-Einheiten'),'Dokumentierter Dickenvertrag ist nicht auf dem aktuellen Stand.');
assert.equal(baseline.releaseVersion,pkg.version,'Package/Baseline müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles?.includes(test),'Skybar-Vierstufenregression fehlt in requiredFiles.');

console.log(`MID v${pkg.version}: vier klar unterscheidbare Skybar-Dicken sind zentral und appweit in 24 h, Profil, 7-Tage-Kurve und Tageskarten geschützt.`);
