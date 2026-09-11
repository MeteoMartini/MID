import fs from 'node:fs';
import assert from 'node:assert/strict';

const app=fs.readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const cockpit=fs.readFileSync(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8');
const helper=fs.readFileSync(new URL('../src/widgetImageExport.ts',import.meta.url),'utf8');

assert.match(app,/freezeWidgetSvgPaintsForExport/,'Widget export must freeze browser-resolved SVG paints before html-to-image serialization.');
assert.match(app,/try\{const\{toBlob\}=await import\('html-to-image'\);return await toBlob\(target,[\s\S]*?\}finally\{restoreSvgPaints\(\)\}/,'Widget export must always restore the live SVG after rendering.');
assert.match(helper,/querySelectorAll<SVGElement>\('svg, svg \*'\)/,'All SVG descendants must be covered by the export paint freeze.');
assert.match(helper,/'fill',[\s\S]*?'stroke',[\s\S]*?'stop-color'/,'Fill, stroke and gradient stop paints must be frozen.');
assert.doesNotMatch(cockpit,/seven-day-curve-night-band[^>]*fill="var\(--mg-night\)"/,'Seven-day curve night bands must not depend on a CSS variable in the SVG fill attribute.');
assert.match(cockpit,/seven-day-curve-night-band[^>]*fill="#495c71"[^>]*fillOpacity=\{0\.08\}/,'Night bands need an explicit export-safe neutral fallback paint.');
console.log('Widget SVG export paint hardening v0.9.84.41: OK');
