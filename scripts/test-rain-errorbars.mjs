import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const panel=await readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const toggles=await readFile(path.join(root,'src','v078.ts'),'utf8');

const failures=[];
if(!panel.includes('ErrorBar'))failures.push('Recharts ErrorBar ist im EnsemblePanel nicht eingebunden.');
if(!panel.includes('dataKey="precipitationErrorBest"'))failures.push('Der Fehlerbalken nutzt precipitationErrorBest nicht.');
if(!panel.includes('bestPrecipitation>=.1?['))failures.push('Fehlerbalken werden nicht nur an Tagen mit Best-Match-Niederschlag vorbereitet.');
if(panel.includes('dataKey="precipitationLow"'))failures.push('Die alte P10-Kurve ist noch im Niederschlagsdiagramm eingebunden.');
if(panel.includes('dataKey="precipitationHigh"'))failures.push('Die alte P90-Kurve ist noch im Niederschlagsdiagramm eingebunden.');
if(!panel.includes('P10–P90-Fehlerbalken'))failures.push('Die Niederschlagsbeschreibung erwähnt den Fehlerbalken nicht.');
if(!styles.includes('.rain-legend i.errorbar'))failures.push('Die Legende enthält kein Fehlerbalken-Symbol.');
if(!toggles.includes("label:'P10–P90'"))failures.push('Die Chart-Toggles wurden nicht auf P10–P90 umgestellt.');

if(failures.length){
  console.error('Ensemble-Niederschlagsdiagramm-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Ensemble-Niederschlagsdiagramm geprüft: P10/P90-Kurven wurden durch einen sichtbaren P10–P90-Fehlerbalken über den Best-Match-Balken ersetzt.');
