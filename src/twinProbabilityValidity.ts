/**
 * Archived forecast probabilities require an actual numeric percentage.
 * JSON round trips turn NaN into null; Math.max/Math.min would then turn
 * that null into 0 %, silently inventing a valid dry forecast.
 * Preserve archived raw values and exclude invalid ones from verification.
 */
export function isVerifiableTwinRainProbability(value:unknown):value is number{
 return typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100;
}
