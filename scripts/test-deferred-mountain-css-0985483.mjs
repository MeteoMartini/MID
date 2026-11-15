import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {activeCssSources,loadCssCascade,consolidateCssCascade,renderConsolidatedCss} from './lib/cssCascade.mjs';

const root=new URL('../',import.meta.url);
const deferred='src/midC18MountainResponsiveFix.css';
const source=await readFile(new URL(deferred,root),'utf8');
const [generated,mountain,app,main,browser]=await Promise.all([
 'src/midPresentation.css','src/MountainWeather.tsx','src/App.tsx','src/main.tsx',
 'scripts/verify-module-css-browser-0985170.mjs'
].map(x=>readFile(new URL(x,root),'utf8')));
const files=activeCssSources(root);
assert.equal(files.length,68,'Exactly one additional stylesheet must leave the previous 69-source eager manifest');
assert.ok(!files.includes(deferred),'Mountain layout CSS cannot remain eager');
assert.equal(files.filter(x=>x.includes('MountainResponsiveFix')).length,0);
assert.ok(mountain.startsWith("import './midC18MountainResponsiveFix.css';\n"),'The deferred mountain module must load its own responsive CSS');
assert.ok(app.includes("const LazyMountainSki=lazy(()=>import('./MountainWeather')"),'Mountain component must remain deferred');
assert.ok(main.includes("import './midPresentation.css';"),'One shared global stylesheet remains the entry contract');
assert.ok(!main.includes("import './midC18MountainResponsiveFix.css'"),'No duplicate eager import');
assert.ok(source.includes('.mountain-day-toggle')&&source.includes('@media (min-width:621px)'),'Responsive mountain layout rules are retained');
assert.ok(!generated.includes(source),'Mountain CSS source must be absent from generated global stylesheet');
const all=loadCssCascade(root);consolidateCssCascade(all);
assert.equal(generated,renderConsolidatedCss(all),'Generated global CSS must match exact ordered canonical source after removal');
assert.ok(browser.includes('MID_PARITY_BASE')&&browser.includes('assert.deepEqual(await snapshot(current.page),await snapshot(reference.page)'),
 'Real browser reference-computed-style and geometry parity is mandatory before release');
console.log('Deferred mountain CSS: source ownership, exact canonical generation, non-eager routing and browser parity harness PASS');
