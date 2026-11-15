/** Defer expensive SHA-validated PseudoSat model reads until the user stops
 * scrubbing a 15-minute timeline. A replaced/disabled view cancels the pending
 * start before any network or bitmap decode occurs.
 */
export const SURROUNDINGS_CLOUD_SCRUB_SETTLE_MS=150;
export function deferSurroundingsCloudRead(begin:()=>void):()=>void{
 const timer=setTimeout(begin,SURROUNDINGS_CLOUD_SCRUB_SETTLE_MS);
 return()=>clearTimeout(timer);
}
