import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const agents=readFileSync(new URL('../AGENTS.md',import.meta.url),'utf8');
const contract=readFileSync(new URL('../MID_CHATGPT_GITHUB_CONTRACT.md',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../ci/github/workflows/chatgpt-pr-gate.yml',import.meta.url),'utf8');
const sync=readFileSync(new URL('./sync-github-workflows.mjs',import.meta.url),'utf8');

for(const token of ['mid-stable','codex/<topic>','MID-professional-replacement.zip','install-mid.yml'])assert.ok(agents.includes(token),`AGENTS.md muss ${token} absichern.`);
assert.ok(contract.includes('never write directly to `mid-stable`')||contract.includes('never write directly to `mid-stable`'.replace('never','Never')),'Contract muss direkte Stable-Schreibzugriffe ausschließen.');
assert.ok(workflow.includes('permissions:\n  contents: read'),'PR-Gate muss global read-only bleiben.');
assert.ok(workflow.includes("startsWith(github.head_ref, 'chatgpt/')")&&workflow.includes("startsWith(github.head_ref, 'codex/')"),'PR-Gate muss auf Agent-Branches begrenzt sein.');
assert.ok(workflow.includes('npm run verify'),'PR-Gate muss den vollständigen MID-Verifikationspfad ausführen.');
assert.ok(workflow.includes('actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1'),'Checkout muss auf vollständige SHA gepinnt sein.');
assert.ok(workflow.includes('actions/setup-node@820762786026740c76f36085b0efc47a31fe5020'),'Setup-Node muss auf vollständige SHA gepinnt sein.');
assert.ok(sync.includes("['workflows/chatgpt-pr-gate.yml','workflows/chatgpt-pr-gate.yml']"),'Workflow muss Teil der kanonischen GitHub-Synchronisierung sein.');
console.log('MID ChatGPT/Codex GitHub-Schreibvertrag: OK');
