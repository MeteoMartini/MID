import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const weather=await readFile(path.join(root,'src','weather.ts'),'utf8');
const failures=[];

if(!styles.includes('.sunshine-scale-legend b,.sunshine-scale-legend em{color:#172033'))failures.push('Sonnenscheinlegende besitzt keine explizite dunkle Schriftfarbe.');
if(weather.includes('${compactSkyFallback(skyLabel)}, ${event} ${when}'))failures.push('Alte Wortstellung „Schauer abends“ ist noch vorhanden.');
if(!weather.includes('${compactSkyFallback(skyLabel)}, ${when} ${event}'))failures.push('Neue Wortstellung „abends Schauer“ fehlt.');
if(!weather.includes('fitDayLabel(`${when} ${event}`,event)'))failures.push('Kurzfassung verwendet noch die alte Wortstellung.');

if(failures.length){
  console.error('Legenden-/Sprachprüfung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Legenden-/Sprachprüfung bestanden: dunkle Schrift auf dem Sonnenscheinband und natürliche deutsche Zeitstellung bei Schauern.');
