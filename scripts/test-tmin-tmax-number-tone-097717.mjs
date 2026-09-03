import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [tone,cockpit,contract,pkgText,baselineText]=await Promise.all([
 read('src/temperatureTone.ts'),read('src/ForecastCockpit.tsx'),read('MID_PARAMETER_COLOR_CONTRACT.md'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-tmin-tmax-number-tone-097717.mjs';

assert.ok(tone.includes("const token=kind==='max'?'var(--param-temperature-max)':'var(--param-temperature-min)'"),'Tmin/Tmax müssen ihre kanonische Blau-/Rotfamilie behalten.');
assert.ok(tone.includes('Math.sqrt(Math.abs(signed))'),'Kleine Klimaabweichungen müssen durch eine empfindliche nichtlineare Kennlinie sichtbar werden.');
assert.ok(tone.includes('backgroundShare=Math.round(5+bounded*11)')&&tone.includes('borderShare=Math.round(20+bounded*26)'),'14-Tage-Kästchenhintergrund und Rahmen müssen abgeschwächt, aber weiterhin klimaabweichungsabhängig reagieren.');
assert.ok(tone.includes('background:`color-mix(in srgb,${token} ${backgroundShare}%,transparent)`'),'Tmin/Tmax benötigen wieder kleine farbige Kästchen.');
assert.ok(tone.includes('border:`color-mix(in srgb,${token} ${borderShare}%,var(--border))`'),'Die Kästchen benötigen eine parametergleiche Kontur.');
assert.ok(cockpit.includes('dailyTemperatureTone(item.bestMin,item.climateMin')&&cockpit.includes('dailyTemperatureTone(item.bestMax,item.climateMax'),'Die 14-Tage-Ansicht muss den historischen Tmin/Tmax-Klimaton weiter verwenden.');
assert.ok(cockpit.includes('Temperaturen nach ECMWF-Farbskala · in 7 Tagen keine Klimaabweichungen.'),'7-Tage-Ansicht muss seit v0.9.78.1 ausdrücklich auf absolute ECMWF-Farben wechseln.');
assert.ok(tone.includes('background:`color-mix(in srgb,${color} 10%,transparent)`'),'7-Tage-ECMWF-Tmin/Tmax benötigen den bewusst abgeschwächten Hintergrund aus v0.9.78.4.');
assert.ok(!cockpit.includes('<small>Min</small>')&&!cockpit.includes('<small>Max</small>'),'7-Tage-Cockpit darf die Zusatzlabels Min/Max nicht wieder einführen.');
assert.ok(contract.includes('kompakten farblich unterscheidbaren Kästchen')&&contract.includes('Hintergrundflächen sind bewusst schwach getönt'),'Der Farbvertrag muss kompakte und lesbare Tmin-/Tmax-Kästchen mit abgeschwächten Hintergründen schützen.');
assert.ok(contract.includes('±0,5 bis ±1 K'),'Kleine Klimaabweichungen müssen ausdrücklich geschützt sein.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen synchron sein.');
assert.equal(pkg.scripts?.['test:tmin-tmax-number-tone'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Regression fehlt im Baseline-Vertrag.');
console.log(`MID v${pkg.version}: abgeschwächte 7-/14-Tage-Tmin/Tmax-Flächen, ECMWF-7d und empfindliche 14d-Klimaabweichungstönung geschützt.`);
