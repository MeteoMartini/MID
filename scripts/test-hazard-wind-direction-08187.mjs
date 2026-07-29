import {rm,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outDir=path.join(root,'.hazard-wind-direction-test');
await rm(outDir,{recursive:true,force:true});
const compile=spawnSync('tsc',['src/dwdWarnings.ts','--target','ES2022','--module','ES2022','--moduleResolution','Bundler','--strict','--skipLibCheck','--outDir','.hazard-wind-direction-test'],{cwd:root,stdio:'inherit',shell:process.platform==='win32'});
if(compile.status!==0)process.exit(compile.status??1);
const {summarizeDwdWarnings,formatDwdWarningDirection,formatDwdWarningDetailWithDirection}=await import(`${pathToFileURL(path.join(outDir,'dwdWarnings.js')).href}?v=${Date.now()}`);
const [warnings,weather,app,ensemble,styles,pkg,baseline]=await Promise.all([
 readFile(path.join(root,'src','dwdWarnings.ts'),'utf8'),
 readFile(path.join(root,'src','weather.ts'),'utf8'),
 readFile(path.join(root,'src','App.tsx'),'utf8'),
 readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8'),
 readFile(path.join(root,'src','styles.css'),'utf8'),
 readFile(path.join(root,'package.json'),'utf8'),
 readFile(path.join(root,'MID_BASELINE.json'),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const sample=(hour,direction,gust=70/1.852)=>({time:`2026-07-30T${String(hour).padStart(2,'0')}:00`,epoch:Date.parse(`2026-07-30T${String(hour).padStart(2,'0')}:00:00Z`),temperature:16,apparent:16,precipitation:0,rain:0,showers:0,snowfall:0,gust,windDirection:direction,code:0,visibility:10000});

const changing=summarizeDwdWarnings([sample(8,225),sample(9,230),sample(10,315),sample(11,320)]).find(signal=>signal.kind==='wind');
if(!changing)failures.push('Windwarnung mit Richtungswechsel fehlt.');
else{if(formatDwdWarningDirection(changing)!=='Anfangs aus südwestlicher, später aus nordwestlicher Richtung')failures.push(`Richtungswechsel falsch: ${formatDwdWarningDirection(changing)}`);if(formatDwdWarningDetailWithDirection(changing)!=='Sturmböen bis 38 kt (70 km/h); anfangs aus südwestlicher, später aus nordwestlicher Richtung.')failures.push(`Richtungswechsel nicht im Warntext: ${formatDwdWarningDetailWithDirection(changing)}`)}
const steady=summarizeDwdWarnings([sample(8,220),sample(9,225),sample(10,230)]).find(signal=>signal.kind==='wind');
if(!steady)failures.push('Konstante Windwarnung fehlt.');
else{if(formatDwdWarningDirection(steady)!=='Aus südwestlicher Richtung')failures.push(`Konstante Richtung falsch: ${formatDwdWarningDirection(steady)}`);if(formatDwdWarningDetailWithDirection(steady)!=='Sturmböen bis 38 kt (70 km/h) aus südwestlicher Richtung.')failures.push(`Konstante Richtung nicht im Warntext: ${formatDwdWarningDetailWithDirection(steady)}`)}
const north=summarizeDwdWarnings([sample(8,350),sample(9,5),sample(10,10)]).find(signal=>signal.kind==='wind');
if(!north)failures.push('Nord-Windwarnung fehlt.');
else if(formatDwdWarningDirection(north)!=='Aus nördlicher Richtung')failures.push(`360°-Übergang falsch: ${formatDwdWarningDirection(north)}`);

for(const token of [
 'windDirection?:number;',
 'windDirectionText?:string',
 'function circularMeanDirection(values:number[])',
 'function warningWindDirectionText(occurrences:WarningOccurrence[])',
 'Anfangs aus ${windDirectionAdjective(early)}, später aus ${windDirectionAdjective(late)} Richtung',
 'export function formatDwdWarningDirection(signal:DwdWarningSignal)',
 'export function formatDwdWarningDetailWithDirection(signal:DwdWarningSignal',
 "windDirectionText:selected.signal.kind==='wind'?warningWindDirectionText(interval.members):undefined"
])need('Warnrichtungs-Berechnung',warnings,token);
for(const token of [
 'formatDwdWarningDetailWithDirection',
 'text:`${formatDwdWarningDetailWithDirection(signal,unit)} Automatisch aus dem Open-Meteo-Best-Match abgeleitet; keine amtliche Warnung.`'
])need('Hazard-Datenvertrag',weather,token);
for(const token of [
 '<span>{x.text}</span>{validity&&',
 "detail:[formatDwdWarningDetail(signal,unit),formatDwdWarningDirection(signal)].filter(Boolean).join(' ')"
])need('Warnrichtungs-Darstellung',app,token);
for(const forbidden of ['className="hazard-wind-direction"','Modellierte Windrichtung im Warnzeitraum'])if(app.includes(forbidden))failures.push(`Separate Windrichtungs-Kapsel ist weiterhin aktiv: ${forbidden}`);
need('Ensemble-Hazard',ensemble,"formatDwdWarningDirection(signal)");
if(styles.includes('.hazard-wind-direction'))failures.push('Veraltete CSS-Regeln der Windrichtungs-Kapsel sind weiterhin vorhanden.');
need('Package-Test',pkg,'test:hazard-wind-direction');
need('Baseline-Test',baseline,'scripts/test-hazard-wind-direction-08187.mjs');

await rm(outDir,{recursive:true,force:true});
if(failures.length){console.error('Windrichtungs-Warnprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Eigene Windwarnungen geprüft: konstante Richtung, Richtungswechsel und 360°-Übergang stehen direkt im Warntext; eine separate Richtungskapsel ist entfernt.');
