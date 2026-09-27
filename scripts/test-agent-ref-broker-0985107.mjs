import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [active,canonical,sync,agents,releaseContract]=await Promise.all([
 read('.github/workflows/agent-ref-broker.yml'),
 read('ci/github/workflows/agent-ref-broker.yml'),
 read('scripts/sync-github-workflows.mjs'),
 read('AGENTS.md'),
 read('MID_AGENT_RELEASE_CONTRACT.md')
]);

assert.equal(active,canonical,'Agent-Ref-Broker muss aktiv und kanonisch bytegleich sein.');
assert.ok(active.includes('issue_comment:'),'Broker muss ausschließlich über den festgelegten Issue-Kommentar-Kanal startbar sein.');
assert.ok(active.includes("github.event.issue.number == 176"),'Broker muss auf den festen Issue #176 begrenzt sein.');
assert.ok(active.includes("github.event.comment.user.login == 'MeteoMartini'"),'Broker muss den Repository-Eigentümer als Auftraggeber verlangen.');
assert.ok(active.includes("^(chatgpt|codex)/"),'Broker darf nur chatgpt/* bzw. codex/* akzeptieren.');
assert.ok(active.includes('refs/heads/main') && active.includes('refs/heads/mid-stable'),'Broker muss main und mid-stable als unveränderte Basis verifizieren.');
assert.ok(active.includes('current_sha') && active.includes('force=false'),'Updates müssen explizit fast-forward und ohne Force erfolgen.');
assert.ok(active.includes('MID_RELEASE_APP_CLIENT_ID') && active.includes('MID_RELEASE_APP_PRIVATE_KEY'),'Ref-Schreibvorgang muss ausschließlich den dedizierten MID Release Bot verwenden.');
assert.ok(!active.includes('permission-actions: write'),'Broker darf keine Actions-Schreibberechtigung anfordern.');
assert.ok(sync.includes("['workflows/agent-ref-broker.yml','workflows/agent-ref-broker.yml']"),'Broker muss kanonisch gespiegelt werden.');
assert.ok(agents.includes('MID Agent Ref Broker'),'AGENTS.md muss den Broker als Ref-Schreibweg dokumentieren.');
assert.ok(releaseContract.includes('Issue #176 (`MID Agent Ref Broker`)'),'Releasevertrag muss den festen Broker-Kanal dokumentieren.');
assert.ok(releaseContract.includes('Replit verwendet diesen Broker nicht'),'Replit muss ausdrücklich vom Agent-Ref-Broker ausgeschlossen bleiben.');

console.log('MID v0.9.85.107 Agent-Ref-Broker geprüft: fester Kanal, Owner-Gate, Stable-Lineage, Fast-Forward und Release-Bot-only.');
