#!/usr/bin/env node
// Qualification only. Matching unsigned fingerprints never authorize artifact reuse.
import {createHash} from 'node:crypto';
import {readFile,writeFile,readdir,lstat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SHA=/^[a-f0-9]{40}$/, HASH=/^[a-f0-9]{64}$/;
const hash=value=>createHash('sha256').update(value).digest('hex');
const canonical=value=>JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b,'en'))));
const safePath=p=>typeof p==='string'&&p.length>0&&p.length<1024&&!p.includes('\\')&&!p.includes('\0')&&!path.posix.isAbsolute(p)&&p.split('/').every(s=>s!==''&&s!=='.'&&s!=='..');
export function environmentFingerprint(env) {
  // VITE values are public build inputs. Only a digest, never their values, is retained.
  const values=Object.fromEntries(Object.entries(env).filter(([key])=>/^VITE_[A-Z0-9_]+$/.test(key)||['NODE_ENV','TZ','LANG'].includes(key)));
  return hash(canonical(values));
}
export function validateManifest(m) {
  if(m?.schema!=='mid.build-parity.v1'||m.releaseAuthorized!==false||!m.inputs||
      !SHA.test(m.inputs.sourceSha)||!SHA.test(m.inputs.treeSha)||!HASH.test(m.inputs.lockSha)||!HASH.test(m.inputs.environmentSha)) throw Error('Invalid build provenance');
  if(Object.keys(m.inputs).sort().join(',')!=='arch,environmentSha,image,lockSha,node,npm,platform,sourceSha,treeSha') throw Error('Unknown or missing build input');
  for(const key of ['node','npm','platform','arch','image']) if(typeof m.inputs[key]!=='string'||!m.inputs[key]||m.inputs[key].length>200) throw Error('Missing toolchain identity');
  if(!Array.isArray(m.files)||m.files.length<1||m.files.length>30000)throw Error('Incomplete build inventory');
  const names=new Set();let bytes=0;
  for(const f of m.files){
    if(!safePath(f?.path)||names.has(f.path)||!HASH.test(f.sha256)||!Number.isSafeInteger(f.bytes)||f.bytes<0)throw Error('Unsafe or duplicate build file');
    if(Object.keys(f).sort().join(',')!=='bytes,path,sha256')throw Error('Unknown file metadata');
    names.add(f.path);bytes+=f.bytes;
  }
  if(bytes>1000000000||!names.has('index.html')||!names.has('version.json')||!names.has('mid-build-identity.json'))throw Error('Incomplete or oversized web build');
  const identity=m.identity;
  if(identity?.schema!=='mid.web-build-identity.v1'||identity.sourceGitSha!==m.inputs.sourceSha||
     !/^\d+\.\d+\.\d+\.\d+$/.test(identity.version)||!Number.isFinite(Date.parse(identity.builtAtUtc))||
     new Date(identity.builtAtUtc).toISOString()!==identity.builtAtUtc||identity.assetCount!==m.files.length-1)throw Error('Invalid build identity');
  const digest=createHash('sha256');
  for(const file of [...m.files].filter(f=>f.path!=='mid-build-identity.json').sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0))digest.update(file.path+'\0'+file.sha256+'\n');
  const raw=JSON.stringify(identity,null,2)+'\n',entry=m.files.find(f=>f.path==='mid-build-identity.json');
  if(identity.assetsSha256!==digest.digest('hex')||entry.sha256!==hash(raw)||entry.bytes!==Buffer.byteLength(raw))throw Error('Build identity/inventory mismatch');
  return m;
}
export function compareBuilds(left,right) {
  validateManifest(left);validateManifest(right);
  const inputDifferences=[...new Set([...Object.keys(left.inputs),...Object.keys(right.inputs)])].filter(k=>left.inputs[k]!==right.inputs[k]);
  const a=new Map(left.files.map(f=>[f.path,f])),b=new Map(right.files.map(f=>[f.path,f]));
  const changed=[...new Set([...a.keys(),...b.keys()])].sort().filter(k=>!a.has(k)||!b.has(k)||a.get(k).sha256!==b.get(k).sha256||a.get(k).bytes!==b.get(k).bytes);
  // Keep original execution metadata and its differing bytes visible. This is
  // an additional payload comparison, never a claim of identical full artifacts.
  const payloadChanges=changed.filter(p=>p!=='mid-build-identity.json');
  return {schema:'mid.build-parity-result.v1',releaseAuthorized:false,reuseAuthorized:false,
    equivalent:inputDifferences.length===0&&changed.length===0,
    payloadEquivalent:inputDifferences.length===0&&payloadChanges.length===0,inputDifferences,changed,
    executionMetadataDiffers:changed.includes('mid-build-identity.json'),
    files:left.files.length,bytes:left.files.reduce((n,f)=>n+f.bytes,0),
    warning:'Unsigned diagnostic evidence; not an attestation, regression result or release approval.'};
}
export async function buildInventory(root) {
  const files=[];let total=0;
  async function walk(dir,prefix=''){
    const entries=await readdir(dir,{withFileTypes:true});
    for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name,'en'))){
      const relative=prefix+entry.name,full=path.join(dir,entry.name),stat=await lstat(full);
      if(!safePath(relative)||stat.isSymbolicLink())throw Error('Unsafe build path');
      if(stat.isDirectory())await walk(full,relative+'/');
      else if(stat.isFile()){
        if(stat.size>100000000||total+stat.size>1000000000||files.length>=30000)throw Error('Build inventory budget exceeded');
        const content=await readFile(full);total+=content.length;
        files.push({path:relative,bytes:content.length,sha256:hash(content)});
      }else throw Error('Unsupported build file');
    }
  }
  if(!(await lstat(root)).isDirectory()||(await lstat(root)).isSymbolicLink())throw Error('Unsafe build root');
  await walk(root);return files;
}
export async function captureInputs(root,env=process.env) {
  const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
  if(git('status','--porcelain','--untracked-files=normal'))throw Error('Fingerprint requires a clean committed source');
  const inputs={sourceSha:git('rev-parse','HEAD'),treeSha:git('rev-parse','HEAD^{tree}'),
    lockSha:hash(await readFile(path.join(root,'package-lock.json'))),
    environmentSha:environmentFingerprint(env),node:process.version,
    npm:execFileSync('npm',['--version'],{encoding:'utf8'}).trim(),platform:process.platform,arch:process.arch,
    image:env.ImageVersion||'local-unqualified'};
  return inputs;
}
async function main(){
  const [mode,...args]=process.argv.slice(2);
  if(mode==='inputs'&&args.length===1){
    await writeFile(args[0],JSON.stringify(await captureInputs(process.cwd()),null,2)+'\n',{flag:'wx'});
  }else if(mode==='inventory'&&args.length===3){
    const inputs=JSON.parse(await readFile(args[0],'utf8'));
    // Prebuild is allowed to generate version mirrors; no VITE/toolchain change is allowed.
    // Reject any source mutation during the build; generated output alone may differ.
    execFileSync('git',['diff','--quiet','HEAD','--','.',':(exclude)dist/**',':(exclude)ios/App/App/public/**']);
    if(inputs.sourceSha!==execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()||
       inputs.environmentSha!==environmentFingerprint(process.env)||inputs.lockSha!==hash(await readFile('package-lock.json')))throw Error('Build inputs changed');
    const report={schema:'mid.build-parity.v1',releaseAuthorized:false,inputs,files:await buildInventory(args[1]),
      identity:JSON.parse(await readFile(path.join(args[1],'mid-build-identity.json'),'utf8'))};
    validateManifest(report);await writeFile(args[2],JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  }else if(mode==='compare'&&args.length===2){
    const result=compareBuilds(...await Promise.all(args.map(async p=>JSON.parse(await readFile(p,'utf8')))));
    process.stdout.write(JSON.stringify(result,null,2)+'\n');if(!result.payloadEquivalent)process.exitCode=1;
  }else throw Error('Usage: build-parity.mjs inputs file | inventory inputs dist output | compare left right');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(()=>{console.error('Build parity qualification failed; no artifact reuse authorized.');process.exitCode=1;});
