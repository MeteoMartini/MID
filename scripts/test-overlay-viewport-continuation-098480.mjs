import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const radar=readFileSync('src/RadarPanel.tsx','utf8');
const subseasonal=readFileSync('src/SubseasonalTrendPanel.tsx','utf8');
const popover=readFileSync('src/AppPortalPopover.tsx','utf8');
const modern=readFileSync('src/styles-src/30-modern.css','utf8');
const aggregate=readFileSync('src/styles.css','utf8');

assert.match(radar,/AppPortalPopover anchorRef=\{focusLayersButtonRef\}[\s\S]*?composite-focus-layer-popover composite-focus-layer-popover-portal/,'Komposit-Ebenenwahl muss das viewportfeste Portal verwenden.');
assert.match(radar,/AppPortalPopover anchorRef=\{buttonRef\}[\s\S]*?composite-info-popover-portal/,'Komposit-Dateninformation muss das viewportfeste Portal verwenden.');
assert.doesNotMatch(radar,/focusLayersRef=useRef/,'Alte lokale Dismissible-Layer-Verankerung der Ebenenwahl darf nicht aktiv bleiben.');
assert.match(subseasonal,/AppPortalPopover anchorRef=\{activeAnchorRef\}[\s\S]*?subseasonal-point-tooltip-portal/g,'Trend-14d+-Punktwerte müssen über Portal gerendert werden.');
assert.doesNotMatch(subseasonal,/className="subseasonal-point-tooltip"\s+style=\{\{left:/,'Alte diagramminterne Tooltip-Positionierung darf nicht zurückkehren.');
assert.doesNotMatch(subseasonal,/function\s+clamp\s*\(/,'Nach der Portal-Umstellung darf kein ungenutzter lokaler clamp-Helfer den TypeScript-Build blockieren.');

const marker='MID v0.9.84.80 · Interaktions-/Overlay-Audit Fortsetzung 17.7.24.';
assert.ok(modern.includes(marker),'Overlay-Auditmarker 0.9.84.80 fehlt.');
for(const token of [
 '.subseasonal-chart .subseasonal-point-tooltip.app-portal-popover',
 '.composite-focus-layer-popover.app-portal-popover',
 '.composite-info-popover.app-portal-popover',
 '.favorite-modal{max-height:min(90dvh,900px)}',
 '.settings-dialog{max-height:min(92dvh,930px)}',
 '.system-update-dialog{max-height:min(86dvh,760px)}',
 '.pwa-install-dialog{max-height:min(90dvh,760px)}',
 '.long-range-dwd-periods article>header small',
 '.subseasonal-model-selector small'
]) assert.ok(modern.includes(token),`Overlay-/Lesbarkeitsregel fehlt: ${token}`);


assert.match(modern,/@media\(max-width:700px\)\{[\s\S]*?\.favorite-modal-backdrop,\.settings-backdrop\{padding:0\}/,'Vollbilddialoge dürfen 100dvh nicht zusätzlich durch Backdrop-Safe-Area-Padding vergrößern.');
assert.match(modern,/\.favorite-modal\{[\s\S]*?height:100dvh;[\s\S]*?padding:var\(--mid-safe-top\) var\(--mid-safe-right\) var\(--mid-safe-bottom\) var\(--mid-safe-left\)/,'Favoriten-Vollbilddialog muss die Safe Area innerhalb des 100dvh-Containers berücksichtigen.');
assert.match(modern,/\.system-update-backdrop,\.pwa-install-backdrop\{[\s\S]*?max\(8px,var\(--mid-safe-top\)\)/,'Kompakte Update-/Installationsdialoge müssen Safe Areas im Backdrop berücksichtigen.');

for(const token of [
 'visualViewport?.width??window.innerWidth',
 'visualViewport?.height??window.innerHeight',
 'actualWidth=Math.min(width,availableWidth)',
 'maxHeight=Math.max(120,viewportHeight-edge*2)',
 'left=clamp(left,viewportLeft+edge',
 "document.addEventListener('pointerdown',dismiss,true)",
 "document.addEventListener('keydown',escape)"
]) assert.ok(popover.includes(token),`Portal-Viewportvertrag fehlt: ${token}`);

// Mathematische Simulation der Portalprimitive an den in MID 17.7.23 festgelegten Viewports.
const devices=[
 [320,568],[360,800],[390,844],[430,932],[844,390],[600,1024],
 [768,1024],[834,1194],[1024,1366],[1366,768],[1440,900],[1920,1080]
];
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
function place(viewportWidth,viewportHeight,anchor,width,contentHeight,align='end',gap=8){
 const edge=8,availableWidth=Math.max(160,viewportWidth-edge*2),actualWidth=Math.min(width,availableWidth),maxHeight=Math.max(120,viewportHeight-edge*2),height=Math.min(contentHeight,maxHeight),viewportRight=viewportWidth,viewportBottom=viewportHeight;
 let left=align==='start'?anchor.left:align==='end'?anchor.right-actualWidth:anchor.left+(anchor.right-anchor.left)/2-actualWidth/2;
 left=clamp(left,edge,Math.max(edge,viewportRight-actualWidth-edge));
 let top=anchor.bottom+gap,above=false;
 if(top+height>viewportBottom-edge&&anchor.top-height-gap>=edge){top=anchor.top-height-gap;above=true}else top=clamp(top,edge,Math.max(edge,viewportBottom-height-edge));
 return {left,top,width:actualWidth,height,maxHeight,above};
}
for(const [w,h] of devices){
 for(const anchor of [
  {left:8,right:52,top:8,bottom:52},
  {left:w-52,right:w-8,top:Math.max(8,Math.round(h*.28)),bottom:Math.max(52,Math.round(h*.28)+44)},
  {left:Math.round(w*.48),right:Math.round(w*.52),top:Math.round(h*.72),bottom:Math.round(h*.72)+30}
 ]){
  for(const contentHeight of [180,420,760]){
   const p=place(w,h,anchor,470,contentHeight,'end');
   assert.ok(p.left>=8-1e-6,`${w}x${h}: Popover links außerhalb (${p.left})`);
   assert.ok(p.left+p.width<=w-8+1e-6,`${w}x${h}: Popover rechts außerhalb (${p.left+p.width})`);
   assert.ok(p.top>=8-1e-6,`${w}x${h}: Popover oben außerhalb (${p.top})`);
   assert.ok(p.top+p.height<=h-8+1e-6,`${w}x${h}: Popover unten außerhalb (${p.top+p.height})`);
   assert.equal(p.maxHeight,Math.max(120,h-16),`${w}x${h}: falsche Maximalhöhe`);
  }
 }
}

const modules=['00-foundation.css','10-features.css','20-ensemble-composite.css','25-extreme-outlook.css','30-modern.css']
 .map(name=>readFileSync(`src/styles-src/${name}`,'utf8')).join('');
assert.equal(aggregate,modules,'src/styles.css muss exakt aus den fünf kanonischen Styles-Modulen erzeugt sein.');

console.log('MID 17.7.24 Overlay-/Viewport-Fortsetzung: Portalpositionierung, dynamische Viewports, Safe Areas und Langfrist-Lesbarkeit geprüft.');
