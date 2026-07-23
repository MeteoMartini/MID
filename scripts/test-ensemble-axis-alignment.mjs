import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const panel=await readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8');
const failures=[];

if(/trend-combined[^\n{]*[\s\S]{0,180}dominant-baseline\s*:\s*hanging/.test(styles)){
  failures.push('Die Ensemble-Achsenticks werden weiterhin per dominant-baseline:hanging nach unten verschoben.');
}
if(!panel.includes("label={{value:'Vorhersagetag'"))failures.push('Die X-Achsenbeschriftung fehlt.');
if(!panel.includes("label={{value:'Temperatur (°C)'"))failures.push('Die Temperatur-Achsenbeschriftung fehlt.');

if(failures.length){
  console.error('Ensemble-Achsenausrichtung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Ensemble-Achsen geprüft: Recharts-Standardbaseline bleibt unverändert; Tickwerte sind nicht mehr nach unten versetzt.');
