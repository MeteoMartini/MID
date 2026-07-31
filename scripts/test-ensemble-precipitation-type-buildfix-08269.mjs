import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const [panel,pkg,baseline]=await Promise.all([readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),readFile(new URL('../package.json',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')]);
const failures=[];const need=t=>{if(!panel.includes(t))failures.push(`EnsemblePanel: ${t}`)};
for(const token of ["row.precipVisualType==='none')return null","<PrecipitationGlyph type={row.precipVisualType}",'size={row.precipVisualSize}','thunder={row.precipVisualThunder}'])need(token);
const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(item=>`Parser: ${item.messageText}`));
const p=JSON.parse(pkg),b=JSON.parse(baseline);if(!p.scripts?.['test:ensemble-precipitation-type-buildfix'])failures.push('Package-Testskript fehlt.');if(!b.regressionTests?.includes('scripts/test-ensemble-precipitation-type-buildfix-08269.mjs'))failures.push('Baseline-Regression fehlt.');
if(failures.length){console.error('Ensemble-Niederschlagstyp-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Niederschlagssymbolik grenzt none vor dem Glyph-Aufruf typsicher aus.');
