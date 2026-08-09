import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const styles=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const failures=[];
for(const token of ['professionalEnsembleLayout(compact:boolean,exporting=false)','height={layout.height}','height={rainLayout.height}','xAxisHeight={layout.xAxisHeight}','height={rainLayout.xAxisHeight}','tick={<EnsembleDateAxisTick data={data} compact={compact}/>}','tick={<EnsembleDateAxisTick data={d} compact={compactChart}/>}'])if(!panel.includes(token))failures.push(`Achsenvertrag fehlt: ${token}`);
if(panel.includes('function EnsembleExternalDateAxis('))failures.push('Veraltete externe Datumsachse vorhanden.');
for(const token of ['.ensemble-mobile-tooltip-layer{','.ensemble-temp-plot,.ensemble-rain-plot,.ensemble-wind-plot{','.header-favorites .favorite-bubbles>button{','touch-action:pan-x;'])if(!styles.includes(token))failures.push(`CSS-Vertrag fehlt: ${token}`);
if(!app.includes('FavoriteQuickStrip'))failures.push('Favoriten-Schnellleiste fehlt.');
if(failures.length){console.error('Tooltip-/Achsen-/Favoriten-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Gemeinsame Recharts-Achsen, mobile Tooltips und Favoriteninteraktion geprüft.');
