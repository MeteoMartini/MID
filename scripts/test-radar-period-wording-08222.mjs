import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}

const [app,worker,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
const forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: unerlaubt ${token}`)};

for(const token of [
 'Niederschlag am Standort voraussichtlich von ${arrivalStart} bis ${end} Uhr',
 'Möglicher Standorttreffer zwischen ${arrivalWindow.replace',
 "const nearby=radar.arrivalKind==='nearby'||radar.arrivalKind==='approximate'"
])need('Radartext',app,token);
forbid('Radartext',app,"Radarecho erreicht den Standort voraussichtlich'} in ${minuteText} Minuten");
for(const token of [
 'function radarFrameEnd(frames,index)',
 'const lastIndex=future.indexOf(last),eventEnd=radarFrameEnd(future,lastIndex)',
 'endAt=new Date(eventEnd).toISOString()'
])need('Worker-Ereignisende',worker,token);
need('Package-Test',pkg,'test:radar-period-wording');
need('Baseline-Test',baseline,'scripts/test-radar-period-wording-08222.mjs');

const dir=await mkdtemp(join(tmpdir(),'mid-08222-'));
try{
 const workerFile=join(dir,'worker.mjs');
 await writeFile(workerFile,`${worker}\nexport {radarResultFromFrames};\n`);
 const workerModule=await import(`${pathToFileURL(workerFile).href}?v=${Date.now()}`);
 const observed=Date.parse('2026-07-30T19:10:00Z');
 const frames=[
  {time:observed,center:0,nearby:0,future:false},
  {time:Date.parse('2026-07-30T19:50:00Z'),center:7,nearby:7,future:true},
  {time:Date.parse('2026-07-30T20:00:00Z'),center:5,nearby:5,future:true},
  {time:Date.parse('2026-07-30T20:10:00Z'),center:0,nearby:0,future:true},
  {time:Date.parse('2026-07-30T20:20:00Z'),center:0,nearby:0,future:true}
 ];
 const result=workerModule.radarResultFromFrames('dwd','DWD-RV','high',frames,'DWD',{latitude:50.8,echoProfile:{mode:'summer-filter',label:'Sommer',siteThreshold:.06,nearbyThreshold:.2}});
 if(result.arrivalStartAt!=='2026-07-30T19:50:00.000Z')failures.push(`Worker: falscher Beginn ${result.arrivalStartAt}`);
 if(result.endAt!=='2026-07-30T20:10:00.000Z')failures.push(`Worker: Ende muss Intervallende 20:10 sein, erhalten ${result.endAt}`);
 if(result.endMinutes!==60)failures.push(`Worker: Ende relativ zum Datenstand muss 60 min sein, erhalten ${result.endMinutes}`);

 const start=app.indexOf('function radarSummary('),finish=app.indexOf('\nfunction combineRadarAndModel',start);
 if(start<0||finish<0)throw new Error('radarSummary konnte nicht extrahiert werden');
 const functionSource=app.slice(start,finish);
 const stub=`
  type RadarNowcast=any;
  const radarClock=(value?:string)=>value?String(value).slice(11,16):'';
  const radarClockRange=(start?:string,end?:string)=>start&&end?radarClock(start)+'–'+radarClock(end):start?radarClock(start):'';
  const radarSiteThreshold=(radar:any)=>Number(radar.siteEchoThreshold)||.05;
  const radarIntensity=(rate:number)=>rate>=5?'mäßig':'leicht';
  const radarRateText=(rate:number)=>rate>0?rate.toFixed(1).replace('.',',')+' mm/h':'';
  ${functionSource}
  export {radarSummary};
 `;
 const compiled=ts.transpileModule(stub,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'radarSummary.ts'}).outputText;
 const appFile=join(dir,'radarSummary.mjs');await writeFile(appFile,compiled);
 const appModule=await import(`${pathToFileURL(appFile).href}?v=${Date.now()}`);
 const siteText=appModule.radarSummary({...result,currentRate:0,peakRate:7,arrivalKind:'site',rateApproximate:false,rateUncertain:false},'UTC');
 if(siteText!=='Niederschlag am Standort voraussichtlich von 19:50 bis 20:10 Uhr · mäßig · 7,0 mm/h.')failures.push(`Standorttext: ${siteText}`);
 const nearbyText=appModule.radarSummary({arrivalKind:'approximate',arrivalStartAt:'2026-07-30T19:50:00.000Z',arrivalEndAt:'2026-07-30T20:30:00.000Z',currentRate:0,peakRate:1,siteEchoThreshold:.06,rateApproximate:true,rateUncertain:true},'UTC');
 if(!nearbyText.startsWith('Möglicher Standorttreffer zwischen 19:50 und 20:30 Uhr; noch unsicher'))failures.push(`Unsicherheitsfenster: ${nearbyText}`);
}finally{await rm(dir,{recursive:true,force:true})}

if(failures.length){console.error('Radar-Zeitraumprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Radar-Niederschlagszeitraum, unsicheres Ankunftsfenster und Worker-Ereignisende geprüft.');
