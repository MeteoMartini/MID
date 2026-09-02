import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {versionAtLeast} from './version-regression-helper.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-modelled-areas-'));
try{
 const modulePath=path.join(tempDir,'modelled-areas.mjs');
 await build({entryPoints:[path.join(root,'src','extremeOutlookModelledAreas.ts')],outfile:modulePath,bundle:true,platform:'node',format:'esm',target:'es2022',logLevel:'silent'});
 const {buildExtremeOutlookContourSet}=await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
 const probabilities=[[8,12,18,15,8,4,2,1,0],[15,31,43,38,29,10,5,3,2],[22,46,58,53,41,22,8,5,4],[18,42,67,61,47,31,15,10,8],[8,24,44,49,40,25,32,52,28],[3,12,27,35,28,18,38,47,19],[1,4,9,14,11,8,17,22,9]];
 const cells=probabilities.flatMap((values,row)=>values.map((probability,col)=>({id:`${row}-${col}`,row,col,lat:54-row*.8,lon:6+col*.75,region:'Vorarlberg/Tirol',elevationM:500,periods:{'0-6':{hazards:{thunderstorm:{intensity:1,intensityLabel:'Wettergefahr',probability:Math.max(10,probability),probabilityBand:'P1',drivers:['Test'],subhazards:[],metrics:{capeJkg:500,cinJkg:20,shearMs:12}}},probabilityFields:{thunderstorm:[probability,0,0,0]},dominant:'thunderstorm'}}})));
 const data={scope:'Mitteleuropa',provider:'Test',model:'Test',checkedAt:new Date(0).toISOString(),officialWarning:false,periods:[{id:'0-6',label:'0–6 h',startHour:0,endHour:6,start:new Date(0).toISOString(),end:new Date(21600000).toISOString()}],cells,grid:{rows:7,cols:9,latStep:.8,lonStep:.75,pointCount:cells.length,bounds:{north:54,south:49.2,west:6,east:12}},thresholds:{probability:{bands:[],overviewMin:40,hazardMin:40,extremeExceptionMin:5},intensity:{levels:[]},rain:{unit:'mm',windows:[],levels:[]},wind:{unit:'km/h',terrainBands:[]},snow:{unit:'cm',windows:[],terrainMultipliers:{},levels:[]},ice:{unit:'mm',levels:[]},thunderstorm:{capeJkg:[],lapseRateKkm:[],shearMs:[],hailCm:[],note:''}},quality:{ensembleMembers:20,probabilityMethod:'Test',modelResolution:'Test',displayGrid:'Test',diagnosticCoveragePct:100,limitations:[]}};
 const areas=buildExtremeOutlookContourSet(data,'0-6','thunderstorm').areas;
 assert.equal(areas.length,2,'Zwei getrennte Konturen dürfen trotz identischer alter Regionsbezeichnung nicht zu einem Listeneintrag verschmelzen.');
 assert.equal(new Set(areas.map(area=>area.id)).size,2,'Jede modellierte Gefahrenfläche benötigt eine stabile eigene ID.');
 assert.ok(areas.every(area=>area.region==='Vorarlberg/Tirol'&&area.signal.probability===area.probability),'Popup-/Listenregion und Wahrscheinlichkeit müssen direkt an dieselbe Kontur gekoppelt sein.');
}finally{fs.rmSync(tempDir,{recursive:true,force:true})}

const panel=fs.readFileSync(path.join(root,'src','ExtremeWeatherOutlookPanel.tsx'),'utf8');
const overlay=fs.readFileSync(path.join(root,'src','ExtremeOutlookAreaOverlay.tsx'),'utf8');
const worker=fs.readFileSync(path.join(root,'worker-src','25-dach-extreme-outlook.js'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const baseline=JSON.parse(fs.readFileSync(path.join(root,'MID_BASELINE.json'),'utf8'));
const test='scripts/test-extreme-outlook-modelled-areas-096618.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.66.19'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:extreme-outlook-modelled-areas'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
for(const token of ['strongestModelledRegionAreas(buildExtremeOutlookContourSet(data,selectedPeriod.id,hazard).areas,8)','row.id','setSelectedAreaId(row.id)','row.region'])assert.ok(panel.includes(token),`Flächengebundene Regionsliste fehlt: ${token}`);
for(const token of ['areas.map(area=>','escapeHtml(area.region)','hazardLabel(area.signal.hazard)'])assert.ok(overlay.includes(token),`Flächengebundenes Popup fehlt: ${token}`);
for(const region of ['Wallis','Zentralschweiz','Tessin','Graubünden','Vorarlberg','Tirol'])assert.ok(worker.includes(`['${region}'`),`Alpenregion fehlt: ${region}`);
assert.ok(!panel.includes('strongestExtremeRegions('),'Die Ansicht darf räumlich getrennte Flächen nicht mehr nach Regionsnamen deduplizieren.');

console.log('MID 0.9.66.18: getrennte Gefahrenflächen, eindeutige Listeneinträge und passende Regionsnamen in Karten-Popups geprüft.');
