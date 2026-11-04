import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
// Deliberately declared groups: divergence must fail, never silently alias a theme.
export const BRAND_GROUPS=[['mid-icon-512.png','mid-icon-dark-512.png','mid-logo.png'],['mid-logo-light-compact.png','mid-logo-light.png'],['mid-logo-dark-compact.png','mid-logo-dark.png'],['mid-icon-192.png','mid-icon-dark-192.png'],['mid-icon-180.png','mid-icon-dark-180.png']];
export function verifiedBrandGroups(root=resolve(fileURLToPath(new URL('..',import.meta.url)))){
 return BRAND_GROUPS.map(urls=>{
  const bytes=readFileSync(resolve(root,'public',urls[0])),sha256=createHash('sha256').update(bytes).digest('hex');
  for(const name of urls.slice(1))if(!readFileSync(resolve(root,'public',name)).equals(bytes))throw new Error('Brand alias divergence: '+urls.join(', '));
  return {urls,sha256,bytes:bytes.length};
 });
}
export function syncBrandGroups(check=false,root=resolve(fileURLToPath(new URL('..',import.meta.url)))){
 const line='const BRAND_SHELL_GROUPS='+JSON.stringify(verifiedBrandGroups(root))+';';
 for(const name of ['service-worker.js','sw.js']){
  const file=resolve(root,'public',name),text=readFileSync(file,'utf8'),next=text.replace(/^const BRAND_SHELL_GROUPS=.*;$/m,line);
  if(next===text&&!text.includes(line))throw new Error('Missing generated brand group marker: '+name);
  if(check&&next!==text)throw new Error('Stale generated brand groups: '+name);
  if(!check)writeFileSync(file,next);
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))syncBrandGroups(process.argv.includes('--check'));
