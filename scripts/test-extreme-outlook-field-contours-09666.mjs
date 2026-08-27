import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [canvasSource,overlay,modelledAreas,client,panel,workerSource,direct,travel,pkgRaw,baselineRaw,changelog,implementation,workerCore]=await Promise.all([
 read('src/extremeOutlookAreaCanvas.ts'),read('src/ExtremeOutlookAreaOverlay.tsx'),read('src/extremeOutlookModelledAreas.ts'),read('src/extremeWeatherOutlook.ts'),read('src/ExtremeWeatherOutlookPanel.tsx'),read('worker-src/25-dach-extreme-outlook.js'),read('src/extremeWeatherOutlookDirect.generated.js'),read('src/travelPlanner.ts'),read('package.json'),read('MID_BASELINE.json'),read('CHANGELOG.md'),read('MID_IMPLEMENTATION_0.9.66.6.md'),read('worker-src/00-core-observations.js')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-extreme-outlook-field-contours-09666.mjs';

const versionAtLeast=(value,minimum)=>{const a=String(value).split('.').map(Number),b=String(minimum).split('.').map(Number);for(let index=0;index<Math.max(a.length,b.length);index++){const x=a[index]??0,y=b[index]??0;if(x!==y)return x>y}return true};
assert.ok(versionAtLeast(pkg.version,'0.9.66.6'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:extreme-outlook-field-contours'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Feldkonturen-Regression ist nicht verbindlich registriert.');
for(const file of[test,'MID_IMPLEMENTATION_0.9.66.6.md'])assert.ok(baseline.requiredFiles?.includes(file),`Baseline-Datei fehlt: ${file}`);
assert.ok(workerCore.includes(`const WORKER_VERSION='${pkg.version}';`),'Professional- und Worker-Version sind nicht gekoppelt.');

for(const token of ['probabilityFields?:','extremeProbabilityLevelsForCell',"cacheKey:'dach-extreme-outlook:v4'",'monotone[index]=Math.min'])assert.ok(client.includes(token),`Client-Feldvertrag fehlt: ${token}`);
for(const token of ['probabilityFields={}','assessment.probabilities','assessment.signal','probabilities[index]=Math.min','Math.round(clamp'])assert.ok(workerSource.includes(token),`Worker-Feldvertrag fehlt: ${token}`);
assert.ok(direct.includes(workerSource.trim()),'Browser-Direktweg muss dieselbe kanonische Feldberechnung wie der Worker verwenden.');
for(const token of ['data.cells.map','probabilityLevels:extremeProbabilityLevelsForCell','minimumProbability','extremeMinimumProbability','colors:EXTREME_INTENSITY_COLORS'])assert.ok(modelledAreas.includes(token),`Flächen-Feldvertrag fehlt: ${token}`);
assert.ok(!modelledAreas.includes('paintAreas=data.cells.filter'),'Das Overlay darf Unterschwellen-Stützfelder nicht vor der Konturberechnung verwerfen.');
for(const token of ['FIELD_SUBDIVISIONS=10','COVERAGE_THRESHOLD=.28','bilinear','fieldComponents','probabilityLevels','level===4?extremeMinimumProbability:minimumProbability'])assert.ok(canvasSource.includes(token),`Isoplethenvertrag fehlt: ${token}`);
assert.ok(!canvasSource.includes('KERNEL_RADIUS_STEPS')&&!canvasSource.includes('supportAt(')&&!canvasSource.includes('connectedComponents('),'Gleichförmige Stützkern-/Symbolgeometrie darf nicht mehr aktiv sein.');
assert.ok(panel.includes('Flächen aus dem vollständigen Wahrscheinlichkeitsfeld'));
assert.ok(panel.includes('räumliche Gradienten bestimmen Lage, Ausdehnung und Rand'));
assert.ok(panel.includes('keine Stützpunktsymbole und keine amtlichen Warnpolygone'));

const compiled=ts.transpileModule(canvasSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,canvasModule=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const probabilities=[
 [8,12,18,15,8,4,2,1,0],
 [15,31,43,38,29,10,5,3,2],
 [22,46,58,53,41,22,8,5,4],
 [18,42,67,61,47,31,15,10,8],
 [8,24,44,49,40,25,32,52,28],
 [3,12,27,35,28,18,38,47,19],
 [1,4,9,14,11,8,17,22,9]
];
const grid={rows:7,cols:9,latStep:.8,lonStep:.75,bounds:{north:54,south:49.2,west:6,east:12}},cellsFor=values=>values.flatMap((row,rowIndex)=>row.map((probability,colIndex)=>({row:rowIndex,col:colIndex,lat:54-rowIndex*.8,lon:6+colIndex*.75,probabilityLevels:[probability,Math.max(0,probability-18),Math.max(0,probability-40),0]}))),options={minimumProbability:40,extremeMinimumProbability:5},contours=canvasModule.buildExtremeOutlookContours(cellsFor(probabilities),grid,options),i1=contours.filter(contour=>contour.intensity===1),i2=contours.filter(contour=>contour.intensity===2);

assert.equal(i1.length,2,'Das Feld muss zwei getrennte I1-Gefahrengebiete statt einzelner Stützpunktsymbole ergeben.');
assert.equal(i2.length,1,'Der stärkere I2-Kern muss als eigene, geschichtete Isoplethe erhalten bleiben.');
const bounds=ring=>({west:Math.min(...ring.map(point=>point.lon)),east:Math.max(...ring.map(point=>point.lon)),south:Math.min(...ring.map(point=>point.lat)),north:Math.max(...ring.map(point=>point.lat))}),i1Bounds=i1.map(contour=>bounds(contour.rings[0])).sort((a,b)=>a.west-b.west),left=i1Bounds[0],right=i1Bounds[1];
assert.ok(i1.every(contour=>contour.rings.length===1&&contour.rings[0].length>150),'Gefahrengebiete benötigen dichte, geglättete und geschlossene Konturen.');
assert.ok(left.east-left.west>2.4&&left.north-left.south>2.5,'Der westliche Feldgradient muss zu einer großräumigen unregelmäßigen Fläche verschmelzen.');
assert.ok(right.east-right.west>.8&&right.north-right.south>1.1,'Das östliche Feldsignal muss eine eigenständige räumliche Kontur bilden.');
assert.ok(Math.abs((left.east-left.west)/(left.north-left.south)-(right.east-right.west)/(right.north-right.south))>.08,'Getrennte Gebiete dürfen keine skalierten Kopien derselben Sechseckform sein.');

const thresholdOnly=probabilities.map(row=>row.map(value=>value<40?0:value)),thresholdContours=canvasModule.buildExtremeOutlookContours(cellsFor(thresholdOnly),grid,options).filter(contour=>contour.intensity===1),thresholdRight=thresholdContours.map(contour=>bounds(contour.rings[0])).sort((a,b)=>a.west-b.west)[1];
assert.ok((right.east-right.west)-(thresholdRight.east-thresholdRight.west)>.5,'Unterschwellenwerte müssen den tatsächlichen Konturrand messbar formen.');

const calls={fill:0,stroke:0,clip:0,line:0},context={beginPath(){},moveTo(){},lineTo(){calls.line++},closePath(){},fill(){calls.fill++},stroke(){calls.stroke++},clip(){calls.clip++},save(){},restore(){},setTransform(){},clearRect(){},lineJoin:'',lineCap:'',fillStyle:'',strokeStyle:'',lineWidth:0},canvas={width:0,height:0,style:{},getContext:()=>context},map={getCanvas:()=>({clientWidth:390,clientHeight:455}),project:([lon,lat])=>({x:lon*18,y:lat*18})};
canvasModule.drawExtremeOutlookContours(map,canvas,contours);
assert.equal(calls.fill,contours.length);assert.ok(calls.clip>=2&&calls.stroke>contours.length*2&&calls.line>700,'Gefahrenfelder müssen gefüllt, geschraffiert und mit vollständigen Konturen gezeichnet werden.');

assert.ok(changelog.includes('## 0.9.66.6'));
for(const token of ['vollständigen, monotonen Überschreitungswahrscheinlichkeiten','bilinear interpoliert','amtlichen Warnpolygonen','älterer Worker bleibt technisch kompatibel'])assert.ok(implementation.includes(token),`Umsetzungsnachweis unvollständig: ${token}`);
for(const token of ["mid:travel-water-climate:noaa-oisst-1991-2020:v5:",'COASTAL_WATER_MAX_DISTANCE_KM=80',"fetchWorkerJson<TravelWaterWorkerPayload>('travel-water-climate'"])assert.ok(travel.includes(token),`Weiterentwickelter Reise-SST-Vertrag ging verloren: ${token}`);
for(const file of ['scripts/test-travel-water-climatology-resilience-09665.mjs','MID_IMPLEMENTATION_0.9.66.5.md'])assert.ok(baseline.requiredFiles?.includes(file),`Angehängte 0.9.66.5-Absicherung ging verloren: ${file}`);

console.log(`MID ${pkg.version}: vollständige I1–I4-Wahrscheinlichkeitsfelder, gradientengeformte DACH-Gefahrengebiete, Entfernung identischer Sechseck-Stützkerne und aktueller NOAA-Reise-SST-Vertrag geprüft.`);
