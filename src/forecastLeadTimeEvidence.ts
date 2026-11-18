/**
 * Audit: the archived lead represents issuedAt -> local target-date noon.
 * Do not infer a nominal 24-hour day at DST boundaries or silently repair
 * historic lead metadata. Invalid cases remain archived but are not scored.
 *
 * The one-minute difference is ONLY a serialization precision tolerance.
 * It does not permit a different model cycle or a shifted verification window.
 */
export function isArchivedDailyForecastLeadCoherent(
 issuedAt:unknown,
 leadHours:unknown,
 targetLocalNoonEpoch:unknown,
):boolean{
 if(typeof issuedAt!=='string'||typeof leadHours!=='number'||
    !Number.isFinite(leadHours)||leadHours<=0||
    typeof targetLocalNoonEpoch!=='number'||!Number.isFinite(targetLocalNoonEpoch))return false;
 const stamp=/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(issuedAt);
 if(!stamp)return false;
 const issueEpoch=Date.parse(issuedAt);
 if(!Number.isFinite(issueEpoch))return false;
 // Date.parse can normalize impossible calendar dates (e.g. February 30).
 const tz=stamp[2],offset=tz==='Z'?0:
  (tz[0]==='+'?1:-1)*(Number(tz.slice(1,3))*60+Number(tz.slice(4,6)));
 const normalizedLocalTime=new Date(issueEpoch+offset*60000).toISOString().slice(0,19);
 if(normalizedLocalTime!==stamp[1])return false;
 const actualLead=(targetLocalNoonEpoch-issueEpoch)/3600000;
 return Number.isFinite(actualLead)&&actualLead>0&&Math.abs(actualLead-leadHours)<=1/60;
}
