import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url),ts=require('typescript');
const [thunder,app,styles,weather,wording,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/thunderstorm.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastWording.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
 'export type ThunderInfoContext={timezone?:string;currentPlaceName?:string;forecastPlaceName?:string}',
 'function namedCoordinate(',
 'function localForecastClock(',
 'Möglicher Standorttreffer in ${locationName}',
 'Nächste Annäherung an ${locationName}',
 "label:'Zellposition'",
 "label:'Zeit der nächsten Annäherung'",
 'currentPlaceName:thunderPlaceNames.current',
 'forecastPlaceName:thunderPlaceNames.forecast'
])need('Gewitter-Orts-/Zeitbezug',thunder+app,token);
for(const token of [
 "const THUNDER_PLACE_CACHE_KEY='mid:thunder-place-cache:v1'",
 'resolveThunderPlace(cell.latitude,cell.longitude,controller.signal)',
 'resolveThunderPlace(cell.forecastLatitude,cell.forecastLongitude,controller.signal)',
 '.slice(0,4)'
])need('Kompakte Gewitterkarte',app,token);
if(app.includes('<span>{thunderInfo.summary}</span>'))failures.push('Die doppelte freie Gewitter-Zusammenfassung wird weiterhin außerhalb der Unterfelder angezeigt.');
for(const token of ['.place-nowcards .thunder-now{padding:11px 12px!important', '.thunder-fact-grid:not(.thunder-fact-grid-expanded)', '.thunder-status{margin-top:6px'])need('Kompakt-CSS',styles,token);
for(const token of [
 'function sentenceStartText(value:string)',
 'return sentenceStartText(clean.length<=DAY_LABEL_MAX?clean:fallback)',
 'return sentenceStartText(clean.length<=DAY_SECONDARY_MAX?clean:fallback)'
])need('7-Tage-Großschreibung',weather,token);
need('Wortlaut-Großschreibung',wording,'return sentenceStart(lead?`${lead} ${event} möglich`:`${event} möglich`)');
need('Package-Test',pkg,'test:thunder-place-compact');
need('Baseline-Test',baseline,'scripts/test-thunder-place-compact-capitalization-081912.mjs');

const compileModule=(source,fileName)=>{
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true,fileName});
 if(output.diagnostics?.length)throw new Error(output.diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,'\n')).join(' | '));
 const module={exports:{}};
 new Function('module','exports','require',output.outputText)(module,module.exports,()=>({}));
 return module.exports;
};
try{
 const module=compileModule(thunder,'thunderstorm.ts');
 const cell={id:'K3D-99',latitude:50.61,longitude:5.74,currentDistanceKm:42,siteBearingDeg:135,relevanceDistanceKm:0,forecastDistanceKm:4,forecastEffectiveDistanceKm:0,forecastUncertaintyKm:6,forecastTime:'2026-07-30T13:00:00Z',forecastLatitude:50.77,forecastLongitude:6.02,motionDirectionDeg:35,arrivalMinutes:35,isApproaching:true,severity:2,trend:0,hailFlag:1,heavyRainFlag:2,gustFlag:2,lightningRate:17,areaHail:2,areaLargeHail:0,speedKmh:46};
 const info=module.combineThunderstormInformation({available:true,coverage:true,provider:'DWD KONRAD3D',observedAt:'2026-07-30T12:25:00Z',ageMinutes:5,cellsFound:6,nearbyCells:[cell],nearest:cell,summary:'x'},[],null,null,'Rheidt',{timezone:'Europe/Berlin',currentPlaceName:'Soumagne, Liège',forecastPlaceName:'Vaals, Limburg'});
 if(!info?.status?.detail.includes('Möglicher Standorttreffer in Rheidt gegen 15:00 Uhr'))failures.push(`Standorttreffer/Uhrzeit nicht klar: ${info?.status?.detail}`);
 const position=(info?.quickFacts??[]).find(item=>item.label==='Zellposition')?.value||'';
 if(!position.includes('Soumagne')||!position.includes('Rheidt'))failures.push(`Ortsname/Bezugsort fehlen in der Zellposition: ${position}`);
 const currentDetail=(info?.details??[]).find(item=>item.label==='Aktuelle Zellposition')?.value||'';
 const forecastDetail=(info?.details??[]).find(item=>item.label==='Prognostizierte Position')?.value||'';
 if(!currentDetail.includes('Soumagne')||!forecastDetail.includes('Vaals'))failures.push(`Ortsnamen fehlen in den Detailpositionen: ${currentDetail} / ${forecastDetail}`);
}catch(error){failures.push(`Funktionale Gewitterprüfung nicht ausführbar: ${error instanceof Error?error.message:String(error)}`)}
try{
 const module=compileModule(wording,'forecastWording.ts');
 if(module.naturalPossibleEventText('regen','abends')!=='Abends regen möglich')failures.push('Zeit-vor-Ereignis-Text beginnt nicht mit Großbuchstaben.');
 if(module.naturalPossibleEventText('regen','')!=='Regen möglich')failures.push('Untertitel ohne Zeitangabe beginnt nicht mit Großbuchstaben.');
}catch(error){failures.push(`Wortlautprüfung nicht ausführbar: ${error instanceof Error?error.message:String(error)}`)}

if(failures.length){console.error('Gewitter-Ortsbezug/Kompaktheit/7-Tage-Großschreibung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Gewitterpositionen mit Ortsnamen, klare Annäherungszeit, kompakte Karte und Großschreibung der 7-Tage-Texte geprüft.');
