import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const test='scripts/test-ui-disclosure-buildfix-095344.mjs';
const [primitive,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/UiPrimitives.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
assert.ok(primitive.includes('defaultOpen?:boolean'),'Öffnungsstandard des Disclosure-Primitivs fehlt.');
assert.ok(primitive.includes('useState(defaultOpen)'),'Disclosure übernimmt defaultOpen nicht als initialen Zustand.');
assert.ok(primitive.includes('open={open}'),'Disclosure verwendet nicht das gültige React-details-open-Attribut.');
assert.ok(primitive.includes('onToggle={event=>setOpen(event.currentTarget.open)}'),'Nativer details-Zustand wird nicht mit React synchronisiert.');
assert.ok(!/<details[^>]*\sdefaultOpen=/.test(primitive),'Ungültiges defaultOpen-DOM-Attribut würde erneut TS2322 auslösen.');
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion);
assert.ok(baseline.requiredRegressionTests.includes(test));
console.log(`MID v${pkg.version}: MidDisclosure nutzt gültige details-Props; TS2322-defaultOpen-Rückfall ist geschützt.`);
