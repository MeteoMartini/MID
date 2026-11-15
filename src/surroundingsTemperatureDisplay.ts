import type {SurroundingsTemperatureSnapshot} from './currentSurroundingsTemperature';

/** A response is bound to the actual requested map selection, not just its nearest
 * hourly provider validity. Different quarter-hours can share that hourly stamp.
 * Keep NoData as NoData when the selected time/places/method change.
 */
export type SurroundingsTemperatureRequest={
 targetTime:number;
 placesKey:string;
 interpolate:boolean;
 snapshot:SurroundingsTemperatureSnapshot|undefined;
};

/** Select only the completed response for the *current* map selection.
 * The original provider's validTime is retained unmodified for provenance.
 */
export function currentSurroundingsTemperature(
 state:SurroundingsTemperatureRequest|undefined,
 targetTime:number,placesKey:string,interpolate:boolean
):SurroundingsTemperatureSnapshot|undefined{
 if(!state||!Number.isFinite(targetTime)||!placesKey||
  state.targetTime!==targetTime||state.placesKey!==placesKey||
  state.interpolate!==interpolate)return undefined;
 return state.snapshot;
}
