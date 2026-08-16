import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const test='scripts/test-ui-standardization-095338.mjs';
const [portal,styles,contract,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/AppPortalPopover.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../MID_UI_ARCHITECTURE_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
for(const token of [
 'const visualViewport=window.visualViewport',
 'visualViewport?.offsetLeft??0',
 'visualViewport?.offsetTop??0',
 'maxHeight=Math.max(120,viewportHeight-edge*2)',
 "'--mid-popover-viewport-max-height':`${position.maxHeight}px`",
 "visualViewport?.addEventListener('resize',schedule",
 "visualViewport?.addEventListener('scroll',schedule",
 "visualViewport?.removeEventListener('resize',schedule)",
 "visualViewport?.removeEventListener('scroll',schedule)"
])assert.ok(portal.includes(token),`AppPortalPopover muss den mobilen VisualViewport berücksichtigen: ${token}`);
for(const token of [
 '--mid-ui-compact-touch:36px',
 '--mid-ui-popover-max-height:min(72dvh,620px)',
 '--mid-ui-popover-max-height:min(64dvh,560px)',
 'var(--mid-popover-viewport-max-height,100dvh)',
 'scrollbar-gutter:stable',
 ':focus-visible',
 'min-width:var(--mid-ui-compact-touch)!important'
])assert.ok(styles.includes(token),`Appweite UI-Standardisierung fehlt: ${token}`);
for(const token of ['visualViewport','gemeinsame, dichteabhängige Maximalhöhe','Tastaturfokus','--mid-ui-compact-touch'])assert.ok(contract.includes(token),`UI-Vertrag schützt die Standardisierung nicht: ${token}`);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);assert.equal(pkg.version,baseline.releaseVersion);assert.ok(baseline.requiredRegressionTests.includes(test));
console.log(`MID v${pkg.version}: mobile Portalgeometrie, Popover-Dichte, Fokus und Touchflächen appweit standardisiert.`);
