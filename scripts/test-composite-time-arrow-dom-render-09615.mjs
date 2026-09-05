import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [radar,pkgText,baselineText]=await Promise.all(['src/RadarPanel.tsx','package.json','MID_BASELINE.json'].map(path=>readFile(new URL(path,root),'utf8')));
for(const token of ['function EchoApproachTrackLayer(','<Polygon pane="mid-motion-labels"','<Polyline pane="mid-motion-labels"','track.nodes.map(','function approachEtaIcon(',"divIcon({className:'mid-approach-node-div-icon'",'<Marker key={`approach-${node.minutes}`}','<Marker pane="mid-motion-labels" position={track.closest}'])assert.ok(radar.includes(token),`DOM-Zugspur-Vertrag fehlt: ${token}`);
assert.ok(!radar.includes('function motionTrackCompositeIcon('),'Großes, zoomabhängiges Komplett-SVG darf nicht zurückkehren.');
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-composite-time-arrow-dom-render-09615.mjs';assert.equal(pkg.scripts?.['test:composite-time-arrow-dom-render'],`node ${test}`);assert.ok(baseline.requiredRegressionTests?.includes(test));assert.ok(baseline.regressionTests?.includes(test));
console.log('DOM-Zugspur geprüft: Korridor, Geopfad, Zeitknoten und ETA-Chip werden als eigenständige Leaflet-Objekte gerendert.');
