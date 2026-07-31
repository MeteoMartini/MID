import {readFile} from 'node:fs/promises';
const [panel,styles]=await Promise.all([readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),readFile(new URL('../src/styles.css',import.meta.url),'utf8')]);
const failures=[];const need=(where,text,token)=>{if(!text.includes(token))failures.push(`${where}: ${token}`)};
for(const token of ['function TrendTooltip(','className="charttooltip trend-tooltip compact-trend-tooltip"','<b>Niederschlag</b><span>{row.precipVisualLabel}</span>','% Best Match','<b>Modelle</b>'])need('Tooltip',panel,token);
for(const token of ['width:min(336px,calc(100vw - 24px));','width:min(286px,calc(100vw - 24px));','width:min(272px,calc(100vw - 20px));'])need('Tooltip-CSS',styles,token);
if(panel.includes('compactPrecipitationTooltipLabel'))failures.push('Der zwischenzeitliche Tooltip-Hilfstext ersetzt weiterhin den Originalinhalt.');
if(failures.length){console.error('Ensemble-Tooltip-Wiederherstellung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Originaler kompakter Ensemble-Temperaturtooltip aus v0.8.25.4 ist wiederhergestellt.');
