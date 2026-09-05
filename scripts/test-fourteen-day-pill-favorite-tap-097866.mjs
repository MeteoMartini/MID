import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [app,sourceStyles,builtStyles,pkgRaw,baselineRaw]=await Promise.all([
 read('src/App.tsx'),read('src/styles-src/30-modern.css'),read('src/styles.css'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-fourteen-day-pill-favorite-tap-097866.mjs';

for(const [name,styles] of [['Quell-CSS',sourceStyles],['Aggregat-CSS',builtStyles]]){
 const marker='/* MID v0.9.78.66 · 14d-Kurzaussagen einzeilig + robuste Favoriten-Taps auf iOS */';
 const start=styles.lastIndexOf(marker);assert.ok(start>=0,`${name}: finaler v66-Override fehlt.`);const block=styles.slice(start);
 for(const token of ['.cockpit-fourteen-regime{','flex-wrap:nowrap!important','white-space:nowrap!important','.cockpit-fourteen-regime>span{','overflow-wrap:normal!important','word-break:keep-all','text-overflow:ellipsis'])assert.ok(block.includes(token),`${name}: 14d-Kurzaussage ist nicht sicher einzeilig: ${token}`);
 for(const token of ['.header-favorites .favorite-bubbles>button .favorite-quick-grip{','position:static','transform:none','min-height:24px'])assert.ok(block.includes(token),`${name}: Favoritengriff bleibt als absolute Touch-Überlagerung aktiv: ${token}`);
}

for(const token of [
 "pointerDrag=useRef<{id:string;pointerId:number;startX:number;startY:number;dragging:boolean}|null>(null)",
 'if(distance<8)return;active.dragging=true;setDragId(active.id)',
 'if(!active.dragging){event.preventDefault();event.stopPropagation();finish();lastGripSelection.current=Date.now();onSelect(item.location);return}',
 'onPointerUp={event=>pointerEnd(event,item)}',
 'onPointerCancel={pointerCancel}',
 "onClick={()=>{if(suppressClick.current||Date.now()-lastGripSelection.current<420)return;onSelect(item.location)}}"
])assert.ok(app.includes(token),`Favoriten-Tap-/Drag-Vertrag fehlt: ${token}`);
assert.ok(!app.includes('tapPointer=useRef<'),'Fragiler zusätzlicher Touch-Tap-Zustand darf die native Button-Auswahl nicht mehr blockieren.');
assert.ok(!app.includes('onPointerDown={event=>tapStart(event,item.id)}'),'Favoritenbutton darf Touch-Taps nicht mehr über einen separaten Pointer-State abfangen.');

assert.ok(/^0\.9\.78\.(?:6[6-9]|[7-9]\d|\d{3,})$/.test(pkg.version),`Paketversion ${pkg.version} darf den v0.9.78.66-Vertrag nicht unterschreiten.`);
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion sind nicht synchron.');
assert.ok(baseline.regressionTests?.includes(test),'Neue Regression fehlt im Baseline-Katalog.');
console.log(`${pkg.version}: 14d-Kurzaussage bleibt einzeilig; Favoriten-Tap und Drag sind auf iOS getrennt und der Griff hat keine tote Touch-Zone mehr.`);
