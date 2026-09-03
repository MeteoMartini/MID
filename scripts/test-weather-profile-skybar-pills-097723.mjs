import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [cockpit,app,skybar,styleSource,styles,contract,pkgText,baselineText]=await Promise.all([
 read('src/ForecastCockpit.tsx'),read('src/App.tsx'),read('src/detailSkyBar.ts'),read('src/styles-src/30-modern.css'),read('src/styles.css'),read('MID_24H_PROFILE_STORY_AXIS_CONTRACT.md'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-weather-profile-skybar-pills-097723.mjs';

assert.ok(app.includes("import {detailSkyBarSegments} from './detailSkyBar';")&&cockpit.includes("import {detailSkyBarSegments} from './detailSkyBar';"),'Tagesansicht und 24-h-Profil müssen dieselbe Skybar-Implementierung verwenden.');
assert.ok(app.includes('detailSkyBarSegments(p,left,right,W,skyBarY)'),'Die Tagesansicht muss weiterhin den kanonischen Skybar-Helfer verwenden.');
assert.ok(cockpit.includes('profileSkyBarSegments=detailSkyBarSegments(')&&cockpit.includes('chartPoints.map(item=>item.x)'),'Das 24-h-Profil muss dieselbe Skybar-Logik auf seiner exakten gemeinsamen Zeitachse verwenden.');
for(const token of ['#ffc229','#aeb3b9','Sonnenschein/Klarheit · Stufe','Gesamtbewölkung · Stufe','precipitationParts','var(--param-precipitation)',"snow:'#66bce8'","mixed:'#a769d8'","storm:'#7869e8'",'if(!daylight||cloud>=50)return null','if(!daylight&&cloud<20)return null','if(amount<2.5)return 1','if(amount<10)return 2','if(amount<50)return 3',"...segmentsForLayer('precip'"])assert.ok(skybar.includes(token),`Skybar-Vertrag fehlt: ${token}`);
assert.ok(cockpit.includes('data-mid-skybar="profile"'),'Die Wetterleiste im 24-h-Profil muss explizit markiert sein.');
assert.ok(cockpit.includes('data-mid-skybar="seven-day"')&&cockpit.includes('skyBarSegments=detailSkyBarSegments(hourly'),'Die weiterentwickelte Wetterleiste muss auch oberhalb der 7-Tage-Temperaturkurve laufen.');
assert.ok(!cockpit.includes("rows=[{key:'total',className:'total',y:cloudTop"),'Das frühere Gesamtbewölkungs-Grauband darf nicht parallel zur Sonne-/Wolken-Leiste bestehen bleiben.');
for(const token of ["key:'high'","key:'mid'","key:'low'"])assert.ok(cockpit.includes(token),`H/M/L-Wolkenband muss erhalten bleiben: ${token}`);
for(const sheet of [styleSource,styles])assert.ok(sheet.includes('.selected-time-value-pill rect{fill:var(--mg-tooltip);fill-opacity:.8;'),'Wertepillen müssen mit 80 % Füllopazität leicht transparent sein.');
assert.ok(contract.includes('Gesamtbewölkung wird im 24-h-Profil nicht mehr als viertes graues Zellenband gezeichnet'),'Story-Axis-Vertrag muss den Ersatz der Gesamt-Zeile dokumentieren.');
assert.ok(contract.includes('detailSkyBarSegments')&&contract.includes('Logik wie die Tagesansicht'),'Story-Axis-Vertrag muss die 1:1-Wiederverwendung der Tagesansichtslogik festschreiben.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen synchron sein.');
assert.equal(pkg.scripts?.['test:weather-profile-skybar-pills'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Neue 24-h-UI-Regression fehlt in der Baseline.');
console.log(`MID v${pkg.version}: transparente Wertepillen und gemeinsame Sonne/Wolken/Niederschlag-Wetterleiste in Tagesansicht, 24-h-Profil und 7-Tage-Kurve geschützt.`);
