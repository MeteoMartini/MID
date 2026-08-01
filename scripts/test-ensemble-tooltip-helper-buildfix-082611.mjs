import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const failures=[];
for(const token of ['function TrendTooltip(','function RainTooltip(','function WindTooltip(','function ResponsiveEnsembleTooltip(',"<b>Niederschlag</b><span>{row.precipVisualLabel.replace(/\\s*Best Match/g,'')}</span>",'<b>Modelle</b>'])if(!panel.includes(token))failures.push(`Tooltip-Baustein fehlt: ${token}`);
if(failures.length){console.error('Tooltip-Helfer-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Gemeinsame Tooltip-Helfer und vollständige Temperaturinhalte geprüft.');
