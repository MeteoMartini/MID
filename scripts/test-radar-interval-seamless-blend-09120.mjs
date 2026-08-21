import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require(join(String(execFileSync('npm',['root','-g'])).trim(),'typescript'))}

const root=new URL('../',import.meta.url);
const shortTerm=readFileSync(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8');
const fusion=readFileSync(new URL('../src/forecastFusion.ts',import.meta.url),'utf8');
const twin=readFileSync(new URL('../src/forecastVerification.ts',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const blendSource=readFileSync(new URL('../src/forecastFusion.ts',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));

assert.ok(shortTerm.includes('isQuarterInterval=offsetMinutes<=QUARTER_STEP_COUNT*15'),'15-Minuten-Raster muss unabhängig vom Vorhandensein nativer Viertelstundendaten bestimmt werden.');
assert.ok(shortTerm.includes("intervalLabel:isQuarterInterval?'15 min':'1 h'"),'Bezugsintervall muss dem Zeitraster entsprechen.');
assert.ok(shortTerm.includes('base.precipitation*intervalFactor'),'Stündliche Modellmenge muss für Viertelstunden auf das Intervall skaliert werden.');
assert.ok(!shortTerm.includes('intervalMinutes=quarter?15:60'),'Alte fehlerhafte Intervallableitung ist noch vorhanden.');
assert.ok(fusion.includes('blendRadarAtTarget'),'Operativer Stunden-Nowcast nutzt nicht den zentralen Radar-Modell-Blend.');
assert.ok(fusion.includes('RADAR_TRANSITION_HORIZON_MINUTES'),'Auslaufender Radar-Timing-Übergang fehlt.');
assert.ok(!fusion.includes('minutes>210'),'Direkte alte 210-Minuten-Radarfortschreibung ist noch vorhanden.');
assert.ok(!twin.includes('applyOperationalNowcastHours(locallyAdjusted,radar)'),'Wetterzwilling darf Radar nicht mehr in einem separaten Parallelpfad anwenden.');
assert.ok(app.includes('finalizeForecastHours(twinHours,baseDisplayDays,{radar:radarAnalysis,thunder:thunderAnalysis,observedTemperature:finalizationObservedTemperature})'),'Aktive Wetterzwilling-Stunden laufen nicht durch dieselbe zentrale Radar-/Modell-Endstufe wie die Ortsvorhersage.');
assert.ok(!twin.includes('Number(radar.currentRate))*.25'),'Wetterzwilling schreibt weiterhin direkte Radarintensität pauschal fort.');
assert.equal(pkg.version,baseline.releaseVersion,'Releaseversion des Radar-Blend-Buildfixstands stimmt nicht mit der Baseline überein.');

const directory=mkdtempSync(join(tmpdir(),'mid-radar-blend-'));
try{
 const executable=blendSource.replace("import {fetchWorkerJson} from './workerClient';","const fetchWorkerJson=async()=>{throw new Error('not used')};").replace("import {reconcileForecastPrecipitation} from './precipitation';","const reconcileForecastPrecipitation=input=>input;").replace("import {readStoredJsonCache,writeStoredJsonCache} from './cachePolicy';","const readStoredJsonCache=()=>undefined;const writeStoredJsonCache=()=>false;").replace("import type {Day,Hour,RadarNowcast,RadarNowcastFrame,ThunderstormNowcast} from './weather';",'');
 const compiled=ts.transpileModule(executable,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},fileName:'forecastFusion.ts'}).outputText;
 const modulePath=join(directory,'radarBlend.mjs');writeFileSync(modulePath,compiled);
 const {blendRadarAtTarget}=await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
 const now=Date.now(),radar={source:'dwd',provider:'DWD',quality:'high',radarProbability:96,currentRate:177.6,peakRate:177.6,coverage:true,arrivalMinutes:0,endMinutes:180,summary:'Test'};
 const quarter=blendRadarAtTarget({radar,targetEpoch:now+75*60000,intervalMinutes:15,modelAmount:.1,modelProbability:20,now});
 assert.equal(quarter?.mode,'direct','75-Minuten-Punkt muss im direkten Radarfenster liegen.');
 assert.ok(Number(quarter?.amount)<44.5,'15-Minuten-Menge darf nicht als volle mm/h-Rate ausgegeben werden.');
 assert.ok(Number(quarter?.amount)>0&&Number(quarter?.amount)<177.6,'Radarintensität wurde nicht plausibel auf Intervallmenge und Modellblend umgerechnet.');
 assert.ok(Number(quarter?.radarRateMmh)<=160,'Extremrate wurde nicht qualitätsabhängig plausibilisiert.');
 const transition=blendRadarAtTarget({radar,targetEpoch:now+150*60000,intervalMinutes:60,modelAmount:2.4,modelProbability:35,now});
 assert.equal(transition?.mode,'transition','Zwischen 2 und 3 Stunden darf Radar nur noch als Übergangssignal wirken.');
 assert.equal(transition?.amount,2.4,'Jenseits von zwei Stunden darf keine direkte Radarmenge fortgeschrieben werden.');
 assert.ok(Number(transition?.probability)>35,'Radar-Timing sollte die Modellwahrscheinlichkeit im Übergangsfenster noch schwach beeinflussen.');
 const beyond=blendRadarAtTarget({radar,targetEpoch:now+181*60000,intervalMinutes:60,modelAmount:2.4,modelProbability:35,now});
 assert.equal(beyond,null,'Nach drei Stunden darf der Radarblend nicht mehr wirken.');
 console.log('Radarintervall und nahtloser 0–180-Minuten-Blend fachlich geprüft.');
}finally{rmSync(directory,{recursive:true,force:true})}
