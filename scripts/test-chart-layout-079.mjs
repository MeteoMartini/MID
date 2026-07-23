import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const ensemble=await readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8');
const enhancer=await readFile(path.join(root,'src','v078.ts'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const failures=[];

for(const token of ['formatGmtOffset','clockTick','place-meta','Z)`','niceRange(','nicePositiveRange(','temperatureTicks.map','rainTicks.map','windTicks.map','directionIndices.map','data-skybar-y={skyBarY}','nowBadgeY=48','iconY=narrowChart?34:36'])if(!app.includes(token))failures.push(`Detail-/Ortsdarstellung fehlt: ${token}`);
if(!app.includes('return <InfoHint label="Erklärung anzeigen">{advanced?(technical??summary):summary}</InfoHint>'))failures.push('Detailbeschreibung wird im erweiterten Modus nicht über (i) geöffnet.');
if(!ensemble.includes('return <InfoHint>{advanced?technical:summary}</InfoHint>'))failures.push('Ensemble-Erklärungen werden im erweiterten Modus nicht über (i) geöffnet.');
for(const token of ['precipitationMidPlot','precipitationErrorRange','dataKey="precipitationMidPlot"','dataKey="precipitationErrorRange"'])if(!ensemble.includes(token))failures.push(`P10–P90-Fehlerbalkenlogik fehlt: ${token}`);
if(ensemble.includes('dataKey="precipitationErrorBest"'))failures.push('Der Fehlerbalken ist weiterhin am Best-Match-Wert verankert.');
if(!enhancer.includes('svg.viewBox.baseVal')||!enhancer.includes('svg.dataset.skybarY'))failures.push('Sonne-/Bewölkungsbalken nutzen nicht die echte adaptive SVG-Geometrie.');
for(const token of ['.place-meta.advanced','white-space:nowrap','font-variant-numeric:tabular-nums'])if(!styles.includes(token))failures.push(`Kompakte einzeilige Ortszeitdarstellung fehlt: ${token}`);

if(failures.length){console.error('v0.7.79-Diagrammprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('v0.7.79 geprüft: Z-Zeit, Info-Popover, exakte P10–P90-Fehlerbalken, getrennte obere Diagramm-Lanes, gerade Skalen und adaptive Windpfeildichte sind eingebunden.');
