import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {buildMidZizmorLedger} from '../../tools/ci/mid-p1-findings-ledger.mjs';
const path='/home/runner/work/MID/MID/.github/workflows/release-self-heal.yml';
const item={ident:'dangerous-triggers',determinations:{severity:'High',confidence:'Medium'},
 locations:[{symbolic:{kind:'Primary',annotation:'workflow_run is almost always used insecurely',key:{Local:{verbatim_path:path}},route:{route:[{Key:'on'},{Key:'workflow_run'}]}},
 concrete:{location:{start_point:{row:4,column:2}}}}]};
const base={expected:{tool:'zizmor',exitCode:14,summary:{valid:true,findings:1,bySeverity:{High:1},
 byAudit:{'dangerous-triggers':1},byWorkflow:{'.github/workflows/release-self-heal.yml':1}}},
 exitCode:14,version:'1.32.0',allowedWorkflows:['release-self-heal.yml']};
const check=(raw:any,args:any=base)=>buildMidZizmorLedger(raw,args);
describe('MID P1 complete findings evidence never masks scanner failures',()=>{
 it('keeps exact original path, line, source route, severity and immutable fingerprint',()=>{
  const out=check(JSON.stringify([item]));
  expect(out.status).toBe('COMPLETE');expect(out.count).toBe(1);
  expect(out.findings[0]).toMatchObject({audit:'dangerous-triggers',severity:'High',workflow:'.github/workflows/release-self-heal.yml',line:5,column:3,route:['on','workflow_run']});
  expect(out.findings[0].fingerprint).toMatch(/^[0-9a-f]{64}$/);
  expect(out.releaseAuthorized).toBe(false);expect(out.mergeAuthorized).toBe(false);
 });
 it('rejects truncated or malformed JSON',()=>expect(check('[{"ident":').reason).toBe('UNPARSEABLE_OR_TRUNCATED_JSON'));
 it('rejects an aggregate count mismatch',()=>expect(check('[]').reason).toBe('FINDING_COUNT_MISMATCH'));
 it('rejects changed scanner exit despite identical findings',()=>expect(check(JSON.stringify([item]),{...base,exitCode:0}).reason).toBe('SCANNER_EXIT_MISMATCH'));
 it('rejects an unknown scanner or version',()=>{
  expect(check(JSON.stringify([item]),{...base,version:'latest'}).reason).toBe('SCANNER_VERSION_UNKNOWN');
  expect(check(JSON.stringify([item]),{...base,expected:{...base.expected,tool:'other'}}).reason).toBe('SCANNER_REFERENCE_UNVERIFIED');
 });
 it('rejects a path outside the verified seven-workflow inventory',()=>{
  const foreign=structuredClone(item);foreign.locations[0].symbolic.key.Local.verbatim_path='/tmp/alien.yml';
  expect(check(JSON.stringify([foreign])).reason).toBe('FINDING_PATH_UNVERIFIED');
 });
 it('rejects a missing allowed-file inventory and fake position',()=>{
  expect(check(JSON.stringify([item]),{...base,allowedWorkflows:[]}).reason).toBe('ALLOWED_WORKFLOWS_MISSING');
  const bad=structuredClone(item);delete bad.locations[0].concrete.location.start_point;
  expect(check(JSON.stringify([bad])).reason).toBe('FINDING_LOCATION_UNVERIFIED');
 });
 it('rejects severity and per-workflow inconsistencies',()=>{
  const expected=structuredClone(base.expected);expected.summary.bySeverity={'Medium':1};
  expect(check(JSON.stringify([item]),{...base,expected}).reason).toBe('FINDING_GROUPS_MISMATCH');
  expected.summary.bySeverity={'High':1};expected.summary.byWorkflow={'unknown':1};
  expect(check(JSON.stringify([item]),{...base,expected}).reason).toBe('FINDING_WORKFLOWS_MISMATCH');
 });
 it('pins the scanner bootstrapping to a complete secondary offline inventory',()=>{
  const root=fileURLToPath(new URL('../..',import.meta.url));
  const source=readFileSync(new URL('../../tools/ci/mid-p1-tool-bootstrap.mjs',import.meta.url),'utf8');
  expect(source).toContain('buildMidZizmorLedger(');
  expect(source).toContain("ledger.status!=='COMPLETE'?'SCANNER_EVIDENCE_INCOMPLETE'");
  expect(source).toContain("'--offline','--no-config','--strict-collection','--format=json'");
  expect(source).toContain('collectWorkflowPilot(root)');
  expect(source).toContain('maxBuffer:2*1024*1024');
  expect(root).toMatch(/MID|repo|work/);
 });
});
