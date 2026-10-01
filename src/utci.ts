/**
 * UTCI (Universal Thermal Climate Index) calculation
 * Reference polynomial from Brode et al. (2012), as implemented in
 * pythermalcomfort (Center for the Built Environment, UC Berkeley).
 *
 * Variables:
 * - Ta: air temperature at 2m [°C]
 * - Tmrt: mean radiant temperature [°C]
 * - va: wind speed at 10m [m/s]
 * - pa: water vapor pressure [kPa]
 *
 * The polynomial uses delta_t_tr = Tmrt - Ta (not Tmrt directly).
 */

/** Calculate water vapor pressure in kPa from temperature [°C] and relative humidity [%] */
export function vaporPressureKpa(taC: number, rhPercent: number): number {
  if (!Number.isFinite(taC) || !Number.isFinite(rhPercent)) return 1.0;
  const clampedRh = Math.max(0, Math.min(100, rhPercent));
  // Tetens formula: saturation vapor pressure in hPa
  const es_hpa = 6.105 * Math.exp((17.27 * taC) / (237.7 + taC));
  // Actual vapor pressure in hPa, then convert to kPa
  return (clampedRh / 100) * es_hpa / 10;
}

/**
 * Estimate mean radiant temperature (Tmrt) from available weather data.
 * Simplified approach using cloud cover, UV index, and solar elevation.
 */
export function estimateTmrt(
  taC: number,
  cloudOktas: number,
  uvIndex: number,
  isDay: boolean,
  elevationM: number = 0
): number {
  if (!Number.isFinite(taC)) return taC;
  const cloudFraction = Math.max(0, Math.min(1, (cloudOktas ?? 4) / 8));
  const uv = Math.max(0, uvIndex ?? 0);
  const altFactor = 1 + Math.min(0.15, (elevationM ?? 0) / 3000);

  if (isDay && uv > 0.5) {
    const solarGain = Math.min(35, uv * 2.8 * (1 - cloudFraction * 0.7)) * altFactor;
    return taC + solarGain;
  }
  const radiativeCooling = (1 - cloudFraction) * 8;
  return taC - radiativeCooling;
}

/**
 * Calculate UTCI using the reference polynomial.
 * Coefficients from pythermalcomfort.models.utci._utci_optimized
 * (Brode et al., 2012; Blanchi et al. implementation).
 */
export function calculateUtci(
  taC: number,
  tmrtC: number,
  vaMs: number,
  rhPercent: number
): number {
  if (!Number.isFinite(taC) || !Number.isFinite(tmrtC) || !Number.isFinite(vaMs) || !Number.isFinite(rhPercent)) {
    return NaN;
  }

  const tdb = taC;
  const v = Math.max(0.5, Math.min(17, vaMs)); // clamp to valid range
  const delta_t_tr = tmrtC - taC;
  const pa = vaporPressureKpa(taC, rhPercent);

  return (
    tdb
    + 0.607562052
    + (-0.0227712343) * tdb
    + 8.06470249e-4 * tdb * tdb
    + (-1.54271372e-4) * tdb ** 3
    + (-3.24651735e-6) * tdb ** 4
    + 7.32602852e-8 * tdb ** 5
    + 1.35959073e-9 * tdb ** 6
    + (-2.25836520) * v
    + 0.0880326035 * tdb * v
    + 0.00216844454 * tdb ** 2 * v
    + (-1.53347087e-5) * tdb ** 3 * v
    + (-5.72983704e-7) * tdb ** 4 * v
    + (-2.55090145e-9) * tdb ** 5 * v
    + (-0.751269505) * v ** 2
    + (-0.00408350271) * tdb * v ** 2
    + (-5.21670675e-5) * tdb ** 2 * v ** 2
    + 1.94544667e-6 * tdb ** 3 * v ** 2
    + 1.14099531e-8 * tdb ** 4 * v ** 2
    + 0.158137256 * v ** 3
    + (-6.57263143e-5) * tdb * v ** 3
    + 2.22697524e-7 * tdb ** 2 * v ** 3
    + (-4.16117031e-8) * tdb ** 3 * v ** 3
    + (-0.0127762753) * v ** 4
    + 9.66891875e-6 * tdb * v ** 4
    + 2.52785852e-9 * tdb ** 2 * v ** 4
    + 4.56306672e-4 * v ** 5
    + (-1.74202546e-7) * tdb * v ** 5
    + (-5.91491269e-6) * v ** 6
    + 0.398374029 * delta_t_tr
    + 1.83945314e-4 * tdb * delta_t_tr
    + (-1.73754510e-4) * tdb ** 2 * delta_t_tr
    + (-7.60781159e-7) * tdb ** 3 * delta_t_tr
    + 3.77830287e-8 * tdb ** 4 * delta_t_tr
    + 5.43079673e-10 * tdb ** 5 * delta_t_tr
    + (-0.0200518269) * v * delta_t_tr
    + 8.92859837e-4 * tdb * v * delta_t_tr
    + 3.45433048e-6 * tdb ** 2 * v * delta_t_tr
    + (-3.77925774e-7) * tdb ** 3 * v * delta_t_tr
    + (-1.69699377e-9) * tdb ** 4 * v * delta_t_tr
    + 1.69992415e-4 * v ** 2 * delta_t_tr
    + (-4.99204314e-5) * tdb * v ** 2 * delta_t_tr
    + 2.47417178e-7 * tdb ** 2 * v ** 2 * delta_t_tr
    + 1.07596466e-8 * tdb ** 3 * v ** 2 * delta_t_tr
    + 8.49242932e-5 * v ** 3 * delta_t_tr
    + 1.35191328e-6 * tdb * v ** 3 * delta_t_tr
    + (-6.21531254e-9) * tdb ** 2 * v ** 3 * delta_t_tr
    + (-4.99410301e-6) * v ** 4 * delta_t_tr
    + (-1.89489258e-8) * tdb * v ** 4 * delta_t_tr
    + 8.15300114e-8 * v ** 5 * delta_t_tr
    + 7.55043090e-4 * delta_t_tr ** 2
    + (-5.65095215e-5) * tdb * delta_t_tr ** 2
    + (-4.52166564e-7) * tdb ** 2 * delta_t_tr ** 2
    + 2.46688878e-8 * tdb ** 3 * delta_t_tr ** 2
    + 2.42674348e-10 * tdb ** 4 * delta_t_tr ** 2
    + 1.54547250e-4 * v * delta_t_tr ** 2
    + 5.24110970e-6 * tdb * v * delta_t_tr ** 2
    + (-8.75874982e-8) * tdb ** 2 * v * delta_t_tr ** 2
    + (-1.50743064e-9) * tdb ** 3 * v * delta_t_tr ** 2
    + (-1.56236307e-5) * v ** 2 * delta_t_tr ** 2
    + (-1.33895614e-7) * tdb * v ** 2 * delta_t_tr ** 2
    + 2.49709824e-9 * tdb ** 2 * v ** 2 * delta_t_tr ** 2
    + 6.51711721e-7 * v ** 3 * delta_t_tr ** 2
    + 1.94960053e-9 * tdb * v ** 3 * delta_t_tr ** 2
    + (-1.00361113e-8) * v ** 4 * delta_t_tr ** 2
    + (-1.21206673e-5) * delta_t_tr ** 3
    + (-2.18203660e-7) * tdb * delta_t_tr ** 3
    + 7.51269482e-9 * tdb ** 2 * delta_t_tr ** 3
    + 9.79063848e-11 * tdb ** 3 * delta_t_tr ** 3
    + 1.25006734e-6 * v * delta_t_tr ** 3
    + (-1.81584736e-9) * tdb * v * delta_t_tr ** 3
    + (-3.52197671e-10) * tdb ** 2 * v * delta_t_tr ** 3
    + (-3.36514630e-8) * v ** 2 * delta_t_tr ** 3
    + 1.35908359e-10 * tdb * v ** 2 * delta_t_tr ** 3
    + 4.17032620e-10 * v ** 3 * delta_t_tr ** 3
    + (-1.30369025e-9) * delta_t_tr ** 4
    + 4.13908461e-10 * tdb * delta_t_tr ** 4
    + 9.22652254e-12 * tdb ** 2 * delta_t_tr ** 4
    + (-5.08220384e-9) * v * delta_t_tr ** 4
    + (-2.24730961e-11) * tdb * v * delta_t_tr ** 4
    + 1.17139133e-10 * v ** 2 * delta_t_tr ** 4
    + 6.62154879e-10 * delta_t_tr ** 5
    + 4.03863260e-13 * tdb * delta_t_tr ** 5
    + 1.95087203e-12 * v * delta_t_tr ** 5
    + (-4.73602469e-12) * delta_t_tr ** 6
    + 5.12733497 * pa
    + (-0.312788561) * tdb * pa
    + (-0.0196701861) * tdb ** 2 * pa
    + 9.99690870e-4 * tdb ** 3 * pa
    + 9.51738512e-6 * tdb ** 4 * pa
    + (-4.66426341e-7) * tdb ** 5 * pa
    + 0.548050612 * v * pa
    + (-0.00330552823) * tdb * v * pa
    + (-0.00164119440) * tdb ** 2 * v * pa
    + (-5.16670694e-6) * tdb ** 3 * v * pa
    + 9.52692432e-7 * tdb ** 4 * v * pa
    + (-0.0429223622) * v ** 2 * pa
    + 0.00500845667 * tdb * v ** 2 * pa
    + 1.00601257e-6 * tdb ** 2 * v ** 2 * pa
    + (-1.81748644e-6) * tdb ** 3 * v ** 2 * pa
    + (-1.25813502e-3) * v ** 3 * pa
    + (-1.79330391e-4) * tdb * v ** 3 * pa
    + 2.34994441e-6 * tdb ** 2 * v ** 3 * pa
    + 1.29735808e-4 * v ** 4 * pa
    + 1.29064870e-6 * tdb * v ** 4 * pa
    + (-2.28558686e-6) * v ** 5 * pa
    + (-0.0369476348) * delta_t_tr * pa
    + 0.00162325322 * tdb * delta_t_tr * pa
    + (-3.14279680e-5) * tdb ** 2 * delta_t_tr * pa
    + 2.59835559e-6 * tdb ** 3 * delta_t_tr * pa
    + (-4.77136523e-8) * tdb ** 4 * delta_t_tr * pa
    + 8.64203390e-3 * v * delta_t_tr * pa
    + (-6.87405181e-4) * tdb * v * delta_t_tr * pa
    + (-9.13863872e-6) * tdb ** 2 * v * delta_t_tr * pa
    + 5.15916806e-7 * tdb ** 3 * v * delta_t_tr * pa
    + (-3.59217476e-5) * v ** 2 * delta_t_tr * pa
    + 3.28696511e-5 * tdb * v ** 2 * delta_t_tr * pa
    + (-7.10542454e-7) * tdb ** 2 * v ** 2 * delta_t_tr * pa
    + (-1.24382300e-5) * v ** 3 * delta_t_tr * pa
    + (-7.38584400e-9) * tdb * v ** 3 * delta_t_tr * pa
    + 2.20609296e-7 * v ** 4 * delta_t_tr * pa
    + (-7.32469180e-4) * delta_t_tr ** 2 * pa
    + (-1.87381964e-5) * tdb * delta_t_tr ** 2 * pa
    + 4.80925239e-6 * tdb ** 2 * delta_t_tr ** 2 * pa
    + (-8.75492040e-8) * tdb ** 3 * delta_t_tr ** 2 * pa
    + 2.77862930e-5 * v * delta_t_tr ** 2 * pa
    + (-5.06004592e-6) * tdb * v * delta_t_tr ** 2 * pa
    + 1.14325367e-7 * tdb ** 2 * v * delta_t_tr ** 2 * pa
    + 2.53016723e-6 * v ** 2 * delta_t_tr ** 2 * pa
    + (-1.72857035e-8) * tdb * v ** 2 * delta_t_tr ** 2 * pa
    + (-3.95079398e-8) * v ** 3 * delta_t_tr ** 2 * pa
    + (-3.59413173e-7) * delta_t_tr ** 3 * pa
    + 7.04388046e-7 * tdb * delta_t_tr ** 3 * pa
    + (-1.89309167e-8) * tdb ** 2 * delta_t_tr ** 3 * pa
    + (-4.79768731e-7) * v * delta_t_tr ** 3 * pa
    + 7.96079978e-9 * tdb * v * delta_t_tr ** 3 * pa
    + 1.62897058e-9 * v ** 2 * delta_t_tr ** 3 * pa
    + 3.94367674e-8 * delta_t_tr ** 4 * pa
    + (-1.18566247e-9) * tdb * delta_t_tr ** 4 * pa
    + 3.34678041e-10 * v * delta_t_tr ** 4 * pa
    + (-1.15606447e-10) * delta_t_tr ** 5 * pa
    + (-2.80626406) * pa ** 2
    + 0.548712484 * tdb * pa ** 2
    + (-0.00399428410) * tdb ** 2 * pa ** 2
    + (-9.54009191e-4) * tdb ** 3 * pa ** 2
    + 1.93090978e-5 * tdb ** 4 * pa ** 2
    + (-0.308806365) * v * pa ** 2
    + 0.0116952364 * tdb * v * pa ** 2
    + 4.95271903e-4 * tdb ** 2 * v * pa ** 2
    + (-1.90710882e-5) * tdb ** 3 * v * pa ** 2
    + 0.00210787756 * v ** 2 * pa ** 2
    + (-6.98445738e-4) * tdb * v ** 2 * pa ** 2
    + 2.30109073e-5 * tdb ** 2 * v ** 2 * pa ** 2
    + 4.17856590e-4 * v ** 3 * pa ** 2
    + (-1.27043871e-5) * tdb * v ** 3 * pa ** 2
    + (-3.04620472e-6) * v ** 4 * pa ** 2
    + 0.0514507424 * delta_t_tr * pa ** 2
    + (-0.00432510997) * tdb * delta_t_tr * pa ** 2
    + 8.99281156e-5 * tdb ** 2 * delta_t_tr * pa ** 2
    + (-7.14663943e-7) * tdb ** 3 * delta_t_tr * pa ** 2
    + (-2.66016305e-4) * v * delta_t_tr * pa ** 2
    + 2.63789586e-4 * tdb * v * delta_t_tr * pa ** 2
    + (-7.01199003e-6) * tdb ** 2 * v * delta_t_tr * pa ** 2
    + (-1.06823306e-4) * v ** 2 * delta_t_tr * pa ** 2
    + 3.61341136e-6 * tdb * v ** 2 * delta_t_tr * pa ** 2
    + 2.29748967e-7 * v ** 3 * delta_t_tr * pa ** 2
    + 3.04788893e-4 * delta_t_tr ** 2 * pa ** 2
    + (-6.42070836e-5) * tdb * delta_t_tr ** 2 * pa ** 2
    + 1.16257971e-6 * tdb ** 2 * delta_t_tr ** 2 * pa ** 2
    + 7.68023384e-6 * v * delta_t_tr ** 2 * pa ** 2
    + (-5.47446896e-7) * tdb * v * delta_t_tr ** 2 * pa ** 2
    + (-3.59937910e-8) * v ** 2 * delta_t_tr ** 2 * pa ** 2
    + (-4.36497725e-6) * delta_t_tr ** 3 * pa ** 2
    + 1.68737969e-7 * tdb * delta_t_tr ** 3 * pa ** 2
    + 2.67489271e-8 * v * delta_t_tr ** 3 * pa ** 2
    + 3.23926897e-9 * delta_t_tr ** 4 * pa ** 2
    + (-0.0353874123) * pa ** 3
    + (-0.221201190) * tdb * pa ** 3
    + 0.0155126038 * tdb ** 2 * pa ** 3
    + (-2.63917279e-4) * tdb ** 3 * pa ** 3
    + 0.0453433455 * v * pa ** 3
    + (-0.00432943862) * tdb * v * pa ** 3
    + 1.45389826e-4 * tdb ** 2 * v * pa ** 3
    + 2.17508610e-4 * v ** 2 * pa ** 3
    + (-6.66724702e-5) * tdb * v ** 2 * pa ** 3
    + 3.33217140e-5 * v ** 3 * pa ** 3
    + (-0.00226921615) * delta_t_tr * pa ** 3
    + 3.80261982e-4 * tdb * delta_t_tr * pa ** 3
    + (-5.45314314e-9) * tdb ** 2 * delta_t_tr * pa ** 3
    + (-7.96355448e-4) * v * delta_t_tr * pa ** 3
    + 2.53458034e-5 * tdb * v * delta_t_tr * pa ** 3
    + (-6.31223658e-6) * v ** 2 * delta_t_tr * pa ** 3
    + 3.02122035e-4 * delta_t_tr ** 2 * pa ** 3
    + (-4.77403547e-6) * tdb * delta_t_tr ** 2 * pa ** 3
    + 1.73825715e-6 * v * delta_t_tr ** 2 * pa ** 3
    + (-4.09087898e-7) * delta_t_tr ** 3 * pa ** 3
    + 0.614155345 * pa ** 4
    + (-0.0616755931) * tdb * pa ** 4
    + 0.00133374846 * tdb ** 2 * pa ** 4
    + 0.00355375387 * v * pa ** 4
    + (-5.13027851e-4) * tdb * v * pa ** 4
    + 1.02449757e-4 * v ** 2 * pa ** 4
    + (-0.00148526421) * delta_t_tr * pa ** 4
    + (-4.11469183e-5) * tdb * delta_t_tr * pa ** 4
    + (-6.80434415e-6) * v * delta_t_tr * pa ** 4
    + (-9.77675906e-6) * delta_t_tr ** 2 * pa ** 4
    + 0.0882773108 * pa ** 5
    + (-0.00301859306) * tdb * pa ** 5
    + 0.00104452989 * v * pa ** 5
    + 2.47090539e-4 * delta_t_tr * pa ** 5
    + 0.00148348065 * pa ** 6
  );
}

/** UTCI thermal stress categories (WMO/ISB standard) */
export type UtciCategory = {
  label: string;
  shortLabel: string;
  color: string;
  minC: number;
  description: string;
};

export const UTCI_CATEGORIES: UtciCategory[] = [
  { label: 'Extreme Kältebelastung', shortLabel: 'extrem kalt', color: 'var(--param-precipitation-snow)', minC: -Infinity, description: 'Außerhalb der thermischen Behaglichkeit. Kälteschutz erforderlich.' },
  { label: 'Sehr starke Kältebelastung', shortLabel: 'sehr kalt', color: 'var(--param-wind)', minC: -40, description: 'Starke Kältebelastung. Angemessene Kleidung erforderlich.' },
  { label: 'Starke Kältebelastung', shortLabel: 'kalt', color: 'var(--param-pressure)', minC: -27, description: 'Deutliche Kältebelastung. Warme Kleidung empfohlen.' },
  { label: 'Mäßige Kältebelastung', shortLabel: 'mäßig kalt', color: 'var(--param-sunshine)', minC: -13, description: 'Mäßige Kältebelastung. Warme Kleidung empfohlen.' },
  { label: 'Geringe Kältebelastung', shortLabel: 'leicht kalt', color: 'var(--param-humidity)', minC: 0, description: 'Geringe Kältebelastung. Leichte warme Kleidung ausreichend.' },
  { label: 'Keine thermische Belastung', shortLabel: 'behaglich', color: 'var(--param-wind)', minC: 9, description: 'Behaglicher Temperaturbereich. Keine besondere Kleidung erforderlich.' },
  { label: 'Mäßige Hitzebelastung', shortLabel: 'mäßig warm', color: 'var(--param-sunshine)', minC: 26, description: 'Mäßige Hitzebelastung. Ausreichend Flüssigkeit empfohlen.' },
  { label: 'Starke Hitzebelastung', shortLabel: 'warm', color: 'var(--param-temperature-max)', minC: 32, description: 'Starke Hitzebelastung. Anstrengung vermeiden, viel trinken.' },
  { label: 'Sehr starke Hitzebelastung', shortLabel: 'sehr warm', color: 'var(--param-precipitation-storm)', minC: 38, description: 'Sehr starke Hitzebelastung. Aufenthalt im Freien einschränken.' },
  { label: 'Extreme Hitzebelastung', shortLabel: 'extrem heiß', color: 'var(--param-precipitation-storm)', minC: 46, description: 'Extreme Hitzebelastung. Lebensgefahr bei längerem Aufenthalt im Freien.' },
];

export function utciCategory(utciC: number): UtciCategory {
  if (!Number.isFinite(utciC)) return UTCI_CATEGORIES[5];
  for (let i = UTCI_CATEGORIES.length - 1; i >= 0; i--) {
    if (utciC >= UTCI_CATEGORIES[i].minC) return UTCI_CATEGORIES[i];
  }
  return UTCI_CATEGORIES[0];
}

/** Convenience: calculate UTCI from Hour-like data */
export function utciFromHour(
  temperatureC: number,
  windMs: number,
  humidityPercent: number,
  cloudOktas: number,
  uvIndex: number,
  isDay: boolean,
  elevationM: number = 0
): { utci: number; category: UtciCategory; tmrt: number } | null {
  if (!Number.isFinite(temperatureC) || !Number.isFinite(windMs) || !Number.isFinite(humidityPercent)) {
    return null;
  }
  const tmrt = estimateTmrt(temperatureC, cloudOktas, uvIndex, isDay, elevationM);
  const utci = calculateUtci(temperatureC, tmrt, windMs, humidityPercent);
  if (!Number.isFinite(utci)) return null;
  return { utci, category: utciCategory(utci), tmrt };
}


export type UtciOutdoorState={
  temperatureC:number;
  windKnots:number;
  humidityPercent:number;
  cloudPercent:number;
  uvIndex:number;
  isDay:boolean;
  elevationM?:number;
};

/**
 * Appweiter MID-Vertrag für UTCI aus den kanonischen Außenwetterfeldern.
 * Wind wird in MID überwiegend in kt geführt und hier auf den UTCI-10-m-Wind
 * in m/s normiert. Die eigentliche UTCI-Approximation begrenzt den Wind auf
 * ihren veröffentlichten Gültigkeitsbereich von 0,5 bis 17 m/s.
 */
export function utciFromOutdoorState(state:UtciOutdoorState){
  const cloudOktas=Math.max(0,Math.min(8,Math.round((Number(state.cloudPercent)||0)/12.5)));
  const windMs=Math.max(0.5,(Number(state.windKnots)||0)*0.514444);
  return utciFromHour(
    Number(state.temperatureC),
    windMs,
    Number(state.humidityPercent),
    cloudOktas,
    Math.max(0,Number(state.uvIndex)||0),
    Boolean(state.isDay),
    Number(state.elevationM)||0
  );
}
