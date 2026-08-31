import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url),ts=require('typescript-strada');
const [thunder,app,styles,weather,worker,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/thunderstorm.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,tokens)=>{for(const token of tokens)if(!text.includes(token))failures.push(`${label}: ${token}`)};

need('Worker-Ortskorridor',worker,[
 "const OVERPASS_ENDPOINTS=",
 'async function overpassStormPlaces(',
 'function closestStormTrackProjection(',
 "return'now'",
 "return'likely'",
 "return'possible'",
 "return'corridor'",
 'async function enrichStormAffectedPlaces(',
 'affectedPlaces:selected',
 'currentAffectedPlaceCount:nowPlaces.length',
 'futureAffectedPlaceCount:futurePlaces.length',
 'routeSummary=compactStormRouteSummary(selected)',
 'OpenStreetMap/Overpass · geometrischer KONRAD3D-Zugbahnkorridor',
 'BigDataCloud-Fallback · gesampelter KONRAD3D-Zugbahnkorridor'
]);
need('Datenvertrag',weather,[
 "export type ThunderstormAffectedPlaceStatus='now'|'likely'|'possible'|'corridor'",
 'affectedPlaces?:ThunderstormAffectedPlace[]',
 'arrivalWindowStartAt?:string',
 'arrivalWindowEndAt?:string',
 'routeSummary?:string',
 'placeSource?:string'
]);
need('Gewitterauswertung',thunder,[
 'function thunderInfoPlaces(',
 "if(place.status==='now')return'Jetzt'",
 "return`voraussichtlich auf der Zugbahn",
 "return`möglicher Treffer",
 "return`nur im Unsicherheitskorridor",
 "label:'Betroffene Orte'",
 'places,routeSummary,placeSource:cell.placeSource'
]);
need('Oberfläche',app,[
 'function ThunderPlaceList(',
 'Betroffene Orte &amp; Zugbahn',
 'hidden>0&&<em>+{hidden} weitere</em>',
 'hidden>0&&<span className="thunder-place-pill more">+{hidden} weitere</span>',
 'Weitere Orte anzeigen (',
 'Jetzt: radarbestimmter Zellbereich',
 'voraussichtlich auf der Zugbahn',
 'nur Unsicherheitskorridor',
 '<ThunderPlaceList places={thunderInfo.places} compact',
 '<ThunderPlaceList places={thunderInfo.places} total='
]);
need('Darstellung',styles,[
 '.thunder-place-section{',
 '.thunder-place-row.now>b{',
 '.thunder-place-row.likely>b{',
 '.thunder-place-row.possible>b{',
 '.thunder-place-row.corridor>b{',
 '.thunder-place-legend{'
]);
need('Package-Test',pkg,['test:thunder-route-places']);
need('Baseline-Test',baseline,['scripts/test-thunder-affected-places-route-09151.mjs']);

const compileModule=(source,fileName)=>{
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true,fileName});
 const diagnostics=(output.diagnostics??[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
 if(diagnostics.length)throw new Error(diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,'\n')).join(' | '));
 const module={exports:{}};new Function('module','exports','require',output.outputText)(module,module.exports,()=>({}));return module.exports;
};
try{
 const module=compileModule(thunder,'thunderstorm.ts'),cell={
  id:'K3D-route',latitude:50.8,longitude:7.0,currentDistanceKm:12,siteBearingDeg:270,relevanceDistanceKm:0,currentImpactRadiusKm:7,
  forecastDistanceKm:2,forecastEffectiveDistanceKm:0,forecastUncertaintyKm:6,forecastTime:'2026-08-04T12:30:00Z',forecastLatitude:50.9,forecastLongitude:7.2,motionDirectionDeg:75,arrivalMinutes:30,isApproaching:true,
  severity:2,trend:1,hailFlag:1,heavyRainFlag:2,gustFlag:1,lightningRate:22,areaHail:2,areaLargeHail:0,speedKmh:48,
  affectedPlacesTotal:4,currentAffectedPlaceCount:1,futureAffectedPlaceCount:3,routeSummary:'von Ort Jetzt über Ort Bald nach Ort Korridor',placeSource:'OpenStreetMap/Overpass · geometrischer KONRAD3D-Zugbahnkorridor',
  affectedPlaces:[
   {name:'Ort Jetzt',latitude:50.8,longitude:7.0,status:'now',arrivalMinutes:0,arrivalAt:'2026-08-04T12:00:00Z',confidence:'high',source:'radar-footprint'},
   {name:'Ort Bald',latitude:50.85,longitude:7.1,status:'likely',arrivalMinutes:15,arrivalAt:'2026-08-04T12:15:00Z',arrivalWindowStartAt:'2026-08-04T12:10:00Z',arrivalWindowEndAt:'2026-08-04T12:20:00Z',distanceToTrackKm:2,confidence:'medium',source:'forecast-track'},
   {name:'Ort Möglich',latitude:50.88,longitude:7.15,status:'possible',arrivalMinutes:25,arrivalAt:'2026-08-04T12:25:00Z',arrivalWindowStartAt:'2026-08-04T12:15:00Z',arrivalWindowEndAt:'2026-08-04T12:35:00Z',distanceToTrackKm:5,confidence:'medium',source:'forecast-track'},
   {name:'Ort Korridor',latitude:50.92,longitude:7.25,status:'corridor',arrivalMinutes:40,arrivalAt:'2026-08-04T12:40:00Z',arrivalWindowStartAt:'2026-08-04T12:25:00Z',arrivalWindowEndAt:'2026-08-04T12:55:00Z',distanceToTrackKm:10,confidence:'low',source:'uncertainty-corridor'}
  ]
 };
 const info=module.combineThunderstormInformation({available:true,coverage:true,provider:'DWD KONRAD3D',observedAt:'2026-08-04T12:00:00Z',ageMinutes:4,cellsFound:3,nearbyCells:[cell],nearest:cell,summary:'x'},[],null,null,'Bezugsort',{timezone:'Europe/Berlin'});
 if(info?.places?.length!==4)failures.push(`Ortsliste unvollständig: ${info?.places?.length}`);
 if(info?.places?.[0]?.badge!=='Jetzt')failures.push(`Aktueller Ort nicht mit Jetzt markiert: ${info?.places?.[0]?.badge}`);
 if(info?.places?.[1]?.badge!=='14:15')failures.push(`Ankunftszeit nicht lokalisiert: ${info?.places?.[1]?.badge}`);
 if(!info?.places?.find(item=>item.status==='possible')?.detail.includes('möglicher Treffer'))failures.push('Möglicher Treffer nicht klar bezeichnet.');
 const corridor=info?.places?.find(item=>item.status==='corridor');
 if(corridor?.badge!=='14:25–14:55'||!corridor.detail.includes('Unsicherheitskorridor'))failures.push(`Korridorfenster unklar: ${corridor?.badge} / ${corridor?.detail}`);
 if(info?.routeSummary!=='von Ort Jetzt über Ort Bald nach Ort Korridor')failures.push(`Zugbahnsatz fehlt: ${info?.routeSummary}`);
 const placeFact=info?.quickFacts?.find(item=>item.label==='Betroffene Orte')?.value;
 if(placeFact!=='1 jetzt · 3 auf Zugbahn')failures.push(`Ortszählung falsch: ${placeFact}`);
}catch(error){failures.push(`Funktionale Ortslistenprüfung nicht ausführbar: ${error instanceof Error?error.message:String(error)}`)}


try{
 const transformed=worker.replace(/export\s*\{[^}]+\};?/g,'').replace(/export default\s*\{/, 'const __workerDefault={')+"\nmodule.exports={closestStormTrackProjection,stormPlaceStatus,compactStormRouteSummary};";
 const module={exports:{}};new Function('module','exports',transformed)(module,module.exports);const geometry=module.exports,track=[{latitude:50,longitude:7,minutes:0,uncertaintyKm:0},{latitude:50,longitude:7.5,minutes:60,uncertaintyKm:3}],center=geometry.closestStormTrackProjection({latitude:50,longitude:7.25},track,4),possible=geometry.closestStormTrackProjection({latitude:50.035,longitude:7.25},track,4),corridor=geometry.closestStormTrackProjection({latitude:50.047,longitude:7.25},track,4);
 if(geometry.stormPlaceStatus(center,30,4)!=='likely')failures.push('Achsnaher Zukunftsort wird nicht als voraussichtlich klassifiziert.');
 if(geometry.stormPlaceStatus(possible,30,4)!=='possible')failures.push(`Seitlicher Zelltreffer falsch klassifiziert: ${geometry.stormPlaceStatus(possible,30,4)}`);
 if(geometry.stormPlaceStatus(corridor,30,4)!=='corridor')failures.push(`Unsicherheitskorridor falsch klassifiziert: ${geometry.stormPlaceStatus(corridor,30,4)}`);
 if(geometry.stormPlaceStatus(center,3,4)!=='now')failures.push('Aktueller Zellbereich wird nicht mit Jetzt klassifiziert.');
}catch(error){failures.push(`Worker-Geometrieprüfung nicht ausführbar: ${error instanceof Error?error.message:String(error)}`)}

if(failures.length){console.error('Gewitter-Orts-/Zugbahnprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Aktuell betroffene Orte, Zugbahnorte, individuelle Ankunftszeiten und Unsicherheitskennzeichnung geprüft.');
