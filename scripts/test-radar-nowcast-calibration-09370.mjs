import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const calibrationSource=fs.readFileSync(path.join(root,'src','RadarNowcastCalibration.ts'),'utf8');
const weatherSource=fs.readFileSync(path.join(root,'src','weather.ts'),'utf8');
const fusionSource=fs.readFileSync(path.join(root,'src','forecastFusion.ts'),'utf8');
const workerSource=fs.readFileSync(path.join(root,'worker','metar-proxy.js'),'utf8');
const rsSource=fs.readFileSync(path.join(root,'src','DwdRsSource.ts'),'utf8');
const hxSource=fs.readFileSync(path.join(root,'src','HxRadarPointSource.ts'),'utf8');

for(const token of ['applyRsAmountCalibration','applyHxBoundaryCalibration','applyStationAmountCalibration','applyRadarNowcastEnsemble','needsHxBoundaryCheck','9-member timing/intensity ensemble','distanceWeight=clamp','ageWeight=clamp'])assert.ok(calibrationSource.includes(token),`Kalibrierungsbaustein fehlt: ${token}`);
for(const token of ['loadDwdRsCalibration','loadHxBoundaryCheck','finalizeRadarNowcastCalibration','nativeRainStationCalibration','if(fast&&dwdExpected)'])assert.ok(weatherSource.includes(token),`Radar-Enrichment fehlt: ${token}`);
assert.ok(fusionSource.includes('Number(frame.amountMm)'), 'Stunden-Nowcast verwendet die kalibrierte 5-Minuten-Menge noch nicht.');
for(const token of ["DWD_RS_ROOTS","mode==='rs-file'","mode==='rs-meta'",'localGrid=motionGrid','radarGrowthDecayFromFields','preferredFieldMotion',"weather?.precipitation_10","url.searchParams.set('max_dist','15000')",'ageMs>30*60000'])assert.ok(workerSource.includes(token),`Worker-Nowcast-Baustein fehlt: ${token}`);
assert.ok(rsSource.includes("leadMinutes===60||frame.leadMinutes===120"),'RS-Anker +60/+120 fehlen.');
assert.ok(hxSource.includes("meta.product!=='hx'"),'HX-Grenzprüfung muss auf das nationale 250-m-Komposit begrenzt bleiben.');

// RS-TAR-Parser funktional absichern: Cloudflare darf aus dem amtlichen Container
// exakt die HDF5-Mitglieder +060/+120 extrahieren, ohne den kompletten TAR an den Browser zu senden.
{
 const begin=workerSource.indexOf('function tarText('),end=workerSource.indexOf('async function dwdRsFileResponse',begin),snippet=workerSource.slice(begin,end),factory=new Function('TextDecoder',`${snippet}; return {tarEntries};`),{tarEntries}=factory(TextDecoder);
 const encoder=new TextEncoder(),octal=(value,length)=>String(value.toString(8)).padStart(length-1,'0')+'\\0',header=(name,size)=>{const bytes=new Uint8Array(512);bytes.set(encoder.encode(name).slice(0,100),0);bytes.set(encoder.encode('0000644\\0'),100);bytes.set(encoder.encode('0000000\\0'),108);bytes.set(encoder.encode('0000000\\0'),116);bytes.set(encoder.encode(octal(size,12)),124);bytes[156]='0'.charCodeAt(0);bytes.set(encoder.encode('ustar\\0'),257);return bytes},entry=(name,payload)=>{const data=encoder.encode(payload),padding=(512-data.length%512)%512,out=new Uint8Array(512+data.length+padding);out.set(header(name,data.length),0);out.set(data,512);return out},a=entry('composite_rs_20260810_0945_060-hd5','RS60'),b=entry('composite_rs_20260810_0945_120-hd5','RS120'),tar=new Uint8Array(a.length+b.length+1024);tar.set(a,0);tar.set(b,a.length);const parsed=tarEntries(tar.buffer);
 assert.deepEqual(parsed.entries.map(entry=>entry.name),['composite_rs_20260810_0945_060-hd5','composite_rs_20260810_0945_120-hd5']);assert.equal(new TextDecoder().decode(parsed.bytes.slice(parsed.entries[1].dataStart,parsed.entries[1].dataEnd)),'RS120');
}

const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const executable=calibrationSource
 .replace("import type {RadarNowcast,RadarNowcastFrame} from './weather';",'')
 .replace("import type {DwdRsCalibration} from './DwdRsSource';",'')
 .replace("import type {HxBoundaryCheck} from './HxRadarPointSource';",'');
const transpiled=ts.transpileModule(executable,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true,fileName:'RadarNowcastCalibration.ts'});
const diagnostics=(transpiled.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);assert.equal(diagnostics.length,0,diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'mid-radar-cal-')),modulePath=path.join(temp,'cal.mjs');fs.writeFileSync(modulePath,transpiled.outputText);const mod=await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
try{
 const base=Date.UTC(2026,7,10,9,0),frames=[];for(let lead=-10;lead<=120;lead+=5)frames.push({time:new Date(base+lead*60000).toISOString(),rate:lead<=0?1.2:lead<=60?2.4:1.8,nearbyRate:2.8,siteSupport:lead<=45?.35:.7,nearestWetKm:.4,hitClass:'site',future:lead>0});
 const radar={source:'dwd',provider:'DWD RV',quality:'high',radarProbability:95,currentRate:1.2,peakRate:2.8,coverage:true,observedAt:new Date(base).toISOString(),siteEchoThreshold:.05,nearbyEchoThreshold:.18,growthRatePerHour:-.22,growthTrend:'decaying',growthConfidence:'medium',nowcastSeries:frames,summary:'Test',motionConfidence:'medium',diagnostics:{meteorologicalContext:{cape:80}}};
 const rs={available:true,observedAt:new Date(base).toISOString(),provider:'DWD',product:'RS',anchors:[{leadMinutes:60,amountMm:.7,nearbyAmountMm:.8,source:'DWD RS',confidence:'high'},{leadMinutes:120,amountMm:.45,nearbyAmountMm:.5,source:'DWD RS',confidence:'high'}]};
 const calibrated=mod.applyRsAmountCalibration(radar,rs);assert.ok(calibrated.amountSource.includes('DWD RS'),'RS wurde nicht als Mengenanker verwendet');assert.ok(calibrated.forecastAmount60<1.05&&calibrated.forecastAmount60>.45,'RS-Kalibrierung der ersten Stunde ist unplausibel');assert.ok(calibrated.forecastAmount120<1.7,'2-h-Menge wurde trotz RS noch überschätzt');
 const hx=mod.applyHxBoundaryCalibration(calibrated,{available:true,observedAt:new Date(base).toISOString(),centerRate:.01,siteSupport:.04,nearestWetKm:1.4,strongEcho:false,source:'DWD HX 250 m'});const earlyBefore=calibrated.nowcastSeries.filter(x=>x.future&&Date.parse(x.time)<=base+45*60000).reduce((sum,x)=>sum+(x.amountMm||0),0),earlyAfter=hx.nowcastSeries.filter(x=>x.future&&Date.parse(x.time)<=base+45*60000).reduce((sum,x)=>sum+(x.amountMm||0),0);assert.ok(earlyAfter<earlyBefore*.8,'HX-Randprüfung dämpft einen schwach gestützten RV-Treffer nicht ausreichend');
 const station=mod.applyStationAmountCalibration(hx,{available:true,name:'DWD Test',provider:'DWD',observedAt:new Date(base).toISOString(),distanceKm:6,amount10m:.05},base);const earlyStation=station.nowcastSeries.filter(x=>x.future&&Date.parse(x.time)<=base+30*60000).reduce((sum,x)=>sum+(x.amountMm||0),0);assert.ok(earlyStation<=earlyAfter,'trockener Stationsabgleich darf die frühe Radar-Menge nicht erhöhen');
 const distantStation=mod.applyStationAmountCalibration(hx,{available:true,name:'DWD Fern',provider:'DWD',observedAt:new Date(base-25*60000).toISOString(),distanceKm:14,amount10m:.05},base);const earlyDistant=distantStation.nowcastSeries.filter(x=>x.future&&Date.parse(x.time)<=base+30*60000).reduce((sum,x)=>sum+(x.amountMm||0),0);assert.ok(earlyStation<=earlyDistant,'eine nahe/frische Station muss stärker gewichtet werden als eine ferne/ältere Station');
 const ensemble=mod.applyRadarNowcastEnsemble(station);assert.equal(ensemble.ensemble.members,9);assert.ok(ensemble.ensemble.totalP25<=ensemble.ensemble.totalMedian&&ensemble.ensemble.totalMedian<=ensemble.ensemble.totalP75,'Ensemble-Quantile sind nicht monoton');assert.ok(ensemble.nowcastSeries.some(x=>x.future&&Number.isFinite(x.amountP25)&&Number.isFinite(x.amountP75)),'5-Minuten-Ensemble-Spanne fehlt');
 const noRs=mod.applyRsAmountCalibration({...radar,growthRatePerHour:-.5},null),first=noRs.nowcastSeries.find(x=>x.future),last=[...noRs.nowcastSeries].reverse().find(x=>x.future);assert.ok((last?.growthFactor??1)<(first?.growthFactor??1),'Zerfall wird mit der Vorhersagezeit nicht stärker berücksichtigt');
}finally{fs.rmSync(temp,{recursive:true,force:true})}
console.log('MID v0.9.37.0: RS-Mengenanker, HX-Randprüfung, Wachstum/Zerfall, lokales Bewegungsfeld, 9-Member-Ensemble und Stationskalibrierung geprüft.');
