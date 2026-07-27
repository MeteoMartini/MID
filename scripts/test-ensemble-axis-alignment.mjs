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
if(!panel.includes('ensemble-temp-axis-title-bottom">Vorhersagetag'))failures.push('Die externe X-Achsenbeschriftung fehlt.');
if(!panel.includes('<b>Temperatur</b><small>°C</small>'))failures.push('Die externe Temperatur-Achsenbeschriftung fehlt.');
const trendStart=panel.indexOf('function CombinedTrendChart('),trendEnd=panel.indexOf('\nfunction RainLegend(',trendStart),trendBlock=panel.slice(trendStart,trendEnd);
if(trendBlock.includes("label={{value:'Vorhersagetag'")||trendBlock.includes("label={{value:'Temperatur (°C)'"))failures.push('Die Temperaturgrafik verwendet weiterhin kollisionsanfällige Recharts-Achsentitel.');

if(failures.length){
  console.error('Ensemble-Achsenausrichtung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Ensemble-Achsen geprüft: Recharts-Standardbaseline bleibt unverändert; externe Temperaturtitel sind kollisionsfrei angeordnet.');
