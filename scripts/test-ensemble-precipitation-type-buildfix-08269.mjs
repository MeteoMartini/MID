import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}

const [panel,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(token)=>{if(!panel.includes(token))failures.push(`EnsemblePanel: ${token}`)};
const forbid=(token)=>{if(panel.includes(token))failures.push(`EnsemblePanel: unerlaubt ${token}`)};

need("const precipType=row.precipVisualType==='none'?null:row.precipVisualType");
need('hasPrecip=precipType!==null');
need('{precipType&&<g');
need('<PrecipitationGlyph type={precipType}');
forbid('<PrecipitationGlyph type={row.precipVisualType}');

const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);
if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(item=>`Parser: ${item.messageText}`));
const temp=await mkdtemp(join(tmpdir(),'mid-08269-'));
try{
 const probe=join(temp,'probe.ts');
 await writeFile(probe,`type Visual='none'|'rain'|'snow'|'mixed';
type Active='rain'|'snow'|'mixed';
declare function glyph(type:Active):void;
function render(row:{type:Visual}){const precipType=row.type==='none'?null:row.type;if(precipType)glyph(precipType)}
`);
 const program=ts.createProgram([probe],{noEmit:true,strict:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,skipLibCheck:true,noLib:true});
 const diagnostics=ts.getPreEmitDiagnostics(program).filter(item=>item.file?.fileName===probe);
 if(diagnostics.length)failures.push(...diagnostics.map(item=>`Typprüfung: ${ts.flattenDiagnosticMessageText(item.messageText,' ')}`));
}finally{await rm(temp,{recursive:true,force:true})}
const parsedPackage=JSON.parse(pkg),parsedBaseline=JSON.parse(baseline);
if(!parsedPackage.scripts?.['test:ensemble-precipitation-type-buildfix'])failures.push('Package-Testskript fehlt.');
if(!parsedBaseline.regressionTests?.includes('scripts/test-ensemble-precipitation-type-buildfix-08269.mjs'))failures.push('Baseline-Regression fehlt.');

if(failures.length){console.error('Ensemble-Niederschlagstyp-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Niederschlagssymbolik ist auf aktive Typen eingegrenzt; der TS2322-Buildfehler ist geschützt.');
