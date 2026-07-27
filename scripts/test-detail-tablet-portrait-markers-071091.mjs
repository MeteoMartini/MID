import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
assert.match(app,/portraitTabletMarkers=mediumChart&&!narrowChart&&!compactLandscape/,'Tablet-Hochformat wird nicht als eigener dichter Markermodus erkannt');
assert.match(app,/showAllDetailMarkers=narrowChart\|\|compactLandscape\|\|portraitTabletMarkers/,'Tablet-Hochformat muss alle Wetterpiktogramme und Windrichtungspfeile aktivieren');
assert.match(app,/iconFontSize=portraitTabletMarkers\?Math\.max\(8,Math\.min\(11,markerSpacing\*\.48\)\)/,'Wetterpiktogramme werden im Tablet-Hochformat nicht kompakt genug skaliert');
assert.match(app,/directionArrowSize=portraitTabletMarkers\?Math\.max\(6,Math\.min\(8\.5,markerSpacing\*\.34\)\)/,'Windrichtungspfeile werden im Tablet-Hochformat nicht kompakt genug skaliert');
assert.match(app,/directionStep=showAllDetailMarkers\?1/,'Windrichtungspfeile müssen im dichten Markermodus stündlich erscheinen');
console.log('Tagesdetaildiagramm geprüft: Tablet-Hochformat zeigt alle Wetterpiktogramme und Windrichtungspfeile in kompakter Größe.');
