import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const ensemble=await readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8');
const enhancer=await readFile(path.join(root,'src','v078.ts'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const failures=[];

for(const token of ['formatGmtOffset','clockTick','place-meta','Z)`','niceRange(','nicePositiveRange(','temperatureTicks.map','rainTicks.map','windTicks.map','directionIndices.map','data-skybar-y={skyBarY}','nowBadgeY=4','iconY=narrowChart?46:48','warningY=hasWarningMarkers','skyBarY=hasWarningMarkers','cloudTop=skyBarY+','selectedMarkerTop=iconY-10','className="selected-hour-line"','y1={selectedMarkerTop}'])if(!app.includes(token))failures.push(`Detail-/Ortsdarstellung fehlt: ${token}`);

const laneMatch=app.match(/nowBadgeY=(\d+),iconY=narrowChart\?(\d+):(\d+),warningY=hasWarningMarkers\?\(narrowChart\?(\d+):(\d+)\):null,skyBarY=hasWarningMarkers\?\(narrowChart\?(\d+):(\d+)\):\(narrowChart\?(\d+):(\d+)\),cloudTop=skyBarY\+\(narrowChart\?(\d+):(\d+)\)/);
if(!laneMatch)failures.push('Die vertikale Lane-Reihenfolge konnte nicht ausgewertet werden.');
else{
 const [,now,narrowIcon,wideIcon,narrowWarning,wideWarning,narrowSkyWarn,wideSkyWarn,narrowSkyClear,wideSkyClear,narrowGap,wideGap]=laneMatch.map(Number);
 if(!(now<narrowIcon&&narrowIcon<narrowWarning&&narrowWarning<narrowSkyWarn&&narrowSkyWarn<narrowSkyWarn+narrowGap))failures.push('Schmale Warnansicht folgt nicht JETZT → Piktogramme → Warnungen → Band → Diagramm.');
 if(!(now<wideIcon&&wideIcon<wideWarning&&wideWarning<wideSkyWarn&&wideSkyWarn<wideSkyWarn+wideGap))failures.push('Breite Warnansicht folgt nicht JETZT → Piktogramme → Warnungen → Band → Diagramm.');
 if(!(now<narrowIcon&&narrowIcon<narrowSkyClear&&now<wideIcon&&wideIcon<wideSkyClear))failures.push('Warnungsfreie Ansicht folgt nicht JETZT → Piktogramme → Band.');
}
const selectedLineIndex=app.indexOf('className="selected-hour-line"'),iconIndex=app.indexOf('{iconIndices.map');
if(selectedLineIndex<0||iconIndex<0||selectedLineIndex>iconIndex)failures.push('Die blaue Stundenlinie liegt nicht hinter den Piktogrammen.');

if(!app.includes('return <InfoHint label="Erklärung anzeigen">{advanced?(technical??summary):summary}</InfoHint>'))failures.push('Detailbeschreibung wird im erweiterten Modus nicht über (i) geöffnet.');
if(!ensemble.includes('return <InfoHint>{advanced?technical:summary}</InfoHint>'))failures.push('Ensemble-Erklärungen werden im erweiterten Modus nicht über (i) geöffnet.');
for(const token of ['precipitationMidPlot','precipitationErrorRange','dataKey="precipitationMidPlot"','dataKey="precipitationErrorRange"'])if(!ensemble.includes(token))failures.push(`P10–P90-Fehlerbalkenlogik fehlt: ${token}`);
if(ensemble.includes('dataKey="precipitationErrorBest"'))failures.push('Der Fehlerbalken ist weiterhin am Best-Match-Wert verankert.');
if(!enhancer.includes('svg.viewBox.baseVal')||!enhancer.includes('svg.dataset.skybarY'))failures.push('Sonne-/Bewölkungsbalken nutzen nicht die echte adaptive SVG-Geometrie.');
for(const token of ['.place-meta.advanced','white-space:nowrap','font-variant-numeric:tabular-nums'])if(!styles.includes(token))failures.push(`Kompakte einzeilige Ortszeitdarstellung fehlt: ${token}`);

if(failures.length){console.error('v0.7.79-Diagrammprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Diagrammlayout geprüft: JETZT, Wetterpiktogramme, optionale Warnzeile, Sonnenschein-/Bewölkungsband und Diagramm folgen der gewünschten Reihenfolge; die ausgewählte Stundenlinie reicht bis zur Piktogramm-Lane.');
