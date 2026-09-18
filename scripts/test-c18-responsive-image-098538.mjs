import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/midC18ResponsivePolish.css',import.meta.url),'utf8');
// Execute the actual production centering body with measured DOM rectangles.
const body=source.match(/const centerImagePoint=useCallback\(\(point:ImagePoint\)=>\{([\s\S]*?)\n \},\[\]\);/)[1];
const center=new Function('point','viewportRef','imageRef','clamp',body);
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const sizes=[[320,568],[390,844],[430,932],[844,390],[932,430],[768,1024],[834,1194],[1024,768],[1194,834],[1024,1366],[1366,1024],[1440,900],[900,1440],[1920,1080]];
for(const [width,height] of sizes)for(const zoom of [.5,1,1.25,2,5]){
 const vw=width<=850?width-24:width-(width<1400?124:236),vh=Math.min(height*.54,500),iw=Math.max(vw,vw*zoom/.4),ih=iw;
 const viewport={clientLeft:2,clientTop:2,clientWidth:vw,clientHeight:vh,scrollWidth:iw,scrollHeight:ih,scrollLeft:13,scrollTop:17,getBoundingClientRect:()=>({left:40,top:80})};
 const image={complete:true,naturalWidth:900,getBoundingClientRect:()=>({left:42-viewport.scrollLeft,top:82-viewport.scrollTop,width:iw,height:ih})};
 for(const point of [{x:.33102793,y:.46836195},{x:.72,y:.3},{x:.03,y:.02},{x:.99,y:.99}]){
  center(point,{current:viewport},{current:image},clamp);
  assert.equal(viewport.scrollLeft,clamp(point.x*iw-vw/2,0,iw-vw));
  assert.equal(viewport.scrollTop,clamp(point.y*ih-vh/2,0,ih-vh));
 }
}
assert.ok(!source.includes('setTimeout(run,'),'Delayed re-centering must not override an intervening pan.');
assert.ok(source.includes('onScroll={rememberViewCenter}'));
assert.ok(source.includes('aria-label="Verkleinern"'));
assert.ok(source.includes('Math.round(next*4)/4,.5,5'),'Fine zoom must include zooming out below the default crop.');
for(const rule of ['max-width:1399px','padding-left:100px','min-width:1400px','cockpit-now90-slot','modern-more-quick-actions','source-legend img','max-width:none!important','orientation:landscape'])assert.ok(css.includes(rule),rule);
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
assert.ok(app.includes('aria-label={tab.label}'),'Icon-only rail buttons need accessible names.');
console.log(`C18: actual centering function verified at ${sizes.length} device orientations × 5 zoom levels × 4 positions; responsive shell and image constraints checked.`);
