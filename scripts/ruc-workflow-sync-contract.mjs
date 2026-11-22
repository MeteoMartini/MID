const includesAll=(text,tokens)=>tokens.every(token=>text.includes(token));

export const RUC_CATCHUP_TOKENS=[
  "cron: '11 * * * *'",
  "cron: '41 * * * *'",
  'group: mid-dwd-ruc-preprocess',
  'cancel-in-progress: false',
  'name: RUC-Schedulerlücke und Aktualität vorab prüfen',
  'id: freshness',
  'tools/ruc/check_ruc_schedule_guard.py',
  "steps.freshness.outputs.should_run == 'true'",
  'Bereits aktuellen RUC-Lauf ohne Neubau bestätigen',
  // The old apt CLI install has been removed; the Python wheel must supply
  // a functioning native ecCodes GRIB decoder before any DWD preparation.
  'Native Python-ecCodes-Wheel vor DWD-Decode prüfen',
  'Native Python-ecCodes-Wheel vor RUC-Aufbereitung prüfen',
  'python -m eccodes selfcheck',
];

export function isLegacyProtectedRucWorkflow(workflow){
  return workflow.includes("cron: '41 * * * *'")
    && !workflow.includes("cron: '11 * * * *'")
    && workflow.includes('group: mid-dwd-ruc-preprocess')
    && workflow.includes('cancel-in-progress: true')
    && !workflow.includes('check_ruc_schedule_guard.py')
    && !workflow.includes('id: freshness');
}

export function isCanonicalCatchupRucWorkflow(workflow){
  const calculate=workflow.indexOf('Native Python-ecCodes-Wheel vor DWD-Decode prüfen');
  const prepare=workflow.indexOf('Native Python-ecCodes-Wheel vor RUC-Aufbereitung prüfen');
  const checks=[...workflow.matchAll(/python -m eccodes selfcheck/g)].map(row=>row.index);
  const schedules=[...workflow.matchAll(/^\s*- cron: '([^']+)'$/gm)].map(match=>match[1]);
  const full=['11 * * * *','41 * * * *'];
  const fastSchedule='13,43 * * * *';
  const fast=workflow.indexOf('name: Install pinned MID native RUC dependencies');
  const hasFast=schedules.includes(fastSchedule);
  const jobStart=workflow.indexOf('\n  qualify_fast:');
  const jobTail=jobStart>=0?workflow.slice(jobStart+1):'';
  const nextJob=jobTail.slice(1).search(/\n  [A-Za-z][\w-]*:\s*\n/);
  const jobEnd=jobStart>=0?(nextJob<0?workflow.length:jobStart+2+nextJob):(-1);
  const fastRequirements=workflow.indexOf('python -m pip install --disable-pip-version-check -r tools/ruc/requirements-pages.txt', fast);
  const pinnedFastDependencies=jobStart>=0 && fast>jobStart && fast<jobEnd &&
    fastRequirements>fast && fastRequirements<checks[2] && fastRequirements<jobEnd;
  const recoverySchedule='28,58 * * * *';
  const hasRecovery=schedules.includes(recoverySchedule);
  const recoveryStart=jobStart>=0?workflow.indexOf('\n      - name: Fast-Nachholbedarf vor DWD-Downloads prüfen',jobStart):-1;
  const recoveryEnd=recoveryStart>=0?workflow.indexOf('\n      - name: Set up native Python and ecCodes',recoveryStart):-1;
  const recoveryBlock=recoveryStart>jobStart && recoveryEnd>recoveryStart && recoveryEnd<fast && fast<jobEnd
    ?workflow.slice(recoveryStart,recoveryEnd):'';
  const exactShaBoundNewestSelector='.workflow_runs | sort_by(.created_at) | reverse | .[] | select(.head_sha == $sha and (.id | tostring) != $self) | .id';
  const hasSafeRecovery=recoveryBlock.includes('id: fast_recovery')
    && recoveryBlock.includes('EXPECTED_STABLE_SHA: ${{ steps.lineage.outputs.sha }}')
    && recoveryBlock.includes(exactShaBoundNewestSelector)
    && recoveryBlock.includes("90 minutes ago")
    && recoveryBlock.includes("25 minutes ago")
    && recoveryBlock.includes('.completed_at >= $after')
    && recoveryBlock.includes('candidate_runs="$(jq -r')
    && recoveryBlock.includes('(.total_count <= 100)')
    && workflow.includes("if: steps.fast_recovery.outputs.skip != 'true'");
  const expected=hasFast?[...full,fastSchedule,recoverySchedule]:full;
  return includesAll(workflow,RUC_CATCHUP_TOKENS)
    && (!hasFast || (hasRecovery && hasSafeRecovery))
    && JSON.stringify(schedules)===JSON.stringify(expected)
    && (workflow.match(/cron:/g)||[]).length===expected.length
    && workflow.indexOf('RUC-Schedulerlücke und Aktualität vorab prüfen')<calculate
    && prepare>calculate
    // A single selfcheck in just one job is NOT sufficient. Each native GRIB
    // stage must prove its own installed ECMWF decoder, without Ubuntu apt.
    && checks.length===(hasFast?3:2) && checks[0]>calculate && checks[0]<prepare
    && checks[1]>prepare
    && (hasFast ? pinnedFastDependencies && checks[2]>fast && checks[2]<jobEnd : fast===-1)
    && !workflow.includes('sudo apt-get');
}

export function isProtectedPreWatchdogCatchupRucWorkflow(workflow){
  return isCanonicalCatchupRucWorkflow(workflow)
    && workflow.includes('workflow_dispatch:')
    && !workflow.includes('inputs:')
    && workflow.includes('if [ "${GITHUB_EVENT_NAME}" = "workflow_dispatch" ]; then')
    && !workflow.includes('inputs.force');
}

export function isProtectedSetupPythonV5ToV7Transition(active,canonical){
  const legacyLine='actions/setup-python@a26af69be951a213d495a4c3e4e4022e16d87065 # v5';
  const canonicalLine='actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97 # v7.0.0';
  if(!active.includes(legacyLine)||!canonical.includes(canonicalLine))return false;
  return active.replace(legacyLine,canonicalLine)===canonical;
}

export function rucWorkflowSyncState(active,canonical){
  if(!isCanonicalCatchupRucWorkflow(canonical)){
    return {ok:false,state:'invalid-canonical',reason:'Kanonischer RUC-Workflow erfüllt den :11/:41-Catch-up-Vertrag nicht vollständig.'};
  }
  if(active===canonical)return {ok:true,state:'synced',reason:'Aktiver und kanonischer RUC-Workflow sind synchron.'};
  if(isProtectedPreWatchdogCatchupRucWorkflow(active)){
    return {ok:true,state:'pending-admin-sync',reason:'Aktiver .github-RUC-Workflow ist der bereits geschützte :11/:41-Catch-up-Stand; nur der guarded Watchdog-Dispatch wartet noch auf expliziten Admin-Sync.'};
  }
  if(isProtectedSetupPythonV5ToV7Transition(active,canonical)){
    return {ok:true,state:'pending-admin-sync',reason:'Aktiver .github-RUC-Workflow entspricht dem kanonischen Stand bis auf den exakt geschützten setup-python-v5→v7-Admin-Sync-Pin.'};
  }
  if(isLegacyProtectedRucWorkflow(active)){
    return {ok:true,state:'pending-admin-sync',reason:'Aktiver .github-RUC-Workflow ist noch exakt der geschützte Legacy-Zustand; kanonischer Catch-up-Workflow wartet auf expliziten Admin-Sync.'};
  }
  return {ok:false,state:'unsafe-drift',reason:'Aktiver RUC-Workflow weicht vom kanonischen Stand ab und entspricht nicht dem eng definierten geschützten Legacy-Zustand.'};
}

export function assertCanonicalRucWorkflow(canonical){
  if(!isCanonicalCatchupRucWorkflow(canonical)){
    throw new Error('Kanonischer RUC-Workflow erfüllt den :11/:41-Catch-up-Vertrag nicht vollständig.');
  }
  return {ok:true,state:'canonical',reason:'Kanonischer RUC-Workflow erfüllt den geschützten :11/:41-Catch-up-Vertrag.'};
}

export function assertRucWorkflowSyncState(active,canonical){
  const result=rucWorkflowSyncState(active,canonical);
  if(!result.ok)throw new Error(result.reason);
  return result;
}
