import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'src','forecastFusion.ts'),'utf8');
for(const token of [
 'DAY_HOURLY_PRECIPITATION_MIN_MM=.1',
 'DAY_HOURLY_PROBABILITY_SUPPORT_MIN=20',
 'DAY_HOURLY_FULL_COVERAGE_MIN_HOURS=18',
 'export function reconcileForecastHoursWithDays',
 'distributeDailyPrecipitationDeficit',
 'baseDisplayDays),[postProcessedHours,baseDisplayDays]'
]){
 if(token.includes('baseDisplayDays'))continue;
 assert.ok(source.includes(token),`fehlender Tages-zu-Stunden-Konsistenzvertrag: ${token}`);
}
const app=fs.readFileSync(path.join(root,'src','App.tsx'),'utf8');
assert.ok(app.includes('reconcileForecastHoursWithDays(postProcessedHours,baseDisplayDays)'), 'finale Darstellungsstunden müssen mit dem Tageswert abgeglichen werden');

const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const executable=source
 .replace("import {fetchWorkerJson} from './workerClient';","const fetchWorkerJson=async()=>{throw new Error('not used')};")
 .replace("import {reconcileForecastPrecipitation} from './precipitation';",`const reconcileForecastPrecipitation=input=>{const precipitation=Math.max(0,Number(input.precipitation)||0),rain=Math.max(0,Number(input.rain)||0),showers=Math.max(0,Number(input.showers)||0),snowfall=Math.max(0,Number(input.snowfall)||0),probability=Math.max(0,Math.min(100,Number(input.probability)||0)),code=Math.round(Number(input.code)||0),wet=[51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99].includes(code),tiny=Math.max(precipitation,rain,showers,snowfall)<=.15,traceSuppressed=(wet||precipitation>=.01||rain>=.01||showers>=.01||snowfall>=.01)&&tiny&&probability<=5;return traceSuppressed?{precipitation:0,rain:0,showers:0,snowfall:0,probability,code:3,traceSuppressed:true}:{precipitation,rain,showers,snowfall,probability,code,traceSuppressed:false}};`)
 .replace("import type {Day,Hour,RadarNowcast,ThunderstormNowcast} from './weather';",'');
const transpiled=ts.transpileModule(executable,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true,fileName:'forecastFusion.ts'});
const diagnostics=(transpiled.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
assert.equal(diagnostics.length,0,diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));
const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-daily-hourly-allocation-'));
const modulePath=path.join(tempDir,'forecastFusion.cjs');fs.writeFileSync(modulePath,transpiled.outputText);const mod=require(modulePath);

const originalNow=Date.now,now=Date.UTC(2026,7,2,13,30,0);Date.now=()=>now;
const date='2026-08-04';
const day=(precipitation=.4,probability=74)=>({date,code:3,max:33,min:22,sunrise:`${date}T06:03`,sunset:`${date}T21:12`,sunshineDuration:42000,precipitation,probability,wind:8,gust:15,direction:90,uvMax:7});
const hour=(index,{precipitation=0,probability=0,epoch=Date.UTC(2026,7,3,22+index,0,0)}={})=>({time:`${date}T${String(index).padStart(2,'0')}:00`,epoch,timezone:'Europe/Berlin',temperature:index<8?23:index<20?30:26,apparent:28,humidity:60,dewPoint:16,pressure:1012,precipitation,rain:precipitation,showers:0,snowfall:0,probability,code:precipitation>=.01?61:3,wind:6,gust:12,direction:90,cloud:85,lowCloud:55,uvIndex:0,visibility:10000,cape:80,liftedIndex:0,convectiveInhibition:0,columnWaterVapour:25,isDay:index>=6&&index<=21});
const probabilityAt=index=>index<12?0:index===12?8:index===13?18:index===14?31:index===15?48:index===16?62:index===17?74:index===18?71:index===19?64:index===20?55:index===21?42:index===22?32:24;

try{
 const dryHours=Array.from({length:24},(_,index)=>hour(index,{probability:probabilityAt(index)}));
 const allocated=mod.reconcileForecastHoursWithDays(dryHours,[day()]);
 const total=allocated.reduce((sum,item)=>sum+item.precipitation,0);
 const wet=allocated.filter(item=>item.precipitation>=.01);
 assert.ok(Math.abs(total-.4)<.000001,`0,4 mm Tagesmenge muss vollständig stündlich sichtbar werden, erhalten: ${total}`);
 assert.ok(wet.length>=2&&wet.length<=6,`Menge soll in ein kompaktes Wahrscheinlichkeitsfenster verteilt werden, Stunden: ${wet.length}`);
 assert.ok(wet.every(item=>item.probability>=31),'zugeordnete Stunden müssen vom stündlichen Wahrscheinlichkeitssignal getragen sein');
 assert.ok(wet.every(item=>[61,80].includes(item.code)&&item.rain+item.showers>0),'zugeordnete Stunden benötigen Niederschlagsphase, Teilmenge und Piktogrammcode');
 assert.equal(allocated[17].probability,74,'Wahrscheinlichkeiten dürfen bei der Mengenverteilung nicht verändert werden');
 const alignedDay=mod.reconcileForecastDaysWithHours([day()],allocated)[0];
 assert.ok(Math.abs(alignedDay.precipitation-.4)<.000001,'Tageskopf und Summe der sichtbaren Stunden müssen übereinstimmen');

 const alreadyPresent=dryHours.map((item,index)=>index===17?{...item,precipitation:.1,rain:.1,code:61}:item);
 const supplemented=mod.reconcileForecastHoursWithDays(alreadyPresent,[day()]);
 assert.ok(Math.abs(supplemented.reduce((sum,item)=>sum+item.precipitation,0)-.4)<.000001,'nur die fehlende Differenz darf ergänzt werden');

 const unsupported=mod.reconcileForecastHoursWithDays(Array.from({length:24},(_,index)=>hour(index,{probability:12})),[day(.4,12)]);
 assert.equal(unsupported.reduce((sum,item)=>sum+item.precipitation,0),0,'ohne stündliches Wahrscheinlichkeitssignal darf keine Uhrzeit erfunden werden');
 const unsupportedDay=mod.reconcileForecastDaysWithHours([day(.4,12)],unsupported)[0];
 assert.equal(unsupportedDay.precipitation,0,'bei vollständiger Stundenabdeckung darf eine nicht gestützte unabhängige Tagesmenge nicht stehen bleiben');
 assert.equal(unsupportedDay.probability,12);
 const dailyOnlySupport=mod.reconcileForecastHoursWithDays(Array.from({length:24},(_,index)=>hour(index,{probability:18})),[day(.4,74)]);
 assert.equal(dailyOnlySupport.reduce((sum,item)=>sum+item.precipitation,0),0,'eine hohe Tageswahrscheinlichkeit allein darf ohne mindestens 20 % stündliches Signal keine Uhrzeit erzeugen');
 const dailyOnlyAligned=mod.reconcileForecastDaysWithHours([day(.4,74)],dailyOnlySupport)[0];
 assert.equal(dailyOnlyAligned.precipitation,0,'vollständig vorhandene Stunden ohne Stützung müssen auch den Tagesmengenwiderspruch entfernen');
 assert.equal(dailyOnlyAligned.probability,18,'bei vollständiger Stundenabdeckung gilt das sichtbare stündliche Wahrscheinlichkeitsmaximum');

 const partial=mod.reconcileForecastHoursWithDays(dryHours.slice(12),[day()]);
 assert.equal(partial.reduce((sum,item)=>sum+item.precipitation,0),0,'bei unvollständiger Tagesabdeckung darf eine Tagesmenge nicht willkürlich verteilt werden');

 const currentDate='2026-08-02',currentDay={...day(),date:currentDate},currentHours=Array.from({length:24},(_,index)=>({...hour(index,{probability:probabilityAt(index),epoch:Date.UTC(2026,7,1,22+index,0,0)}),time:`${currentDate}T${String(index).padStart(2,'0')}:00`}));
 const nowcastProtected=mod.reconcileForecastHoursWithDays(currentHours,[currentDay]);
 assert.equal(nowcastProtected.reduce((sum,item)=>sum+item.precipitation,0),0,'laufender Tag bleibt wegen Vergangenheit und Nowcast von der Verteilung ausgeschlossen');
}finally{Date.now=originalNow;fs.rmSync(tempDir,{recursive:true,force:true})}
console.log('Tages-/Stunden-Niederschlagszuordnung ab v0.8.33.13 geprüft: gestützte Tagesmengen werden vollständig und kompakt in der Stundenkurve sichtbar; bei vollständiger Abdeckung wird der Tageskopf aus derselben finalen Stundenreihe gebildet.');
