import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const styles=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const failures=[];
for(const token of ['professionalEnsembleLayout(compact:boolean,exporting=false)','height={layout.height}','height={rainLayout.height}','xAxisHeight={layout.xAxisHeight}','function EnsembleExternalDateAxis(','<EnsembleExternalDateAxis data={data}','<EnsembleExternalDateAxis data={d}'])if(!panel.includes(token))failures.push(`Achsenvertrag fehlt: ${token}`);
for(const token of ['.ensemble-mobile-tooltip-layer{','.ensemble-temp-plot,.ensemble-rain-plot,.ensemble-wind-plot{','.ensemble-external-date-axis{','.header-favorites .favorite-bubbles>button{','touch-action:pan-x;'])if(!styles.includes(token))failures.push(`CSS-Vertrag fehlt: ${token}`);
if(!app.includes('FavoriteQuickStrip'))failures.push('Favoriten-Schnellleiste fehlt.');
if(failures.length){console.error('Tooltip-/Achsen-/Favoriten-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Gemeinsame Achsen, mobile Tooltips und Favoriteninteraktion geprüft.');
