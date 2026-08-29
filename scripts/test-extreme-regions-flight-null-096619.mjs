import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {versionAtLeast} from './version-regression-helper.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-096619-'));
try{
 const areaModule=path.join(tempDir,'areas.mjs');
 await build({entryPoints:[path.join(root,'src','extremeOutlookModelledAreas.ts')],outfile:areaModule,bundle:true,platform:'node',format:'esm',target:'es2022',logLevel:'silent'});
 const {buildExtremeOutlookContourSet,strongestModelledRegionAreas}=await import(`${pathToFileURL(areaModule).href}?v=${Date.now()}`);
 const probabilities=[[8,12,18,15,8,4,2,1,0],[15,31,43,38,29,10,5,3,2],[22,46,58,53,41,22,8,5,4],[18,42,67,61,47,31,15,10,8],[8,24,44,49,40,25,32,52,28],[3,12,27,35,28,18,38,47,19],[1,4,9,14,11,8,17,22,9]];
 const cells=probabilities.flatMap((values,row)=>values.map((probability,col)=>({id:`${row}-${col}`,row,col,lat:54-row*.8,lon:6+col*.75,region:col<5?'Westregion':'Ostregion',elevationM:500,periods:{'0-6':{hazards:{thunderstorm:{intensity:1,intensityLabel:'Wettergefahr',probability:Math.max(10,probability),probabilityBand:'P1',drivers:['Test'],subhazards:[],metrics:{capeJkg:500,cinJkg:20,shearMs:12}}},probabilityFields:{thunderstorm:[probability,0,0,0]},dominant:'thunderstorm'}}})));
 const data={scope:'Mitteleuropa',provider:'Test',model:'Test',checkedAt:new Date(0).toISOString(),officialWarning:false,periods:[{id:'0-6',label:'0–6 h',startHour:0,endHour:6,start:new Date(0).toISOString(),end:new Date(21600000).toISOString()}],cells,grid:{rows:7,cols:9,latStep:.8,lonStep:.75,pointCount:cells.length,bounds:{north:54,south:49.2,west:6,east:12}},thresholds:{probability:{bands:[],overviewMin:40,hazardMin:40,extremeExceptionMin:5},intensity:{levels:[]},rain:{unit:'mm',windows:[],levels:[]},wind:{unit:'km/h',terrainBands:[]},snow:{unit:'cm',windows:[],terrainMultipliers:{},levels:[]},ice:{unit:'mm',levels:[]},thunderstorm:{capeJkg:[],lapseRateKkm:[],shearMs:[],hailCm:[],note:''}},quality:{ensembleMembers:20,probabilityMethod:'Test',modelResolution:'Test',displayGrid:'Test',diagnosticCoveragePct:100,limitations:[]}};
 const areas=buildExtremeOutlookContourSet(data,'0-6','thunderstorm').areas;
 assert.deepEqual(new Set(areas.map(area=>area.region)),new Set(['Westregion','Ostregion']),'Der Regionsname muss aus der räumlichen Lage jeder Kontur stammen.');
 const duplicate={...areas[0],id:`${areas[0].id}:duplicate`,probability:Math.max(0,areas[0].probability-5)};
 const grouped=strongestModelledRegionAreas([...areas,duplicate],8);
 assert.equal(grouped.length,areas.length,'Gleiche Region, Gefahr und Intensität dürfen in der Regionsliste nicht mehrfach erscheinen.');
 assert.equal(grouped.find(area=>area.region===areas[0].region)?.probability,areas[0].probability,'Beim Zusammenführen bleibt die höchste Wahrscheinlichkeit erhalten.');

 const aviationModule=path.join(tempDir,'aviation.mjs');
 await build({entryPoints:[path.join(root,'src','eventAviation.ts')],outfile:aviationModule,bundle:true,platform:'node',format:'esm',target:'es2022',logLevel:'silent'});
 const {coherentEventFlightCeiling,normalizeEventFlightHazardSummary}=await import(`${pathToFileURL(aviationModule).href}?v=${Date.now()}`);
 assert.equal(coherentEventFlightCeiling(null,10000),null,'Ein fehlender Ceiling-Wert darf nicht zu 0 ft werden.');
 assert.equal(coherentEventFlightCeiling(50,10000),null,'Unter 100 ft bei Sicht >= 10 km ist als inkohärent zu verwerfen.');
 assert.equal(coherentEventFlightCeiling(50,900),50,'Ein sehr niedriger Ceiling-Wert bleibt bei passend schlechter Sicht erhalten.');
 const normalized=normalizeEventFlightHazardSummary({available:true,overall:'caution',items:[{id:'ceiling',label:'Wolkenuntergrenze',level:'caution',detail:'min. ca. 0 ft AGL',value:0,unit:'ft'}],freezingLevelMin:null,ceilingMinFt:0,visibilityMinM:10000,gustMaxKt:null,source:'Test'});
 assert.equal(normalized.ceilingMinFt,null);
 assert.equal(normalized.items[0].level,'none');
 assert.equal(normalized.overall,'none');
}finally{fs.rmSync(tempDir,{recursive:true,force:true})}

const eventPanel=fs.readFileSync(path.join(root,'src','EventPlannerPanel.tsx'),'utf8');
const extremePanel=fs.readFileSync(path.join(root,'src','ExtremeWeatherOutlookPanel.tsx'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const baseline=JSON.parse(fs.readFileSync(path.join(root,'MID_BASELINE.json'),'utf8'));
const test='scripts/test-extreme-regions-flight-null-096619.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.66.19'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.match(eventPanel,/value===null\|\|value===undefined/,'Nullwerte müssen vor Number(value) abgefangen werden.');
for(const token of ['renderedFlightHazards?.ceilingMinFt','normalizeEventFlightHazardSummary'])assert.ok(eventPanel.includes(token),`Flugwetter-Darstellungsschutz fehlt: ${token}`);
assert.ok(extremePanel.includes('strongestModelledRegionAreas'),'Die Regionsliste muss den konturbezogenen Gruppierungsvertrag verwenden.');
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
console.log('MID 0.9.66.19: räumlich korrekte Regionsnamen, deduplizierte Regionsliste und nullsichere Flugwetter-Ceilings geprüft.');
