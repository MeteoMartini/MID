import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const intervalsSource=readFileSync(new URL('../src/precipitationIntervals.ts',import.meta.url),'utf8');
const appSource=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');

assert.ok(intervalsSource.includes('export function canonicalPrecipitationTimeline'),'Kanonische Niederschlags-Zeitlogik fehlt.');
assert.ok(appSource.includes('canonicalPrecipitationTimeline(minutes,hours,now,6)'),'Aktuell-Zusammenfassung muss dieselbe intervallbewusste Zeitlogik verwenden.');
assert.ok(!appSource.includes("first.at(-1)!.epoch+3600000"),'Der alte pauschale +1-h-Endzeitversatz darf nicht zurückkehren.');
assert.ok(!appSource.includes("parts.total>=.05||Number(hour.probability)>=55"),'Reine Wahrscheinlichkeit darf keine künstliche Niederschlagsdauer erzeugen.');
assert.ok(appSource.includes("case'short-term':return <ShortTermForecast key={id} minutes15={displayMinutes15} hours={displayHours}"),'Kurzfrist muss weiterhin dieselben finalisierten Niederschlagsdaten erhalten.');
assert.ok(appSource.includes("minutes15={displayMinutes15}")&&appSource.includes("hours={displayHours}"),'Prognoseflächen müssen auf der kanonischen finalisierten Datenbasis bleiben.');

const require=createRequire(import.meta.url),ts=require('typescript-strada');
const executable=intervalsSource
 .replace("import {precipitationParts} from './precipitation';",`const precipitationParts=sample=>{const total=Math.max(0,Number(sample.precipitation)||0,Number(sample.rain)||0,Number(sample.showers)||0,Number(sample.snowfall)||0),code=Math.round(Number(sample.code)||0),wetCode=code>=50&&code<=99;return{type:wetCode?'rain':'none',total,displayCode:wetCode?61:3};};`)
 .replace("import type {Hour,Minute15} from './weather';",'');
const transpiled=ts.transpileModule(executable,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},fileName:'precipitationIntervals.ts'}).outputText;
const temp=mkdtempSync(join(tmpdir(),'mid-precip-timing-')),modulePath=join(temp,'intervals.mjs');writeFileSync(modulePath,transpiled);
try{
 const mod=await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
 const HOUR=3600000,QUARTER=15*60000,now=Date.UTC(2026,9,1,6,30),hourGridStart=Date.UTC(2026,9,1,3,0);
 const hour=(epoch,wet=false,probability=wet?80:5)=>({epoch,time:new Date(epoch).toISOString().slice(0,16),precipitation:wet?.8:0,rain:wet?.8:0,showers:0,snowfall:0,probability,code:wet?61:3,visibility:10000,humidity:80,temperature:10,cloud:80});
 const hours=[];for(let epoch=hourGridStart;epoch<=Date.UTC(2026,9,1,15,0);epoch+=HOUR){const wet=epoch===Date.UTC(2026,9,1,9,0)||epoch===Date.UTC(2026,9,1,10,0);hours.push(hour(epoch,wet))}
 const hourlyTimeline=mod.canonicalPrecipitationTimeline([],hours,now,6);
 assert.equal(hourlyTimeline.source,'hourly');
 assert.equal(hourlyTimeline.periods.length,1);
 assert.equal(hourlyTimeline.periods[0].startEpoch,Date.UTC(2026,9,1,8,0),'Rohwert 09:00 muss als Intervall 08:00–09:00 erscheinen.');
 assert.equal(hourlyTimeline.periods[0].endEpoch,Date.UTC(2026,9,1,10,0),'Letzter nasser Rohwert 10:00 endet um 10:00 und darf nicht pauschal bis 11:00 verlängert werden.');

 const minutes=[];for(let epoch=now-2*HOUR;epoch<=now+7*HOUR;epoch+=QUARTER){const wet=epoch>Date.UTC(2026,9,1,8,30)&&epoch<=Date.UTC(2026,9,1,10,0);minutes.push({epoch,time:new Date(epoch).toISOString().slice(0,16),precipitation:wet?.2:0,rain:wet?.2:0,showers:0,snowfall:0,probability:wet?80:5,code:wet?61:3})}
 const minuteTimeline=mod.canonicalPrecipitationTimeline(minutes,hours,Date.UTC(2026,9,1,8,30),6);
 assert.equal(minuteTimeline.source,'15-min','Bei vollständiger 15-Minuten-Abdeckung muss die feinere finalisierte Reihe kanonisch sein.');
 assert.equal(minuteTimeline.periods.length,1);
 assert.equal(minuteTimeline.periods[0].startEpoch,Date.UTC(2026,9,1,8,30));
 assert.equal(minuteTimeline.periods[0].endEpoch,Date.UTC(2026,9,1,10,0));

 const probabilityOnly=minutes.map(row=>({...row,precipitation:0,rain:0,showers:0,snowfall:0,probability:90,code:61}));
 const probabilityTimeline=mod.canonicalPrecipitationTimeline(probabilityOnly,hours.map(row=>({...row,precipitation:0,rain:0,showers:0,snowfall:0,probability:90,code:61})),Date.UTC(2026,9,1,8,30),6);
 assert.equal(probabilityTimeline.periods.length,0,'Hohe Wahrscheinlichkeit ohne messbare Menge darf keine scheinbar sichere Dauer erzeugen.');
}finally{rmSync(temp,{recursive:true,force:true})}

console.log('MID v0.9.85.132: Niederschlags-Endzeiten nutzen appweit konsistente Intervallsemantik ohne künstlichen +1-h-Versatz.');
