import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [agents,replit,skill,contract,activeGate,canonicalGate,sync]=await Promise.all([
 read('AGENTS.md'),
 read('replit.md'),
 read('.agents/skills/mid-handoff/SKILL.md'),
 read('MID_REPLIT_HANDOFF_CONTRACT.md'),
 read('.github/workflows/replit-handoff-gate.yml'),
 read('ci/github/workflows/replit-handoff-gate.yml'),
 read('scripts/sync-github-workflows.mjs')
]);

assert.match(activeGate,/name: Produktionsbuild und Regressionen prüfen\s+shell: bash\s+timeout-minutes: 25\s+env:[\s\S]*?run: npm run verify/,'Handoff must retain the complete verification within its observed 25-minute budget');
assert.match(activeGate,/timeout-minutes: 30/,'Job must leave room for verification and the iOS shell check');
assert.equal(activeGate,canonicalGate,'Aktiver und kanonischer Replit-Handoff-Gate müssen bytegleich sein.');
assert.ok(sync.includes("['workflows/replit-handoff-gate.yml','workflows/replit-handoff-gate.yml']"),'Replit-Handoff-Gate muss kanonisch gespiegelt werden.');

for(const token of [
 '.github/*','ci/*','.agents/*','replit.md','AGENTS.md','MID_*CONTRACT.md',
 'worker/*','worker-src/*','worker.js','workflow-patches/*',
 'scripts/sync-github-workflows.mjs','scripts/sync-version.mjs','scripts/run-regressions.mjs',
 'scripts/audit-production-dependencies.mjs','scripts/check-dependency-upgrade-policy.mjs',
 'package.json','package-lock.json','src/version.ts','public/version.json'
]) assert.ok(activeGate.includes(token),`Replit-Gate schützt nicht: ${token}`);

for(const text of [agents,replit,contract]){
 assert.ok(text.includes('replit/*'),'Persistenter Vertrag muss replit/* als Handoff-Namespace benennen.');
 assert.ok(text.includes('main'),'Persistenter Vertrag muss main als Produktionsgrenze benennen.');
 assert.ok(text.includes('mid-stable'),'Persistenter Vertrag muss mid-stable als Stable-Grenze benennen.');
}
assert.ok(replit.includes('Jeder MID-Arbeitsauftrag an Replit wird von ChatGPT erteilt'),'replit.md muss ChatGPT als alleinige Replit-Auftragsinstanz festlegen.');
assert.ok(contract.includes('ChatGPT ist die alleinige Instanz, die MID-Arbeitsaufträge an Replit erteilt'),'Handoff-Vertrag muss ChatGPT als alleinige Auftragsinstanz festlegen.');
assert.ok(skill.includes('Require a concrete current MID task issued by ChatGPT'),'Replit-Skill muss einen konkreten ChatGPT-Auftrag voraussetzen.');
assert.ok(agents.includes('ChatGPT is the sole tasking authority for MID work sent to Replit'),'AGENTS.md muss ChatGPT als alleinige Replit-Auftragsinstanz festlegen.');
assert.ok(replit.includes('keinen schreibenden SSH-Deploy-Key'),'replit.md muss den automatischen Schreib-Deploy-Key-Fallback verbieten.');
assert.ok(replit.includes('Remote-Ref erneut gelesen'),'replit.md muss Post-Write-SHA-Verifikation verlangen.');
assert.ok(skill.includes('no-release/no-production'),'MID-Handoff-Skill muss die No-Release-Rolle eindeutig beschreiben.');
assert.ok(contract.includes('serverseitiges Release-ZIP'),'Handoff-Vertrag muss die serverseitige Paketierung festschreiben.');
assert.ok(agents.includes('Do not commit or transport `MID-professional-replacement.zip`'),'AGENTS.md muss den aktuellen Source-PR-Vertrag statt des alten ZIP-in-PR-Wegs abbilden.');
assert.ok(!agents.includes('commit the candidate `MID-professional-replacement.zip`'),'Veralteter ZIP-in-PR-Vertrag darf nicht fortbestehen.');

console.log('MID Collaboration Hardening geprüft: persistente Replit-Regeln, Skill, kanonischer Handoff-Gate, geschützte Governancepfade und aktueller Source-PR-Vertrag.');
