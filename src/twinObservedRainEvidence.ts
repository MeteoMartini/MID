/**
 * Pure numeric admission for observed precipitation evidence. Missing or
 * invalid values must NEVER be coerced to a zero-mm dry observation.
 * Callers still verify precipitation-specific source, time and coverage.
 */
export type TwinRainObservationState = 'unknown' | 'dry' | 'wet';

export function twinObservedRainState(
  accumulatedMm: unknown,
  dryThresholdMm: number,
): TwinRainObservationState {
  if (
    typeof accumulatedMm !== 'number' ||
    !Number.isFinite(accumulatedMm) ||
    accumulatedMm < 0 ||
    !Number.isFinite(dryThresholdMm) ||
    dryThresholdMm <= 0
  ) return 'unknown';
  return accumulatedMm < dryThresholdMm ? 'dry' : 'wet';
}

/** Only allow a dryness rule after numeric observation admission. */
export function hasTwinObservedDryEvidence(
  accumulatedMm: unknown,
  dryThresholdMm: number,
): boolean {
  return twinObservedRainState(accumulatedMm, dryThresholdMm) === 'dry';
}
