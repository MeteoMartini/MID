/** Read-only diagnostic: report cross-selector CSS conflicts before lazy splitting. */
import {writeFile,mkdir} from 'node:fs/promises';
import {loadCssCascade} from './lib/cssCascade.mjs';
import {cssSelectorRiskEvidence} from './lib/cssSelectorRiskEvidence.mjs';

const root=new URL('../',import.meta.url);
const entries=loadCssCascade(root);
const candidates=[
 'src/styles-src/25-extreme-outlook.css',
 'src/midC14MapWorkspace.css',
 'src/midC18FourteenReplitFluidGrid.css',
];
const report={
 schema:'mid.design17.css-selector-risk-report.v1',
 scope:'Read-only lower-bound candidate ordering risk; no CSS move or release permission',
 eagerSources:entries.length,
 candidates:candidates.map(file=>cssSelectorRiskEvidence(entries,file)),
};
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/css-selector-risk-design17.json',JSON.stringify(report,null,2)+'\n');
console.log('MID_DESIGN17_CSS_SELECTOR_RISK '+JSON.stringify({sources:report.eagerSources,
 candidates:report.candidates.map(({candidateFile,status,potentialPairs,matchingImportancePairs,differentImportancePairs,shorthandLonghandPairs,shorthandMatchingImportancePairs,shorthandDifferentImportancePairs,affectedFiles,ambiguousCandidateSelectors,ambiguousLaterSelectors,safeToDefer})=>
  ({candidateFile,status,potentialPairs,matchingImportancePairs,differentImportancePairs,shorthandLonghandPairs,shorthandMatchingImportancePairs,shorthandDifferentImportancePairs,affectedFileCount:affectedFiles.length,ambiguousCandidateSelectors,ambiguousLaterSelectors,safeToDefer}))}));
