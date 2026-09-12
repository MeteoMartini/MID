import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const modern=await read('src/styles-src/30-modern.css');
const styles=await read('src/styles.css');
assert.match(modern,/MID v0\.9\.84\.71 · Visualisierungs-Audit Block 2/,'Visualisierungs-Audit Block 2 fehlt');

const contracts=[
 ['Wasser-Kennwerte',/\.water-indicators small,\.water-indicators span,[\s\S]*font-size:var\(--mid-text-micro\)!important/],
 ['Wasser-Timeline',/\.water-timeline\{grid-auto-columns:minmax\(136px,1fr\);scroll-snap-type:x proximity/],
 ['Flug-SVG-Achsen',/\.flight-axis-label,\.flight-chart-meta\{font-size:10px!important\}/],
 ['Flug-Standardwerte',/\.flight-standard-value\{font-size:8\.5px!important\}/],
 ['Routen-Tooltip',/\.route-map-tooltip strong\{font-size:var\(--mid-text-sm\)!important\}/],
 ['Event-Mikrotexte',/\.event-workspace-nav button>span,[\s\S]*font-size:var\(--mid-text-micro\)!important/],
 ['Reise-Tageskarten',/\.travel-day-strip article\{flex-basis:112px;min-width:112px/],
 ['Hazard-Gültigkeit',/\.hazards\.compact-list \.hazard-toggle-head \.hazard-validity,\.hazard-validity\{font-size:var\(--mid-text-micro\)!important/],
 ['Windwarnschwellen',/\.cockpit-weather-profile \.wind-warning-threshold-label\{font-size:8\.5px!important\}/],
 ['Radarlegende',/\.radarlegend\.compact \.radarlegend-head span,\.legend-active-chips em,\.lightning-age-legend span\{font-size:9px!important/],
 ['DWD-Kartentooltip',/\.dwd-precip-type-radar__maplibre \.mid-map-tooltip\{font-size:10\.5px!important/],
 ['Druckzentrum-Tooltip',/\.mid-map-tooltip\.mid-pressure-center small\{font-size:9\.5px!important/],
 ['iPad-Split-View',/@media\(min-width:600px\) and \(max-width:1024px\)\{[\s\S]*\.water-indicators\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/]
];
for(const [name,pattern] of contracts)assert.match(modern,pattern,`${name} ist nicht im Block-2-Vertrag geschützt`);

assert.match(modern,/@media\(any-pointer:coarse\)\{[\s\S]*\.travel-selected-destination \.secondary,[\s\S]*min-height:44px!important/,'Reise-Touchziele sind nicht 44 px geschützt');
assert.match(modern,/@media\(any-pointer:coarse\)\{[\s\S]*\.hazards\.compact-list \.hazard-toggle,\.official-alert>button\{min-height:44px!important\}/,'Warnungs-Touchziele sind nicht 44 px geschützt');

const modules=await Promise.all(['00-foundation.css','10-features.css','20-ensemble-composite.css','25-extreme-outlook.css','30-modern.css'].map(name=>read(`src/styles-src/${name}`)));
assert.equal(styles,modules.join(''),'styles.css ist nicht mit den kanonischen Modulen synchron');
console.log('OK visualization readability block 2 098471');
