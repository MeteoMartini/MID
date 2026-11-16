// MID P1: compact, complete, SHA-bound zizmor finding inventory (read-only).
// A truncated or inconsistent scanner response is never a clean PASS.
import {createHash} from 'node:crypto';
const MAX_JSON=2_000_000, MAX_FINDINGS=1_000;
const invalid=reason=>({schema:1,status:'INCOMPLETE',reason,findings:[],releaseAuthorized:false,mergeAuthorized:false});
const tally=(items,key)=>items.reduce((acc,item)=>(acc[item[key]]=(acc[item[key]]??0)+1,acc),{});
const equalCounts=(a,b)=>JSON.stringify(Object.entries(a??{}).sort())===JSON.stringify(Object.entries(b??{}).sort());

export function buildMidZizmorLedger(raw,{expected,exitCode,allowedWorkflows,version}={}){
 if(typeof raw!=='string'||raw.length===0||raw.length>MAX_JSON)return invalid('RAW_MISSING_OR_OVER_LIMIT');
 if(expected?.tool!=='zizmor'||!Number.isInteger(expected.exitCode)||expected.summary?.valid!==true)return invalid('SCANNER_REFERENCE_UNVERIFIED');
 if(exitCode!==expected.exitCode)return invalid('SCANNER_EXIT_MISMATCH');
 if(typeof version!=='string'||!/^\d+\.\d+\.\d+$/.test(version))return invalid('SCANNER_VERSION_UNKNOWN');
 let items;
 try{items=JSON.parse(raw);}catch{return invalid('UNPARSEABLE_OR_TRUNCATED_JSON');}
 if(!Array.isArray(items)||items.length>MAX_FINDINGS)return invalid('INVALID_OR_EXCESSIVE_FINDINGS');
 if(items.length!==expected.summary.findings)return invalid('FINDING_COUNT_MISMATCH');
 const allowed=new Set((allowedWorkflows??[]).map(n=>'.github/workflows/'+n));
 if(allowed.size===0)return invalid('ALLOWED_WORKFLOWS_MISSING');
 const findings=[];
 for(let i=0;i<items.length;i++){
  const item=items[i];
  if(typeof item?.ident!=='string'||typeof item?.determinations?.severity!=='string'||!Array.isArray(item.locations)||!item.locations.length)return invalid('MALFORMED_FINDING');
  const location=item.locations.find(x=>x?.symbolic?.kind==='Primary')??item.locations[0];
  const rawPath=String(location?.symbolic?.key?.Local?.verbatim_path??'').replaceAll('\\','/');
  const file=rawPath.match(/(?:^|\/)(\.github\/workflows\/[A-Za-z0-9_.-]+\.ya?ml)$/)?.[1];
  if(!file||!allowed.has(file))return invalid('FINDING_PATH_UNVERIFIED');
  const at=location?.concrete?.location?.start_point;
  if(!Number.isInteger(at?.row)||at.row<0||!Number.isInteger(at?.column)||at.column<0)return invalid('FINDING_LOCATION_UNVERIFIED');
  const route=location?.symbolic?.route?.route;
  const parts=Array.isArray(route)?route.map(x=>typeof x?.Key==='string'?x.Key:Number.isInteger(x?.Index)?x.Index:'?'):[];
  const finding={number:i+1,audit:item.ident,severity:item.determinations.severity,confidence:item.determinations.confidence??null,
    workflow:file,line:at.row+1,column:at.column+1,route:parts,annotation:String(location?.symbolic?.annotation??'').slice(0,120)};
  finding.fingerprint=createHash('sha256').update(JSON.stringify([finding.audit,finding.severity,finding.workflow,finding.line,finding.column,finding.route])).digest('hex');
  findings.push(finding);
 }
 if(!equalCounts(tally(findings,'severity'),expected.summary.bySeverity)||!equalCounts(tally(findings,'audit'),expected.summary.byAudit))return invalid('FINDING_GROUPS_MISMATCH');
 if(!equalCounts(tally(findings,'workflow'),expected.summary.byWorkflow))return invalid('FINDING_WORKFLOWS_MISMATCH');
 return {schema:1,status:'COMPLETE',tool:'zizmor',version,count:findings.length,bySeverity:tally(findings,'severity'),
   byAudit:tally(findings,'audit'),byWorkflow:tally(findings,'workflow'),findings,releaseAuthorized:false,mergeAuthorized:false};
}
