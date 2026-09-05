import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript-strada');
const [app,thunder,radar,weather,worker,styles,composite]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/thunderstorm.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../src/compositeSettings.ts',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,tokens)=>{for(const token of tokens)if(!text.includes(token))failures.push(`${label}: ${token}`)};
need('KONRAD3D-Ortsbezug Worker',worker,['siteBearingDeg:Number(bearingTowards(lat,lon,clat,clon).toFixed(1))','forecastUncertaintyKm:bestForecast?.uncertaintyKm']);
need('KONRAD3D-Typvertrag',weather,['siteBearingDeg?:number','forecastUncertaintyKm?:number']);
need('Gewitterkarte',app,["displayLocationName=currentFavorite?favoriteLabel(currentFavorite):loc?.name??'Standort'",'combineThunderstormInformation(thunderAnalysis,hours,radarAnalysis,st,displayLocationName)','KONRAD3D-Zellinformationen anzeigen','thunder-detail-list']);
need('Gewitterauswertung',thunder,['Aktuell ${Math.max(1,Math.round(currentDistance))} km','größte berechnete Annäherung','Aktuelle Entfernung / Richtung','Wirksamer Mindestabstand','Unsicherheitsradius','Datenstand']);
need('Optionale Verlagerung',radar,['showMotionOverlay:boolean','showMotion=showMotionOverlay&&motionAvailable','label="Zugspuren"','motionButtonDetail=approachTrack?']);
need('Standardzustand Zeitpfeil',composite,['showMotionOverlay:true']);
need('Objektlegende',radar,['function NowcastObjectLegend()','KONRAD3D schwach','NowCastMIX-Blitzgeometrie','Zellprognose','showNowcastObjects&&<NowcastObjectLegend/>']);
need('Objekt- und Tooltip-Styling',styles,['.thunder-detail-list{','.nowcast-object-legend{','.konrad-dot.weak{','.konrad-track-sample{','.nowcastmix-dot{','.konrad-popup{']);

try{
 const js=ts.transpileModule(thunder,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}};
 new Function('module','exports','require',js)(module,module.exports,()=>({}));
 const cell={id:'K3D-42',latitude:51.1,longitude:6.7,currentDistanceKm:42,siteBearingDeg:315,relevanceDistanceKm:20,forecastDistanceKm:22,forecastEffectiveDistanceKm:20,forecastUncertaintyKm:2,forecastTime:'2026-07-26T17:00:00Z',forecastLatitude:50.9,forecastLongitude:7.0,motionDirectionDeg:120,arrivalMinutes:60,isApproaching:true,severity:0,trend:0,hailFlag:0,heavyRainFlag:0,gustFlag:0,lightningRate:0,areaHail:0,areaLargeHail:0,speedKmh:28};
 const info=module.exports.combineThunderstormInformation({available:true,coverage:true,provider:'DWD KONRAD3D',observedAt:'2026-07-26T16:00:00Z',ageMinutes:5,cellsFound:9,nearbyCells:[cell],nearest:cell,summary:'x'},[],null,null,'Niederkassel');
 if(!info?.summary.includes('Aktuell 42 km nordwestlich von Niederkassel'))failures.push(`Aktuelle Zelllokalisierung fehlt: ${info?.summary}`);
 if(!info?.summary.includes('auf ca. 22 km'))failures.push(`Prognostizierter Rohabstand fehlt: ${info?.summary}`);
 if(info?.summary.includes('20 km entfernt'))failures.push('Wirksamer Prognoseabstand wird weiterhin fälschlich als aktuelle Entfernung bezeichnet.');
 const details=new Map((info?.details??[]).map(row=>[row.label,row.value]));
 if(!String(details.get('Aktuelle Entfernung / Richtung')).includes('42'))failures.push('Aktuelle Entfernung fehlt im Tooltip.');
 if(!String(details.get('Wirksamer Mindestabstand')).includes('20')||!String(details.get('Wirksamer Mindestabstand')).includes('2 km'))failures.push('Effektiver Abstand und Unsicherheitsradius fehlen im Tooltip.');
}catch(error){failures.push(`Funktionale Gewitter-Ortsprüfung nicht ausführbar: ${error instanceof Error?error.message:String(error)}`)}

if(failures.length){console.error('Gewitterlokalisierung/Komposit-Legende/Verlagerungsoption fehlerhaft:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Gewitterlokalisierung, vollständiger KONRAD3D-Tooltip, Nowcast-Objektlegende und optionale echogebundene Zugspur sind geprüft.');
