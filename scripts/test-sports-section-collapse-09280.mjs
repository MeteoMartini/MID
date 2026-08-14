import {readFile} from 'node:fs/promises';
const [app,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
 "case'mountain':return currentFavorite?.mountain.enabled?<CollapsibleModule",
 'id="mountain" title="Berg-/Wintersport"',
 'summary="Höhenprofil, Bergwetter und Bedingungen" defaultOpen={true}',
 "case'water':return currentFavorite?.water.enabled?<CollapsibleModule",
 'id="water" title="Wassersport"',
 'summary="Wasserwetter, Gezeiten und Bedingungen" defaultOpen={true}',
 'persistModuleOpen(id,open)'
])need('Sportsektionen',app,token);
need('Baseline',baseline,'scripts/test-sports-section-collapse-09280.mjs');
if(failures.length){console.error('Einklappbare Sportsektionen fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Wasser- und Bergsportsektionen sind einklappbar und speichern ihren Zustand über die bestehende Modul-Persistenz.');
