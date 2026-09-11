import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8');
assert.ok(src.includes('<Tooltip direction="top" opacity={.96}>'),'Front-Tooltip muss mit dem MID-Leaflet-Typvertrag kompatibel sein.');
assert.ok(!src.includes('<Tooltip sticky direction="top" opacity={.96}>'),'Nicht typisiertes sticky-Prop darf im Front-Tooltip nicht zurückkehren.');
console.log('Composite front tooltip type contract: OK');
