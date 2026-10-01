import {regressionSuite} from './regression-suite.mjs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),directory=path.join(root,'scripts');
const localBin=path.join(root,'node_modules','.bin');
const childEnv={...process.env,PATH:[localBin,process.env.PATH??''].filter(Boolean).join(path.delimiter)};
// Discovery contract: /^test-.*\.mjs$/i; validated centrally against both baseline inventories.
const tests=await regressionSuite(root);
const failures=[],timings=[];
const started=performance.now();
for(const [index,name] of tests.entries()){
 const start=performance.now();
 const result=spawnSync(process.execPath,[path.join(directory,name)],{cwd:root,encoding:'utf8',env:childEnv,maxBuffer:16*1024*1024});
 timings.push({name,ms:performance.now()-start});
 if(result.status!==0){failures.push(name);console.error(`\nFAIL ${name}\n${result.stdout??''}${result.stderr??''}${result.error??''}`)}
 else if(process.env.MID_REGRESSION_VERBOSE==='1')process.stdout.write(result.stdout??'');
 if((index+1)%50===0||index+1===tests.length)console.log(`Regressionen: ${index+1}/${tests.length}, ${failures.length} Fehler`);
}
console.log(`Suite: ${((performance.now()-started)/1000).toFixed(1)} s; langsamste Prüfungen: ${timings.sort((a,b)=>b.ms-a.ms).slice(0,5).map(row=>`${row.name} ${(row.ms/1000).toFixed(1)} s`).join('; ')}`);
if(failures.length){console.error(`\n${failures.length} von ${tests.length} Regressionstests fehlgeschlagen: ${failures.join(', ')}`);process.exit(1)}
console.log(`\nAlle ${tests.length} automatisch erkannten MID-Regressionstests bestanden.`);
