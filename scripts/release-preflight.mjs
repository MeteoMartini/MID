import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const localBin=path.join(root,'node_modules','.bin');
const env={...process.env,PATH:[localBin,process.env.PATH??''].filter(Boolean).join(path.delimiter)};
const steps=[
 ['Saubere Lockfile-Installation','npm',['ci','--ignore-scripts','--no-audit','--no-fund']],
 ['Produktionsbuild (TypeScript 7 + Vite)','npm',['run','build']],
 ['Worker-Syntax: kanonisch','node',['--check','worker.js']],
 ['Worker-Syntax: Modul','node',['--check','worker/metar-proxy.js']],
 ['Vollständige MID-Regressionssuite','npm',['run','test:regressions']],
 ['Versionsvertrag','node',['scripts/test-versioning.mjs']],
 ['Baseline-Vertrag','node',['scripts/test-baseline-079526-contract.mjs']],
 ['Release-Lineage','node',['scripts/test-release-lineage.mjs']],
 ['Release-Uploadbudget','node',['scripts/test-release-upload-budget-097410.mjs']],
];
for(const [label,command,args] of steps){
 console.log(`\n[release-preflight] ${label}`);
 const result=spawnSync(command,args,{cwd:root,stdio:'inherit',env});
 if(result.status!==0)throw new Error(`Release-Preflight fehlgeschlagen: ${label}`);
}
console.log('\nRelease-Preflight vollständig bestanden. ZIP-Erstellung freigegeben.');
