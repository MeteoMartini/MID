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
 it('requires the Fast recovery check before pinned native dependency setup',()=>{
   const install='      - name: Install pinned MID native RUC dependencies\n';
   const next='      - name: Fail-closed offline fast producer';
   const recovery='      - name: Fast-Nachholbedarf vor DWD-Downloads prüfen\n';
   const start=canonical.indexOf(install);
   const end=canonical.indexOf(next,start);
   expect(start).toBeGreaterThan(0);
   expect(end).toBeGreaterThan(start);
   const moved=canonical.slice(start,end);
   const without=canonical.slice(0,start)+canonical.slice(end);
   const insertAt=without.indexOf(recovery);
   expect(insertAt).toBeGreaterThan(0);
   const reordered=without.slice(0,insertAt)+moved+without.slice(insertAt);
   expect(isCanonicalCatchupRucWorkflow(reordered)).toBe(false);
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
