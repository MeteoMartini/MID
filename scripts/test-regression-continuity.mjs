import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const current=(await readdir(path.join(root,'scripts'))).filter(name=>/^test-.*\.mjs$/i.test(name)).sort();
const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const runner=await readFile(path.join(root,'scripts','run-regressions.mjs'),'utf8');
const failures=[];
if(!String(pkg.scripts?.verify||'').includes('node scripts/run-regressions.mjs'))failures.push('verify verwendet nicht den automatischen Regressionstest-Runner.');
for(const token of ["/^test-.*\\.mjs$/i",'tests.length','spawnSync(process.execPath'])if(!runner.includes(token))failures.push(`Automatischer Runner unvollständig: ${token}`);
if(current.length<50)failures.push(`Unerwartet wenige geschützte Tests: ${current.length}`);
for(const required of ['test-baseline-079526-contract.mjs','test-popover-regression.mjs','test-consistency-tooltip-dismiss.mjs','test-push-notifications.mjs','test-web-analytics.mjs'])if(!current.includes(required))failures.push(`Referenzschutz fehlt: ${required}`);
if(failures.length){console.error('Automatischer MID-Funktionsschutz fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`Funktionskontinuität geprüft: ${current.length} automatisch erkannte Regressionstests; Referenz-, Popover-, Push- und Analytics-Schutz dürfen nicht verschwinden.`);
