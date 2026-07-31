import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}

const panel=await readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const failures=[];
const need=(token)=>{if(!panel.includes(token))failures.push(`fehlt: ${token}`)};
const forbid=(token)=>{if(panel.includes(token))failures.push(`unerlaubt: ${token}`)};

forbid('const ENSEMBLE_EXPORT_PLOT_WIDTH=');
forbid(' isFront');
forbid('<ReferenceDot');
forbid('<ReferenceArea');
forbid('useCartesianScale');
forbid('ZIndexLayer');
need('function EnsembleLegacyWeatherBand');
need('ensemble-legacy-weather-band${exporting');
need('className="ensemble-legacy-weather-cell"');
need('className="ensemble-legacy-hazard-badges"');
need('<PrecipitationGlyph type={precipType}');

const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);
if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(item=>`Parser: ${item.messageText}`));
let referenceDots=0,weatherBands=0;
const visit=node=>{
 if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(source)==='EnsembleLegacyWeatherBand')weatherBands+=1;
 if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(source)==='EnsembleLegacyWeatherBand')weatherBands+=1;
 if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(source)==='ReferenceDot')referenceDots+=1;
 ts.forEachChild(node,visit)
};
visit(source);
if(weatherBands!==1)failures.push(`Erwartet genau ein sichtbares Wetterband, gefunden ${weatherBands}.`);
if(referenceDots!==0)failures.push(`Alte ReferenceDot-Marker noch vorhanden: ${referenceDots}.`);

if(failures.length){console.error('Recharts-3-Wetterebenen-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Recharts-3-Wetterband ist unabhängig von experimentellen Skalenhooks und alten ReferenceDot-Props.');
