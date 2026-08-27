import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url),ts=require('typescript');
const source=fs.readFileSync(path.join(root,'src','extremeOutlookAreaGeoJson.ts'),'utf8');
const overlay=fs.readFileSync(path.join(root,'src','ExtremeOutlookAreaOverlay.tsx'),'utf8');
const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'extremeOutlookAreaGeoJson.ts',reportDiagnostics:true});
const errors=(output.diagnostics??[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
assert.equal(errors.length,0,errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));

const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-extreme-outlook-geodata-'));
try{
 const modulePath=path.join(tempDir,'extremeOutlookAreaGeoJson.mjs');
 fs.writeFileSync(modulePath,output.outputText);
 const geojsonModule=await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
 const contours=[{
  intensity:2,
  color:'#f59e0b',
  opacity:.55,
  probability:60,
  rings:[
   [{lon:5,lat:0},{lon:0,lat:0},{lon:0,lat:5},{lon:5,lat:5}],
   [{lon:1,lat:1},{lon:4,lat:1},{lon:4,lat:4},{lon:1,lat:4}],
   [{lon:3.4,lat:1.6},{lon:2.6,lat:1.6},{lon:2.6,lat:2.4},{lon:3.4,lat:2.4}]
  ]
 }];
 const geojson=geojsonModule.buildExtremeOutlookContourGeoJson(contours);
 assert.equal(geojson.type,'FeatureCollection');
 assert.equal(geojson.features.length,1);
 const geometry=geojson.features[0].geometry;
 assert.equal(geometry.type,'MultiPolygon');
 assert.equal(geometry.coordinates.length,2,'Eine Insel innerhalb einer Schraffur-Lücke muss als zweite Polygonfläche erhalten bleiben.');
 const holePolygon=geometry.coordinates.find(polygon=>polygon.length===2);
 const islandPolygon=geometry.coordinates.find(polygon=>polygon.length===1);
 assert.ok(holePolygon,'Äußerer Ring und 60-%-Aussparung müssen als Polygon mit Loch kodiert werden.');
 assert.ok(islandPolygon,'Eine Insel innerhalb eines Lochs darf nicht als weitere Lochkontur verloren gehen.');
 const signedArea=ring=>ring.slice(0,-1).reduce((sum,point,index)=>{const next=ring[index+1];return sum+point[0]*next[1]-next[0]*point[1]},0)/2;
 assert.ok(signedArea(holePolygon[0])>0,'Außenringe müssen stabil gegenzeigersinnig ausgegeben werden.');
 assert.ok(signedArea(holePolygon[1])<0,'Lochringe müssen stabil im Gegensinn ausgegeben werden.');
 assert.ok(signedArea(islandPolygon[0])>0,'Inselpolygone im Loch müssen erneut als Außenring ausgegeben werden.');
}finally{fs.rmSync(tempDir,{recursive:true,force:true})}

const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const baseline=JSON.parse(fs.readFileSync(path.join(root,'MID_BASELINE.json'),'utf8'));
const changelog=fs.readFileSync(path.join(root,'CHANGELOG.md'),'utf8');
const implementation=fs.readFileSync(path.join(root,'MID_IMPLEMENTATION_0.9.66.14.md'),'utf8');
const workerCore=fs.readFileSync(path.join(root,'worker-src','00-core-observations.js'),'utf8');
const test='scripts/test-extreme-outlook-geodata-096614.mjs';
const versionAtLeast=(value,minimum)=>{const a=String(value).split('.').map(Number),b=String(minimum).split('.').map(Number);for(let index=0;index<Math.max(a.length,b.length);index++){const x=a[index]??0,y=b[index]??0;if(x!==y)return x>y}return true};
assert.ok(versionAtLeast(pkg.version,'0.9.66.14'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:extreme-outlook-geodata'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes('MID_IMPLEMENTATION_0.9.66.14.md'));
assert.ok(workerCore.includes(`const WORKER_VERSION='${pkg.version}';`),'Professional- und Worker-Versionen sind nicht synchronisiert.');
for(const token of ['pointInRing','normalizeOrientation','buildExtremeOutlookContourGeoJson'])assert.ok(source.includes(token),`GeoJSON-Verschachtelung fehlt: ${token}`);
assert.ok(overlay.includes('CanvasOverlay')&&overlay.includes('drawExtremeOutlookContours'),'Sichtbare Flächen müssen den MapLibre-6-robusten Canvas-Konturpfad nutzen.');
assert.ok(changelog.includes('## 0.9.66.14'));
for(const token of ['GeoJSON-Multipolygonen','Lochringe','Inseln innerhalb geschraffter Aussparungen','Worker fachlich unverändert'])assert.ok(implementation.includes(token),`Umsetzungsnachweis unvollständig: ${token}`);

console.log(`MID ${pkg.version}: GeoJSON-Multipolygone, 60-%-Schraffur-Lochringe und verschachtelte Extremflächen stabilisiert.`);
