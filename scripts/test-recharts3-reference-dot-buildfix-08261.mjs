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
need('zIndex={800} shape={(props:{cx?:number;cy?:number})=><EnsemblePrecipShape');
need('zIndex={800} shape={(props:{cx?:number;cy?:number})=><EnsembleHazardShape');

const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);
if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(item=>`Parser: ${item.messageText}`));
let referenceDots=0;
const visit=node=>{if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(source)==='ReferenceDot'){
 referenceDots+=1;
 const names=node.attributes.properties.filter(ts.isJsxAttribute).map(attribute=>attribute.name.text);
 if(names.includes('isFront'))failures.push('ReferenceDot verwendet weiterhin das in Recharts 3 entfernte isFront-Prop.');
 if(!names.includes('zIndex'))failures.push('ReferenceDot-Warn-/Niederschlagsmarker besitzt keinen Recharts-3-zIndex.');
 }ts.forEachChild(node,visit)};
visit(source);
if(referenceDots!==2)failures.push(`Erwartet 2 ReferenceDot-Marker, gefunden ${referenceDots}.`);

if(failures.length){console.error('Recharts-3-ReferenceDot-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Recharts-3-ReferenceDot-Props und ungenutzte Exportkonstante geprüft.');
