import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const MODULE_PATH=fileURLToPath(import.meta.url);
const DEFAULT_ROOT=path.resolve(path.dirname(MODULE_PATH),'..');
const SHA_PATTERN=/^[a-f0-9]{40}$/i;
const VERSION_PATTERN=/^\d+\.\d+\.\d+\.\d+$/;
async function filesUnder(directory,relative=''){
 const items=await readdir(path.join(directory,relative),{withFileTypes:true});
 const files=[];
 for(const item of items){
  const name=path.posix.join(relative.split(path.sep).join('/'),item.name);
  if(item.isSymbolicLink())throw new Error('Symlink im Web-Bundle unzulässig: '+name);
  if(item.isDirectory())files.push(...await filesUnder(directory,name));
  else if(item.isFile()&&name!=='mid-build-identity.json')files.push(name);
 }
 return files;
}
function knownSourceSha(root){
 const configured=String(process.env.GITHUB_SHA||'').trim();
 if(SHA_PATTERN.test(configured))return configured.toLowerCase();
 try{
  const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  return SHA_PATTERN.test(sha)?sha.toLowerCase():null;
 }catch{return null;}
}
export async function writeBuildIdentity({root=DEFAULT_ROOT,sourceSha,now}={}){
 const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
 const version=String(pkg.version||'').trim();
 if(!VERSION_PATTERN.test(version))throw new Error('Ungültige vierteilige MID-Version: '+version);
 const dist=path.join(root,'dist');
 const released=JSON.parse(await readFile(path.join(dist,'version.json'),'utf8'));
 if(released.version!==version)throw new Error('Web-Bundle-Version widerspricht package.json');
 const index=await readFile(path.join(dist,'index.html'),'utf8');
 if(!index.includes('<meta name="mid-version" content="'+version+'">'))throw new Error('Web-Bundle-HTML und package.json widersprechen sich');
 const sourceVersion=await readFile(path.join(root,'src','version.ts'),'utf8');
 if(!sourceVersion.includes("MID_VERSION='"+version+"'"))throw new Error('App-Version widerspricht package.json');
 const filenames=(await filesUnder(dist)).sort();
 if(!filenames.some(name=>name.startsWith('assets/')&&name.endsWith('.js')))throw new Error('Vite-Bundle enthält keine JavaScript-Assets');
 const fingerprint=createHash('sha256');
 for(const filename of filenames){
  const data=await readFile(path.join(dist,filename));
  const digest=createHash('sha256').update(data).digest('hex');
  fingerprint.update(filename+'\u0000'+digest+'\n');
 }
 const sha=sourceSha===undefined?knownSourceSha(root):sourceSha;
 if(sha!==null&&!SHA_PATTERN.test(String(sha)))throw new Error('Ungültige Quell-SHA');
 const date=now===undefined?new Date():new Date(now);
 if(!Number.isFinite(date.getTime()))throw new Error('Ungültige Build-Zeit');
 const identity={schema:'mid.web-build-identity.v1',version,sourceGitSha:sha?.toLowerCase()||null,builtAtUtc:date.toISOString(),assetsSha256:fingerprint.digest('hex'),assetCount:filenames.length};
 await writeFile(path.join(dist,'mid-build-identity.json'),JSON.stringify(identity,null,2)+'\n');
 return identity;
}
if(process.argv[1]&&path.resolve(process.argv[1])===MODULE_PATH){
 const result=await writeBuildIdentity();
 console.log('MID-Web-Build-Identität: v'+result.version+' · '+result.assetCount+' Assets · sha256 '+result.assetsSha256.slice(0,12)+' · Source '+(result.sourceGitSha||'nicht verifizierbar'));
}
