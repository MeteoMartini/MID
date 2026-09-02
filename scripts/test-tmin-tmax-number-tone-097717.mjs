import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [tone,cockpit,contract,pkgText,baselineText]=await Promise.all([
 read('src/temperatureTone.ts'),read('src/ForecastCockpit.tsx'),read('MID_PARAMETER_COLOR_CONTRACT.md'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-tmin-tmax-number-tone-097717.mjs';

assert.ok(tone.includes("const token=kind==='max'?'var(--param-temperature-max)':'var(--param-temperature-min)'"),'Tmin/Tmax müssen ihre kanonische Blau-/Rotfamilie behalten.');
assert.ok(tone.includes('textShare=Math.round(58+bounded*42)'),'Die Klimaabweichung muss die sichtbare Sättigung der Zahlfarbe steuern.');
assert.ok(tone.includes('color:`color-mix(in srgb,${token} ${textShare}%,var(--muted))`'),'Die sichtbare Änderung muss in der Zahlfarbe erfolgen.');
assert.ok(tone.includes("background:'transparent'")&&tone.includes("border:'transparent'"),'Tmin/Tmax-Hintergrund und -Rahmen müssen unabhängig von der Klimaabweichung neutral bleiben.');
assert.ok(!tone.includes('backgroundShare=')&&!tone.includes('borderShare='),'Die Klimaabweichung darf keine Hintergrund-/Rahmenintensität mehr berechnen.');
assert.ok(cockpit.includes('Tmin blau, Tmax rot · Zahlfarbe = Abweichung vom jeweiligen Klimamittel.'),'Die 7-Tage-Legende muss die Zahlfarbenlogik benennen.');
assert.ok(contract.includes('Ausschließlich die Zahlfarbe einzelner Tmin-/Tmax-Werte darf anhand der Abweichung vom zugehörigen Klimamittel variieren'),'Der Farbvertrag muss die Klimaabweichung auf die Zahlfarbe begrenzen.');
assert.ok(contract.includes('Hintergrund und Rahmen des Wertes werden dabei nicht eingefärbt.'),'Der Farbvertrag muss farbige Tmin/Tmax-Hintergründe ausdrücklich ausschließen.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen synchron sein.');
assert.equal(pkg.scripts?.['test:tmin-tmax-number-tone'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Regression fehlt im Baseline-Vertrag.');
console.log(`MID v${pkg.version}: Tmin/Tmax-Klimaabweichung ausschließlich über die Zahlfarbe geschützt.`);
