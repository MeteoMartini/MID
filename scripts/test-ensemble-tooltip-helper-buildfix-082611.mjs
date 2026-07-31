import {readFile} from 'node:fs/promises';

const panel=await readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const failures=[];
const need=(token)=>{if(!panel.includes(token))failures.push(`fehlt: ${token}`)};

need('function compactPrecipitationTooltipLabel(row:TrendRow)');
need("if(row.precipVisualType==='none')return'Trocken'");
need("if(row.precipVisualThunder)return`Gewitter · ${amount}`");
need('{compactPrecipitationTooltipLabel(row)}');

const declarations=(panel.match(/function compactPrecipitationTooltipLabel\(row:TrendRow\)/g)??[]).length;
if(declarations!==1)failures.push(`erwartet genau eine Helper-Deklaration, gefunden ${declarations}`);

if(failures.length){
 console.error('Ensemble-Tooltip-Helper-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Ensemble-Tooltip-Helper ist deklariert, eindeutig und im Temperatur-Tooltip verwendet.');
