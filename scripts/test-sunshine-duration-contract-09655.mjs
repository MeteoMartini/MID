import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'src','sunshineDuration.ts'),'utf8');
const require=createRequire(import.meta.url),ts=require('typescript-strada');
const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'sunshineDuration.ts',reportDiagnostics:true});
const errors=(output.diagnostics??[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
assert.equal(errors.length,0,errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));

const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-sunshine-contract-'));
try{
 const modulePath=path.join(tempDir,'sunshineDuration.mjs');fs.writeFileSync(modulePath,output.outputText);
 const sunshine=await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);

 assert.equal(sunshine.canonicalSunshineHourSeconds(null),null,'fehlende Stundenwerte dürfen nicht zu 0 werden');
 assert.equal(sunshine.canonicalSunshineHourSeconds(5000),3600,'Stundenwerte müssen auf 3600 s begrenzt werden');
 assert.equal(sunshine.canonicalSunshineHourSeconds(1200,[900,900,900,900]),3600,'vier vollständige 15-min-Werte müssen Vorrang haben');
 assert.equal(sunshine.canonicalSunshineHourSeconds(2400,[900,null,900,900]),2400,'unvollständige Viertelstunden müssen auf den Stundenwert zurückfallen');
 assert.equal(sunshine.canonicalSunshineHourSeconds(0,[1200,-60,600,900]),2400,'Viertelstunden müssen einzeln auf 0 bis 900 s begrenzt werden');

 const capped=sunshine.canonicalSunshineDaySeconds({hourValues:Array(24).fill(3600),dailyValue:46800,daylightSeconds:43200});
 assert.equal(capped.valueSeconds,43200,'Tagessumme darf die astronomische Tageslänge nicht überschreiten');
 assert.equal(capped.source,'hourly','vollständige lokale Stunden sind die kanonische Tagesquelle');

 const deviating=sunshine.canonicalSunshineDaySeconds({hourValues:[...Array(12).fill(3600),...Array(12).fill(0)],dailyValue:18000,daylightSeconds:54000});
 assert.equal(deviating.valueSeconds,43200);
 assert.equal(deviating.quality,'deviating','große Abweichungen zur Daily-Referenz müssen diagnostiziert werden');

 const fallback=sunshine.canonicalSunshineDaySeconds({hourValues:Array(12).fill(3600),dailyValue:46800,daylightSeconds:54000});
 assert.equal(fallback.valueSeconds,46800,'Daily ist bei unvollständiger Stundenabdeckung der Fallback');
 assert.equal(fallback.source,'daily-fallback');

 const missing=sunshine.canonicalSunshineDaySeconds({hourValues:Array(24).fill(null),dailyValue:null,daylightSeconds:43200});
 assert.equal(missing.valueSeconds,null,'fehlende Providerwerte bleiben fehlend');
 assert.equal(missing.quality,'missing');

 assert.equal(sunshine.sunshineMinutesLabel(900,15),'15 min');
 assert.equal(sunshine.sunshineMinutesLabel(null),'–');
 assert.equal(sunshine.sunshineHoursLabel(1800),'0,5 h');
 assert.equal(sunshine.sunshineHoursLabel(0),'0 h');
 assert.equal(sunshine.sunshineHoursLabel(null),'–');
}finally{fs.rmSync(tempDir,{recursive:true,force:true})}

const contracts=[
 ['src/weather-src/20-mapping-day-character.tsfrag',['canonicalSunshineHourSeconds','canonicalSunshineDaySeconds','weatherDaylightSeconds']],
 ['src/forecastFusion.ts',['minimumExpectedHours:completeCoverage?relevant.length:26','const reference=','sunshineDurationMeta']],
 ['src/ShortTermForecast.tsx',['sunshineMinutesLabel','Bewölkung / Sicht / Sonnenscheindauer']],
 ['src/ForecastCockpit.tsx',['mid-forecast-row-detail compact','RelativeSunshineIcon','relativeSunshineShare','possibleSunshineDuration','P10–P90','sunshineHoursLabel','sunshineWholeHoursLabel','bestSunshineDuration=bestDay?.sunshineDuration!=null']],
 ['src/EnsemblePanel.tsx',['Sonnenscheindauer','formatSunshineHours']],
 ['src/EventPlannerPanel.tsx',['eventSunshineLabel','Sonnenscheindauer']],
 ['src/App.tsx',['sunshineHoursLabel']],
 ['src/WidgetGenerator.tsx',['showSunshine','widgetmeta-sun','sunshineWholeHoursLabel']],
 ['src/nativeWidget.ts',['sunshineDurationSeconds','sunshineDuration']],
 ['ios/App/MIDWidgets/MIDWidgetSnapshot.swift',['sunshineDurationSeconds']],
 ['ios/App/MIDWidgets/MIDWidget.swift',['sunshineMinutes','sunshineHours']],
 ['worker-src/00-core-observations.js',['widgetSunshineSeconds','sunshineDurationSeconds','sunshineDuration:\'s\'']]
];
for(const [file,tokens] of contracts){const text=fs.readFileSync(path.join(root,file),'utf8');for(const token of tokens)assert.ok(text.includes(token),`${file}: Sunshine-Contract fehlt: ${token}`)}

 // Tested expression is extracted from production 3-h detail grouping rather
 // than duplicated: partial coverage must never appear as a complete sum.
 const detailSource=fs.readFileSync(path.join(root,'src','App.tsx'),'utf8');
 const marker='sunshineValues=group.map(hour=>hour.sunshineDuration)';
 const begin=detailSource.indexOf(marker),finish=detailSource.indexOf(',cloud=meanCloudLayer(group',begin);
 assert.ok(begin>=0&&finish>begin,'3-h-Sonnenscheindauer muss aus dem produktiven Stundenaggregat stammen');
 const fragment=detailSource.slice(begin,finish);
 assert.match(fragment,/sunshineValues\.length===group\.length/,'Nur vollständig vorhandene 3-h-Stundenwerte dürfen aufsummiert werden');
 const dailySrc='export function sumDetailSunshine(group:{sunshineDuration?:number|null}[],completeCoverage:boolean){const '+fragment+';return sunshineDuration;}';
 const detailJs=ts.transpileModule(dailySrc,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'detailSunshineProbe.ts',reportDiagnostics:true});
 assert.equal((detailJs.diagnostics??[]).filter(item=>item.category===ts.DiagnosticCategory.Error).length,0,'Aggregat-Ausdruck muss TypeScript-kompilierbar sein');
 const detailDir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-daily-sunshine-detail-'));
 try{
 const detailFile=path.join(detailDir,'detailSunshineProbe.mjs');fs.writeFileSync(detailFile,detailJs.outputText);
 const {sumDetailSunshine}=await import(pathToFileURL(detailFile).href);
 const sum=(values,completeCoverage=true)=>sumDetailSunshine(values.map(sunshineDuration=>({sunshineDuration})),completeCoverage);
 assert.equal(sum([0,3600,0]),3600,'Gültige Stunden inklusive echter Null bleiben exakt erhalten');
 assert.equal(sum([0,0,0]),0,'Drei nachgewiesene Nullen sind eine echte 0');
 assert.equal(sum([null,1800,null]),null,'Lücken nicht als vollständige 3-h-Summe anzeigen');
 assert.equal(sum([0,null,0]),null,'Eine einzige fehlende Stunde macht die 3-h-Summe unbekannt');
 assert.equal(sum([undefined,1800,900]),null,'Undefined darf keine Teil-Summe erzeugen');
 assert.equal(sum([0,NaN,0]),null,'NaN darf keine Teil-Summe erzeugen');
 assert.equal(sum([0,-1,0]),null,'Unphysikalisch negative Sonne ist nicht 0');
 assert.equal(sum([0,3601,0]),null,'Mehr als 3600 s/h ist kein valider Stundenwert');
 assert.equal(sum([1800],false),null,'Eine einzelne Stunde darf nicht als voller 3h-Block gelten');
 assert.equal(sum([1800,0],false),null,'Zwei gelieferte Stunden beweisen keinen vollen 3h-Block');
 assert.equal(sum([0,3600],true),3600,'Ein vollständiger zweistündiger DST-Frühlingsblock darf gültig sein');
 }finally{fs.rmSync(detailDir,{recursive:true,force:true})}


 // Execute the actual production local-calendar helper and existing window-coverage helper,
 // bundled from exact application source with the project's real timezone conversion.
 const winStart=detailSource.indexOf('function detailThreeHourWindow('),winEnd=detailSource.indexOf('function detailHoursByResolution(',winStart);
 assert.ok(winStart>=0&&winEnd>winStart,'3h-Kalenderfenster-Helfer muss vorhanden sein');
 assert.match(detailSource,/completeCoverage=completePrecipitationWindowCoverage\(group\.map/);
 assert.ok(detailSource.includes('detailHoursByResolution(allDayHours,detailResolution,calendarTimezone??timezone)'));
 assert.ok(detailSource.includes('sunshineDuration=completeCoverage&&sunshineValues.length===group.length'));
 const winDir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-3h-local-window-'));
 try{
  const winFile=path.join(winDir,'threeHourWindow.mjs');
  await build({stdin:{contents:"import {localIsoToEpoch} from './src/timeDisplay';import {completePrecipitationWindowCoverage} from './src/precipitationAvailability';"+detailSource.slice(winStart,winEnd)+"\nexport{detailThreeHourWindow,completePrecipitationWindowCoverage};",resolveDir:root,sourcefile:'threeHourWindow.ts',loader:'ts'},outfile:winFile,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
  const {detailThreeHourWindow,completePrecipitationWindowCoverage}=await import(pathToFileURL(winFile).href);
  const H=3600000, cases=[['2026-03-28T00:00',3],['2026-03-29T00:00',2],['2026-10-25T00:00',4],['2026-11-10T21:00',3]];
  for(const [time,realHours] of cases){
   const window=detailThreeHourWindow({time},'Europe/Berlin');
   assert.equal((window.end-window.start)/H,realHours,'Tatsächliche lokale 3h-Kalenderdauer: '+time);
   const slots=Array.from({length:realHours},(_,i)=>({start:window.start+i*H,end:window.start+(i+1)*H}));
   assert.equal(completePrecipitationWindowCoverage(slots,window.start,window.end),true,'Vollständiger realer 3h-Block: '+time);
   assert.equal(completePrecipitationWindowCoverage(slots.slice(0,-1),window.start,window.end),false,'Letzte Quellstunde fehlt: '+time);
   assert.equal(completePrecipitationWindowCoverage(slots.slice(1),window.start,window.end),false,'Erste Quellstunde fehlt: '+time);
  }
  const invalid=detailThreeHourWindow({time:'2026-02-30T00:00'},'Europe/Berlin');
  assert.equal(Number.isFinite(invalid.start),false,'Ungültiges Quelldatum ist keine valide Zeitachse');
 }finally{fs.rmSync(winDir,{recursive:true,force:true})}

console.log('0.9.65.5: appweiter Sunshine-Duration-Contract von 15 min über Stunde/Tag bis Ensemble, Events und Widgets geprüft.');
