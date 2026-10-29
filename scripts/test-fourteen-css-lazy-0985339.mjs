import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {runBounded} from '../tools/ci/bounded-process.mjs';
const read=p=>readFileSync(p,'utf8');
const manifest=JSON.parse(read('src/styles-src/presentation-order.json'));
assert.ok(!manifest.sources.includes('src/midC28MapPhase.css'),'Exclusive final module stylesheet must not remain eager');
assert.ok(read('src/FourteenDayDevelopment.tsx').startsWith("import './midC28MapPhase.css';"));
const cockpit=read('src/ForecastCockpit.tsx');
assert.ok(cockpit.includes("lazy(()=>import('./FourteenDayDevelopment')"));
assert.ok(cockpit.includes('<LazyFourteenDayDevelopment series={series}/>'),'Canonical series must reach the shared renderer');
assert.ok(!read('src/midPresentation.css').includes('[data-fourteen-development]'));
if(existsSync('dist/index.html')){
 const html=read('dist/index.html'),hrefs=[...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="\.\/([^\"]+)"/g)].map(m=>m[1]);assert.ok(hrefs.length);
 for(const href of hrefs)assert.ok(!read('dist/'+href).includes('[data-fourteen-development]'),'HTML-linked CSS must exclude this module');
 const files=readdirSync('dist/assets'),css=files.filter(f=>/^FourteenDayDevelopment-.*\.css$/.test(f));assert.equal(css.length,1);
 assert.ok(read('dist/assets/'+css[0]).includes('[data-fourteen-development]'));
 assert.ok(!hrefs.some(href=>href.endsWith(css[0])),'Async CSS must not be an initial stylesheet');
 assert.ok(html.includes('rel="mid-offline"'),'Deferred module must remain available in the offline shell');
}
const parity=read('scripts/verify-fourteen-css-production-0985339.mjs');
for(const token of ['settledSnapshot(', 'requestAnimationFrame(()=>requestAnimationFrame(resolve))','assert.deepEqual(actual,expected', 'assert.ok(images[0].equals(images[1])','throw new Error(label']){
 assert.ok(parity.includes(token),'WebKit browser parity must await stable deferred layout and retain exact computed/pixel comparisons: '+token);
}
if(process.env.GITHUB_ACTIONS==='true'||process.env.MID_CSS_BROWSER_QA==='1'){
 console.log('[css-parity] launching independent Chromium/WebKit production parity process');
 await runBounded(process.execPath,['scripts/verify-fourteen-css-production-0985339.mjs'],{timeoutMs:420000});
 await runBounded(process.execPath,['scripts/verify-c48-tablet-timeline-0985345.mjs'],{timeoutMs:90000});
}
console.log('14-day development: canonical data and shared SVG renderer preserved; exclusive stylesheet and component load asynchronously.');