import type {OfficialAlert} from './weather';

function alertEpoch(value:string|undefined){const epoch=Date.parse(String(value??''));return Number.isFinite(epoch)?epoch:Number.POSITIVE_INFINITY}
export function officialAlertStartEpoch(alert:OfficialAlert){return alertEpoch(alert.onset??alert.effective)}
export function officialAlertEndEpoch(alert:OfficialAlert){return alertEpoch(alert.expires)}
export function chronologicalOfficialAlerts(alerts:OfficialAlert[]){return alerts.map((alert,index)=>({alert,index})).sort((a,b)=>officialAlertStartEpoch(a.alert)-officialAlertStartEpoch(b.alert)||officialAlertEndEpoch(a.alert)-officialAlertEndEpoch(b.alert)||a.index-b.index).map(row=>row.alert)}
