import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [overlay,geojsonSource,canvasSource,panel,styles,pkgRaw,baselineRaw,changelog,implementation,workerSource]=await Promise.all([
 read('src/ExtremeOutlookAreaOverlay.tsx'),read('src/extremeOutlookAreaGeoJson.ts'),read('src/extremeOutlookAreaCanvas.ts'),read('src/ExtremeWeatherOutlookPanel.tsx'),read('src/styles.css'),read('package.json'),read('MID_BASELINE.json'),read('CHANGELOG.md'),read('MID_IMPLEMENTATION_0.9.66.2.md'),read('worker-src/00-core-observations.js')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-extreme-outlook-area-rendering-09662.mjs';

assert.ok(pkg.version.startsWith('0.9.66.')&&Number(pkg.version.split('.')[3])>=2,'Flächenfix benötigt mindestens MID 0.9.66.2.');
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:extreme-outlook-area-rendering'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Flächenrendering-Regression ist nicht verbindlich registriert.');
assert.ok(baseline.requiredFiles?.includes(test)&&baseline.requiredFiles?.includes('src/ExtremeOutlookAreaOverlay.tsx')&&baseline.requiredFiles?.includes('src/extremeOutlookAreaCanvas.ts')&&baseline.requiredFiles?.includes('MID_IMPLEMENTATION_0.9.66.2.md'),'Flächenrendering-Dateien fehlen im Baseline-Vertrag.');
assert.ok(workerSource.includes(`const WORKER_VERSION='${pkg.version}';`),'Gekoppelte Worker-Version ist nicht synchron.');

for(const token of ['buildExtremeOutlookContours','extremeProbabilityLevelsForCell','minimumProbability','EXTREME_INTENSITY_COLORS','buildExtremeOutlookContourGeoJson',"type:'fill'","type:'line'",'fill-pattern'])assert.ok(overlay.includes(token),`Flächen-Layervertrag fehlt: ${token}`);
for(const token of ["type:'MultiPolygon'",'FeatureCollection<MultiPolygon','contourPolygons','normalizeOrientation'])assert.ok(geojsonSource.includes(token),`GeoJSON-Flächenvertrag fehlt: ${token}`);
assert.ok(overlay.includes('CanvasOverlay')||panel.includes('only_labels/{z}/{x}/{y}.png'),'Die Flächen müssen georeferenziert gerendert werden; bei nativen Polygonen muss die Beschriftungsebene darüberliegen.');
for(const token of ['map.project([point.lon,point.lat])','buildExtremeOutlookContours','context.fill','context.stroke','devicePixelRatio','Math.min(2'])assert.ok(canvasSource.includes(token),`Canvas-Flächenvertrag fehlt: ${token}`);
assert.ok(panel.includes("import ExtremeOutlookAreaOverlay from './ExtremeOutlookAreaOverlay'"));
assert.ok(panel.includes('<ExtremeOutlookAreaOverlay data={data} periodId={selectedPeriod.id} hazard={hazard}/>'));
assert.ok(panel.includes("markers=useMemo(()=>regions.slice(0,6),[regions])"),'Marker müssen auf regionale Maxima begrenzt sein.');
assert.ok(!panel.includes('slice(0,28)'),'Zellweise Markerüberdeckung ist wieder vorhanden.');
assert.ok(panel.includes("'fill-opacity':.001"),'Unsichtbare GeoJSON-Interaktionsfläche fehlt.');
assert.ok(panel.includes('unter 60 %')&&!panel.includes('Farbe = erwartete Auswirkung')&&!panel.includes('Prozent/Deckkraft = Eintrittswahrscheinlichkeit'),'Die aktuelle kompakte Kartenlegende darf den entfernten Farbe-/Deckkrafttext nicht wieder einführen.');
assert.ok(styles.includes('.mid-maplibre-canvas.extreme-outlook-areas'));

const compiled=ts.transpileModule(canvasSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,canvasModule=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const calls={move:0,line:0,fill:0,stroke:0,clip:0,transform:[]},context={beginPath(){},moveTo(){calls.move++},lineTo(){calls.line++},closePath(){},fill(){calls.fill++},stroke(){calls.stroke++},clip(){calls.clip++},save(){},restore(){},setTransform(...values){calls.transform=values},clearRect(){},lineJoin:'',lineCap:'',fillStyle:'',strokeStyle:'',lineWidth:0},canvas={width:0,height:0,style:{},getContext:()=>context},map={getCanvas:()=>({clientWidth:320,clientHeight:240}),project:([lon,lat])=>({x:lon*10,y:lat*10})};
Object.defineProperty(globalThis,'devicePixelRatio',{value:3,configurable:true});
canvasModule.drawExtremeOutlookAreas(map,canvas,[{lat:50,lon:8,intensity:1,probability:50,color:'#269b83',opacity:.62},{lat:48,lon:12,intensity:2,probability:70,color:'#e7b92f',opacity:.7}],{latStep:.8,lonStep:.75});
assert.equal(canvas.width,640,'Canvas-Pixeldichte muss auf 2× begrenzt sein.');assert.equal(canvas.height,480);assert.deepEqual(calls.transform,[2,0,0,2,0,0]);assert.equal(calls.fill,2,'Jedes Gefahrengebiet benötigt eine sichtbare Füllung.');assert.ok(calls.stroke>=4,'Gefahrengebiete benötigen Schraffur beziehungsweise Doppelkontur.');assert.equal(calls.clip,1,'Wahrscheinlichkeiten unter 60 % müssen schraffiert werden.');assert.ok(calls.move>4&&calls.line>20,'Geglättete Flächen dürfen nicht auf vier Rechteckkanten zurückfallen.');
assert.ok(changelog.includes('## 0.9.66.2'));
assert.ok(implementation.includes('verdeckten dadurch die darunterliegende Füllung weitgehend'));
assert.ok(implementation.includes('meteorologische Fachlogik ändert sich nicht'));

console.log('MID ab 0.9.66.2: sichtbare, georeferenzierte DACH-Gefahrenflächen und reduzierte regionale Marker geprüft.');
