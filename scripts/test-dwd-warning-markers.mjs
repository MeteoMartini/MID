import {rm,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outDir=path.join(root,'.dwd-warning-test');
await rm(outDir,{recursive:true,force:true});
const compile=spawnSync('tsc',['src/dwdWarnings.ts','--target','ES2022','--module','ES2022','--moduleResolution','Bundler','--strict','--skipLibCheck','--outDir','.dwd-warning-test'],{cwd:root,stdio:'inherit',shell:process.platform==='win32'});
if(compile.status!==0)process.exit(compile.status??1);
const {dwdWarningSignalsAt,summarizeDwdWarnings,formatDwdWarningValue,formatDwdWarningCompactValue,formatDwdWarningDetail,formatDwdWindValue}=await import(`${pathToFileURL(path.join(outDir,'dwdWarnings.js')).href}?v=${Date.now()}`);
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const ensemble=await readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const failures=[];
const sample=(overrides={})=>({temperature:10,apparent:10,precipitation:0,rain:0,showers:0,snowfall:0,gust:0,code:0,visibility:10000,...overrides});
const signal=(samples,kind,elevation=0,index=0)=>dwdWarningSignalsAt(samples,index,elevation).find(item=>item.kind===kind);

if(signal([sample({gust:50/1.852})],'wind'))failures.push('50 km/h darf die DWD-Schwelle > 50 km/h noch nicht auslösen.');
if(signal([sample({gust:50.1/1.852})],'wind')?.level!==1)failures.push('Mehr als 50 km/h muss Windböen der DWD-Warnstufe 1 auslösen.');
if(signal([sample({gust:65/1.852})],'wind')?.level!==2)failures.push('65 km/h muss DWD-Warnstufe 2 auslösen.');
if(signal([sample({gust:105/1.852})],'wind')?.level!==3)failures.push('105 km/h muss DWD-Warnstufe 3 auslösen.');
if(signal([sample({gust:141/1.852})],'wind')?.level!==4)failures.push('Mehr als 140 km/h muss DWD-Warnstufe 4 auslösen.');
if(signal([sample({rain:15,precipitation:15})],'heavyRain')?.level!==2)failures.push('15 mm in 1 h muss Starkregen Stufe 2 auslösen.');
if(signal(Array.from({length:3},()=>sample({temperature:-10.5})),'frost')?.level!==2)failures.push('Anhaltend unter −10 °C muss strengen Frost Stufe 2 auslösen.');
if(signal([sample({apparent:38.1})],'heat')?.level!==3)failures.push('Gefühlte Temperatur über 38 °C muss extreme Wärmebelastung Stufe 3 auslösen.');
if(signal([sample({code:95})],'thunderstorm')?.level!==1)failures.push('Ein einfaches Gewitter muss DWD-Warnstufe 1 auslösen.');
if(signal([sample({visibility:149})],'fog')?.level!==1)failures.push('Sichtweite unter 150 m muss Nebel der DWD-Warnstufe 1 auslösen.');
if(!summarizeDwdWarnings([sample({gust:70/1.852}),sample({gust:110/1.852})]).some(item=>item.kind==='wind'&&item.level===3))failures.push('Zusammenfassung übernimmt nicht die höchste Warnstufe.');

const windSignal=signal([sample({gust:65/1.852})],'wind');
if(!windSignal)failures.push('Wind-Testsignal fehlt.');
else{
 const kn=formatDwdWarningValue(windSignal,'kn'),kmh=formatDwdWarningValue(windSignal,'kmh'),detail=formatDwdWarningDetail(windSignal,'kn');
 if(!/^35 kt \(65 km\/h\)$/.test(kn))failures.push(`Windwert in kt/km/h unerwartet: ${kn}`);
 if(!/^65 km\/h \(Bft 8\)$/.test(kmh))failures.push(`Windwert in km/h/Bft unerwartet: ${kmh}`);
 if(!detail.includes('35 kt (65 km/h)'))failures.push('Warntext berücksichtigt die gewählte Einheit nicht.');
 if(formatDwdWarningCompactValue(windSignal,'kn')!=='35 kt')failures.push('Kompakter Tageswarnwert enthält weiterhin eine Umrechnung.');
 if(formatDwdWarningCompactValue(windSignal,'kmh')!=='65 km/h')failures.push('Kompakter Tageswarnwert in km/h ist falsch.');
}
if(formatDwdWindValue(50,'kmh')!=='50 km/h (Bft 7)')failures.push('Beaufort-Zusatz für km/h ist falsch.');
const heat=signal([sample({apparent:38.6})],'heat');
if(heat&&/[,.]\d/.test(formatDwdWarningDetail(heat,'kn')))failures.push('Wärme-Warntext enthält weiterhin Kommawerte.');

for(const token of ["minimumLevel:DwdWarningLevel=1","dailyHazards(d,dayHours,elevation,unit,1)",'compact-hazard','formatDwdWarningCompactValue(signal,unit)'])if(!app.includes(token))failures.push(`7-Tage-Hazarddarstellung fehlt: ${token}`);
for(const token of ['detailWarningMarkers(p,hours,elevation)','model-warning-marker','detail-model-warning-tooltip','data-warning-y'])if(app.includes(token))failures.push(`Warnmarker ist im Detaildiagramm noch vorhanden: ${token}`);
for(const token of ['signal.level>=2','Best-Match-Warnhinweise','ensemble-hazard-tooltip'])if(!ensemble.includes(token))failures.push(`Ensemble-Hazard-Tooltip fehlt: ${token}`);
for(const token of ['EnsembleHazardShape','hazardPoints','ensemble-hazard-marker'])if(ensemble.includes(token)||styles.includes(token))failures.push(`Veralteter Ensemble-Hazardmarker ist noch vorhanden: ${token}`);
if(!styles.includes('.forecast-hazards .compact-hazard')||!styles.includes('.ensemble-hazard-tooltip'))failures.push('Hazard-Stile für 7-Tage- und Ensemble-Tooltip fehlen.');

await rm(outDir,{recursive:true,force:true});
if(failures.length){console.error('DWD-Warnkriterien-/Darstellungsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD-Warnungen geprüft: Warntexte sind ganzzahlig und einheitenbewusst; 7-Tage-Hazards zeigen nur Wert und Einheit, Detailmarker sind entfernt und Ensemble-Hazards stehen ab Stufe 2 im Tooltip.');
