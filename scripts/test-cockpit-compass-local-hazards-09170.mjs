import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url),ts=require('typescript-strada');
const [cockpit,app,styles,thunder,heavy,fusion,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../src/thunderstorm.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/heavyRain.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastFusion.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
 'function CockpitForecastGuide(',
 'aria-label="MID Prognose-Kompass"',
 'cockpit-forecast-compass',
 '<CockpitForecastGuide data={series} scenarios={scenarios} advancedMode={advancedMode}/>',
 "advancedMode:boolean;"
])need('Cockpit-Kompass',cockpit,token);
for(const token of [
 "const LOCAL_HAZARD_DISPLAY_SETTINGS_KEY='mid:localHazardDisplaySettings'",
 'showThunderAndFlashFlood:parsed?.showThunderAndFlashFlood!==false',
 'Gewitter- und Sturzfluthinweise',
 "localHazardDisplaySettings.showThunderAndFlashFlood&&thunderInfo",
 "localHazardDisplaySettings.showThunderAndFlashFlood&&heavyRainInfo",
 "layoutMode==='standard'?' standard-compact':''",
 "if(!loc||!localHazardDisplaySettings.showThunderAndFlashFlood)",
 "advancedMode={layoutMode==='advanced'}"
])need('Einstellung/Darstellung',app,token);
for(const token of [
 '.cockpit-forecast-compass{',
 '.thunder-now.standard-compact',
 '.heavy-rain-now.standard-compact',
 '@media(min-width:681px) and (max-width:900px)'
])need('CSS',styles,token);
for(const token of [
 'export function assessThunderCellSiteRelevance(',
 'THUNDER_SITE_PASSED_HIDE_DISTANCE_KM=15',
 'THUNDER_SITE_MAX_DISTANCE_KM=60',
 'relevance?.relevant',
 'passedCell'
])need('Standortrelevanz',thunder,token);
need('Sturzflut-Kopplung',heavy,'siteRelevance?.relevant');
need('Nowcast-Kopplung',fusion,'convectiveCellSiteRelevance(cell)');
need('Nowcast-Kopplung',fusion,'relevance?.approaching||!relevance.relevant');
need('Package-Test',pkg,'test:cockpit-compass-local-hazards');
need('Baseline-Test',baseline,'scripts/test-cockpit-compass-local-hazards-09170.mjs');

const compileModule=(source,fileName)=>{
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true,fileName});
 const diagnostics=(output.diagnostics??[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
 if(diagnostics.length)throw new Error(diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,'\n')).join(' | '));
 const module={exports:{}};
 new Function('module','exports','require',output.outputText)(module,module.exports,()=>({}));
 return module.exports;
};
try{
 const module=compileModule(thunder,'thunderstorm.ts');
 const base={id:'K3D-SITE',latitude:50.8,longitude:7.1,currentDistanceKm:35,siteBearingDeg:280,relevanceDistanceKm:12,forecastDistanceKm:16,forecastEffectiveDistanceKm:10,forecastUncertaintyKm:5,forecastTime:'2026-08-05T10:30:00Z',forecastLatitude:50.82,forecastLongitude:7.2,motionDirectionDeg:95,arrivalMinutes:35,isApproaching:true,severity:2,trend:0,hailFlag:0,heavyRainFlag:1,gustFlag:1,lightningRate:9,areaHail:0,areaLargeHail:0,speedKmh:42};
 const wrap=nearest=>({available:true,coverage:true,provider:'DWD KONRAD3D',observedAt:'2026-08-05T09:50:00Z',ageMinutes:5,cellsFound:3,nearbyCells:[nearest],nearest,summary:'KONRAD3D-Test'});
 const approaching=module.combineThunderstormInformation(wrap(base),[],null,null,'Bezugsort');
 if(!approaching||approaching.status?.kind!=='approaching')failures.push(`Annähernde standortrelevante Zelle fehlt: ${JSON.stringify(approaching?.status)}`);
 const passed={...base,currentDistanceKm:30,forecastDistanceKm:49,forecastEffectiveDistanceKm:47,isApproaching:false,arrivalMinutes:NaN};
 const passedRelevance=module.assessThunderCellSiteRelevance(passed);
 if(!passedRelevance.movingAway||passedRelevance.relevant)failures.push(`Abgezogene Zelle falsch bewertet: ${JSON.stringify(passedRelevance)}`);
 if(module.combineThunderstormInformation(wrap(passed),[],null,null,'Bezugsort')!==null)failures.push('Abgezogene 30-km-Zelle erzeugt weiterhin eine Gewitterkarte.');
 const far={...base,currentDistanceKm:72,forecastDistanceKm:70,forecastEffectiveDistanceKm:65,isApproaching:false,arrivalMinutes:NaN};
 const farRelevance=module.assessThunderCellSiteRelevance(far);
 if(!farRelevance.tooDistant||farRelevance.relevant)failures.push(`Entfernte Zelle falsch bewertet: ${JSON.stringify(farRelevance)}`);
 if(module.combineThunderstormInformation(wrap(far),[],null,null,'Bezugsort')!==null)failures.push('Nicht annähernde 72-km-Zelle erzeugt weiterhin eine Gewitterkarte.');
 const nearLeaving={...base,currentDistanceKm:10,forecastDistanceKm:18,forecastEffectiveDistanceKm:16,isApproaching:false,arrivalMinutes:NaN};
 const nearInfo=module.combineThunderstormInformation(wrap(nearLeaving),[],null,null,'Bezugsort');
 if(!nearInfo)failures.push('Noch unmittelbar nahe Zelle wird bereits vor der 15-km-Auszugsgrenze ausgeblendet.');
 const now=Date.now(),modelHours=[{epoch:now+30*60000,code:95,cape:500,probability:65}],radarQuiet={currentRate:0},radarActive={currentRate:10};
 if(module.combineThunderstormInformation(wrap(passed),modelHours,radarQuiet,null,'Bezugsort')!==null)failures.push('Abgezogene Zelle wird über ein bloßes Modellsignal erneut eingeblendet.');
 const liveSignal=module.combineThunderstormInformation(wrap(passed),[{...modelHours[0],cape:1100}],radarActive,null,'Bezugsort');
 if(!liveSignal||liveSignal.status?.kind!=='model')failures.push('Neues starkes Standortradar-/CAPE-Signal wird nach Zellabzug unzulässig unterdrückt.');
}catch(error){failures.push(`Funktionale Standortrelevanz nicht ausführbar: ${error instanceof Error?error.message:String(error)}`)}

if(failures.length){console.error('Cockpit-Kompass/lokale Gefahrenhinweise fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID-Prognose-Kompass in beiden Cockpit-Modi sowie optionale, kompakte und standortrelevante Gewitter-/Sturzfluthinweise geprüft.');
