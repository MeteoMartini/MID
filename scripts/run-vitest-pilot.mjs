import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const args=process.argv.slice(2),coverage=args.includes('--coverage');
const spec=args[0];
if(!/^vitest@\d+\.\d+\.\d+$/.test(spec??''))throw new Error('An exact Vitest version is required.');
const coverageSpec=`@vitest/coverage-v8@${spec.slice('vitest@'.length)}`;
if(args.some(arg=>![spec,coverageSpec,'--coverage'].includes(arg)))throw new Error('Unexpected pilot argument.');
const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
if(!/^\d+\.\d+\.\d+$/.test(pkg.devDependencies.vite))throw new Error('Vite must be pinned.');
const prefix=await mkdtemp(join(tmpdir(),'mid-vitest-pilot-'));
function run(command,argv){const result=spawnSync(command,argv,{stdio:'inherit'});if(result.error)throw result.error;return result.status??1;}
let status=1;
try{
 // npm exec can omit Vite because it exists in MID, leaving the isolated Vitest
 // unable to resolve its peer. Install the complete toolchain in one prefix.
 status=run(process.platform==='win32'?'npm.cmd':'npm',['install','--prefix',prefix,'--no-save','--package-lock=false','--ignore-scripts','--no-audit','--no-fund','--legacy-peer-deps',`vite@${pkg.devDependencies.vite}`,spec,...(coverage?[coverageSpec]:[])]);
 if(status===0)status=run(process.execPath,[join(prefix,'node_modules/vitest/vitest.mjs'),'run','--config','vitest.config.ts',...(coverage?['--coverage']:[])]);
}finally{await rm(prefix,{recursive:true,force:true});}
process.exitCode=status;
