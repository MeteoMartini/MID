import {readFileSync,writeFileSync} from 'node:fs';
import {loadCssCascade,consolidateCssCascade,cssCascadeFingerprint,renderConsolidatedCss} from './lib/cssCascade.mjs';
const root=new URL('../',import.meta.url),entries=loadCssCascade(root),removed=consolidateCssCascade(entries);
const output=renderConsolidatedCss(entries),target=new URL('src/midPresentation.css',root);
const savedBytes=removed.reduce((sum,declaration)=>sum+Buffer.byteLength(declaration.property+':'+declaration.value+(declaration.important?'!important':'')+';'),0);
if(process.argv.includes('--write'))writeFileSync(target,output);
console.log(JSON.stringify({removedDeclarations:removed.length,savedBytes,cascadeFingerprint:cssCascadeFingerprint(entries)},null,2));
if(process.argv.includes('--check')&&readFileSync(target,'utf8')!==output){console.error('Generated presentation CSS is stale');process.exitCode=1;}
