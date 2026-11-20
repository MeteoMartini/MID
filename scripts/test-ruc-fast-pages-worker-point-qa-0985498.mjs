// SHA-bound MID #946 native Fast Pages Worker point contract.
// Execute real Node test fixtures in the existing core regression runner.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const file=fileURLToPath(new URL('../tests/unit/mid-ruc-fast-pages-worker-point.test.mjs',import.meta.url));
const run=spawnSync(process.execPath,['--test',file],{stdio:'inherit',timeout:120000});
if(run.error)throw run.error;
if(run.status!==0)process.exit(run.status??1);
