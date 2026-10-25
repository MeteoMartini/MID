import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const[theme,radar,mapLibre,legacy,packageRaw,baselineRaw,eager,compiled]=await Promise.all([
 read('src/mapPopupTheme.css'),read('src/RadarPanel.tsx'),read('src/MapLibreCore.tsx'),read('src/MapLibreLegacyCompat.tsx'),read('package.json'),read('MID_BASELINE.json'),read('src/midPresentation.css'),read('src/styles.css')
]);
const pkg=JSON.parse(packageRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-map-popup-theme-0985333.mjs';
assert.equal(pkg.version,'0.9.85.333');
assert.equal(pkg.scripts?.['test:map-popup-theme'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests.includes(test)&&baseline.regressionTests.includes(test));
assert.ok(baseline.requiredFiles.includes(test)&&baseline.requiredFiles.includes('docs/implementation/MID_MAP_POPUP_THEME_0.9.85.333.md'));

for(const token of [
 '.leaflet-container .leaflet-popup-content-wrapper',
 '.leaflet-container .leaflet-popup-tip',
 '.leaflet-container .leaflet-popup-content{color:var(--text)}',
 '.maplibregl-popup.mid-themed-popup .maplibregl-popup-content{background:var(--surface);color:var(--text)}',
 '.maplibregl-popup.mid-themed-popup .maplibregl-popup-tip{border-color:var(--surface)}',
 '.extreme-map .maplibregl-popup.mid-themed-popup .maplibregl-popup-content{background:#fff;color:#13243a}',
 '.extreme-map .maplibregl-popup.mid-themed-popup .maplibregl-popup-tip{border-color:#fff}',
 '.extreme-map .maplibregl-popup.mid-themed-popup .maplibregl-popup-close-button{color:#1167b1}',
 '.leaflet-container .leaflet-popup-close-button',
 '.maplibregl-popup.mid-themed-popup .maplibregl-popup-close-button:focus-visible',
 '@media(pointer:coarse)', 'width:44px;height:44px'
])assert.ok(theme.includes(token),`Gemeinsame Karten-Popup-Regel fehlt: ${token}`);
assert.ok(radar.includes("import './mapPopupTheme.css'"),'Leaflet-Radar muss das gemeinsame Popup-Theme laden.');
assert.ok(mapLibre.includes("import './mapPopupTheme.css'"),'MapLibreCore muss das Popup-Theme laden.');
assert.equal((mapLibre.match(/className:'mid-themed-popup'/g)||[]).length,2,'Alle zentral erzeugten MapLibre-Popups müssen die thematisierte Klasse erhalten.');
assert.equal((legacy.match(/new maplibregl\.Popup\([^)]*className:'mid-themed-popup'/g)||[]).length,1,'Der Legacy-Kompatibilitätsmarker muss ebenfalls das MapLibre-Popup-Theme verwenden.');
assert.ok(!/new maplibregl\.Popup\((?![^)]*className:'mid-themed-popup')/.test(`${mapLibre}\n${legacy}`),'Jede direkte MapLibre-Popup-Erzeugung muss die thematisierte Klasse erhalten.');
assert.ok(!eager.includes('.leaflet-container .leaflet-popup-content-wrapper')&&!compiled.includes('.leaflet-container .leaflet-popup-content-wrapper'),'Popup-Regeln dürfen das harte initiale CSS-Budget nicht vergrößern.');
assert.ok(radar.includes('<Popup><div className="konrad-popup">'),'KONRAD3D muss vom gemeinsamen Leaflet-Popup-Theme abgedeckt sein.');
assert.ok((radar.match(/<Popup>/g)||[]).length>=4,'Radar-Popups für KONRAD3D, Blitz, NowCastMIX und Standortmarker müssen vom gemeinsamen Theme erfasst werden.');
console.log('MID .333: Leaflet- und MapLibre-Popups laden ihr Theme nur mit dem Kartenmodul; KONRAD3D, Radar-Details und zentrale MapLibre-Popups sind abgedeckt, Touch-Schließen bleibt mindestens 44px und das initiale CSS-Budget bleibt unberührt.');
