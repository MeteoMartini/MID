import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const fail=message=>{throw new Error(`v0.9.15.13: ${message}`)};

const fusion=await read('src/forecastFusion.ts');
if(!fusion.includes('RadarNowcastFrame,RadarNowcastInterval,ThunderstormNowcast'))fail('RadarNowcastInterval fehlt im type-only Import von forecastFusion.ts.');
if(!fusion.includes('function parseInterval(interval:RadarNowcastInterval)'))fail('RadarNowcastInterval wird nicht mehr für die Intervallauswertung verwendet.');

const cockpit=await read('src/ForecastCockpit.tsx');
if(cockpit.includes('{peakRainPoint.probability} %'))fail('Niederschlagsrisiko wird weiterhin ungerundet ausgegeben.');
if(!cockpit.includes('{Math.round(peakRainPoint.probability)} %'))fail('Ganzzahlige Cockpit-Prozentanzeige fehlt.');

const verification=await read('src/forecastVerification.ts');
if(/toFixed\(1\)[^\n]{0,120}%/.test(verification))fail('Forecast-Verifikation enthält noch Prozentangaben mit einer Nachkommastelle.');
const verificationPanel=await read('src/ForecastVerificationPanel.tsx');
if(/formatDecimal\(report\.weightedImprovement![^\n]{0,80}%/.test(verificationPanel))fail('Gewichtungsverbesserung wird noch dezimal formatiert.');

const app=await read('src/App.tsx');
if(app.includes('${currentThunderRisk.percent} %')||app.includes('Gewitterrisiko {currentThunderRisk.percent} %'))fail('Gewitter-Prozentangaben werden noch unge­rundet ausgegeben.');

const radar=await read('src/RadarPanel.tsx');
for(const key of ['radarOpacity','satelliteOpacity','lightningOpacity','warningOpacity','modelOpacity']){
 if(radar.includes(`{${key}}%`))fail(`${key} wird noch unge­rundet ausgegeben.`);
}

console.log('v0.9.15.13 Build-/Ganzzahl-Prozentregression bestanden.');
