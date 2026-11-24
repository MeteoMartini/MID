import assert from 'node:assert/strict';
import test from 'node:test';
import {assessPostInstallEvidence} from './post-install-recovery-evidence.mjs';

const stable = 'a'.repeat(40);
const packetSha = 'b'.repeat(40);
const installedSha = 'c'.repeat(40);
const actor = {login: 'mid-release-bot-meteomartini[bot]'};
const zip = 'MID-professional-replacement.zip';
const install = 'Vollständig geprüften Release sammeln und committen';

function fixture() {
  const run = {
    id: 9, path: '.github/workflows/install-mid.yml', head_repository: {full_name: 'MeteoMartini/MID'},
    head_sha: packetSha, head_branch: 'main', event: 'workflow_dispatch', run_attempt: 1,
    status: 'completed', conclusion: 'failure',
  };
  const jobs = [];
  const add = (name, conclusion = 'success', steps = []) => jobs.push({
    id: jobs.length + 1, name, conclusion, steps, run_id: run.id, run_attempt: 1,
    head_sha: packetSha, status: 'completed',
  });
  add('Release-ZIP prüfen und immutable Snapshot vorbereiten');
  add('Release-Core, Build, Audit und iOS prüfen');
  for (let i = 1; i <= 4; i++) add('Release-Core-Regression · ' + `core-${i}/4`);
  for (const name of ['heavy-browser-state', 'heavy-mountain-visual', 'heavy-native-map']) {
    add('Release-Heavy · ' + name + ' ·');
  }
  for (let i = 1; i <= 3; i++) add(`Release-Heavy · heavy-unified-map · ${i}/3`);
  add(install, 'success', [{name: 'Neue MID-Version committen', conclusion: 'success'}]);
  add('Geprüften MID-Worker sicher automatisch veröffentlichen');
  add('GitHub-Pages-Artefakt parallel vorbereiten', 'skipped');
  add('Pages-Retry abkühlen · 1');
  add('Pages-Retry abkühlen · 2');
  add('MID auf GitHub Pages veröffentlichen · Versuch 1', 'skipped');
  for (const slot of [2, 3]) {
    add('MID auf GitHub Pages veröffentlichen · Versuch ' + slot, 'failure', [
      {name: 'Frischen Fast-Snapshot aus dem aktiven Pages-Artefakt erhalten', conclusion: 'failure'},
      {name: 'GitHub-Pages-Deployment · Versuch ' + slot, conclusion: 'skipped'},
    ]);
  }
  add('Erfolgreichen Pages-/Worker-Release finalisieren', 'skipped');
  add('SHA-verifizierten GitHub Release-Katalog nach Stable aktualisieren', 'skipped');
  return {
    stable, run, inventory: {total_count: jobs.length, jobs},
    finalRefs: {main: installedSha, stable},
    lineage: {status: 'ahead', base_commit: {sha: stable}, merge_base_commit: {sha: stable}},
    installed: {
      sha: installedSha, author: actor, committer: actor, parents: [{sha: packetSha}],
      commit: {message: 'Install MID v0.9.85.515'}, files: [{filename: zip, status: 'removed'}],
    },
    packet: {
      sha: packetSha, author: actor, committer: actor,
      parents: [{sha: 'd'.repeat(40)}], files: [{filename: zip, status: 'added'}],
    },
  };
}

test('recognizes the exact installer failure as evidence only', () => {
  assert.deepEqual(assessPostInstallEvidence(fixture()), {
    reason: 'POST_INSTALL_PRE_PAGES_FAILURE', evidenceComplete: true,
    mergeAuthorized: false, releaseAuthorized: false,
  });
});

for (const [label, mutate, reason] of [
  ['changed main', data => { data.finalRefs.main = packetSha; }, 'REF_OR_ANCESTRY_MISMATCH'],
  ['foreign packet', data => { data.packet.committer = {login: 'foreign'}; }, 'UNEXPECTED_INSTALL_CHAIN'],
  ['foreign job SHA', data => { data.inventory.jobs[0].head_sha = stable; }, 'INCOMPLETE_JOBS'],
  ['foreign job attempt', data => { data.inventory.jobs[0].run_attempt = 2; }, 'INCOMPLETE_JOBS'],
  ['unknown matrix job', data => { data.inventory.jobs[2].name = 'Release-Core-Regression · forged'; }, 'UNEXPECTED_JOB_INVENTORY'],
  ['unexpected cooldown outcome', data => {
    data.inventory.jobs.find(job => job.name === 'Pages-Retry abkühlen · 1').conclusion = 'failure';
  }, 'UNEXPECTED_JOB_OUTCOME'],
  ['partial inventory', data => { data.inventory.jobs.pop(); }, 'INCOMPLETE_JOBS'],
  ['prior Pages publication', data => {
    data.inventory.jobs.find(job => job.name.endsWith('Versuch 2')).steps[1].conclusion = 'success';
  }, 'PAGES_SIDE_EFFECT_UNKNOWN'],
]) {
  test('rejects ' + label, () => {
    const data = fixture();
    mutate(data);
    assert.deepEqual(assessPostInstallEvidence(data), {
      reason, evidenceComplete: false, mergeAuthorized: false, releaseAuthorized: false,
    });
  });
}
