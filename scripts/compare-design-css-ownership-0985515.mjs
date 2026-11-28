#!/usr/bin/env node
/**
 * Conservative CSS cascade-growth signals from the existing MID ownership audit.
 * Reports diagnostic risk, never claims computed-style equivalence or safe deletion.
 * Run: node scripts/compare-design-css-ownership-0985515.mjs <stable-audit.json> <candidate-audit.json>
 */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const FIELDS=[
 ['sourceCount','Manifest source count'],
 ['sourceBytes','CSS source bytes'],
 ['rules','CSS rule count'],
 ['importantDeclarations','Important declarations'],
 ['laterExactMatches','Cross-file exact-selector/property/context collisions'],
 ['laterDifferentValue','Cross-file conflicting-value signals'],
 ['laterImportanceDifferences','Cross-file priority-difference signals'],
];
const safe=(value,label)=>{
 if(!Number.isSafeInteger(value)||value<0)throw Error('Invalid ownership metric '+label);
 return value;
};
function sum(list,key){return list.reduce((n,item)=>n+safe(item[key],key+' in '+item.file),0)}
export function ownershipSnapshot(audit){
 if(!audit||audit.schema!=='mid.css.ownership.diagnostic.v1'||
  audit.status!=='DIAGNOSTIC_ONLY_NO_CSS_MOVE_APPROVAL'||!audit.summary||!Array.isArray(audit.sources)||!audit.sources.length){
  throw Error('Invalid MID ownership audit evidence');
 }
 const names=new Set();
 for(const row of audit.sources){
  if(typeof row?.file!=='string'||!row.file||names.has(row.file))throw Error('Invalid/duplicate CSS source in ownership snapshot');
  names.add(row.file);
 }
 const sources=audit.sources,s=audit.summary;
 const metrics={
  sourceCount:sources.length,
  sourceBytes:sum(sources,'sourceBytes'),
  rules:sum(sources,'rules'),
  importantDeclarations:sum(sources,'important'),
  laterExactMatches:sum(sources,'laterExactMatches'),
  laterDifferentValue:sum(sources,'laterDifferentValue'),
  laterImportanceDifferences:sum(sources,'laterImportanceDifferences'),
 };
 for(const key of ['sourceCount','sourceBytes','rules','importantDeclarations']){
  if(metrics[key]!==safe(s[key],'summary.'+key))throw Error('Contradictory CSS ownership report: '+key);
 }
 if(metrics.laterDifferentValue>metrics.laterExactMatches||metrics.laterImportanceDifferences>metrics.laterDifferentValue){
  throw Error('Inconsistent CSS collision-count evidence');
 }
 return metrics;
}
export function compareCssOwnership(stable,candidate){
 const a=ownershipSnapshot(stable),b=ownershipSnapshot(candidate);
 const rows=FIELDS.map(([key,label])=>({key,label,stable:a[key],candidate:b[key],delta:b[key]-a[key],ok:b[key]<=a[key]}));
 return {schema:'mid.design-css-ownership-delta.v1',
  status:rows.every(x=>x.ok)?'PASS_NO_CASCADE_SIGNAL_GROWTH':'FAIL_CASCADE_SIGNAL_GROWTH',rows,
  limitation:'Identical selectors in different files can have legitimate state/media ownership. No safe removal follows from this count; browser computed-style and responsive parity remain mandatory.'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  if(process.argv.length!==4)throw Error('Usage: node scripts/compare-design-css-ownership-0985515.mjs <stable-audit.json> <candidate-audit.json>');
  const base=JSON.parse(readFileSync(process.argv[2],'utf8'));
  const head=JSON.parse(readFileSync(process.argv[3],'utf8'));
  const result=compareCssOwnership(base,head);
  for(const x of result.rows)console.log(`${x.ok?'PASS':'FAIL'} ${x.label}: ${x.stable} -> ${x.candidate} (${x.delta>=0?'+':''}${x.delta})`);
  console.log(result.status+' | '+result.limitation);
  if(result.status!=='PASS_NO_CASCADE_SIGNAL_GROWTH')process.exitCode=1;
 }catch(e){console.error('FAIL_OWNERSHIP_EVIDENCE: '+(e instanceof Error?e.message:String(e)));process.exitCode=1}
}
