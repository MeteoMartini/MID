import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const ts=require('typescript-strada')
const panel=await readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');const failures=[];const need=token=>{if(!panel.includes(token))failures.push(`fehlt: ${token}`)};const forbid=token=>{if(panel.includes(token))failures.push(`unerlaubt: ${token}`)};
for(const token of [' isFront','<ReferenceArea','<ReferenceDot','useCartesianScale','ZIndexLayer'])forbid(token);
for(const token of ['function EnsemblePrecipShape','function EnsembleHazardShape','function EnsembleTemperatureWeatherOverlay','layer:\'weather\'|\'hazards\'','plotBottom=Math.max(plotTop,height-margin.bottom-xAxisHeight)','hazardY=plotBottom+8','cellHeight=zones.weatherHeight','cellY=zones.weatherY'])need(token);
if(!panel.includes('weatherHeight=clamp((plotBottom-plotTop)*.07,14,22)'))failures.push('fehlt: begrenzte wetterband-Flexhöhe');
if((panel.match(/ensembleTemperatureZones\(height,margin,xAxisHeight\)/g)||[]).length<3)failures.push('fehlt: gemeinsame Geometrie für Wetterband, Kurven und Raster');
if(panel.includes('hazardY=Math.max(plotTop+8,cellY-16)'))failures.push('Historische überlappende Hazard-Geometrie darf nicht zurückkehren');
const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(item=>`Parser: ${item.messageText}`));
if(failures.length){console.error('Recharts-3-Wetterebenen-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Recharts-3-Wetter-/Hazard-Quellstruktur und TSX-Parsing geprüft; reale SVG-Geometrie und Typprüfung sind separate Gates.');
