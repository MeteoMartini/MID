import assert from 'node:assert/strict';
import {rucWorkflowSyncState} from './ruc-workflow-sync-contract.mjs';

const canonical=`name: MID DWD RUC preprocessing
on:
  schedule:
    - cron: '11 * * * *'
    - cron: '41 * * * *'
concurrency:
  group: mid-dwd-ruc-preprocess
  cancel-in-progress: false
steps:
  - name: RUC-Schedulerlücke und Aktualität vorab prüfen
    id: freshness
    run: python tools/ruc/check_ruc_schedule_guard.py
  - name: Freie DWD-Decodierwerkzeuge installieren
    if: \${{ steps.freshness.outputs.should_run == 'true' }}
  - name: Bereits aktuellen RUC-Lauf ohne Neubau bestätigen
`;
const legacy=`name: MID DWD RUC preprocessing
on:
  schedule:
    - cron: '41 * * * *'
concurrency:
  group: mid-dwd-ruc-preprocess
  cancel-in-progress: true
steps:
  - name: Freie DWD-Decodierwerkzeuge installieren
`;
assert.equal(rucWorkflowSyncState(canonical,canonical).state,'synced');
assert.deepEqual(rucWorkflowSyncState(legacy,canonical),{
  ok:true,
  state:'pending-admin-sync',
  reason:'Aktiver .github-RUC-Workflow ist noch exakt der geschützte Legacy-Zustand; kanonischer Catch-up-Workflow wartet auf expliziten Admin-Sync.'
});
assert.equal(rucWorkflowSyncState(legacy.replace('cancel-in-progress: true','cancel-in-progress: false'),canonical).state,'unsafe-drift');
assert.equal(rucWorkflowSyncState(legacy,canonical.replace("    - cron: '11 * * * *'\n",'')).state,'invalid-canonical');
console.log('RUC workflow sync transition contract OK: state-bound legacy protection replaces brittle release-version windows.');
