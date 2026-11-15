/** Read-only CSS ownership preflight; exact selector/property collisions are a
 * LOWER BOUND on cascade risk, never proof of safe runtime relocation.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadCssCascade} from './lib/cssCascade.mjs';

const root=pathToFileURL(resolve(process.argv[2]??'.')+'/');
const entries=loadCssCascade(root);
const desired=[
 'src/styles-src/25-extreme-outlook.css',
 'src/midC18FourteenReplitFluidGrid.css',
 'src/midC14MapWorkspace.css'
];
function rows(entry){const result=[];entry.tree.walkRules(rule=>{
 const props=rule.nodes.filter(n=>n.type==='decl').map(n=>n.prop.toLowerCase());
 for(const selector of rule.selector.split(/,(?![^()]*\))/).map(x=>x.trim()).filter(Boolean)){
  if(props.length)result.push({selector,props});
 }
});return result;}
const parsed=entries.map(entry=>({file:entry.file,rows:rows(entry),bytes:Buffer.byteLength(entry.original)}));
const results=[];
const mountainCssFile=resolve(process.argv[2]??'.','src/midC18MountainResponsiveFix.css');
const mountainCssText=await (await import('node:fs/promises')).readFile(mountainCssFile,'utf8');
const mountainModuleText=await (await import('node:fs/promises')).readFile(resolve(process.argv[2]??'.','src/MountainWeather.tsx'),'utf8');
if(parsed.some(e=>e.file==='src/midC18MountainResponsiveFix.css')||
 !mountainModuleText.startsWith("import './midC18MountainResponsiveFix.css';"))
 throw Error('Mountain styles must be owned by the deferred MountainWeather module, not the eager CSS manifest');
results.push({file:'src/midC18MountainResponsiveFix.css',sourceBytes:Buffer.byteLength(mountainCssText),
 ruleSelectors:0,sameSelectorPropertyCollisions:null,examples:[],
 status:'MOVED_PENDING_BROWSER_PARITY'});
for(const candidate of desired){
 const i=parsed.findIndex(e=>e.file===candidate);if(i<0)throw Error('CSS candidate absent from canonical presentation manifest: '+candidate);
 const current=parsed[i],later=parsed.slice(i+1),collisions=[];
 for(const rule of current.rows)for(const e of later)for(const follow of e.rows){
  if(rule.selector!==follow.selector)continue;
  const shared=[...new Set(rule.props)].filter(prop=>follow.props.includes(prop));
  if(shared.length)collisions.push({selector:rule.selector,properties:shared,overriddenIn:e.file});
 }
 results.push({file:candidate,sourceBytes:current.bytes,ruleSelectors:current.rows.length,
  sameSelectorPropertyCollisions:collisions.length,examples:collisions.slice(0,12),
  status:collisions.length?'BLOCKED_STATIC_COLLISIONS':'UNVERIFIED_NEEDS_OWNERSHIP_BROWSER_QA'});
}
const report={schema:'mid.css-move-risk.v1',kind:'read-only lower-bound collision inventory, not safe-move proof',
 eagerCssSourceCount:parsed.length,candidates:results};
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/css-move-risk-0985482.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({sources:parsed.length,candidates:results.map(x=>({file:x.file,bytes:x.sourceBytes,overrides:x.sameSelectorPropertyCollisions,status:x.status}))},null,2));
