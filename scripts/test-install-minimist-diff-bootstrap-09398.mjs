import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const temp=await mkdtemp(path.join(tmpdir(),'mid-09398-'));
const source=path.join(temp,'source');
const target=path.join(temp,'target');
await mkdir(path.join(source,'node_modules','minimist'),{recursive:true});
await mkdir(path.join(target,'node_modules','minimist','.git'),{recursive:true});
await writeFile(path.join(source,'package.json'),'new\n');
await writeFile(path.join(target,'package.json'),'old\n');
await writeFile(path.join(target,'node_modules','minimist','.git','config'),'git residue\n');
await writeFile(path.join(target,'node_modules','minimist','package.json'),'legacy package\n');

const rsyncArgs=['-a','--delete','--checksum','--itemize-changes',"--exclude=.git/","--exclude=.github/","--exclude=MID-professional-replacement.zip",source+'/',target+'/'];
const rsync=spawnSync('rsync',rsyncArgs,{encoding:'utf8'});
if(rsync.status!==0)throw new Error(`Screenshot-Reproduktion: rsync Exit ${rsync.status}: ${rsync.stdout}${rsync.stderr}`);
const diffArgs=['-qr',"--exclude=.git","--exclude=.github","--exclude=MID-professional-replacement.zip",source+'/',target+'/'];
const diff=spawnSync('diff',diffArgs,{encoding:'utf8'});
if(diff.status!==0)throw new Error(`Screenshot-Reproduktion: diff muss trotz geschuetztem minimist/.git Exit 0 liefern: ${diff.stdout}${diff.stderr}`);
await rm(temp,{recursive:true,force:true});
console.log('v0.9.39.8: exakter Altinstaller-Fall "Only in ./node_modules: minimist" ist regressionsgeschuetzt.');
