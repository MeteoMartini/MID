import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const test='scripts/test-ui-interaction-standardization-095342.mjs';
const [styles,contract,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../MID_UI_ARCHITECTURE_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
for(const token of [
 '-webkit-text-size-adjust:100%',
 'text-size-adjust:100%',
 '-webkit-tap-highlight-color:transparent',
 'user-select:none',
 '[aria-disabled="true"]',
 'accent-color:var(--primary)',
 '@media(hover:none),(pointer:coarse)',
 'touch-action:manipulation',
 '@media(prefers-reduced-motion:reduce)',
 'animation-duration:.01ms!important',
 'transition-duration:.01ms!important',
 '@media(forced-colors:active)',
 'outline:2px solid Highlight'
])assert.ok(styles.includes(token),`Appweite Interaktionsstandardisierung fehlt: ${token}`);
for(const token of ['Textskalierung','Tap-Highlight','Disabled-Zustand','prefers-reduced-motion','Forced-Colors'])assert.ok(contract.includes(token),`UI-Vertrag schützt die neue Standardisierung nicht: ${token}`);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion);
assert.ok(baseline.requiredRegressionTests.includes(test));
console.log(`MID v${pkg.version}: iOS-Textskalierung, Touch, Disabled, Reduced Motion und Hochkontrast appweit vereinheitlicht.`);
