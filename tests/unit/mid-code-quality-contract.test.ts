import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe,expect,it} from 'vitest';
const root=fileURLToPath(new URL('../..',import.meta.url));
const read=(file:string)=>readFileSync(resolve(root,file),'utf8');
const mirror=(name:string)=>{
 const active=read('.github/workflows/'+name);
 expect(active).toBe(read('ci/github/workflows/'+name));
 return active;
};
const segment=(source:string,start:string,end:string)=>{
 const a=source.indexOf(start);
 const b=source.indexOf(end,a+start.length);
 return a>=0&&b>a?source.slice(a,b):'';
};
function unitDiagnostic(yaml:string){
 const part=segment(yaml,'- name: MID P1 · actionlint, zizmor, Biome (QA-Pilot)','- name: MID P1 · QA-Evidenz sichern');
 return part.includes("github.event_name == 'pull_request'")&&
  part.includes("startsWith(github.head_ref, 'chatgpt/')")&&
  part.includes('continue-on-error: true')&&
  part.includes("GH_TOKEN: ''")&&part.includes("GITHUB_TOKEN: ''")&&
  part.includes("ZIZMOR_GITHUB_TOKEN: ''")&&
  part.includes('node scripts/qa-mid-workflow-quality-pilot-0985455.mjs')&&
  part.includes('node tools/ci/mid-p1-tool-bootstrap.mjs');
}
describe('MID registered code-quality contract and workflow admission',()=>{
 it('records the diagnostic and release boundaries in a normative registered contract',()=>{
  const registry=JSON.parse(read('contracts/index.json'));
  const contract=read('MID_CHATGPT_GITHUB_CONTRACT.md');
  expect(registry.contracts.some((x:{id:string})=>x.id==='MID_CHATGPT_GITHUB_CONTRACT')).toBe(true);
  expect(contract).toContain('## MID code-quality tooling: normative PR and release evidence');
  expect(contract).toContain('PILOT_FINDINGS_OR_FAILURE');
  expect(contract).toContain('Unresolved material P0/P1');
  expect(contract).toContain('This QA-only contract does not declare any new application release.');
 });
 it('keeps both unit workflows mirrored and optional, with scrubbed tokens',()=>{
  const yaml=mirror('unit-coverage.yml');
  expect(unitDiagnostic(yaml)).toBe(true);
  expect(unitDiagnostic(yaml.replace('continue-on-error: true','continue-on-error: false'))).toBe(false);
  expect(unitDiagnostic(yaml.replace("GH_TOKEN: ''","GH_TOKEN: unsafe"))).toBe(false);
  expect(unitDiagnostic(yaml.replace('node tools/ci/mid-p1-tool-bootstrap.mjs','echo bypass'))).toBe(false);
 });
 it('retains the optional pilot evidence artifact and fail-signalling bootstrap',()=>{
  const yaml=mirror('unit-coverage.yml');
  const evidence=segment(yaml,'- name: MID P1 · QA-Evidenz sichern','- name: Coverage-Bericht sichern');
  expect(evidence).toContain('if: always()');
  expect(evidence).toContain('mid-p1-tool-report.json');
  expect(evidence).toContain('if-no-files-found: warn');
  const script=read('tools/ci/mid-p1-tool-bootstrap.mjs');
  expect(script).toContain("evidence.status='SCANNER_BOOTSTRAP_ERROR'");
  expect(script).toContain("if(evidence.status!=='PILOT_PASS')process.exitCode=1");
  expect(script).toContain('releaseAuthorized:false,mergeAuthorized:false');
 });
 it('preserves three versioned exact-digest binary scanners and offline workflow inspection',()=>{
  const bootstrap=read('tools/ci/mid-p1-tool-bootstrap.mjs');
  for(const name of ['actionlint','zizmor','biome'])
   expect(bootstrap).toMatch(new RegExp("name:'"+name+"',version:'[^']+',url:'https://[^']+',sha:'[a-f0-9]{64}'"));
  expect(bootstrap).toContain("ZIZMOR_OFFLINE:'true'");
  const inspector=read('tools/ci/mid-workflow-quality-pilot.mjs');
  expect(inspector).toContain("name:'actionlint'");
  expect(inspector).toContain("name:'zizmor'");
  expect(inspector).toContain("'PILOT_FINDINGS_OR_FAILURE'");
 });
 it('retains separate optional axe and identical SHA-pinned CodeQL init/analyze',()=>{
  const yaml=mirror('mid-code-revision.yml');
  const part=segment(yaml,'- name: MID P1 · axe-core/Playwright WCAG 2.2 AA (diagnostisch)','- name: Befund als dedupliziertes Issue melden');
  expect(part).toContain('continue-on-error: true');
  expect(part).toContain("steps.browser_install.outcome == 'success'");
  expect(part).toMatch(/@axe-core\/playwright@\d+\.\d+\.\d+/);
  expect(part).toContain('tests/smoke/mid-axe-p1-audit.spec.mjs');
  const init=yaml.match(/github\/codeql-action\/init@([0-9a-f]{40})/);
  const analyze=yaml.match(/github\/codeql-action\/analyze@([0-9a-f]{40})/);
  expect(init?.[1]).toMatch(/^[a-f0-9]{40}$/);
  expect(analyze?.[1]).toBe(init?.[1]);
  expect(yaml).toContain('security-extended');
 });
 it('keeps privileged workflow_run release and retry jobs on immutable trusted code',()=>{
  const bot=mirror('agent-source-release.yml');
  const retry=mirror('release-self-heal.yml');
  const safeBot=(yaml:string)=>{
   const checkout=segment(yaml,'- name: SHA-gebundenen Reviewguard des ausgeführten Workflows laden','- name: Node.js 22 für Review-Readback');
   const merge=segment(yaml,'- name: Geprüften Agent-PR automatisch zusammenführen','- name: Zusammengeführten main-Stand laden');
   return yaml.includes('workflow_run:')&&
    yaml.includes("github.event.workflow_run.conclusion == 'success'")&&
    yaml.includes(".head.repo.full_name == $repo and .head.sha == $sha and .draft == false")&&
    checkout.includes('ref: ${{ github.workflow_sha }}')&&
    checkout.includes('persist-credentials: false')&&
    merge.includes('EXPECTED_HEAD_SHA: ${{ steps.pr.outputs.head_sha }}')&&
    merge.includes('EXPECTED_WORKFLOW_SHA: ${{ github.workflow_sha }}')&&
    merge.includes('node tools/ci/mid-review-premerge-guard.mjs')&&
    merge.includes('sha="${EXPECTED_HEAD_SHA}"');
  };
  const safeRetry=(yaml:string)=>{
   const stable=segment(yaml,'- name: Geschuetzte Stable-Provenienz und unveraenderlichen Classifier-SHA feststellen','- name: Geprüften Release-Classifier von mid-stable laden');
   const checkout=segment(yaml,'- name: Geprüften Release-Classifier von mid-stable laden','- name: Node.js 22 für unveränderliche Retry-Klassifikation');
   const classify=segment(yaml,'- name: Fehlgeschlagene Jobs und Logs ohne Codeänderung klassifizieren','- name: Nur temporär klassifizierte Fehler automatisch erneut ausführen');
   return yaml.includes('workflow_run:')&&
    yaml.includes("github.event.workflow_run.conclusion == 'failure'")&&
    yaml.includes('github.event.workflow_run.run_attempt < 3')&&
    stable.includes('repos/${GITHUB_REPOSITORY}/branches/mid-stable')&&
    stable.includes('if [[ ! "$trusted_sha" =~ ^[0-9a-f]{40}$ ]] || [ "$protected" != true ]')&&
    checkout.includes('ref: ${{ steps.trusted_stable.outputs.sha }}')&&
    checkout.includes('persist-credentials: false')&&
    classify.includes('env -u GH_TOKEN node tools/ci/release-self-heal-classify.mjs')&&
    yaml.includes('/rerun-failed-jobs');
  };
  expect(safeBot(bot)).toBe(true);
  expect(safeRetry(retry)).toBe(true);
  expect(safeBot(bot.replace('ref: ${{ github.workflow_sha }}','ref: ${{ github.event.workflow_run.head_sha }}'))).toBe(false);
  expect(safeBot(bot.replace('node tools/ci/mid-review-premerge-guard.mjs','echo unsafe-bypass'))).toBe(false);
  expect(safeRetry(retry.replace('ref: ${{ steps.trusted_stable.outputs.sha }}','ref: main'))).toBe(false);
  expect(safeRetry(retry.replace('github.event.workflow_run.run_attempt < 3','true'))).toBe(false);
 });
});
