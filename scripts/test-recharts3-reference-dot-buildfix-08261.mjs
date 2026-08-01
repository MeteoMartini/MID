import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const panel=await readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');const failures=[];const need=token=>{if(!panel.includes(token))failures.push(`fehlt: ${token}`)};const forbid=token=>{if(panel.includes(token))failures.push(`unerlaubt: ${token}`)};
for(const token of [' isFront','<ReferenceArea','<ReferenceDot','useCartesianScale','ZIndexLayer'])forbid(token);
for(const token of ['function EnsemblePrecipShape','function EnsembleHazardShape','function EnsembleTemperatureWeatherOverlay','layer:\'weather\'|\'hazards\'','plotBottom=height-margin.bottom-xAxisHeight','hazardY=Math.max(plotTop+8,cellY-16)'])need(token);
if(!/cellHeight=Math\.max\(14,Math\.min\(22,plotHeight\*\.07\)\)/.test(panel))failures.push('fehlt: flexible cellHeight-Geometrie');
const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(item=>`Parser: ${item.messageText}`));
if(failures.length){console.error('Recharts-3-Wetterebenen-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Recharts-3-Wetter-, Niederschlags- und Hazardebenen verwenden eine typsichere, achsengebundene SVG-Ebene.');
