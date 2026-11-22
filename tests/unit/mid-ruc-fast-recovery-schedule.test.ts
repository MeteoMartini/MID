import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {isCanonicalCatchupRucWorkflow} from '../../scripts/ruc-workflow-sync-contract.mjs';

const active=readFileSync(new URL('../../.github/workflows/mid-ruc-preprocess.yml',import.meta.url),'utf8');
const canonical=readFileSync(new URL('../../ci/github/workflows/mid-ruc-preprocess.yml',import.meta.url),'utf8');

describe('MID .510 Fast-RUC catch-up scheduler integrity',()=>{
 it('ships one byte-identical canonical workflow and four ordered schedule slots',()=>{
   expect(active).toBe(canonical);
   expect(isCanonicalCatchupRucWorkflow(canonical)).toBe(true);
   expect([...canonical.matchAll(/^\s*- cron: '([^']+)'$/gm)].map(x=>x[1])).toEqual([
     '11 * * * *','41 * * * *','13,43 * * * *','28,58 * * * *'
   ]);
 });
 it('rejects removal of the recovery slot without altering the ordinary Fast slots',()=>{
   expect(isCanonicalCatchupRucWorkflow(canonical.replace("    - cron: '28,58 * * * *'\n",''))).toBe(false);
 });
 it('rejects an unbound GitHub run selector inside the recovery step, even if other SHA text survives',()=>{
   expect(isCanonicalCatchupRucWorkflow(canonical.replace(
     'select(.head_sha == $sha and (.id | tostring) != $self)',
     'select((.id | tostring) != $self)'
   ))).toBe(false);
   expect(isCanonicalCatchupRucWorkflow(canonical.replace(
     'select(.head_sha == $sha and (.id | tostring) != $self)',
     'select(.head_sha == "other" and (.id | tostring) != $self)'
   ))).toBe(false);
 });
 it('refuses Fast runs from a different source-lineage SHA',()=>{
   expect(isCanonicalCatchupRucWorkflow(canonical.replace('EXPECTED_STABLE_SHA: ${{ steps.lineage.outputs.sha }}','EXPECTED_STABLE_SHA: ${{ github.sha }}'))).toBe(false);
 });
 it('requires a bounded 90-minute window rather than 22-minute best-effort scanning',()=>{
   expect(isCanonicalCatchupRucWorkflow(canonical.replace('90 minutes ago','22 minutes ago'))).toBe(false);
   expect(isCanonicalCatchupRucWorkflow(canonical.replace('25 minutes ago','90 minutes ago'))).toBe(false);
   expect(isCanonicalCatchupRucWorkflow(canonical.replace('.completed_at >= $after','.created_at >= $after'))).toBe(false);
   expect(isCanonicalCatchupRucWorkflow(canonical.replaceAll('(.total_count <= 100)','(.total_count <= 1000)'))).toBe(false);
 });
 it('inspects newest real Fast run before older successes',()=>{
   expect(isCanonicalCatchupRucWorkflow(canonical.replace('sort_by(.created_at) | reverse','sort_by(.created_at)'))).toBe(false);
   expect(isCanonicalCatchupRucWorkflow(canonical.replace('candidate_runs="$(jq -r','candidate_runs="unsafe'))).toBe(false);
 });
 it('never drops the original Fast qualification and recoverable skip guard',()=>{
   expect(isCanonicalCatchupRucWorkflow(canonical.replace('id: fast_recovery','id: fast_unprotected'))).toBe(false);
   expect(isCanonicalCatchupRucWorkflow(canonical.replaceAll("if: steps.fast_recovery.outputs.skip != 'true'",'if: always()'))).toBe(false);
 });
});
