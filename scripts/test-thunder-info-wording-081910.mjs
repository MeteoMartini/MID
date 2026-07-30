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
 "export type ThunderInfoFactTone='neutral'|'motion'|'rain'|'hail'|'wind'|'lightning'",
 "export type ThunderInfoStatusKind='at-site'|'near'|'approaching'|'passing'|'surrounding'|'model'",
 'function impactHeadline(',
 "'Starkes Gewitter'",
 "'schwere Sturmböen'",
 "label:'Nähert sich'",
 "label:'Zieht voraussichtlich vorbei'",
 "tone:'rain'",
 "tone:'hail'",
 "tone:'wind'"
])need('Gewitteranalyse',thunder,token);
for(const token of [
 'width={560}',
 'popoverClassName="thunder-info-popover"',
 'showClose',
 'className={`thunder-status ${thunderInfo.status.kind}`}',
 "item.prominent!==false",
 "className={`thunder-fact ${item.tone??'neutral'}`}"
])need('Gewitterdarstellung',app,token);
for(const token of ['.thunder-status.approaching{','.thunder-fact.rain{','.thunder-fact.hail{','.thunder-fact.wind{','.thunder-info-popover{','.thunder-info-close{'])need('Gewitter-CSS',styles,token);
for(const token of ["import {naturalPossibleEventFallback,naturalPossibleEventText} from './forecastWording';",'const full=naturalPossibleEventText(event,timing)'])need('7-Tage-Wortlaut',weather,token);
if(weather.includes('`${event} ${timing} möglich`'))failures.push('Alte unnatürliche Reihenfolge „Regen abends möglich“ ist noch vorhanden.');
need('Package-Test',pkg,'test:thunder-info-wording');
need('Baseline-Test',baseline,'scripts/test-thunder-info-wording-081910.mjs');

const compileModule=(source,fileName)=>{
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true,fileName});
 if(output.diagnostics?.length)throw new Error(output.diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,'\n')).join(' | '));
 const module={exports:{}};
 new Function('module','exports','require',output.outputText)(module,module.exports,()=>({}));
 return module.exports;
};
try{
 const module=compileModule(thunder,'thunderstorm.ts');
 const cell={id:'K3D-88',latitude:50.9,longitude:7.2,currentDistanceKm:42,siteBearingDeg:315,relevanceDistanceKm:20,forecastDistanceKm:22,forecastEffectiveDistanceKm:20,forecastUncertaintyKm:2,forecastTime:'2026-07-30T13:00:00Z',forecastLatitude:50.85,forecastLongitude:7.05,motionDirectionDeg:35,arrivalMinutes:35,isApproaching:true,severity:2,trend:1,hailFlag:1,heavyRainFlag:2,gustFlag:2,lightningRate:17,areaHail:3.2,areaLargeHail:0,speedKmh:46};
 const info=module.combineThunderstormInformation({available:true,coverage:true,provider:'DWD KONRAD3D',observedAt:'2026-07-30T12:40:00Z',ageMinutes:5,cellsFound:8,nearbyCells:[cell],nearest:cell,summary:'x'},[],null,null,'Aachen');
 const expectedHeadline='Starkes Gewitter mit heftigem Starkregen; Hagel und schwere Sturmböen möglich';
 if(info?.headline!==expectedHeadline)failures.push(`Kompakte Gewitterüberschrift: erwartet „${expectedHeadline}“, erhalten „${info?.headline}“`);
 if(info?.status?.kind!=='approaching'||info?.status?.label!=='Nähert sich')failures.push(`Annäherungspriorität fehlt: ${JSON.stringify(info?.status)}`);
 const tones=new Set((info?.quickFacts??[]).map(item=>item.tone));
 for(const tone of ['rain','hail','wind','motion'])if(!tones.has(tone))failures.push(`Farbton ${tone} fehlt in den Kernauswirkungen.`);
 const passing={...cell,currentDistanceKm:30,forecastDistanceKm:48,forecastEffectiveDistanceKm:46,isApproaching:false,arrivalMinutes:NaN,heavyRainFlag:0,hailFlag:0,gustFlag:0};
 const passingInfo=module.combineThunderstormInformation({available:true,coverage:true,provider:'DWD KONRAD3D',observedAt:'2026-07-30T12:40:00Z',ageMinutes:5,cellsFound:8,nearbyCells:[passing],nearest:passing,summary:'x'},[],null,null,'Aachen');
 if(passingInfo?.status?.kind!=='passing'||passingInfo?.status?.label!=='Zieht voraussichtlich vorbei')failures.push(`Vorbeizug wird nicht klar priorisiert: ${JSON.stringify(passingInfo?.status)}`);
}catch(error){failures.push(`Funktionale Gewitterprüfung nicht ausführbar: ${error instanceof Error?error.message:String(error)}`)}
try{
 const module=compileModule(wording,'forecastWording.ts');
 const cases=[
  ['Regen','abends','Abends Regen möglich'],
  ['Schauer','nachmittags','Nachmittags Schauer möglich'],
  ['Schnee','ab Mittag','Ab Mittag Schnee möglich'],
  ['Gewitter','zeitweise','Zeitweise Gewitter möglich'],
  ['Regen','','Regen möglich']
 ];
 for(const [event,timing,expected] of cases){const actual=module.naturalPossibleEventText(event,timing);if(actual!==expected)failures.push(`Natürlicher 7-Tage-Wortlaut: erwartet „${expected}“, erhalten „${actual}“`)}
}catch(error){failures.push(`Wortlautprüfung nicht ausführbar: ${error instanceof Error?error.message:String(error)}`)}

if(failures.length){console.error('Gewitterinformation/7-Tage-Wortlaut fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Gewitterinformation verfeinert und natürliche Zeit-vor-Ereignis-Sprache der 7-Tage-Untertitel geprüft.');
