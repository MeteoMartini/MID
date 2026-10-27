import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {gzipSync,brotliCompressSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import ts from 'typescript-strada';
import {execFileSync} from 'node:child_process';
import {activeCssSources,loadCssCascade,consolidateCssCascade,cssCascadeFingerprint,renderConsolidatedCss,parseCssOutput} from './lib/cssCascade.mjs';
const root=new URL('../',import.meta.url),read=file=>readFileSync(new URL(file,root),'utf8');
const baseline=JSON.parse(read('scripts/fixtures/module-css-baseline-0985170.json'));
function declarations(file){const source=read(file),ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),result=new Map;for(const node of ast.statements){for(const name of node.name?[node.name.getText(ast)]:node.declarationList?.declarations.map(d=>d.name.getText(ast))||[])result.set(name,node.getText(ast));}return result;}
const files=new Map;
for(const item of baseline.declarations){if(!files.has(item.file))files.set(item.file,declarations(item.file));const source=files.get(item.file).get(item.name);assert.ok(source,`Extracted implementation missing: ${item.name}`);assert.equal(createHash('sha256').update(source).digest('hex'),item.sha256,`${item.name}: implementation differs from the approved ${baseline.baselineVersion} golden`);}
const app=read('src/App.tsx');
for(const name of ['MountainWeather','WidgetGenerator'])assert.ok(app.includes(`lazy(()=>import('./${name}')`),`${name} must load on demand`);
assert.ok(!app.includes('function mountainZoneAssessments('),'Mountain implementation must be outside App');
assert.ok(!app.includes('function storedWidgetSettings('),'Widget implementation must be outside App');
for(const file of files.keys())assert.ok(!/from ['"]\.\/App['"]|import\(['"]\.\/App['"]\)/.test(read(file)),`${file}: forbidden reverse dependency into App`);
assert.match(read('src/WidgetGenerator.tsx'),/SevenDayCurveOverview/,'Widget must retain the common curve renderer');
assert.match(read('src/WidgetGenerator.tsx'),/freezeWidgetSvgPaintsForExport/,'PNG export must retain resolved SVG paints');
assert.match(read('src/MountainWeather.tsx'),/mountainSportsForecast\(loc,config,controller.signal/,'Mountain data acquisition must retain cancellation');
assert.deepEqual(activeCssSources(root),[...baseline.cssSources,'src/midC21CurrentWeather.css','src/midC23CloudAudit.css','src/midC26UpdateRecovery.css','src/midC27CompactProfile.css','src/midC48TabletTimeline.css'],'Established stylesheet precedence changed; only reviewed C21/C23/C26/C27 layers may follow the unchanged .169 eager cascade; C28 is owned by the async development component');
const originalEntries=loadCssCascade(root).filter(entry=>!['src/midC21CurrentWeather.css','src/midC23CloudAudit.css','src/midC26UpdateRecovery.css','src/midC27CompactProfile.css','src/midC28MapPhase.css','src/midC48TabletTimeline.css'].includes(entry.file));
const entries=loadCssCascade(root),removed=consolidateCssCascade(entries);
// C32 explicitly changes only the two Skybar preview/legend radii. Require the
// new values, then restore just these declarations on the historical comparison
// copy: every other .169 declaration and its order remain golden-checked.
const flatSkyRules=new Map([
 ['src/v078.css','.detaillegend i.sunshine-bar,.detaillegend i.cloudiness-bar,.detaillegend i.precipitation-bar'],
 ['src/midC18NowcastSkybarPolish.css',"html[data-mid-design='next'] .settings-skybar-preview.band i"]
]);
let reviewedRadii=0;
for(const entry of originalEntries){
 const selector=flatSkyRules.get(entry.file);if(!selector)continue;
 entry.tree.walkRules(selector,rule=>rule.walkDecls('border-radius',decl=>{
  assert.equal(decl.value,'0','C32 Skybar preview/legend must have flat ends');
  decl.value='999px';reviewedRadii++;
 }));
}
assert.equal(reviewedRadii,2,'Exactly the two authorized shape changes');
// C36: the reviewed search fix intentionally replaces the root scroll container.
// Require the production values before restoring only these two declarations on
// this historical comparison copy. All remaining .169 semantics/order stay pinned.
const searchRootSelector="html[data-mid-design='next'],html[data-mid-design='next'] body,html[data-mid-design='next'] #root";
let reviewedSearchRoots=0;
for(const entry of originalEntries){
 if(entry.file!=='src/midC14ViewportFixes.css')continue;
 entry.tree.walkRules(searchRootSelector,rule=>{
  const horizontal=rule.nodes.filter(node=>node.type==='decl'&&node.prop==='overflow-x');
  const vertical=rule.nodes.filter(node=>node.type==='decl'&&node.prop==='overflow-y');
  assert.equal(horizontal.length,1,'Exactly one reviewed horizontal root declaration');
  assert.equal(vertical.length,1,'Exactly one reviewed vertical root declaration');
  assert.equal(horizontal[0].value,'clip','Search must retain horizontal clipping without a scroll container');
  assert.equal(vertical[0].value,'visible','Search must remain hittable beyond a short root');
  assert.ok(!horizontal[0].important&&!vertical[0].important,'Root fix must not gain cascade priority');
  horizontal[0].value='hidden';vertical[0].remove();reviewedSearchRoots++;
 });
}
assert.equal(reviewedSearchRoots,1,'Exactly the authorized root overflow rule');
const originalRemoved=consolidateCssCascade(originalEntries);
assert.equal(originalRemoved.length,baseline.removedIdenticalCssDeclarations);
assert.equal(cssCascadeFingerprint(originalEntries),baseline.cssCascadeSha256,'Original canonical CSS cascade diverged from .169');
assert.ok(read('src/FourteenDayDevelopment.tsx').startsWith("import './midC28MapPhase.css';"),'Trailing development styles must load with their sole consumer');
assert.ok(!read('src/ForecastCockpit.tsx').includes("import {FourteenDayDevelopment}"),'Development chart must remain an async boundary');
const output=read('src/midPresentation.css');
assert.equal(output,renderConsolidatedCss(entries),'Generated CSS does not match canonical ordered sources');
assert.equal(cssCascadeFingerprint(parseCssOutput(output)),cssCascadeFingerprint(entries),'Published stylesheet changed canonical CSS semantics/order');
const main=read('src/main.tsx'),eager=[...main.matchAll(/^import '\.\/(.*\.css)';/gm)].map(m=>m[1]);
assert.deepEqual(eager,['midPresentation.css'],'Eager CSS must have one consolidated entry');
assert.ok(!read('src/v078.ts').includes("import './v078.css'"),'Legacy CSS must not load a second time');
// v0.9.85.248: prove that the tempting 25-extreme stylesheet is not
// independently movable without changing downstream rules or verifying
// computed styles. This is read-only: the canonical CSS cascade stays intact.
const publishedCss=read('src/midPresentation.css');
const extremeSource=read('src/styles-src/25-extreme-outlook.css');
const start=publishedCss.indexOf('/* MID v0.9.66.9 · probabilistic DACH extreme-weather outlook */');
const stop=publishedCss.indexOf('/* v0.9.15.0 · klassische Stundenübersicht */',start+1);
assert.ok(start>0&&stop>start,'CSS ownership audit cannot locate the established extreme-weather segment');
const isolatedBytes=Buffer.byteLength(publishedCss.slice(start,stop));
const laterCss=publishedCss.slice(stop);
const ownedClasses=[...new Set([...extremeSource.matchAll(/\.extreme-[\w-]+/g)].map(match=>match[0]))];
const crossReferenced=ownedClasses.filter(name=>laterCss.includes(name));
assert.ok(crossReferenced.length>0,'Lazy CSS must be reaudited; previously present later overrides changed');
assert.ok(isolatedBytes>0&&isolatedBytes<Buffer.byteLength(publishedCss),'Route CSS candidate must be a proper subsection');
console.log(`CSS split candidate: extreme-weather source ${Buffer.byteLength(extremeSource)} B, consolidated region ${isolatedBytes} B, later shared selectors ${crossReferenced.length}, total emitted source ${Buffer.byteLength(publishedCss)} B. Deferred until DOM/paint parity is proven.`);
console.log(`Module/CSS consolidation: ${baseline.declarations.length} approved extracted declarations, ${removed.length} covered CSS duplicates, order-sensitive .169 CSS cascade equality.`);
// v0.9.85.249: read-only actual HTML-linked initial stylesheet sizes.
// Do not confuse this with full render/paint parity or async module CSS bytes.
const distHtmlUrl=new URL('../dist/index.html',import.meta.url);
if(existsSync(distHtmlUrl)){
 const html=readFileSync(distHtmlUrl,'utf8');
 const distRoot=new URL('../dist/',import.meta.url);
 const tags=[...html.matchAll(/<link\b[^>]*>/g)].map(hit=>hit[0]);
 const urls=[...new Set(tags.filter(tag=>/\brel=["']stylesheet["']/.test(tag)).map(tag=>tag.match(/\bhref=["']([^"']+)["']/)?.[1]).filter(Boolean))];
 const measured=[];
 for(const href of urls){
  const asset=new URL(href,distHtmlUrl);
  assert.ok(asset.href.startsWith(distRoot.href),'Stylesheet URL escapes dist directory');
  assert.ok(existsSync(asset),'HTML references a nonexisting initial stylesheet');
  const bytes=readFileSync(asset);
  measured.push({asset:href,rawBytes:bytes.length,gzipBytes:gzipSync(bytes).length,brotliBytes:brotliCompressSync(bytes).length});
 }
 const raw=measured.reduce((a,b)=>a+b.rawBytes,0),gzip=measured.reduce((a,b)=>a+b.gzipBytes,0),brotli=measured.reduce((a,b)=>a+b.brotliBytes,0);
 console.log('MID initial CSS delivery (HTML stylesheet links only, not async route CSS or measured rendering): '+JSON.stringify({count:measured.length,rawBytes:raw,gzipBytes:gzip,brotliBytes:brotli,assets:measured}));
}else{
 console.log('MID initial CSS delivery not measured: production dist/index.html not present in this test environment');
}

// MID v0.9.85.250: source PR regression must catch every RUC Python syntax
// error *before* CI accepts a PR, independently of the RUC data pipeline.
if(process.env.GITHUB_ACTIONS==='true'){
 const code="import ast; from pathlib import Path; files=sorted(Path('tools/ruc').glob('*.py')); assert files, 'No RUC Python files'; [ast.parse(f.read_text(encoding='utf-8'),filename=str(f)) for f in files]; print(f'RUC-Python syntax gate: {len(files)} sources OK')";
 execFileSync('python3',['-c',code],{cwd:root,stdio:'inherit',timeout:20000});
}
if(process.env.GITHUB_ACTIONS==='true')execFileSync(process.execPath,['scripts/verify-module-css-browser-0985170.mjs'],{cwd:root,stdio:'inherit',timeout:360000});
