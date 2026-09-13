import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const meteogram=readFileSync('src/MeteogramPanel.tsx','utf8');
const portal=readFileSync('src/AppPortalPopover.tsx','utf8');
const modern=readFileSync('src/styles-src/30-modern.css','utf8');
const aggregate=readFileSync('src/styles.css','utf8');
const extreme=readFileSync('src/styles-src/25-extreme-outlook.css','utf8');

assert.match(meteogram,/import \{AppPortalPointTooltip\} from '\.\/AppPortalPopover';/,'Meteogramm-Tooltips müssen die gemeinsame MID-Portalprimitive verwenden.');
assert.match(meteogram,/<AppPortalPointTooltip[\s\S]*?className=\"meteogram-tooltip meteogram-tooltip-portal\"/,'Meteogramm-Tooltipportal fehlt.');
assert.ok(portal.includes('return createPortal(<div ref={layerRef}'),'Gemeinsame Tooltipprimitive muss in document.body portalisieren.');
assert.match(meteogram,/touch:event\.pointerType==='touch'/,'Tooltipzustand muss Touch unterscheiden.');
assert.match(meteogram,/autoDismissMs=\{value\.touch\?4200:0\}/,'Nur Touch-Tooltips müssen automatisch verschwinden.');
assert.match(portal,/window\.setTimeout\(onClose,autoDismissMs\)/,'Gemeinsame Tooltipprimitive muss Auto-Dismiss zentral ausführen.');
assert.doesNotMatch(meteogram,/const svg=event\.currentTarget\.ownerSVGElement/,'Diagramminterne Tooltipkoordinaten dürfen nicht zurückkehren.');

const marker='MID v0.9.84.82 · Karten-/Diagramm-/Querformat-Audit 17.7.24.';
assert.ok(modern.includes(marker),'Auditmarker v0.9.84.82 fehlt.');
for(const token of [
 '.meteogram-tooltip-portal{',
 'position:fixed!important;',
 'max-width:min(320px,calc(100vw - 20px))!important;',
 'white-space:normal!important;',
 '.weather-maps-head{display:grid!important;',
 '.weather-maps-meta small{overflow:visible!important;',
 '.dwd-precip-type-radar__info[open]>.dwd-precip-type-radar__legend{',
 'bottom:max(8px,env(safe-area-inset-bottom))!important;',
 '.synoptic-impact-chip small,.synoptic-station-chips b,.synoptic-station-chips small{',
 '.synoptic-map-legend{max-height:92px;overflow:auto;',
 '.extreme-region-list b,.extreme-region-list small{',
 '.extreme-map-legend{right:7px!important;bottom:18px!important;',
 '@media(orientation:landscape) and (max-height:520px) and (max-width:950px){',
 '.weather-maps-map-shell{height:min(76dvh,340px)!important;min-height:260px!important}',
 '.synoptic-maplibre-map{height:min(74dvh,330px)!important;min-height:250px}'
]) assert.ok(modern.includes(token),`Responsive Karten-/Diagrammregel fehlt: ${token}`);

assert.ok(extreme.includes('.extreme-hazard-tabs,.extreme-period-tabs{display:flex;gap:6px;min-width:0;overflow-x:auto'), 'Extremwetter-Tabs müssen horizontal scrollbar bleiben.');

// Tooltip-Geometrie auf den verbindlichen MID-Viewports: geschätzte Tooltipbreite
// bleibt vollständig im sichtbaren Viewport, unabhängig von Pointerposition.
const devices=[[320,568],[360,800],[390,844],[430,932],[844,390],[600,1024],[768,1024],[834,1194],[1024,1366],[1366,768],[1440,900],[1920,1080]];
for(const [w,h] of devices){
 const edge=10,maxWidth=Math.min(320,Math.max(180,w-edge*2)),half=maxWidth/2;
 for(const rawX of [0,8,w*.5,w-8,w]){
  const x=Math.max(edge+half,Math.min(w-edge-half,rawX));
  assert.ok(x-half>=edge-1e-6,`${w}x${h}: Tooltip links außerhalb.`);
  assert.ok(x+half<=w-edge+1e-6,`${w}x${h}: Tooltip rechts außerhalb.`);
 }
 const maxHeight=Math.min(h*.48,320);
 assert.ok(maxHeight<=h*.60+1e-6,`${w}x${h}: Tooltip zu hoch.`);
}

const modules=['00-foundation.css','10-features.css','20-ensemble-composite.css','25-extreme-outlook.css','30-modern.css']
 .map(name=>readFileSync(`src/styles-src/${name}`,'utf8')).join('');
assert.equal(aggregate,modules,'src/styles.css muss exakt aus den fünf kanonischen Styles-Modulen erzeugt sein.');

console.log('MID 17.7.24 Karten-/Diagramm-/Querformat-Audit: Meteogramm-Portale, mobile Kartenlegenden, Wetterkarten, Synoptik und Extremwetter geprüft.');
