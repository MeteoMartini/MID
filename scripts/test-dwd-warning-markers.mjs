import {rm,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outDir=path.join(root,'.dwd-warning-test');
await rm(outDir,{recursive:true,force:true});
const compile=spawnSync('tsc',['src/dwdWarnings.ts','--target','ES2022','--module','ES2022','--moduleResolution','Bundler','--strict','--skipLibCheck','--outDir','.dwd-warning-test'],{cwd:root,stdio:'inherit',shell:process.platform==='win32'});
if(compile.status!==0)process.exit(compile.status??1);
const {dwdWarningSignalsAt,summarizeDwdWarnings}=await import(`${pathToFileURL(path.join(outDir,'dwdWarnings.js')).href}?v=${Date.now()}`);
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const failures=[];
const sample=(overrides={})=>({temperature:10,apparent:10,precipitation:0,rain:0,showers:0,snowfall:0,gust:0,code:0,visibility:10000,...overrides});
const signal=(samples,kind,elevation=0,index=0)=>dwdWarningSignalsAt(samples,index,elevation).find(item=>item.kind===kind);

if(signal([sample({gust:50/1.852})],'wind'))failures.push('50 km/h darf die DWD-Schwelle > 50 km/h noch nicht auslösen.');
if(signal([sample({gust:50.1/1.852})],'wind')?.level!==1)failures.push('Mehr als 50 km/h muss Windböen der DWD-Warnstufe 1 auslösen.');
if(signal([sample({gust:64/1.852})],'wind')?.level!==1)failures.push('64 km/h muss DWD-Warnstufe 1 bleiben.');
if(signal([sample({gust:65/1.852})],'wind')?.level!==2)failures.push('65 km/h muss DWD-Warnstufe 2 auslösen.');
if(signal([sample({gust:90/1.852})],'wind')?.level!==2)failures.push('90 km/h muss als schwere Sturmböe weiterhin Stufe 2 sein.');
if(signal([sample({gust:105/1.852})],'wind')?.level!==3)failures.push('105 km/h muss DWD-Warnstufe 3 auslösen.');
if(signal([sample({gust:120/1.852})],'wind')?.level!==3)failures.push('120 km/h muss DWD-Warnstufe 3 auslösen.');
if(signal([sample({gust:141/1.852})],'wind')?.level!==4)failures.push('Mehr als 140 km/h muss DWD-Warnstufe 4 auslösen.');

if(signal([sample({rain:14.9,precipitation:14.9})],'heavyRain'))failures.push('Starkregenwarnung erscheint unter 15 mm/h.');
if(signal([sample({rain:15,precipitation:15})],'heavyRain')?.level!==2)failures.push('15 mm in 1 h muss Starkregen Stufe 2 auslösen.');
if(signal([sample({rain:25,precipitation:25})],'heavyRain')?.level!==3)failures.push('25 mm in 1 h muss Starkregen Stufe 3 auslösen.');
if(signal([sample({rain:41,precipitation:41})],'heavyRain')?.level!==4)failures.push('Mehr als 40 mm in 1 h muss Starkregen Stufe 4 auslösen.');

const rain24=Array.from({length:24},()=>sample({rain:1.25,precipitation:1.25}));
if(signal(rain24,'continuousRain')?.level!==2)failures.push('30 mm in 24 h muss Dauerregen Stufe 2 auslösen.');
const snowFlat=Array.from({length:24},()=>sample({snowfall:.625,code:73}));
if(signal(snowFlat,'snow',200)?.level!==2)failures.push('15 cm in 24 h im Flachland muss Schneefall Stufe 2 auslösen.');
const snowMountain=Array.from({length:6},()=>sample({snowfall:3.4,code:75}));
if(signal(snowMountain,'snow',1200)?.level!==3)failures.push('Mehr als 20 cm in 6 h im Bergland muss Schneefall Stufe 3 auslösen.');
if(signal([sample({code:56})],'ice')?.level!==2)failures.push('Gefrierender Sprühregen muss markante Glätte Stufe 2 auslösen.');
if(signal([sample({code:67})],'ice')?.level!==3)failures.push('Starker gefrierender Regen muss Glatteis Stufe 3 auslösen.');
if(signal(Array.from({length:3},()=>sample({temperature:-10.5})),'frost')?.level!==2)failures.push('Anhaltend unter −10 °C muss strengen Frost Stufe 2 auslösen.');
if(signal([sample({apparent:38.1})],'heat')?.level!==3)failures.push('Gefühlte Temperatur über 38 °C muss extreme Wärmebelastung Stufe 3 auslösen.');
if(signal([sample({code:95})],'thunderstorm')?.level!==1)failures.push('Ein einfaches Gewitter muss DWD-Warnstufe 1 auslösen.');
if(signal([sample({code:96})],'thunderstorm')?.level!==2)failures.push('Gewitter mit Hagel muss mindestens Stufe 2 auslösen.');

const lightSnow=Array.from({length:6},()=>sample({temperature:-1,snowfall:.5,code:71}));
if(signal(lightSnow,'snow',200)?.level!==1)failures.push('Leichter Schneefall unterhalb der Stufe-2-Menge muss DWD-Warnstufe 1 auslösen.');
if(signal([sample({temperature:-1,rain:.2,precipitation:.2,code:61})],'ice')?.level!==1)failures.push('Niederschlag bei Frost muss als Glätte DWD-Warnstufe 1 auslösen.');
if(signal([sample({temperature:-1})],'frost',200)?.level!==1)failures.push('Frost unter 0 °C in Lagen bis 800 m muss DWD-Warnstufe 1 auslösen.');
if(signal([sample({temperature:-1})],'frost',900))failures.push('Die automatische Frostwarnung darf oberhalb 800 m nicht aus dem Flachlandkriterium abgeleitet werden.');
if(signal([sample({visibility:149})],'fog')?.level!==1)failures.push('Sichtweite unter 150 m muss Nebel der DWD-Warnstufe 1 auslösen.');
if(signal([sample({visibility:150})],'fog'))failures.push('Sichtweite von 150 m darf das Kriterium unter 150 m nicht auslösen.');
const heatStage1=[sample({temperature:26,apparent:33}),...Array.from({length:11},()=>sample({temperature:20.5,apparent:25}))];
if(signal(heatStage1,'heat')?.level!==1)failures.push('Gefühlte Temperatur über etwa 32 °C mit geringer Abkühlung muss Hitzewarnstufe 1 auslösen.');
if(!summarizeDwdWarnings([sample({gust:70/1.852}),sample({gust:110/1.852})]).some(item=>item.kind==='wind'&&item.level===3))failures.push('Zusammenfassung übernimmt nicht die höchste Warnstufe.');

if(!app.includes('.filter(signal=>signal.level>=2)'))failures.push('Die Symbolzeile filtert Warnstufe 1 nicht weiterhin aus.');
for(const token of ['detailWarningMarkers(p,hours,elevation)','warningY=hasWarningMarkers','model-warning-marker','detail-model-warning-tooltip','Best-Match-basierter Hinweis','DWD_WARNING_COLORS[marker.signal.level]'])if(!app.includes(token))failures.push(`Detaildiagramm-Warnhinweis fehlt: ${token}`);
if(!styles.includes('.detail-model-warning-tooltip.level-2')||!styles.includes('.detail-model-warning-tooltip.level-4'))failures.push('Warnintensitäten sind im Tooltip nicht farblich unterscheidbar.');

await rm(outDir,{recursive:true,force:true});
if(failures.length){console.error('DWD-Warnkriterien-/Markerprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD-Warnkriterien geprüft: Warnstufe 1 ist für Wind, Gewitter, leichten Schnee, Glätte, Frost, Nebel und Hitze hinterlegt; die Symbolzeile zeigt weiterhin ausschließlich Best-Match-Warnstufen 2–4.');
