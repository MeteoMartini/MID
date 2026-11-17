/**
 * Archive leadHours is the distance from issuedAt to the local target-date
 * noon (not midnight). Validation never mutates source data.
 * One-minute rounding tolerance, never an arbitrary forecast-run shift.
 */
export function isArchivedDailyForecastLeadCoherent(
 issuedAt:unknown,leadHours:unknown,targetLocalNoonEpoch:unknown,
):boolean{
 if(typeof issuedAt!=='string'||typeof leadHours!=='number'||
    !Number.isFinite(leadHours)||leadHours<=0||
    typeof targetLocalNoonEpoch!=='number'||!Number.isFinite(targetLocalNoonEpoch))return false;
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(issuedAt))return false;
 const issueEpoch=Date.parse(issuedAt),actualLead=(targetLocalNoonEpoch-issueEpoch)/3600000;
 return Number.isFinite(issueEpoch)&&Number.isFinite(actualLead)&&actualLead>0&&
  Math.abs(actualLead-leadHours)<=1/60;
}
