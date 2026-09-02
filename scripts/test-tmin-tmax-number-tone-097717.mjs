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
assert.ok(tone.includes('backgroundShare=Math.round(9+bounded*19)')&&tone.includes('borderShare=Math.round(24+bounded*34)'),'Kästchenhintergrund und Rahmen müssen mit der Klimaabweichung reagieren.');
assert.ok(tone.includes('background:`color-mix(in srgb,${token} ${backgroundShare}%,transparent)`'),'Tmin/Tmax benötigen wieder kleine farbige Kästchen.');
assert.ok(tone.includes('border:`color-mix(in srgb,${token} ${borderShare}%,var(--border))`'),'Die Kästchen benötigen eine parametergleiche Kontur.');
assert.ok(cockpit.includes('Tmin blau, Tmax rot · Kästchenintensität = Abweichung vom jeweiligen Klimamittel.'),'Die 7-Tage-Legende muss die Kästchenlogik benennen.');
assert.ok(contract.includes('kleinen bläulichen')&&contract.includes('kleinen rötlichen Kästchen'),'Der Farbvertrag muss die blauen/roten Tmin-/Tmax-Kästchen schützen.');
assert.ok(contract.includes('±0,5 bis ±1 K'),'Kleine Klimaabweichungen müssen ausdrücklich geschützt sein.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen synchron sein.');
assert.equal(pkg.scripts?.['test:tmin-tmax-number-tone'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Regression fehlt im Baseline-Vertrag.');
console.log(`MID v${pkg.version}: Tmin/Tmax-Kästchen und empfindliche Klimaabweichungstönung geschützt.`);
