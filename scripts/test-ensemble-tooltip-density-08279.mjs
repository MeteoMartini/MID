import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const fails=[];
for(const token of ['function ResponsiveEnsembleTooltip(','ensemble-mobile-tooltip-layer','className="trend-tooltip compact-trend-tooltip" onDismiss={onDismiss}','className="rain-tooltip" onDismiss={onDismiss}','className="wind-tooltip" onDismiss={onDismiss}','title="Zum Schließen antippen"'])if(!panel.includes(token))fails.push(`Tooltip-Engine fehlt: ${token}`);
for(const token of ['.ensemble-pro-tooltip{','.ensemble-mobile-tooltip-layer{','.ensemble-pro-tooltip .trend-tooltip-matrix{','.ensemble-pro-tooltip dl>div{'])if(!css.includes(token))fails.push(`Tooltip-CSS fehlt: ${token}`);
if(fails.length){console.error('Ensemble-Tooltip-Prüfung fehlgeschlagen:\n- '+fails.join('\n- '));process.exit(1)}
console.log('Einheitliche Desktop- und Mobile-Tooltips mit expliziter Klick-Schließung geprüft.');
