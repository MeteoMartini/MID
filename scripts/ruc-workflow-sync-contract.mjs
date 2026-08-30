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
  return includesAll(workflow,RUC_CATCHUP_TOKENS)
    && (workflow.match(/cron:/g)||[]).length===2
    && workflow.indexOf('RUC-Schedulerlücke und Aktualität vorab prüfen')<workflow.indexOf('Freie DWD-Decodierwerkzeuge installieren');
}

export function isProtectedPreWatchdogCatchupRucWorkflow(workflow){
  return isCanonicalCatchupRucWorkflow(workflow)
    && workflow.includes('workflow_dispatch:')
    && !workflow.includes('inputs:')
    && workflow.includes('if [ "${GITHUB_EVENT_NAME}" = "workflow_dispatch" ]; then')
    && !workflow.includes('inputs.force');
}

export function rucWorkflowSyncState(active,canonical){
  if(!isCanonicalCatchupRucWorkflow(canonical)){
    return {ok:false,state:'invalid-canonical',reason:'Kanonischer RUC-Workflow erfüllt den :11/:41-Catch-up-Vertrag nicht vollständig.'};
  }
  if(active===canonical)return {ok:true,state:'synced',reason:'Aktiver und kanonischer RUC-Workflow sind synchron.'};
  if(isProtectedPreWatchdogCatchupRucWorkflow(active)){
    return {ok:true,state:'pending-admin-sync',reason:'Aktiver .github-RUC-Workflow ist der bereits geschützte :11/:41-Catch-up-Stand; nur der guarded Watchdog-Dispatch wartet noch auf expliziten Admin-Sync.'};
  }
  if(isLegacyProtectedRucWorkflow(active)){
    return {ok:true,state:'pending-admin-sync',reason:'Aktiver .github-RUC-Workflow ist noch exakt der geschützte Legacy-Zustand; kanonischer Catch-up-Workflow wartet auf expliziten Admin-Sync.'};
  }
  return {ok:false,state:'unsafe-drift',reason:'Aktiver RUC-Workflow weicht vom kanonischen Stand ab und entspricht nicht dem eng definierten geschützten Legacy-Zustand.'};
}

export function assertRucWorkflowSyncState(active,canonical){
  const result=rucWorkflowSyncState(active,canonical);
  if(!result.ok)throw new Error(result.reason);
  return result;
}
