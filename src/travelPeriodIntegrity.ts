/** Interval evidence only: no assertion of historical reference-year coverage. */
export type TravelFieldRule = 'finite' | 'nonnegative' | 'percentage';
export type TravelFieldCoverage = { valid: number; total: number };
export type TravelFieldStats = TravelFieldCoverage & { sum: number; mean: number };
export function travelFieldStats<T extends object>(points: readonly T[], key: keyof T, rule: TravelFieldRule = 'finite'): TravelFieldStats {
  let valid = 0, sum = 0;
  for (const point of points) {
    const value = point[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    if (rule !== 'finite' && value < 0 || rule === 'percentage' && value > 100) continue;
    valid++;
    sum += value;
  }
  const total = points.length;
  const complete = total > 0 && valid === total && Number.isFinite(sum);
  return { valid, total, sum: complete ? sum : NaN, mean: complete ? sum / total : NaN };
}
/** Never blend a cached JSON null (or another missing baseline) as a physical zero. */
export function travelStrictBlend(base: number, target: number, share: number): number {
  if (!Number.isFinite(base)) return NaN;
  return Number.isFinite(target) ? base + (target - base) * share : base;
}
