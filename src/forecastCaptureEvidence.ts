/**
 * A daily forecast capture is verifiable only if its timestamp is explicit,
 * its lead is a finite positive quantity, and it was issued before the
 * first observation minute of the target calendar day.
 *
 * This validates evidence eligibility only; it NEVER modifies source forecasts
 * or recorded observations. Same-day forecasts need a separately windowed
 * verification contract (not the whole-day reference used here).
 */
export function isFullDayForecastEvidenceIssuedBeforeDay(
 issuedAt:unknown,
 leadHours:unknown,
 localDayStartEpoch:number,
):boolean{
 if(typeof issuedAt!=='string'||typeof leadHours!=='number'||
    !Number.isFinite(leadHours)||leadHours<=0||!Number.isFinite(localDayStartEpoch))return false;
 // Reject ambiguous local timestamps: historic archives must provide Z/offset.
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(issuedAt))return false;
 const issueEpoch=Date.parse(issuedAt);
 return Number.isFinite(issueEpoch)&&issueEpoch<=localDayStartEpoch;
}
