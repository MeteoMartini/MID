import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript-strada';

const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const overlay=read('src/ExtremeOutlookAreaOverlay.tsx');
const canvas=read('src/extremeOutlookAreaCanvas.ts');
const core=read('src/MapLibreCore.tsx');
const styles=read('src/styles-src/25-extreme-outlook.css');
const pkg=JSON.parse(read('package.json'));
const baseline=JSON.parse(read('MID_BASELINE.json'));
const worker=read('worker-src/00-core-observations.js');
const path='scripts/test-extreme-outlook-render-fallback-0985309.mjs';
assert.equal(pkg.version,'0.9.85.309');
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(baseline.version,pkg.version);
assert.equal(pkg.scripts['test:extreme-outlook-render-fallback'],'node '+path);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles','protectedFiles'])
 assert.ok(baseline[key]?.includes(path),path+' fehlt in '+key);
assert.ok(worker.includes("const WORKER_VERSION='"+pkg.version+"';"));
const sourceCheck=ts.transpileModule(overlay,{fileName:'ExtremeOutlookAreaOverlay.tsx',compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true});
assert.equal((sourceCheck.diagnostics||[]).filter(row=>row.category===ts.DiagnosticCategory.Error).length,0,'Overlay muss syntaktisch gültiges TSX sein');
for(const token of [
 'buildExtremeOutlookContourSet(data,periodId,hazard)',
 'buildExtremeOutlookContourGeoJson(contours)',
 'map.isSourceLoaded(SOURCE_ID)',
 'map.queryRenderedFeatures({layers:[LAYER_IDS[0]]})',
 "map.on('error',errorHandler)",
 "map.on('idle',verify)",
 'setFallback(!nativeVisible())',
 'setFallback(contours.length>0)',
 'if(contours.length)setFallback(true)',
 'clearTimeout(watchdog)',
 "map.off('idle',verify)",
 "map.off('error',errorHandler)",
 'fallback&&contours.length>0?<CanvasOverlay',
 'render={drawFallback}',
 'role="status"'
]) assert.ok(overlay.includes(token),'Layer- und Fallback-Vertrag fehlt: '+token);
assert.ok(overlay.includes('drawExtremeOutlookContours(activeMap,canvas,contours)'),
 'Fallback muss dieselben vollständigen Original-Konturen verwenden, nicht Ersatz-Zellen/Schwellwerte.');
assert.ok(overlay.includes("zIndex={12}")&&overlay.includes("zIndex={35}"),
 'Fallback unter Gebietsbeschriftungen');
assert.ok(overlay.includes("type:'fill'")&&overlay.includes("type:'line'")&&overlay.includes("'fill-pattern'"),
 'Nativer Layer bleibt der Normalweg');
assert.ok(core.includes('maplibregl.setWorkerUrl(maplibreWorkerUrl)'),'Original-MapLibre-Worker darf nicht weggelassen werden');
assert.ok(canvas.includes("context.fill('evenodd')")&&canvas.includes("context.clip('evenodd')"),
 'Fallback muss Löcher, Inseln und Schraffur erhalten');
assert.ok(styles.includes('.extreme-map-layer-fallback-status')&&styles.includes('pointer-events:none'),
 'Degradationshinweis darf Karteninteraktion nicht überdecken');
console.log('MID 0.9.85.309: native Gefahrenpolygonprüfung mit georeferenziertem, deutlich deklariertem Canvas-Notfallmodus geprüft (Quell-/Konturvertrag, keine Browser-Pixelabnahme).');
