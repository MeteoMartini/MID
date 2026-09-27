import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [activeGate,canonicalGate,replit,contract,skill]=await Promise.all([
  read('.github/workflows/replit-handoff-gate.yml'),
  read('ci/github/workflows/replit-handoff-gate.yml'),
  read('replit.md'),
  read('MID_REPLIT_HANDOFF_CONTRACT.md'),
  read('.agents/skills/mid-handoff/SKILL.md')
]);

assert.equal(activeGate,canonicalGate,'Aktiver und kanonischer Replit-Handoff-Gate müssen bytegleich sein.');
assert.ok(/on:\\n\\s+create:/m.test(activeGate),'Replit-Handoff-Gate muss auf Branch-Create reagieren.');
assert.ok(activeGate.includes("github.event_name == 'create' && github.event.ref_type == 'branch' && startsWith(github.event.ref, 'replit/')"),'Create-Event muss ausschließlich fertige replit/*-Branches aktiv prüfen.');
assert.ok(activeGate.includes("ref: ${{ github.event_name == 'create' && github.event.ref || github.sha }}"),'Checkout muss beim Create-Event den neu angelegten Handoff-Branch laden.');
assert.ok(activeGate.includes("github.event_name == 'push' && startsWith(github.ref_name, 'replit/')"),'Klassische replit/*-Pushes müssen weiterhin geprüft werden.');
assert.ok(activeGate.includes("github.event_name == 'pull_request' && startsWith(github.head_ref, 'replit/')"),'Direkte Replit-PRs nach main müssen weiterhin in den blockierenden Gate laufen.');
assert.ok(replit.includes('erst nach vollständigem Objekttransfer einmalig angelegt'),'replit.md muss den finalen einmaligen Ref-Write verlangen.');
assert.ok(contract.includes('erstmalige Anlegen eines fertigen `replit/*`-Branch-Refs'),'Vertrag muss Branch-Create als Gate-Trigger dokumentieren.');
assert.ok(skill.includes('fresh `replit/*` branch for each completed handoff'),'Skill muss immutable/fresh Handoffs vorschreiben.');
assert.ok(skill.includes('final branch-create event'),'Skill muss den Create-Event-Gate kennen.');

console.log('MID v0.9.85.107 Replit-Create-Gate geprüft: finaler Ref-Create, Push-Fallback, PR-Blockade und immutable Handoffs.');
