import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [panel,briefingSource,pkgText,baselineText]=await Promise.all(['src/CrossSectionPanel.tsx','src/flightRouteBriefing.ts','package.json','MID_BASELINE.json'].map(read)),ts=createRequire(import.meta.url)('typescript'),compiled=ts.transpileModule(briefingSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},reportDiagnostics:true,fileName:'flightRouteBriefing.ts'}),errors=(compiled.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);assert.equal(errors.length,0,errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));const briefing=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-flight-text-vertical-briefing-09620.mjs';assert.ok(baseline.requiredRegressionTests.includes(test)&&baseline.regressionTests.includes(test));
const levels=[
 {pressure:900,height:1000,temperature:1,humidity:94,cloud:85,windSpeed:25,windDirection:180},
 {pressure:700,height:3000,temperature:-10,humidity:96,cloud:96,windSpeed:70,windDirection:260},
 {pressure:500,height:6000,temperature:-28,humidity:75,cloud:65,windSpeed:80,windDirection:270}
];
const point=(fraction,distanceKm,validTime,active=true)=>({fraction,distanceKm,latitude:50+fraction,longitude:8+fraction,elevation:120,validTime,precipitation:active?1:0,weatherCode:active?95:0,cape:active?900:20,levels:active?levels:levels.map(row=>({...row,humidity:45,cloud:5,windSpeed:20,windDirection:180}))});
const data={route:'EDDF_EDDK_EDDL',waypoints:[{id:'EDDF',name:'Frankfurt',latitude:50,longitude:8,elevation:100,fraction:0,distanceKm:0},{id:'EDDK',name:'Köln',latitude:50.8,longitude:7.1,elevation:90,fraction:.5,distanceKm:100},{id:'EDDL',name:'Düsseldorf',latitude:51.3,longitude:6.8,elevation:40,fraction:1,distanceKm:200}],points:[point(0,0,'2026-08-20T10:00:00Z'),point(.5,100,'2026-08-20T11:00:00Z'),point(1,200,'2026-08-20T12:00:00Z',false)],totalDistanceKm:200,startTime:'2026-08-20T10:00:00Z',endTime:'2026-08-20T12:00:00Z',flightLevel:100,corridorKm:40,regions:[{fraction:.25,distanceKm:50,latitude:50.4,longitude:7.5,label:'Rhein-Main'},{fraction:.75,distanceKm:150,latitude:51,longitude:7,label:'Rheinland'}],model:'best_match',modelLabel:'Best Match',generatedAt:'2026-08-20T09:00:00Z',source:'Test'};
const vertical=briefing.verticalHazardRuns(data),kinds=new Set(vertical.map(row=>row.kind));
for(const kind of ['cloud','icing','turbulence','convection','wind'])assert.ok(kinds.has(kind),`Vertikale Betrachtung fehlt: ${kind}`);
const icing=vertical.find(row=>row.kind==='icing');assert.ok(icing&&icing.baseFl<icing.topFl,'Vereisung muss als vertikale Schicht ausgewiesen werden.');
const timing=briefing.hazardTransitionWindow(data,icing);assert.equal(timing.fromRouteStart,true);assert.equal(timing.toRouteEnd,false);assert.equal(timing.exitFrom,'2026-08-20T11:00:00.000Z');assert.equal(timing.exitTo,'2026-08-20T11:30:00.000Z');
assert.match(briefing.runWhere(data,icing),/Raum|Rhein|km|Korridor/);const verticalDetail=briefing.verticalHazardDetail(icing,40);assert.match(verticalDetail,/(?:SFC|\d+ ft AGL|FL\d{3})–(?:\d+ ft AGL|FL\d{3}).*40-km-Korridor/);assert.match(verticalDetail,/4000 ft AGL–FL100/,'Unter FL050 muss das Vertikalbriefing in ft AGL statt als FL040 beschriften.');
for(const token of ['2–8 Orte','Analysekorridor','Start ·','Landung ·','Eintritt','Austritt','VERTIKALPROFIL · TEXTBRIEFING','größere Städte/Gebiete','frühere Cross-Section-Grafik bleibt'])assert.ok(panel.includes(token),`Textbriefing-Vertrag fehlt: ${token}`);
assert.ok(!panel.includes('<svg'),'Die alte grafische Cross Section darf nicht zurückkehren.');
console.log(`MID v${pkg.version}: mehrpunktfähiges textuelles Korridor-/Vertikalbriefing mit räumlicher Unschärfe und Eintritts-/Austrittsfenstern geprüft.`);
