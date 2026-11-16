import {describe,it,expect} from 'vitest';
import postcss from 'postcss';
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
});
