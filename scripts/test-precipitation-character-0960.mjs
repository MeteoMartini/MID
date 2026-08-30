import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';
const root=new URL('../',import.meta.url),source=await readFile(new URL('src/precipitation.ts',root),'utf8'),require=createRequire(import.meta.url);const ts=require('typescript-strada')
for(const token of ['classifyPrecipitationCharacter','directPartition','convectiveFraction','liftedIndex','convectiveInhibition','lowStratusSignal','drizzlePlausible'])assert.ok(source.includes(token),`Niederschlagscharakter-Vertrag fehlt: ${token}`);
const dir=await mkdtemp(join(tmpdir(),'mid-precip-character-'));
try{
 const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'precipitation.ts',reportDiagnostics:true}),errors=(out.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);assert.equal(errors.length,0,errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));
 const file=join(dir,'precipitation.mjs');await writeFile(file,out.outputText);const mod=await import(`${pathToFileURL(file).href}?v=${Date.now()}`),base={probability:80,cloud:55,lowCloud:20,humidity:76,isDay:true,leadHours:6};
 const directShowers={...base,precipitation:.8,rain:.1,showers:.7,snowfall:0,code:61,cape:500,liftedIndex:-2,convectiveInhibition:20,sunshineDuration:1800};
 assert.equal(mod.classifyPrecipitationCharacter(directShowers).character,'convective');assert.ok([80,81,82].includes(mod.reconcileForecastPrecipitation(directShowers).code));
 const directRain={...base,precipitation:.8,rain:.8,showers:0,snowfall:0,code:61,cape:1200,liftedIndex:-4,convectiveInhibition:10,sunshineDuration:2000};
 assert.equal(mod.classifyPrecipitationCharacter(directRain).character,'stratiform','explizites rain-Feld bleibt stärker als CAPE allein');assert.equal(mod.reconcileForecastPrecipitation(directRain).code,61);
 const showerToRain={...base,precipitation:.8,rain:.8,showers:0,snowfall:0,code:80,cloud:95,lowCloud:90,humidity:96,cape:100,liftedIndex:2,convectiveInhibition:200,sunshineDuration:0};
 assert.equal(mod.reconcileForecastPrecipitation(showerToRain).code,61,'geschlossene stratiforme Lage korrigiert einen widersprüchlichen Schauer-Code');
 const mixed={...base,precipitation:.6,rain:.3,showers:.3,snowfall:0,code:61,cape:400,liftedIndex:-1,convectiveInhibition:60,sunshineDuration:900};assert.equal(mod.classifyPrecipitationCharacter(mixed).character,'mixed');assert.equal(mod.reconcileForecastPrecipitation(mixed).code,61,'gemischte Aufteilung wird nicht künstlich in reine Schauer umgedeutet');
 const drizzle={...base,precipitation:.3,rain:.3,showers:0,snowfall:0,code:51,cloud:95,lowCloud:90,humidity:96,temperature:8,dewPoint:7,cloudBaseHft:1200,sunshineDuration:0};assert.equal(mod.precipitationParts(drizzle).type,'drizzle');
 const falseDrizzle={...drizzle,cloud:40,lowCloud:10,humidity:70,dewPoint:2,cloudBaseHft:6000,sunshineDuration:2500};assert.equal(mod.precipitationParts(falseDrizzle).type,'rain');
}finally{await rm(dir,{recursive:true,force:true})}
console.log('Konvektiver/stratiformer Niederschlag geprüft: direkte Modellkomponenten führen, Instabilität stützt, Phase bleibt kohärent.');
