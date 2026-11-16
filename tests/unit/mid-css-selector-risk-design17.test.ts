import {describe,it,expect} from 'vitest';
import postcss from 'postcss';
import {execFileSync} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {cssSelectorRiskEvidence} from '../../scripts/lib/cssSelectorRiskEvidence.mjs';
import {loadCssCascade} from '../../scripts/lib/cssCascade.mjs';

const css=(file:string,source:string)=>({file,tree:postcss.parse(source,{from:file})});

describe('Design 1.7 – fail-closed CSS cross-selector cascade evidence',()=>{
 it('finds ordering risks even when the selectors are not exactly identical',()=>{
  const entries=[
   css('candidate.css','@media (max-width: 430px){.card.active{padding:8px!important}}'),
   css('following.css','.shell .card{padding:16px}')
  ];
  const report=cssSelectorRiskEvidence(entries,'candidate.css');
  expect(report.schema).toBe('mid.css-selector-risk-evidence.v1');
  expect(report.potentialPairs).toBe(1);
  expect(report.affectedClasses).toEqual(['card']);
  expect(report.examples[0].candidate.conditions).toContain('@media (max-width: 430px)');
  expect(report.status).toBe('POTENTIAL_CROSS_SELECTOR_CASCADE_RISK');
  expect(report.safeToDefer).toBe(false);
 });
 it('does not duplicate identical selector collisions handled by the existing risk audit',()=>{
  const report=cssSelectorRiskEvidence([
   css('candidate.css','.card{padding:8px}'),
   css('later.css','.card{padding:9px}')
  ],'candidate.css');
  expect(report.potentialPairs).toBe(0);
  expect(report.safeToDefer).toBe(false);
 });
 it('does not treat unrelated classes, keyframe selectors or zero matches as a safe move',()=>{
  const report=cssSelectorRiskEvidence([
   css('candidate.css','.badge{color:red}.plain{margin:0}'),
   css('later.css','@keyframes blink {from{color:white} to{color:black}} .other{color:blue}')
  ],'candidate.css');
  expect(report.potentialPairs).toBe(0);
  expect(report.status).toBe('UNVERIFIED_NO_STATIC_MATCH');
  expect(report.safeToDefer).toBe(false);
 });
 it('reports unclassified element selectors without inventing safety',()=>{
  const report=cssSelectorRiskEvidence([
   css('candidate.css','button{padding:4px}.label{display:block}'),
   css('later.css','button{padding:8px}')
  ],'candidate.css');
  expect(report.unclassifiedRules).toBe(1);
  expect(report.safeToDefer).toBe(false);
 });
 it('rejects missing candidate, duplicate entries and malformed trees',()=>{
  expect(()=>cssSelectorRiskEvidence([], 'candidate.css')).toThrow(/Nonempty/);
  expect(()=>cssSelectorRiskEvidence([css('else.css','.x{margin:0}')], 'candidate.css')).toThrow(/missing/);
  const entry=css('a.css','.x{margin:0}');
  expect(()=>cssSelectorRiskEvidence([entry,entry],'a.css')).toThrow(/duplicate/);
  expect(()=>cssSelectorRiskEvidence([{file:'candidate.css',tree:null}] as never,'candidate.css')).toThrow(/parsed PostCSS/);
 });
 it('reads the real canonical 68-source cascade and never authorizes CSS moves',()=>{
  const entries=loadCssCascade(new URL('../../',import.meta.url));
  const report=cssSelectorRiskEvidence(entries,'src/midC18FourteenReplitFluidGrid.css');
  expect(entries.length).toBeGreaterThan(60);
  expect(report.candidateRuleCount).toBeGreaterThan(1);
  expect(report.laterEagerFiles).toBeGreaterThan(0);
  expect(report.safeToDefer).toBe(false);
  expect(['UNVERIFIED_NO_STATIC_MATCH','POTENTIAL_CROSS_SELECTOR_CASCADE_RISK']).toContain(report.status);
 });

 it('ignores dotted strings in attribute selectors and quoted pseudo parameters',()=>{
  const report=cssSelectorRiskEvidence([
   css('candidate.css','[data-caption=".card"]{padding:4px}:lang(".card"){padding:5px}'),
   css('later.css','.shell .card{padding:8px}')
  ],'candidate.css');
  expect(report.potentialPairs).toBe(0);
  expect(report.unclassifiedRules).toBe(2);
  expect(report.safeToDefer).toBe(false);
 });
 it('keeps real classes in functional selectors while ignoring attribute literals',()=>{
  const report=cssSelectorRiskEvidence([
   css('candidate.css','[data-icon=".fake"] :is(.card,.tile){padding:4px}'),
   css('later.css','.shell .card{padding:8px}')
  ],'candidate.css');
  expect(report.potentialPairs).toBe(1);
  expect(report.affectedClasses).toEqual(['card']);
  expect(report.safeToDefer).toBe(false);
 });
 it('marks escaped and non-ASCII class names uncertain instead of matching truncated anchors',()=>{
  const report=cssSelectorRiskEvidence([
   css('candidate.css',String.raw`.card\:active{padding:4px}.métric{padding:8px}`),
   css('later.css','.shell .card{padding:10px}')
  ],'candidate.css');
  expect(report.potentialPairs).toBe(0);
  expect(report.ambiguousCandidateSelectors).toBe(2);
  expect(report.unclassifiedRules).toBe(2);
  expect(report.safeToDefer).toBe(false);
 });
 it('records uncertain later selectors separately from eligible matches',()=>{
  const report=cssSelectorRiskEvidence([
   css('candidate.css','.card{padding:4px}'),
   css('later.css',String.raw`.card\:hover{padding:9px}.wrapper .card{padding:11px}`)
  ],'candidate.css');
  expect(report.ambiguousLaterSelectors).toBe(1);
  expect(report.potentialPairs).toBe(1);
  expect(report.affectedClasses).toEqual(['card']);
 });


 it('runs the real diagnostic CLI for all canonical CSS candidates without granting a move',async()=>{
  const repoRoot=fileURLToPath(new URL('../../',import.meta.url));
  const cwd=await mkdtemp(join(tmpdir(),'mid-design17-selector-risk-'));
  try{
   const stdout=execFileSync(process.execPath,[join(repoRoot,'scripts/audit-css-selector-risk-design17.mjs')],{
    cwd,encoding:'utf8',timeout:45_000,stdio:['ignore','pipe','pipe'],
   });
   expect(stdout).toContain('MID_DESIGN17_CSS_SELECTOR_RISK');
   const report=JSON.parse(await readFile(join(cwd,'artifacts/css-selector-risk-design17.json'),'utf8'));
   expect(report.schema).toBe('mid.design17.css-selector-risk-report.v1');
   expect(report.eagerSources).toBeGreaterThan(60);
   expect(report.candidates.map((x:{candidateFile:string})=>x.candidateFile)).toEqual([
    'src/styles-src/25-extreme-outlook.css',
    'src/midC14MapWorkspace.css',
    'src/midC18FourteenReplitFluidGrid.css',
   ]);
   for(const row of report.candidates){
    expect(row.safeToDefer).toBe(false);
    expect(Number.isInteger(row.potentialPairs)).toBe(true);
    expect(Number.isInteger(row.ambiguousCandidateSelectors)).toBe(true);
    expect(Number.isInteger(row.ambiguousLaterSelectors)).toBe(true);
    expect(row.status).toMatch(/^(POTENTIAL_CROSS_SELECTOR_CASCADE_RISK|UNVERIFIED_NO_STATIC_MATCH)$/);
   }
   console.log('MID_DESIGN17_REAL_CASCADE_QA '+JSON.stringify(report.candidates.map(
    (row:{candidateFile:string;potentialPairs:number;ambiguousCandidateSelectors:number;safeToDefer:boolean})=>({
     file:row.candidateFile,staticRiskPairs:row.potentialPairs,ambiguous:row.ambiguousCandidateSelectors,safeToDefer:row.safeToDefer
    })
   )));
  }finally{await rm(cwd,{recursive:true,force:true})}
 });

});
