import {readFile,mkdir,writeFile,appendFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const root=new URL('../',import.meta.url);
const lockText=await readFile(new URL('../package-lock.json',import.meta.url),'utf8');
const lock=JSON.parse(lockText);
const packages=lock.packages??{};

const packageNameFromPath=(packagePath)=>{
 const marker='node_modules/';
 const index=packagePath.lastIndexOf(marker);
 if(index<0)return null;
 const tail=packagePath.slice(index+marker.length);
 if(!tail)return null;
 if(tail.startsWith('@')){
  const parts=tail.split('/');
  return parts.length>=2?`${parts[0]}/${parts[1]}`:null;
 }
 return tail.split('/')[0]||null;
};

const productionPackages=[];
const seen=new Set();
for(const [packagePath,entry] of Object.entries(packages)){
 if(!packagePath||!entry||typeof entry!=='object'||entry.dev===true)continue;
 const name=packageNameFromPath(packagePath);
 const version=typeof entry.version==='string'?entry.version:null;
 if(!name||!version)continue;
 const key=`${name}@${version}`;
 if(seen.has(key))continue;
 seen.add(key);
 productionPackages.push({name,version});
}
productionPackages.sort((a,b)=>a.name.localeCompare(b.name)||a.version.localeCompare(b.version));

if(!productionPackages.length){
 console.error('MID Dependency Audit: keine Produktionspakete aus package-lock.json ermittelt.');
 process.exit(1);
}

const severityRank={unknown:0,low:1,moderate:2,medium:2,high:3,critical:4};
const normalizeSeverity=(value)=>String(value??'unknown').trim().toLowerCase();
const isBlockingSeverity=(value)=>severityRank[normalizeSeverity(value)]>=severityRank.high;
const advisoryKey=(item)=>`${item.packageName}:${item.id??item.url??item.title??item.summary??'unknown'}`;

async function fetchJson(url,{body,timeoutMs=18000}={}){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(new Error(`Timeout nach ${timeoutMs} ms`)),timeoutMs);
 try{
  const response=await fetch(url,{
   method:'POST',
   headers:{'content-type':'application/json','accept':'application/json','user-agent':'MID-dependency-audit'},
   body:JSON.stringify(body),
   signal:controller.signal,
  });
  if(!response.ok)throw new Error(`HTTP ${response.status} ${response.statusText}`);
  return await response.json();
 }finally{
  clearTimeout(timer);
 }
}

async function auditWithNpmBulk(){
 const versions={};
 for(const item of productionPackages)(versions[item.name]??=[]).push(item.version);
 const endpoint=process.env.MID_NPM_AUDIT_BULK_URL||'https://registry.npmjs.org/-/npm/v1/security/advisories/bulk';
 const payload=await fetchJson(endpoint,{body:versions});
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new Error('Ungültiger npm-Advisory-Bericht.');
 const findings=[];
 for(const [packageName,advisories] of Object.entries(payload??{})){
  if(!Array.isArray(advisories))throw new Error('Ungültige npm-Advisory-Liste.');
  for(const advisory of advisories){
   const severity=normalizeSeverity(advisory?.severity??advisory?.cvss?.severity);
   const score=Number(advisory?.cvss?.score);
   if(isBlockingSeverity(severity)||(Number.isFinite(score)&&score>=7)){
    findings.push({
     source:'npm-bulk',
     packageName,
     id:advisory?.id,
     title:advisory?.title,
     severity:Number.isFinite(score)&&score>=9?'critical':Number.isFinite(score)&&score>=7?'high':severity,
     url:advisory?.url,
    });
   }
  }
 }
 return findings;
}

const osvSeverity=(vulnerability)=>{
 const candidates=[vulnerability?.database_specific?.severity,vulnerability?.ecosystem_specific?.severity];
 for(const candidate of candidates)if(isBlockingSeverity(candidate))return normalizeSeverity(candidate);
 // OSV liefert CVSS häufig als Vektor. Ohne Bibliothek wird kein Score erfunden;
 // HIGH/CRITICAL aus der Quelldatenbank bleibt der verbindliche Fallbackvertrag.
 return null;
};

async function auditWithOsv(){
 const endpoint=process.env.MID_OSV_AUDIT_URL||'https://api.osv.dev/v1/querybatch';
 const queries=productionPackages.map(({name,version})=>({package:{name,ecosystem:'npm'},version}));
 const payload=await fetchJson(endpoint,{body:{queries},timeoutMs:20000});
 if(!Array.isArray(payload?.results)||payload.results.length!==queries.length||payload.results.some(result=>!result||typeof result!=='object'||Array.isArray(result)||(result.vulns!==undefined&&!Array.isArray(result.vulns))))throw new Error('Ungültiger oder unvollständiger OSV-Advisory-Bericht.');
 const results=payload.results;
 const findings=[];
 results.forEach((result,index)=>{
  const packageInfo=productionPackages[index];
  if(!packageInfo||!Array.isArray(result?.vulns))return;
  for(const vulnerability of result.vulns){
   const severity=osvSeverity(vulnerability);
   if(!severity)continue;
   findings.push({
    source:'osv',
    packageName:packageInfo.name,
    id:vulnerability?.id,
    title:vulnerability?.summary,
    severity,
    url:vulnerability?.references?.find?.(reference=>reference?.type==='ADVISORY')?.url,
   });
  }
 });
 return findings;
}

function validateInstalledProductionTree(){
 const result=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['ls','--omit=dev','--all','--json'],{
  cwd:new URL('.',root),
  encoding:'utf8',
  env:{...process.env,npm_config_audit:'false',npm_config_fund:'false'},
 });
 if(result.status===0)return;
 const detail=(result.stderr||result.stdout||'npm ls fehlgeschlagen').trim();
 throw new Error(`installierter Produktionsbaum ist inkonsistent: ${detail.slice(0,1500)}`);
}

validateInstalledProductionTree();
console.log(`MID Dependency Audit: ${productionPackages.length} installierte Produktionspaket-Versionen ermittelt.`);

let findings=[];
let npmBulkError=null;
let source='npm-bulk';
let advisoryUnavailable=false;
const providerErrors=[];
try{
 findings=await auditWithNpmBulk();
 console.log('MID Dependency Audit: npm Bulk Advisory Endpoint erfolgreich geprüft.');
}catch(error){
 npmBulkError=error;
 providerErrors.push({source:'npm-bulk',message:String(error?.message??error)});
 console.warn(`::warning::npm Bulk Advisory Endpoint nicht erreichbar (${error?.message??error}). OSV-Fallback wird verwendet.`);
 try{
  findings=await auditWithOsv();
  source='osv';
  console.log('MID Dependency Audit: OSV-Fallback erfolgreich geprüft.');
 }catch(osvError){
  console.warn(`::warning::Auch OSV ist vorübergehend nicht erreichbar (${osvError?.message??osvError}). Der Release wird wegen eines reinen externen Advisory-Service-Ausfalls nicht blockiert; npm-ci-Baum, Lockfile und MID-Upgrade-Policy bleiben separat verbindlich.`);
  console.warn(`::warning::Primärer npm-Fehler: ${npmBulkError?.message??npmBulkError}`);
  findings=[];
  source=null;
  advisoryUnavailable=true;
  providerErrors.push({source:'osv',message:String(osvError?.message??osvError)});
 }
}

const deduped=[...new Map(findings.map(item=>[advisoryKey(item),item])).values()];
const state=deduped.length?'blocked':advisoryUnavailable?'unknown':'checked';
const report={schema:'mid.dependency-audit.v1',state,checkedAt:new Date().toISOString(),lockfileSha256:createHash('sha256').update(lockText).digest('hex'),productionPackageVersions:productionPackages.length,source,findings:deduped,providerErrors,recheckRequired:advisoryUnavailable,releasePolicy:advisoryUnavailable?'deferred-external-service-outage':'enforce-high-critical'};
await mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});
await writeFile(new URL('../artifacts/dependency-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(`MID_DEPENDENCY_AUDIT_RESULT=${JSON.stringify(report)}`);
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`\nMID Dependency Audit: **${state}** · ${productionPackages.length} Produktionsversionen · Lockfile SHA-256 \`${report.lockfileSha256}\` · Quelle: ${source??'keine verfügbar'}${advisoryUnavailable?' · Nachprüfung erforderlich; keine Sicherheitsfreigabe belegt.':''}\n`);
if(deduped.length){
 console.error('MID Dependency Audit: HIGH/CRITICAL-Sicherheitsbefunde in Produktionsabhängigkeiten:');
 for(const item of deduped){
  console.error(`- [${String(item.severity).toUpperCase()}] ${item.packageName}: ${item.title??item.id??'Advisory'}${item.url?` · ${item.url}`:''}`);
 }
 process.exit(1);
}

if(advisoryUnavailable)console.warn('::warning::MID Dependency Audit: UNKNOWN – beide Advisory-Dienste ausgefallen. Keine Aussage über HIGH/CRITICAL möglich; Nachprüfung erforderlich. Bestehende externe-Ausfall-Policy unverändert.');
else console.log('MID Dependency Audit: keine HIGH/CRITICAL-Befunde aus dem verfügbaren Advisory-Pfad.');
