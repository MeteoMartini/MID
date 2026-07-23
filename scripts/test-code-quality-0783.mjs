import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const [app,ensemble,styles,dismissible,chartMath]=await Promise.all([
 read('src/App.tsx'),read('src/EnsemblePanel.tsx'),read('src/styles.css'),read('src/useDismissibleLayer.ts'),read('src/chartMath.ts')
]);
const failures=[];
for(const [token,where] of [
 ['✓ Keine Hazards',app],
 ['<ForecastHazards hazards={hz}/>',app],
 ['tooltip-group-wide sunshine-tooltip-line',ensemble],
 ['<b>Sonnenscheindauer</b>',ensemble],
 ['<b>Prognosekonsistenz</b>',ensemble],
 ["import {useDismissibleLayer} from './useDismissibleLayer';",app+ensemble],
 ["document.addEventListener('pointerdown',onPointerDown,true)",dismissible],
 ['export function niceTemperatureScale',chartMath],
 ['export function nicePositiveRange',chartMath],
 ['.forecast-hazards .no-hazard',styles]
])if(!where.includes(token))failures.push(`Erwartete Modernisierung fehlt: ${token}`);
if(app.includes('✓ Keine Warnhinweise'))failures.push('Veralteter Text „Keine Warnhinweise“ ist noch vorhanden.');
if(ensemble.includes('payload?:any[]'))failures.push('Ensemble-Tooltips verwenden weiterhin untypisierte Payloads.');
if(ensemble.includes('data:any[]'))failures.push('Ensemble-Diagrammdaten sind weiterhin untypisiert.');
if((app+ensemble).includes("document.addEventListener('touchstart',outside"))failures.push('Doppelte Touch-/Pointer-Außenklicklistener sind noch vorhanden.');
if(!styles.includes('text-overflow:ellipsis;white-space:nowrap;box-sizing:border-box'))failures.push('Der warnfreie Hinweis ist nicht gegen Überlauf abgesichert.');

const sourceFiles=(await readdir(path.join(root,'src'))).filter(name=>/\.(ts|tsx)$/.test(name));
if(sourceFiles.length<15)failures.push('Unerwartet wenige Quellcodedateien gefunden.');
if(failures.length){console.error('CodeCheck v0.7.83 fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('CodeCheck v0.7.83 bestanden: gemeinsame Popover-Logik, zentrale Diagrammskalen, typisierte Ensemble-Tooltips, stabile Hazard-Keys und überlaufsichere 7-Tage-Hinweise.');
