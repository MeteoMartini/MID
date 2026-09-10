import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [eventCenter,v078]=await Promise.all([
  readFile(path.join(root,'src/eventCenter.ts'),'utf8'),
  readFile(path.join(root,'src/v078.ts'),'utf8')
]);
const checks=[
  [eventCenter.includes('previousProbabilityFinite=previousProbability!=null&&Number.isFinite(previousProbability)?previousProbability:null'),'Event-PoP wird vor dem Vergleich nicht explizit auf einen endlichen Wert normalisiert.'],
  [eventCenter.includes('nextProbabilityFinite=nextProbability!=null&&Number.isFinite(nextProbability)?nextProbability:null'),'Neue Event-PoP wird vor dem Vergleich nicht explizit auf einen endlichen Wert normalisiert.'],
  [eventCenter.includes('rounded(nextProbabilityFinite-previousProbabilityFinite)'),'PoP-Delta verwendet nicht die typsicheren endlichen Werte.'],
  [!eventCenter.includes('rounded(nextProbability-previousProbability)'),'Alte nullable PoP-Subtraktion ist noch vorhanden.'],
  [v078.includes('items:readonly ServiceWorkerRegistration[]=[]'),'Service-Worker-Registrierungen akzeptieren den readonly DOM-Vertrag nicht.'],
  [v078.includes('const registrations=[...items]'),'Readonly Service-Worker-Registrierungen werden nicht vor lokaler Filterung materialisiert.'],
  [!v078.includes('items:ServiceWorkerRegistration[]=[]'),'Alter mutabler Service-Worker-Callbackvertrag ist noch vorhanden.']
];
const failed=checks.filter(([ok])=>!ok).map(([,message])=>message);
if(failed.length){console.error(failed.join('\n'));process.exit(1)}
console.log('CI-Typverträge für Event-PoP und Service-Worker-Registrierungen sind abgesichert.');
