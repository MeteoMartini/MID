import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const agents=readFileSync(new URL('../AGENTS.md',import.meta.url),'utf8');
const contract=readFileSync(new URL('../MID_CHATGPT_GITHUB_CONTRACT.md',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../ci/github/workflows/chatgpt-pr-gate.yml',import.meta.url),'utf8');
const sync=readFileSync(new URL('./sync-github-workflows.mjs',import.meta.url),'utf8');

for(const token of ['mid-stable','chatgpt/v<version>-<topic>','codex/v<version>-<topic>','MID-professional-replacement.zip','install-mid.yml'])assert.ok(agents.includes(token),`AGENTS.md muss ${token} absichern.`);
assert.ok(contract.includes('Never write directly to `main` or `mid-stable`'),'Contract muss direkte Main-/Stable-Schreibzugriffe ausschließen.');
assert.ok(contract.includes('source pull request against `main`'),'Contract muss den Source-PR-Weg festschreiben.');
assert.ok(contract.includes('Do **not** commit or transport `MID-professional-replacement.zip`'),'Contract muss ZIP-im-PR im normalen Agentweg verbieten.');
assert.ok(contract.includes('server-side from the merged `main` source'),'Contract muss das Release-ZIP serverseitig nach dem Merge erzeugen.');
assert.ok(contract.includes('MID ChatGPT/Codex Source-PR Gate'),'Contract muss das aktuelle Source-PR-Gate benennen.');
assert.ok(!contract.includes('Open a pull request to `main` containing the release ZIP'),'Veralteter ZIP-im-PR-Vertrag darf nicht fortbestehen.');
assert.ok(!contract.includes('Build the canonical unversioned `MID-professional-replacement.zip`'),'Agent darf das Release-ZIP nicht vor dem Source-PR bauen müssen.');
assert.ok(workflow.includes('permissions:\n  contents: read'),'PR-Gate muss global read-only bleiben.');
assert.ok(workflow.includes("startsWith(github.head_ref, 'chatgpt/')")&&workflow.includes("startsWith(github.head_ref, 'codex/')"),'PR-Gate muss auf Agent-Branches begrenzt sein.');
assert.ok(workflow.includes('npm run verify'),'PR-Gate muss den vollständigen MID-Verifikationspfad ausführen.');
assert.ok(workflow.includes('fetch-depth: 1'),'PR-Gate muss ohne unnötige Vollhistorie prüfen.');
assert.ok(workflow.includes('actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1'),'Checkout muss auf vollständige SHA gepinnt sein.');
assert.ok(workflow.includes('actions/setup-node@820762786026740c76f36085b0efc47a31fe5020'),'Setup-Node muss auf vollständige SHA gepinnt sein.');
assert.ok(sync.includes("['workflows/chatgpt-pr-gate.yml','workflows/chatgpt-pr-gate.yml']"),'Workflow muss Teil der kanonischen GitHub-Synchronisierung sein.');
console.log('MID ChatGPT/Codex GitHub-Schreibvertrag: OK');
