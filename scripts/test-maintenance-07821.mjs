import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const [app,ensemble,styles,serviceWorker,legacyWorker]=await Promise.all([
 read('src/App.tsx'),read('src/EnsemblePanel.tsx'),read('src/styles.css'),read('public/service-worker.js'),read('public/sw.js')
]);
const failures=[];
for(const token of ['className="brand-expanded"','<b>M</b>eteorological <b>I</b>nformation <b>D</b>ashboard','.brand-expanded b'])if(!(app+styles).includes(token))failures.push(`MID-Initialenformatierung fehlt: ${token}`);
for(const token of ['formatDwdWarningCompactValue(signal,unit)','dailyHazards(d,dayHours,elevation,unit,1)'])if(!app.includes(token))failures.push(`Kompakte 7-Tage-Warnwerte fehlen: ${token}`);
for(const token of ['Best-Match-Hazards','ensemble-hazard-tooltip','row.hazards.map'])if(!ensemble.includes(token))failures.push(`Ensemble-Warnhinweise fehlen im Tooltip: ${token}`);
for(const token of ['EnsembleHazardShape','ReferenceDot','ensemble-hazard-marker'])if(!ensemble.includes(token)&&!styles.includes(token))failures.push(`Kompakte Ensemble-Warnmarker fehlen: ${token}`);
for(const token of ['className="probability-axis"','[0,50,100].map','barRight=Math.min(W-right','width={barRight-barLeft}','right=narrowChart?48:mediumChart?64:72'])if(!app.includes(token))failures.push(`Korrektur der Niederschlagsbalken/rechten Achse fehlt: ${token}`);
for(const token of ["String(meta.rolledBackFrom||'')===VERSION","mode:'updating',pending:{targetVersion:VERSION", "document.getElementById('mid-rollback-banner')?.remove()", "u.searchParams.set('mid-retry'",'navigateClientsForUpdate','retryNewerRollback'])if(!serviceWorker.includes(token))failures.push(`Rückfallbalken-/Updatekorrektur fehlt: ${token}`);
if(serviceWorker!==legacyWorker)failures.push('service-worker.js und sw.js weichen voneinander ab.');
if(failures.length){console.error('Wartungsprüfung v0.7.82.1 fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Wartung v0.7.82.1 geprüft: MID-Initialen, selbstheilende Rückfallversion, kompakte Tageswarnungen, Ensemble-Warnungen im Tooltip und korrekte Niederschlagsachsen sind vorhanden.');
