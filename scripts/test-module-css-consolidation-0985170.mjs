import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {gzipSync,brotliCompressSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import ts from 'typescript-strada';
import postcss from 'postcss';
import {execFileSync} from 'node:child_process';
import {activeCssSources,loadCssCascade,consolidateCssCascade,cssCascadeFingerprint,renderConsolidatedCss,parseCssOutput} from './lib/cssCascade.mjs';
const root=new URL('../',import.meta.url),read=file=>readFileSync(new URL(file,root),'utf8');
const baseline=JSON.parse(read('scripts/fixtures/module-css-baseline-0985170.json'));
function declarations(file){const source=read(file),ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),result=new Map;for(const node of ast.statements){for(const name of node.name?[node.name.getText(ast)]:node.declarationList?.declarations.map(d=>d.name.getText(ast))||[])result.set(name,node.getText(ast));}return result;}
// .365 intentionally changes only storage wiring in these three components.
// Require each reviewed new expression, then restore only that expression on
// the historical comparison copy. Every calculation, renderer and other byte
// remains pinned to the existing golden; the fixture hashes are not rewritten.
// .396 reviewed widget behavior: only the storage subscription and ten actual
// user actions may differ from the approved historical Widget renderer.
// Assert each exact current expression, restore it on the comparison copy,
// and KEEP the old fixture SHA/renderer/CSS golden unchanged.
const approvedWidgetStorageWiring=[
 [
  "useEffect(()=>{if(urlExport)return;\n  const sync=()=>{const s=storedWidgetSettings();setN(s.days);setDark(s.dark);setShowWind(s.showWind);setShowRain(s.showRain);setShowSkybar(s.showSkybar);setShowSunshine(s.showSunshine);setShowHazards(s.showHazards);setEcmwfTemperatureColors(s.ecmwfTemperatureColors);setView(s.view);setEnsembleMetric(s.ensembleMetric)};\n  const onStorage=(event:StorageEvent)=>{if(event.key===WIDGET_SETTINGS_STORAGE_KEY||event.key===null)sync()};\n  window.addEventListener('storage',onStorage);window.addEventListener(WIDGET_SETTINGS_CHANGED,sync);\n  return()=>{window.removeEventListener('storage',onStorage);window.removeEventListener(WIDGET_SETTINGS_CHANGED,sync)};\n },[urlExport]);\n const persist=(patch:Partial<WidgetStoredSettings>)=>{if(!urlExport)patchStoredWidgetSettings(patch)};\n ",
  "useEffect(()=>{if(urlExport)return;try{localStorage.setItem(WIDGET_SETTINGS_STORAGE_KEY,JSON.stringify({schema:5,days:n,dark,showWind,showRain,showSkybar,showSunshine,showHazards,ecmwfTemperatureColors,view,ensembleMetric} satisfies WidgetStoredSettings))}catch{}},[n,dark,showWind,showRain,showSkybar,showSunshine,showHazards,ecmwfTemperatureColors,view,ensembleMetric,urlExport]);\n "
 ],
 [
  "onChange={e=>{const days=Number(e.target.value) as WidgetDayCount;setN(days);persist({days})}}",
  "onChange={e=>setN(Number(e.target.value) as WidgetDayCount)}"
 ],
 [
  "onChange={e=>{const view=e.target.value as WidgetView;setView(view);persist({view})}}",
  "onChange={e=>setView(e.target.value as WidgetView)}"
 ],
 [
  "onChange={e=>{const ensembleMetric=e.target.value as EnsembleDisplayMetric;setEnsembleMetric(ensembleMetric);persist({ensembleMetric})}}",
  "onChange={e=>setEnsembleMetric(e.target.value as EnsembleDisplayMetric)}"
 ],
 [
  "onChange={e=>{setDark(e.target.checked);persist({dark:e.target.checked})}}",
  "onChange={e=>setDark(e.target.checked)}"
 ],
 [
  "onChange={e=>{setShowWind(e.target.checked);persist({showWind:e.target.checked})}}",
  "onChange={e=>setShowWind(e.target.checked)}"
 ],
 [
  "onChange={e=>{setShowRain(e.target.checked);persist({showRain:e.target.checked})}}",
  "onChange={e=>setShowRain(e.target.checked)}"
 ],
 [
  "onChange={e=>{setShowSunshine(e.target.checked);persist({showSunshine:e.target.checked})}}",
  "onChange={e=>setShowSunshine(e.target.checked)}"
 ],
 [
  "onChange={e=>{setShowSkybar(e.target.checked);persist({showSkybar:e.target.checked})}}",
  "onChange={e=>setShowSkybar(e.target.checked)}"
 ],
 [
  "onChange={e=>{setShowHazards(e.target.checked);persist({showHazards:e.target.checked})}}",
  "onChange={e=>setShowHazards(e.target.checked)}"
 ],
 [
  "onChange={e=>{setEcmwfTemperatureColors(e.target.checked);persist({ecmwfTemperatureColors:e.target.checked})}}",
  "onChange={e=>setEcmwfTemperatureColors(e.target.checked)}"
 ]
];
const displayWiring=new Map([
 ['MountainZoneAnalysis',[["useDisplayPreference('MountainWeather.zoneAnalysis.open',false,displayBoolean)","useState(false)"]]],
 ['MountainSnowLineTrend',[["useDisplayPreference('MountainWeather.snowLine.open',false,displayBoolean)","useState(false)"],["useDisplayPreference<MountainSnowLineHorizon>('MountainWeather.snowLine.horizon',3,displayChoice(1,3,7,14))","useState<MountainSnowLineHorizon>(3)"]]],
 ['MountainForecastOverview',[["useDisplayPreference<MountainLevelRole>('MountainWeather.forecast.role','summit',displayChoice('valley','middle','summit'))","useState<MountainLevelRole>('summit')"],[" useEffect(()=>{setExpandedDate(null)},[selectedRole]);"," useEffect(()=>{if(level&&level.role!==selectedRole)setSelectedRole(level.role)},[level,selectedRole]);\n useEffect(()=>{setExpandedDate(null)},[selectedRole]);"]]]
]);
function historicalDisplaySource(name,source){
 if(name==='Widget')for(const [current,historical] of approvedWidgetStorageWiring){
  assert.equal(source.split(current).length-1,1,'Widget v.396 reviewed storage expression must occur exactly once: '+current.slice(0,60));
  source=source.replace(current,historical);
 }

 for(const [current,historical] of displayWiring.get(name)||[]){assert.equal(source.split(current).length-1,1,`${name}: reviewed persistent expression must occur exactly once`);source=source.replace(current,historical)}
 return source;
}
const files=new Map;
for(const item of baseline.declarations){if(!files.has(item.file))files.set(item.file,declarations(item.file));const source=files.get(item.file).get(item.name);assert.ok(source,`Extracted implementation missing: ${item.name}`);assert.equal(createHash('sha256').update(historicalDisplaySource(item.name,source)).digest('hex'),item.sha256,`${item.name}: implementation differs from the approved ${baseline.baselineVersion} golden`);}
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
// .378: on the historical comparison AST only, undo the exact reviewed
// theme and shared-line changes. Production CSS and the .169 golden remain intact.
const reviewedThemeColors=[
 [':root','--param-pressure','#8469be','#7b61b7'],
 [':root[data-theme=light]','--param-precipitation-snow','#418bb6','#4f9fc9'],
 [':root[data-theme=light]','--param-sunshine','#a77c00','#bf8d00']
];
const reviewedLineRules=[[".cockpit-meteogram-pro__tooltip-content dt i.dew",0,"background:#71869a","background:var(--param-dewpoint)",1],[".cockpit-meteogram-pro__tooltip-content dt i.rain",0,"background:#2697d8","background:var(--param-precipitation)",1],[".cockpit-meteogram-pro__tooltip-content dt i.wind",0,"background:#3ba66e","background:var(--param-wind)",1],[".cockpit-meteogram-pro__tooltip-content dt i.gust",0,"background:#9c63bb","background:var(--param-gust)",1],[".cockpit-meteogram-pro__tooltip-content dt i.pressure",0,"background:#6d89a5","background:var(--param-pressure)",1],[".cockpit-meteogram-pro__legend i.temperature",0,"width:24px;height:4px;border-radius:999px;background:linear-gradient(90deg,#74b7d8,#ffe391,#f06a46)","width:24px;height:4px;border-radius:999px;background:var(--param-temperature)",1],[".cockpit-weather-profile .cockpit-meteogram-pro__legend i.apparent",0,null,"width:24px;height:2px;border:0;background:repeating-linear-gradient(90deg,var(--apparent-line) 0 5px,transparent 5px 9px)",1],[".cockpit-meteogram-pro__legend i.rain",0,"width:8px;height:14px;border-radius:999px;background:#2697d8","width:8px;height:14px;border-radius:999px;background:var(--param-precipitation)",1],[".cockpit-meteogram-pro__legend i.wind",0,"width:12px;height:12px;border-top:3px solid #3ba66e;border-right:3px solid #3ba66e;transform:rotate(45deg)","width:12px;height:12px;border-top:3px solid var(--param-wind);border-right:3px solid var(--param-wind);transform:rotate(45deg)",1],[".cockpit-weather-profile .gust-line",0,"fill:none;stroke:var(--profile-gust);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:5 4;opacity:.96","fill:none;stroke:var(--profile-gust);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:9 4;opacity:.96",2],[".cockpit-weather-profile .cockpit-meteogram-pro__legend i.dewpoint",0,"width:24px;height:0;border-top:2px dotted var(--profile-dew)","width:24px;height:2px;border:0;background:repeating-linear-gradient(90deg,var(--profile-dew) 0 2px,transparent 2px 7px)",1],[".cockpit-weather-profile .cockpit-meteogram-pro__legend i.probability",0,"width:24px;height:0;border-top:2px dashed var(--profile-prob)","width:24px;height:2px;border:0;background:repeating-linear-gradient(90deg,var(--profile-prob) 0 4px,transparent 4px 7px)",1],[".cockpit-weather-profile .cockpit-meteogram-pro__legend i.gust",0,"width:24px;height:0;border-top:2px dashed var(--profile-gust)","width:24px;height:2px;border:0;background:repeating-linear-gradient(90deg,var(--profile-gust) 0 9px,transparent 9px 13px)",1],[".detaillegend i.gustline",0,"background:repeating-linear-gradient(90deg,var(--param-gust) 0 7px,transparent 7px 11px)!important","background:repeating-linear-gradient(90deg,var(--param-gust) 0 9px,transparent 9px 13px)!important",1],[".detaillegend i.apparent",0,null,"background:repeating-linear-gradient(90deg,var(--apparent-line) 0 5px,transparent 5px 9px)!important",1],[".detaillegend i.probability",0,null,"background:repeating-linear-gradient(90deg,var(--param-precipitation) 0 4px,transparent 4px 7px)!important",1]];
for(const entry of originalEntries){
 if(entry.file==='src/styles-src/00-foundation.css')for(const [selector,prop,actual,historical] of reviewedThemeColors){
  // A theme may legitimately have multiple :root blocks. Identify the
  // unique canonical token declaration, not an arbitrary selector occurrence.
  const decls=[];
  entry.tree.walkRules(selector,rule=>{
   for(const declaration of rule.nodes||[])
    if(declaration.type==='decl'&&declaration.prop===prop)decls.push(declaration);
  });
  assert.equal(decls.length,1,'Theme property drift '+selector+'/'+prop);
  assert.equal(decls[0].value,actual,'Theme color drift '+prop);decls[0].value=historical;
 }
 if(entry.file==='src/styles-src/30-modern.css')for(const [selector,index,prior,current,count] of reviewedLineRules){
  const rules=[];entry.tree.walkRules(selector,r=>rules.push(r));assert.equal(rules.length,count,'Line CSS selector drift '+selector);
  assert.equal(rules[index].toString(),selector+'{'+current+'}','Line CSS declaration drift '+selector);
  if(prior===null)rules[index].remove();else rules[index].replaceWith(postcss.parse(selector+'{'+prior+'}').first);
 }
}
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
