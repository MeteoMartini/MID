/** UTC validity axis for compact model fields; not a claim about the source cadence. */
export const SURROUNDINGS_QUARTER_HOUR_MS=15*60_000;

/** Step zero is the last completed quarter-hour timestamp; no invented observation. */
export function surroundingsQuarterHourTarget(now:number,step:number):number{
 if(!Number.isFinite(now)||!Number.isInteger(step)||step<0||step>9)return Number.NaN;
 return Math.floor(now/SURROUNDINGS_QUARTER_HOUR_MS)*SURROUNDINGS_QUARTER_HOUR_MS
  +step*SURROUNDINGS_QUARTER_HOUR_MS;
}
