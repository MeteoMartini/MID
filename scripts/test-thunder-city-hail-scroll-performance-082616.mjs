import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const [app,thunderCache,weather,thunder,enhancer,frame,styles,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/thunderPlaceCache.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/thunderstorm.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/v078.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/EnsembleChartFrame.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const forbid=(label,text,token)=>{if(text.includes(token))failures.push(`${label}: unerlaubt ${token}`)};

for(const token of [
 'city?:string;locality?:string;',
 "city=String(d.city||'').trim()",
 'city:city||undefined,locality:locality||undefined'
])need('Reverse-Geocoding auf Stadtniveau',weather,token);
for(const token of [
 "const THUNDER_PLACE_CACHE_KEY='mid:thunder-place-cache:v3'",
 'const city=String(location.city||\'\').trim()',
 'blocked=new Set([country,admin1]',
 'candidate=[city,admin2,name,locality].find(usable)',
 "export type ThunderPlaceNames={site?:string;current?:string;forecast?:string}"
])need('Gewitter-Ortsauflösung · Cache',thunderCache,token);
for(const token of ['thunderLocationName=thunderPlaceNames.site||appendIsoCountry(displayLocationName','resolveThunderPlace(loc.latitude,loc.longitude,controller.signal)'])need('Gewitter-Ortsauflösung · App',app,token);

for(const token of [
 'type HailSizeAssessment=',
 'KONRAD3D-Großhagelsignal aktiv',
 'Körner um oder über 2 cm nicht ausgeschlossen',
 'kleiner bis mittelgroßer Hagel möglich',
 "label:'Hagelgröße / Hagelfläche'",
 'radarbasierte Größenklasse'
])need('Hagelgrößenbewertung',thunder,token);

for(const token of [
 'const ENHANCEMENT_SELECTOR=',
 'function mutationTouchesEnhancement(',
 'scheduleEnhanceAfterResize',
 "window.addEventListener('resize',scheduleEnhanceAfterResize",
 "window.addEventListener('orientationchange',scheduleEnhanceAfterResize"
])need('DOM-/Resize-Performance',enhancer,token);
forbid('DOM-/Resize-Performance',enhancer,'enhancementResizeObserver');
forbid('DOM-/Resize-Performance',enhancer,'observeEnhancementResizeTargets');
forbid('DOM-/Resize-Performance',enhancer,"window.addEventListener('resize',scheduleEnhance,");

for(const token of [
 "const hostRef=useRef<HTMLDivElement>(null),[width,setWidth]=useState(0)",
 'entry.contentRect.width',
 'cloneElement(children,{width,height,responsive:false'
])need('Recharts-Resize-Performance',frame,token);
forbid('Recharts-Resize-Performance',frame,'entry.contentRect.height');
forbid('Recharts-Resize-Performance',frame,'setSize(');

for(const token of [
 'MID v0.8.26.16 · scrollschonende Darstellung ohne Funktionsverlust',
 '.ensemble-responsive-chart,.ensemble-scenarios,.place-nowcards,.short-term-forecast{contain:layout style}',
 '.top{background:var(--surface);backdrop-filter:none;-webkit-backdrop-filter:none}',
 '.chartscroll,.detail-scroll,.trend-scroll,.meteogram-scroll{scroll-snap-type:none}'
])need('Mobile Scroll-CSS',styles,token);

const compileModule=(source,fileName)=>{
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true,fileName});
 if(output.diagnostics?.length)throw new Error(output.diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,'\n')).join(' | '));
 const module={exports:{}};
 new Function('module','exports','require',output.outputText)(module,module.exports,()=>({}));
 return module.exports;
};
try{
 const module=compileModule(thunder,'thunderstorm.ts'),base={id:'K3D-HAIL',latitude:50.7,longitude:7.1,currentDistanceKm:24,siteBearingDeg:225,relevanceDistanceKm:10,forecastDistanceKm:8,forecastEffectiveDistanceKm:4,forecastUncertaintyKm:4,forecastTime:'2026-07-31T20:20:00Z',forecastLatitude:50.8,forecastLongitude:7.2,motionDirectionDeg:45,arrivalMinutes:25,isApproaching:true,severity:2,trend:0,heavyRainFlag:0,gustFlag:0,lightningRate:12,areaHail:6,speedKmh:40};
 const large={...base,hailFlag:2,areaLargeHail:2.5},small={...base,hailFlag:1,areaLargeHail:0};
 const nowcast=nearest=>({available:true,coverage:true,provider:'DWD KONRAD3D',observedAt:'2026-07-31T20:00:00Z',ageMinutes:5,cellsFound:1,nearbyCells:[nearest],nearest,summary:'x'});
 const largeInfo=module.combineThunderstormInformation(nowcast(large),[],null,null,'Niederkassel, DEU',{currentPlaceName:'Bonn, DEU'}),smallInfo=module.combineThunderstormInformation(nowcast(small),[],null,null,'Niederkassel, DEU',{currentPlaceName:'Bonn, DEU'}),largeHail=largeInfo?.quickFacts?.find(item=>item.label==='Hagel')?.value||'',smallHail=smallInfo?.quickFacts?.find(item=>item.label==='Hagel')?.value||'';
 if(!largeHail.includes('2 cm'))failures.push(`Großhagel-Größenklasse fehlt: ${largeHail}`);
 if(!smallHail.includes('kleiner bis mittelgroßer'))failures.push(`Kleine/mittlere Hagelklasse fehlt: ${smallHail}`);
 const detail=largeInfo?.details?.find(item=>item.label==='Hagelgröße / Hagelfläche')?.value||'';
 if(!detail.includes('Großhagelsignal')||!detail.includes('nicht direkt gemessen'))failures.push(`Hagelgrößen-Detail unvollständig: ${detail}`);
}catch(error){failures.push(`Funktionale Hagelprüfung nicht ausführbar: ${error instanceof Error?error.message:String(error)}`)}

for(const [name,source,kind] of [['App.tsx',app,ts.ScriptKind.TSX],['weather.ts',weather,ts.ScriptKind.TS],['thunderstorm.ts',thunder,ts.ScriptKind.TS],['v078.ts',enhancer,ts.ScriptKind.TS],['EnsembleChartFrame.tsx',frame,ts.ScriptKind.TSX]]){
 const parsed=ts.createSourceFile(name,source,ts.ScriptTarget.ESNext,true,kind);if(parsed.parseDiagnostics.length)failures.push(...parsed.parseDiagnostics.map(item=>`${name}: ${ts.flattenDiagnosticMessageText(item.messageText,'\n')}`));
}
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),script='scripts/test-thunder-city-hail-scroll-performance-082616.mjs';
if(!pkg.scripts?.['test:thunder-city-hail-scroll-performance'])failures.push('Package-Testskript fehlt.');
if(!baseline.regressionTests?.includes(script))failures.push('Baseline-Regression fehlt.');

if(failures.length){console.error('Gewitterstadt/Hagelgröße/Scroll-Performance fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Stadtgenaue Gewitterlokalisierung, qualitative Hagelgrößenklasse und scrollschonende Observer-/Recharts-/CSS-Pfade geprüft.');
