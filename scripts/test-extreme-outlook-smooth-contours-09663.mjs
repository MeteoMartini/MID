import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [canvasSource,overlay,panel,pkgRaw,baselineRaw,changelog,implementation,workerSource]=await Promise.all([
 read('src/extremeOutlookAreaCanvas.ts'),read('src/ExtremeOutlookAreaOverlay.tsx'),read('src/ExtremeWeatherOutlookPanel.tsx'),read('package.json'),read('MID_BASELINE.json'),read('CHANGELOG.md'),read('MID_IMPLEMENTATION_0.9.66.3.md'),read('worker-src/00-core-observations.js')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-extreme-outlook-smooth-contours-09663.mjs';

assert.equal(pkg.version,'0.9.66.3');
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:extreme-outlook-smooth-contours'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Konturflächen-Regression ist nicht verbindlich registriert.');
assert.ok(baseline.requiredFiles?.includes(test)&&baseline.requiredFiles?.includes('MID_IMPLEMENTATION_0.9.66.3.md'),'Konturflächen-Dateien fehlen im Baseline-Vertrag.');
assert.ok(workerSource.includes(`const WORKER_VERSION='${pkg.version}';`),'Professional- und Worker-Version sind nicht gekoppelt.');

for(const token of ['SAMPLE_SUBDIVISIONS=9','KERNEL_RADIUS_STEPS=.8','FIELD_THRESHOLD=.09','connectedComponents','supportAt','smoothRing','traceMask','buildExtremeOutlookContours','probability<60',"context.clip('evenodd')"])assert.ok(canvasSource.includes(token),`Professioneller Konturvertrag fehlt: ${token}`);
assert.ok(!canvasSource.includes('grid.latStep*.515')&&!canvasSource.includes('grid.lonStep*.515'),'Rechteckige Rasterzellen dürfen nicht mehr sichtbar gezeichnet werden.');
assert.ok(overlay.includes('buildExtremeOutlookContours(paintAreas,data.grid)')&&overlay.includes('drawExtremeOutlookContours(map,canvas,contours)'),'Vorbemessene Konturen sind nicht in das Kartenoverlay eingebunden.');
assert.ok(panel.includes('cellHitRing')&&panel.includes('Array.from({length:24}'),'Interaktionsflächen müssen der geglätteten Geometrie folgen.');
assert.ok(panel.includes('Geglättete Isoplethenflächen aus dem Regionalraster'));
assert.ok(panel.includes('unter 60 % schraffiert'));

const compiled=ts.transpileModule(canvasSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,canvasModule=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`),grid={latStep:.8,lonStep:.75},areas=[
 {lat:50,lon:8,intensity:1,probability:50,color:'#269b83',opacity:.62},
 {lat:50,lon:8.75,intensity:1,probability:55,color:'#269b83',opacity:.62},
 {lat:49.2,lon:8.75,intensity:1,probability:45,color:'#269b83',opacity:.58},
 {lat:47,lon:12,intensity:2,probability:70,color:'#e7b92f',opacity:.78}
],contours=canvasModule.buildExtremeOutlookContours(areas,grid);

assert.equal(contours.length,2,'Benachbarte I1-Stützfelder müssen zu einem Gebiet verschmelzen; das getrennte I2-Gebiet bleibt eigenständig.');
const merged=contours.find(contour=>contour.intensity===1),isolated=contours.find(contour=>contour.intensity===2);
assert.ok(merged&&isolated);assert.equal(merged.probability,50);assert.equal(merged.rings.length,1);assert.equal(isolated.rings.length,1);
const ring=merged.rings[0],uniqueLon=new Set(ring.map(point=>point.lon.toFixed(5))),uniqueLat=new Set(ring.map(point=>point.lat.toFixed(5)));
assert.ok(ring.length>40&&uniqueLon.size>10&&uniqueLat.size>10,'Die zusammengeführte Gefahrenfläche muss eine geglättete, unregelmäßige Kontur statt vier Rechteckecken besitzen.');
const west=Math.min(...ring.map(point=>point.lon)),east=Math.max(...ring.map(point=>point.lon)),south=Math.min(...ring.map(point=>point.lat)),north=Math.max(...ring.map(point=>point.lat));
assert.ok(west<8&&east>8.75&&south<49.2&&north>50,'Die Kontur muss alle verbundenen Stützpunkte räumlich umschließen.');

const calls={fill:0,stroke:0,clip:0,move:0,line:0},context={beginPath(){},moveTo(){calls.move++},lineTo(){calls.line++},closePath(){},fill(){calls.fill++},stroke(){calls.stroke++},clip(){calls.clip++},save(){},restore(){},setTransform(){},clearRect(){},lineJoin:'',lineCap:'',fillStyle:'',strokeStyle:'',lineWidth:0},canvas={width:0,height:0,style:{},getContext:()=>context},map={getCanvas:()=>({clientWidth:390,clientHeight:455}),project:([lon,lat])=>({x:lon*18,y:lat*18})};
canvasModule.drawExtremeOutlookContours(map,canvas,contours);
assert.equal(calls.fill,2);assert.equal(calls.clip,1,'Nur das Gebiet unter 60 % wird schraffiert.');assert.ok(calls.stroke>4&&calls.move>4&&calls.line>80,'Füllung, Schraffur und doppelte geglättete Kontur müssen tatsächlich gezeichnet werden.');

assert.ok(changelog.startsWith('## 0.9.66.3'));
assert.ok(implementation.includes('keine amtlichen Warnpolygone'));
assert.ok(implementation.includes('meteorologischen Schwellen und Diagnosen bleiben unverändert'));

console.log('MID 0.9.66.3: geglättete, unregelmäßige und georeferenzierte DACH-Gefahrenkonturen geprüft.');
