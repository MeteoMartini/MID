import {mkdtemp,mkdir,writeFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

// Regression for the one-time transition from the historic, accidentally
// versioned node_modules tree.  IMPORTANT: this test runs after `npm ci` in CI,
// so it must never inspect the live project node_modules directory.  Instead it
// recreates the old installer contract in an isolated temporary checkout.
const temp=await mkdtemp(path.join(tmpdir(),'mid-09397-'));
const source=path.join(temp,'source');
const target=path.join(temp,'target');

await mkdir(path.join(source,'node_modules','minimist'),{recursive:true});
await mkdir(path.join(target,'node_modules','minimist','.git'),{recursive:true});
await writeFile(path.join(source,'package.json'),'new release\n');
await writeFile(path.join(target,'package.json'),'old checkout\n');
await writeFile(path.join(target,'node_modules','minimist','.git','config'),'protected git residue\n');
await writeFile(path.join(target,'node_modules','minimist','legacy.js'),'legacy package file\n');

const rsync=spawnSync('rsync',[
  '-a','--delete','--checksum','--itemize-changes',
  "--exclude=.git/","--exclude=.github/","--exclude=MID-professional-replacement.zip",
  source+'/',target+'/'
],{encoding:'utf8'});
if(rsync.status!==0)throw new Error(`Alter Installer-rsync scheitert weiterhin (${rsync.status}): ${rsync.stdout}${rsync.stderr}`);

const diff=spawnSync('diff',[
  '-qr',"--exclude=.git","--exclude=.github","--exclude=MID-professional-replacement.zip",
  source+'/',target+'/'
],{encoding:'utf8'});
if(diff.status!==0)throw new Error(`Alter Installer-diff scheitert weiterhin (${diff.status}): ${diff.stdout}${diff.stderr}`);

const remaining=await readdir(path.join(target,'node_modules','minimist'));
if(remaining.some(name=>name!=='.git'))throw new Error(`Nicht geschuetzte minimist-Altdateien blieben uebrig: ${remaining.join(', ')}`);

await rm(temp,{recursive:true,force:true});
console.log('v0.9.39.9: Bootstrap-Regression ist npm-ci-sicher und reproduziert den alten rsync/diff-Installer isoliert.');
