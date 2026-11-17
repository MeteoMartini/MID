/**
 * A Brier score is an error score, not itself a calibrated reliability class or
 * Brier Skill Score. Without independent reference-skill evidence the UI must
 * not proclaim "high/medium/low" forecast skill based on absolute thresholds.
 *
 * ForecastVerificationReport.model(best_match).parameterMetrics.probability.samples
 * counts distinct evaluated local days, not raw 12/24/48/72 h captures.
 * Display only a compact summary, with no additional telemetry or requests.
 */
export type RainBrierPresentation={value:string;detail:string};

export function rainBrierPresentation(brier:number|undefined|null,samples:number|undefined|null):RainBrierPresentation{
 if(typeof brier!=='number'||!Number.isFinite(brier)||brier<0||brier>1||
    typeof samples!=='number'||!Number.isSafeInteger(samples)||samples<1){
  return {value:'–',detail:'Noch keine auswertbaren unabhängigen Vergleiche'};
 }
 const score=brier.toFixed(2).replace('.',',');
 const days=samples===1?'1 unabhängiger Vergleichstag':`${samples} unabhängige Vergleichstage`;
 return {value:`Brier ${score}`,detail:`${days} · kein Referenz-Skill belegt`};
}
