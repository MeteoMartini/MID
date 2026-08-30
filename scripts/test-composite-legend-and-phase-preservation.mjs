import {readFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [radar,styles,precipitation,route]=await Promise.all([
 readFile(path.join(root,'src','RadarPanel.tsx'),'utf8'),
 readFile(path.join(root,'src','styles.css'),'utf8'),
 readFile(path.join(root,'src','precipitation.ts'),'utf8'),
 readFile(path.join(root,'src','RouteWeatherPanel.tsx'),'utf8')
]);
const failures=[];
for(const token of [
 "const[expanded,setExpanded]=useState(false)",
 "aria-label={expanded?'Komposit-Legende verkleinern':'Komposit-Legende vergrößern'}",
 "expanded&&<div className=\"radarlegend-details\"",
 "className={`radarlegend compact ${expanded?'expanded':'collapsed'}`}"
])if(!radar.includes(token))failures.push(`Einklappbare Komposit-Legende fehlt: ${token}`);
for(const token of ['.radarlegend.compact.collapsed','.radarlegend.compact.expanded','.radarlegend-toggle','.radarlegend-details'])if(!styles.includes(token))failures.push(`Legenden-CSS fehlt: ${token}`);
for(const token of [
 "const convectiveLean=character.character==='convective'||hasShowers",
 "type=drizzlePlausible(h,total)?'drizzle':convectiveLean?'showers':'rain'",
 "type=snowGrainsPlausible(h,total)?'snowGrains':convectiveLean?'snowShowers':'snow'",
 "type=codedType;",
 "Der WMO-Code bleibt für die Phase"
])if(!precipitation.includes(token))failures.push(`Phasenerhaltende Plausibilitätslogik fehlt: ${token}`);
if(precipitation.includes('snowPlausible('))failures.push('Temperaturbasierte Schnee-zu-Regen-Umschaltung ist noch vorhanden.');
if(!route.includes('Die feste oder flüssige Phase des WMO-Codes bleibt unverändert.'))failures.push('Routenwetter erklärt die phasenerhaltende Logik nicht.');

const outDir=path.join(root,'.phase-preservation-test');
await rm(outDir,{recursive:true,force:true});
const compile=spawnSync('tsc',['--ignoreConfig','src/precipitation.ts','--target','ES2022','--module','ES2022','--moduleResolution','Bundler','--strict','--skipLibCheck','--outDir','.phase-preservation-test'],{cwd:root,stdio:'inherit',shell:process.platform==='win32'});
if(compile.status!==0)process.exit(compile.status??1);
const {precipitationParts}=await import(`${pathToFileURL(path.join(outDir,'precipitation.js')).href}?v=${Date.now()}`);
const sample=(overrides={})=>({precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:0,...overrides});
const cases=[
 ['warmer Schneefall',sample({code:73,temperature:7,precipitation:1,rain:1}), 'snow'],
 ['warmer Schneeschauer',sample({code:85,temperature:8,precipitation:1,showers:1}), 'showers'],
 ['unplausibler Schneegriesel',sample({code:77,temperature:6,humidity:55,lowCloud:10,cloud:30,precipitation:.4,rain:.4}), 'snow'],
 ['unplausibler Sprühregen',sample({code:53,temperature:-4,humidity:60,lowCloud:15,cloud:40,precipitation:.4,snowfall:.5}), 'rain']
];
for(const [name,input,expected] of cases){const actual=precipitationParts(input).type;if(actual!==expected)failures.push(`${name}: erwartet ${expected}, erhalten ${actual}`)}
await rm(outDir,{recursive:true,force:true});
if(failures.length){console.error('Komposit-Legenden-/Phasenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Komposit-Legende und phasenerhaltende Sprühregen-/Schneegriesel-Plausibilisierung geprüft.');
