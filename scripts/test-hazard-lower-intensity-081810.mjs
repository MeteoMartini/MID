import {rm,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outDir=path.join(root,'.hazard-lower-intensity-test');
await rm(outDir,{recursive:true,force:true});
const compile=spawnSync('tsc',['--ignoreConfig','src/dwdWarnings.ts','--target','ES2022','--module','ES2022','--moduleResolution','Bundler','--strict','--skipLibCheck','--outDir','.hazard-lower-intensity-test'],{cwd:root,stdio:'inherit',shell:process.platform==='win32'});
if(compile.status!==0)process.exit(compile.status??1);
const {dwdWarningSignalsAt,summarizeDwdWarnings,formatDwdWarningDetailWithDirection}=await import(`${pathToFileURL(path.join(outDir,'dwdWarnings.js')).href}?v=${Date.now()}`);
const [warnings,weather,app,styles,pkg,baseline]=await Promise.all([
 readFile(path.join(root,'src','dwdWarnings.ts'),'utf8'),
 readFile(path.join(root,'src','weather.ts'),'utf8'),
 readFile(path.join(root,'src','App.tsx'),'utf8'),
 readFile(path.join(root,'src','styles.css'),'utf8'),
 readFile(path.join(root,'package.json'),'utf8'),
 readFile(path.join(root,'MID_BASELINE.json'),'utf8')
]);
const failures=[];
const hour=(clock,gustKmh,direction)=>({time:`2026-07-30T${clock}:00`,epoch:Date.parse(`2026-07-30T${clock}:00:00Z`),temperature:18,apparent:18,precipitation:0,rain:0,showers:0,snowfall:0,gust:gustKmh/1.852,direction,code:0,visibility:10000});
const result=summarizeDwdWarnings([
 hour('14',54,270),
 hour('15',71,225),
 hour('16',71,225),
 hour('17',54,315)
]);
const wind=result.filter(signal=>signal.kind==='wind');
const low=wind.find(signal=>signal.title==='Windböen');
const high=wind.find(signal=>signal.title==='Sturmböen');
if(wind.length!==2)failures.push(`Erwartet wurden zwei Windwarnstufen, erhalten: ${wind.map(item=>item.title).join(', ')}`);
if(!low)failures.push('Niedrigere Warnstufe Windböen fehlt.');
else{
 if(!low.lowerIntensity)failures.push('Niedrigere Warnstufe ist nicht gekennzeichnet.');
 if(low.validFrom!=='2026-07-30T14:00:00.000Z'||low.validTo!=='2026-07-30T18:00:00.000Z')failures.push(`Zeitraum Windböen falsch: ${low.validFrom}–${low.validTo}`);
 const detail=formatDwdWarningDetailWithDirection(low);
 if(!detail.includes('Windböen über 27 kt (50 km/h); zeitweise bis 38 kt (71 km/h)'))failures.push(`Text der niedrigeren Warnstufe falsch: ${detail}`);
}
if(!high)failures.push('Höhere Warnstufe Sturmböen fehlt.');
else{
 if(high.lowerIntensity)failures.push('Höchste Warnstufe wurde fälschlich als niedrigere Stufe markiert.');
 if(high.validFrom!=='2026-07-30T15:00:00.000Z'||high.validTo!=='2026-07-30T17:00:00.000Z')failures.push(`Zeitraum Sturmböen falsch: ${high.validFrom}–${high.validTo}`);
}
const rainStages=dwdWarningSignalsAt([{time:'2026-07-30T14:00',epoch:Date.parse('2026-07-30T14:00:00Z'),temperature:18,apparent:18,precipitation:45,rain:45,showers:0,snowfall:0,gust:0,direction:270,code:63,visibility:10000}],0).filter(signal=>signal.kind==='heavyRain');
if(rainStages.map(signal=>signal.level).join(',')!=='4,3,2')failures.push(`Kumulative Starkregenstufen fehlen: ${rainStages.map(signal=>signal.level).join(',')}`);
const iceStages=dwdWarningSignalsAt([{time:'2026-07-30T14:00',epoch:Date.parse('2026-07-30T14:00:00Z'),temperature:-1,apparent:-2,precipitation:2,rain:2,showers:0,snowfall:0,gust:0,direction:270,code:67,visibility:5000}],0).filter(signal=>signal.kind==='ice');
if(iceStages.map(signal=>signal.level).join(',')!=='3,2,1')failures.push(`Kumulative Glättestufen fehlen: ${iceStages.map(signal=>signal.level).join(',')}`);
const frostSamples=Array.from({length:3},(_,index)=>({time:`2026-07-30T${String(index+2).padStart(2,'0')}:00`,epoch:Date.parse(`2026-07-30T${String(index+2).padStart(2,'0')}:00:00Z`),temperature:-11,apparent:-14,precipitation:0,rain:0,showers:0,snowfall:0,gust:0,direction:0,code:0,visibility:10000}));
const frostStages=dwdWarningSignalsAt(frostSamples,0).filter(signal=>signal.kind==='frost');
if(frostStages.map(signal=>signal.level).join(',')!=='2,1')failures.push(`Kumulative Froststufen fehlen: ${frostStages.map(signal=>signal.level).join(',')}`);
for(const token of ['function windClassifications(kmh:number)','function warningStageKey(signal:DwdWarningSignal)','lowerIntensity?:boolean','warningIntervalsOverlap(signal,other)'])if(!warnings.includes(token))failures.push(`Mehrstufenlogik fehlt: ${token}`);
for(const token of ['kind?:DwdWarningKind;lowerIntensity?:boolean','kind:signal.kind,lowerIntensity:signal.lowerIntensity'])if(!weather.includes(token))failures.push(`Hazard-Datenvertrag fehlt: ${token}`);
for(const token of ['lower-intensity','Niedrigere Stufe'])if(!app.includes(token))failures.push(`Warnkartendarstellung fehlt: ${token}`);
for(const token of ['.hazard-title-line{','.hazards article.lower-intensity{'])if(!styles.includes(token))failures.push(`Kompaktes Mehrstufen-CSS fehlt: ${token}`);
if(!pkg.includes('test:hazard-lower-intensity'))failures.push('Package-Testeintrag fehlt.');
if(!baseline.includes('scripts/test-hazard-lower-intensity-081810.mjs'))failures.push('Baseline-Testeintrag fehlt.');
await rm(outDir,{recursive:true,force:true});
if(failures.length){console.error('Warnstufenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Warnstufenprüfung bestanden: niedrigere und höhere Intensitätsstufen werden parallel mit eigenen Zeiträumen, Texten und kompakter Kennzeichnung ausgegeben.');
