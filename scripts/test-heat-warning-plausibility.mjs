import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=await readFile(path.join(root,'src','dwdWarnings.ts'),'utf8');
const failures=[];
for(const token of [
  'const maximum=Math.max(...apparentValues),minimum=Math.min(...temperatureValues);',
  "value:maximum,unit:'°C'",
  'Maximale gefühlte Temperatur ${Math.round(maximum)} °C',
  'else byKind.delete(\'heat\')'
])if(!source.includes(token))failures.push(`Plausible Tages-Hitzeauswertung fehlt: ${token}`);
if(source.includes('Einfaches Gewitter'))failures.push('Die unerwünschte Bezeichnung „Einfaches Gewitter“ ist noch vorhanden.');
// Plausibilitätsbeispiel aus der Fehlermeldung: Tagesmaximum gefühlt 36 °C,
// Lufttemperaturminimum 20 °C muss 36 °C und nicht einen früheren 35-°C-Wert melden.
const apparent=[28,31,35,36,34],temperature=[20,24,33,38,29],maximum=Math.max(...apparent),minimum=Math.min(...temperature);
if(!(maximum===36&&minimum===20&&maximum>32&&minimum>=20))failures.push('Referenzfall für starke Wärmebelastung ist nicht plausibel.');
if(failures.length){console.error('Hitze-/Gewitter-Plausibilitätsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Hitze-/Gewitterhinweise geprüft: Tagesmaximum der gefühlten Temperatur und Tagesminimum der Lufttemperatur werden konsistent verwendet; „Einfaches“ ist entfernt.');
