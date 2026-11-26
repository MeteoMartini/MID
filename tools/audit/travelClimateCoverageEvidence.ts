/** Research-only coverage oracle for MID Audit 1.5. No I/O or production wiring. */
export type TravelCoverageField = 'temperature' | 'nonnegative' | 'probability' | 'wmo-code';
export type TravelCoverageStatus = 'complete' | 'partial' | 'missing';

export type TravelFieldCoverage = {
  status: TravelCoverageStatus;
  valid: number;
  total: number;
  missing: number;
  /** Only a genuinely complete interval can have an unqualified total. */
  completeSum: number | null;
  completeMean: number | null;
  /** A diagnostic statistic, never an estimate for an incomplete period. */
  observedMean: number | null;
};

function admittedNumber(value: unknown, field: TravelCoverageField): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false;
  if (field === 'nonnegative') return value >= 0;
  if (field === 'probability') return value >= 0 && value <= 100;
  if (field === 'wmo-code') return Number.isInteger(value) && value >= 0 && value <= 99;
  return true; // Temperature: preserve genuine extremes rather than cap them.
}

/** O(n) time, O(1) extra space. Null, strings, undefined and NaN never become zero. */
export function assessTravelFieldCoverage(values: readonly unknown[], field: TravelCoverageField): TravelFieldCoverage {
  let valid = 0;
  let sum = 0;
  for (const value of values) {
    if (!admittedNumber(value, field)) continue;
    valid++;
    sum += value;
  }
  const total = values.length;
  const complete = total > 0 && valid === total;
  return {
    status: complete ? 'complete' : valid ? 'partial' : 'missing',
    valid,
    total,
    missing: total - valid,
    completeSum: complete && field !== 'wmo-code' && field !== 'probability' && Number.isFinite(sum) ? sum : null,
    completeMean: complete && field !== 'wmo-code' && Number.isFinite(sum) ? sum / total : null,
    observedMean: valid && field !== 'wmo-code' && Number.isFinite(sum) ? sum / valid : null,
  };
}

export type ClimateYearSample = { year: number; value: unknown };
export type ClimateReferenceCoverage = {
  status: 'sufficient' | 'insufficient';
  complete: boolean;
  validYears: number;
  expectedYears: 30;
  minimumYears: 20;
  conflictingYears: number;
  /** Mean of distinct valid reference years, never a 30/30-complete claim by itself. */
  referenceMean: number | null;
};

/**
 * Fixed 1991–2020 climate-year evidence. A repeated year is ambiguous and excluded,
 * not counted twice. Feb 29 has only eight original years and requires a separately
 * labelled interpolation if shown as a 30-year daily climatology.
 */
export function assessTravelClimateYears(samples: readonly ClimateYearSample[], field: TravelCoverageField, calendarDay?: string): ClimateReferenceCoverage {
  if (calendarDay !== undefined && !/^(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])$/.test(calendarDay)) throw new RangeError('Invalid calendar day');
  const byYear = new Map<number, { value: unknown; duplicated: boolean }>();
  for (const sample of samples) {
    if (!Number.isInteger(sample.year) || sample.year < 1991 || sample.year > 2020) continue;
    if (calendarDay !== undefined) {
      const [month, day] = calendarDay.split('-').map(Number);
      const date = new Date(Date.UTC(sample.year, month - 1, day));
      if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) continue;
    }
    const previous = byYear.get(sample.year);
    if (previous) previous.duplicated = true;
    else byYear.set(sample.year, { value: sample.value, duplicated: false });
  }
  let validYears = 0;
  let conflictingYears = 0;
  let sum = 0;
  for (const row of byYear.values()) {
    if (row.duplicated) { conflictingYears++; continue; }
    if (!admittedNumber(row.value, field)) continue;
    validYears++;
    sum += row.value;
  }
  return {
    status: validYears >= 20 ? 'sufficient' : 'insufficient',
    complete: validYears === 30 && conflictingYears === 0,
    validYears,
    expectedYears: 30,
    minimumYears: 20,
    conflictingYears,
    referenceMean: field !== 'wmo-code' && validYears >= 20 && Number.isFinite(sum) ? sum / validYears : null,
  };
}
