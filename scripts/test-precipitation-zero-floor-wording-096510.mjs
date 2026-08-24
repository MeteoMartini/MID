import {readFile,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve('.');
const [shortTerm,cockpit,ensemble,wording,travel,baselineRaw,pkgRaw]=await Promise.all([
 readFile('src/ShortTermForecast.tsx','utf8'),
 readFile('src/ForecastCockpit.tsx','utf8'),
 readFile('src/EnsemblePanel.tsx','utf8'),
 readFile('src/forecastWording.ts','utf8'),
 readFile('src/travelPlanner.ts','utf8'),
 readFile('MID_BASELINE.json','utf8'),
 readFile('package.json','utf8')
]);
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
const forbid=(area,text,pattern,label)=>{if(pattern.test(text))failures.push(`${area}: ${label}`)};

need('Kurzfrist-PoP',shortTerm,'const shownProbability=clampValue(Number(signal.probability)||0,0,100);');
forbid('Kurzfrist-PoP',shortTerm,/normalized\s*>\s*0\s*&&\s*normalized\s*<\s*5\s*\?\s*5/,'künstliche 5-%-Untergrenze noch aktiv');
forbid('Kurzfrist-PoP',shortTerm,/function\s+displayProbability\s*\(/,'separate Anzeige-Floor-Funktion noch aktiv');
need('Cockpit-Wortlaut',cockpit,"import {precipitationOutlookText} from './forecastWording';");
need('Cockpit-Wortlaut',cockpit,'laterRainProbabilityMax=Math.max(0,...later.map');
need('Ensemble-Wortlaut',ensemble,"import {precipitationOutlookText} from './forecastWording';");
need('Ensemble-Wortlaut',ensemble,'laterRainProbabilityMax=Math.max(0,...later.map');
need('Zentrale Wortlogik',wording,"if(total<=.1&&maximum<=5)return'trocken';");
need('Reise-Klimawortlaut',travel,"wetShare<=.03&&summary.precipitationTotal<.2?'trocken'");

for(const [name,text] of [['ForecastCockpit',cockpit],['EnsemblePanel',ensemble]]){
 forbid(name,text,/laterRainProbability<=25&&laterRain<1\?'überwiegend trocken'/,'alte pauschale Trockenformulierung noch aktiv');
}

const compileDir=await mkdtemp(path.join(tmpdir(),'mid-pop-wording-'));
try{
 const compile=spawnSync('tsc',['--pretty','false','--target','ES2022','--module','ESNext','--moduleResolution','Bundler','--strict','--skipLibCheck','--outDir',compileDir,path.resolve('src/forecastWording.ts')],{cwd:root,encoding:'utf8'});
 if(compile.status!==0)failures.push(`TypeScript forecastWording: ${compile.stdout||compile.stderr}`);
 else{
  const file=path.join(compileDir,'forecastWording.js');
  const module=await import(`${pathToFileURL(file).href}?v=${Date.now()}`);
  const phrase=module.precipitationOutlookText;
  if(phrase({totalAmount:0,averageProbability:.5,maximumProbability:1,elevatedAmountThreshold:4})!=='trocken')failures.push('0 mm / 0–1 % wird nicht eindeutig als trocken beschrieben.');
  if(phrase({totalAmount:.1,averageProbability:3,maximumProbability:5,elevatedAmountThreshold:4})!=='trocken')failures.push('Quasi ausgeschlossener Niederschlag bis 5 % wird nicht als trocken beschrieben.');
  if(phrase({totalAmount:.6,averageProbability:18,maximumProbability:25,elevatedAmountThreshold:4})!=='überwiegend trocken')failures.push('Geringes, aber reales Restniederschlagsrisiko verliert die abgestufte Formulierung.');
  if(phrase({totalAmount:5,averageProbability:65,maximumProbability:80,elevatedAmountThreshold:4})!=='mit erhöhter Regenneigung')failures.push('Erhöhte Regenneigung wird nicht erhalten.');
 }
}finally{await rm(compileDir,{recursive:true,force:true})}

const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw),testName='scripts/test-precipitation-zero-floor-wording-096510.mjs';
if(baseline.releaseVersion!==pkg.version)failures.push('Baseline-Version nicht synchron.');
if(!(baseline.requiredRegressionTests||[]).includes(testName))failures.push('Neue PoP-/Trockenwortlaut-Regression fehlt in requiredRegressionTests.');
if(!(baseline.regressionTests||[]).includes(testName))failures.push('Neue PoP-/Trockenwortlaut-Regression fehlt in regressionTests.');

if(failures.length){console.error('PoP-Nullboden/Trockenwortlaut fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('PoP geprüft: keine künstliche 5-%-Untergrenze; 0/1/4 % bleiben möglich. Quasi ausgeschlossener Niederschlag wird appweit eindeutig als trocken statt nur überwiegend trocken beschrieben.');
