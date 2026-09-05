import {readFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [precipitation,weather,cockpit,app,shortTerm,meteogram,ensemble,water,pkg,baseline]=await Promise.all([
 readFile(path.join(root,'src','precipitation.ts'),'utf8'),
 readFile(path.join(root,'src','weather.ts'),'utf8'),
 readFile(path.join(root,'src','ForecastCockpit.tsx'),'utf8'),
 readFile(path.join(root,'src','App.tsx'),'utf8'),
 readFile(path.join(root,'src','ShortTermForecast.tsx'),'utf8'),
 readFile(path.join(root,'src','MeteogramPanel.tsx'),'utf8'),
 readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8'),
 readFile(path.join(root,'src','WaterSportsPanel.tsx'),'utf8'),
 readFile(path.join(root,'package.json'),'utf8'),
 readFile(path.join(root,'MID_BASELINE.json'),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: fehlt ${token}`)};
for(const token of [
 'export function precipitationAmountLabel',
 "snowfall>=.05?`${base} · ${snowSymbol?'❄ ':''}${formatDecimalFixed(snowfall,1)} cm`:base",
 'export function dominantPrecipitationForm',
 "if(type==='sleet')return'Schneeregen'",
 "if(type==='sleetShowers')return'Schneeregenschauer'",
 "if(type==='snowShowers')return'Schneeschauer'"
])need('Zentrale Niederschlagslogik',precipitation,token);
for(const token of [
 "if(text.includes('schneeregenschauer'))return'Schneeregenschauer'",
 "if(text.includes('schneeschauer'))return'Schneeschauer'",
 "if(text.includes('schneeregen'))return'Schneeregen'",
 "if(text.includes('schneegriesel'))return'Schneegriesel'"
])need('Wettertext',weather,token);
for(const token of [
 'precipitationForm=dominantPrecipitationForm(dayHours)',
 'regimeText=regimeLabel(regime,precipitationForm?.label)',
 '>{conditionText}</span>',
 'precipitationAmountLabel(day)'
])need('7-Tage-Cockpit',cockpit,token);
for(const [label,text] of [
 ['App',app],['Kurzfrist',shortTerm],['Meteogramm',meteogram],['Ensemble',ensemble],['Wassersport',water]
])need(label,text,'precipitationAmountLabel');
need('App-Stundendetail',app,"return amount>.04||snowfall>=.05?precipitationAmountLabel(hour):'–'");
for(const token of [
 '[56,57,66,67,68,69,83,84].includes(code)',
 "code===85||code===86"
])need('Ensemble-Niederschlagsphase',ensemble,token);

const outDir=path.join(root,'.precip-units-test');
await rm(outDir,{recursive:true,force:true});
const compile=spawnSync('tsc',['--ignoreConfig','src/precipitation.ts','--target','ES2022','--module','ES2022','--moduleResolution','Bundler','--strict','--skipLibCheck','--outDir','.precip-units-test'],{cwd:root,stdio:'inherit',shell:process.platform==='win32'});
if(compile.status!==0)process.exit(compile.status??1);
const mod=await import(`${pathToFileURL(path.join(outDir,'precipitation.js')).href}?v=${Date.now()}`);
const sample=(overrides={})=>({precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:0,...overrides});
if(mod.precipitationAmountLabel({precipitation:2,snowfall:3.4})!=='2,0 mm · ❄ 3,4 cm')failures.push(`Schneemenge nicht zusätzlich in cm: ${mod.precipitationAmountLabel({precipitation:2,snowfall:3.4})}`);
if(mod.precipitationAmountLabel({precipitation:2,snowfall:0})!=='2,0 mm')failures.push('Reiner Flüssigniederschlag darf keine cm-Angabe erhalten.');
const snow=mod.precipitationParts(sample({code:75,precipitation:2,snowfall:3.4,probability:90,temperature:-2}));
if(snow.type!=='snow'||!snow.label.includes('2,0 mm · ❄ 3,4 cm'))failures.push(`Schneefall nicht phasen-/mengentreu: ${snow.type}/${snow.label}`);
const sleet=mod.precipitationParts(sample({code:68,precipitation:1.2,rain:.6,snowfall:.8,probability:80,temperature:1}));
if(sleet.type!=='sleet'||!sleet.label.includes('0,8 cm'))failures.push(`Schneeregen nicht phasen-/mengentreu: ${sleet.type}/${sleet.label}`);
const dominantSnow=mod.dominantPrecipitationForm([
 sample({code:71,precipitation:.4,snowfall:.7,probability:70,temperature:-1}),
 sample({code:73,precipitation:.8,snowfall:1.4,probability:85,temperature:-2})
]);
if(dominantSnow?.label!=='Schnee')failures.push(`Tagesdominanz für Schnee fehlerhaft: ${JSON.stringify(dominantSnow)}`);
const dominantSleet=mod.dominantPrecipitationForm([
 sample({code:68,precipitation:.7,rain:.3,snowfall:.4,probability:75,temperature:1}),
 sample({code:69,precipitation:1.1,rain:.4,snowfall:.7,probability:80,temperature:.5})
]);
if(dominantSleet?.label!=='Schneeregen')failures.push(`Tagesdominanz für Schneeregen fehlerhaft: ${JSON.stringify(dominantSleet)}`);
await rm(outDir,{recursive:true,force:true});
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;
if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error(`Appweite Niederschlagsformen-/Schneemengenprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID: Niederschlagsformen phasentreu und Schneefall zusätzlich in cm appweit abgesichert.');
