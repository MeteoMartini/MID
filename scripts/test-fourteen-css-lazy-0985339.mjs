import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
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
 assert.ok(!html.includes(css[0]),'Async CSS must not be an initial stylesheet');
}
if(process.env.GITHUB_ACTIONS==='true'||process.env.MID_CSS_BROWSER_QA==='1')execFileSync(process.execPath,['scripts/verify-fourteen-css-production-0985339.mjs'],{stdio:'inherit',timeout:330000});
console.log('14-day development: canonical data and shared SVG renderer preserved; exclusive stylesheet and component load asynchronously.');
