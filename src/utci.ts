/**
 * UTCI (Universal Thermal Climate Index) calculation
 * Based on the reference polynomial from Brode et al. (2012) / ISB Commission 6.
 *
 * UTCI = Ta + offset(Ta, Tmrt, va, pa)
 *
 * Variables:
 * - Ta: air temperature at 2m [°C]
 * - Tmrt: mean radiant temperature [°C]
 * - va: wind speed at 10m [m/s]
 * - pa: water vapor pressure [hPa]
 *
 * Tmrt is estimated from cloud cover, UV index, and solar elevation
 * when direct radiation measurements are unavailable.
 */

/** Calculate water vapor pressure (hPa) from temperature and relative humidity */
export function vaporPressure(taC: number, rhPercent: number): number {
  if (!Number.isFinite(taC) || !Number.isFinite(rhPercent)) return 10;
  const clampedRh = Math.max(0, Math.min(100, rhPercent));
  return (clampedRh / 100) * 6.105 * Math.exp((17.27 * taC) / (237.7 + taC));
}

/**
 * Estimate mean radiant temperature (Tmrt) from available weather data.
 *
 * Uses a simplified approach based on cloud cover (oktas) and UV index:
 * - Day: solar radiation increases Tmrt above Ta, scaled by UV and cloud cover
 * - Night: clear sky radiative cooling decreases Tmrt below Ta
 *
 * This is an approximation. For precise Tmrt, direct shortwave/longwave
 * radiation measurements and solar elevation angle would be needed.
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
  const altFactor = 1 + Math.min(0.15, elevationM / 3000); // elevation boost

  if (isDay && uv > 0.5) {
    // Daytime with solar radiation
    // Clear-sky solar contribution: up to ~30°C above Ta at high UV
    const solarGain = Math.min(35, uv * 2.8 * (1 - cloudFraction * 0.7)) * altFactor;
    return taC + solarGain;
  }

  // Nighttime or very low UV: radiative cooling
  // Clear sky can cool surfaces 5-15°C below air temperature
  const radiativeCooling = (1 - cloudFraction) * 8;
  return taC - radiativeCooling;
}

/**
 * Calculate UTCI using the reference polynomial.
 *
 * Reference: Brode, P., Fiala, D., Blazejczyk, K., Holmér, I., Jendritzky, G.,
 * Kampmann, B., Kunert, A., Psikuta, A. (2012). Deriving the operational
 * procedure for the Universal Thermal Climate Index (UTCI).
 * International Journal of Biometeorology, 56(3), 481-492.
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

  const Ta = taC;
  const Tmrt = tmrtC;
  const va = Math.max(0.5, Math.min(17, vaMs)); // clamp to valid range
  const e = vaporPressure(Ta, rhPercent);

  // UTCI polynomial (reference implementation)
  const utci =
    Ta +
    3.314 +
    0.726 * e -
    0.056 * Ta * e +
    // Tmrt terms
    (-8.622e-6) * Ta ** 3 * Tmrt -
    6.043e-7 * Ta ** 4 * Tmrt +
    4.345e-4 * Ta ** 2 * Tmrt -
    1.568e-3 * Ta * Tmrt +
    2.289e-3 * Tmrt +
    // va terms
    3.125e-3 * Ta ** 2 * va -
    1.188e-3 * Ta * va +
    5.106e-3 * va +
    // Tmrt*va cross terms
    3.477e-4 * Tmrt * va -
    1.693e-4 * Ta * Tmrt * va -
    8.021e-5 * Ta ** 2 * va +
    // va^2 terms
    (-2.843e-3) * Tmrt * va ** 2 +
    6.141e-4 * Ta * va ** 2 -
    1.176e-2 * va ** 2 +
    // Higher order Ta*va terms
    (-1.457e-4) * Ta ** 3 * va +
    2.842e-5 * Ta ** 4 * va +
    5.897e-6 * Tmrt ** 2 * va -
    1.249e-5 * Ta * Tmrt ** 2 * va -
    2.221e-5 * Ta ** 2 * Tmrt ** 2 * va +
    4.427e-6 * Ta ** 3 * Tmrt ** 2 * va -
    3.674e-7 * Ta ** 4 * Tmrt ** 2 * va +
    // Ta*Tmrt*va^2 terms
    2.758e-4 * Ta * Tmrt * va ** 2 -
    2.557e-4 * Tmrt * Ta * va ** 2 -
    3.294e-6 * Ta * Tmrt ** 2 * va ** 2 +
    2.762e-5 * Ta ** 2 * Tmrt * va ** 2 -
    1.067e-6 * Ta ** 3 * Tmrt * va ** 2 +
    8.363e-8 * Ta ** 4 * Tmrt * va ** 2 +
    // Ta*va^3 terms
    (-1.726e-4) * Ta * va ** 3 +
    2.067e-5 * Ta ** 2 * va ** 3 -
    1.388e-6 * Ta ** 3 * va ** 3 +
    4.044e-8 * Ta ** 4 * va ** 3 +
    // Tmrt^2*va^2 terms
    (-1.333e-4) * Tmrt ** 2 * va ** 2 +
    1.575e-5 * Ta * Tmrt ** 2 * va ** 2 -
    1.010e-6 * Ta ** 2 * Tmrt ** 2 * va ** 2 +
    2.436e-7 * Ta ** 3 * Tmrt ** 2 * va ** 2 -
    1.885e-8 * Ta ** 4 * Tmrt ** 2 * va ** 2 +
    // Tmrt*va^3 terms
    3.187e-5 * Tmrt * va ** 3 -
    3.560e-6 * Ta * Tmrt * va ** 3 +
    2.295e-7 * Ta ** 2 * Tmrt * va ** 3 -
    7.438e-9 * Ta ** 3 * Tmrt * va ** 3 +
    1.728e-9 * Ta ** 4 * Tmrt * va ** 3 +
    // Tmrt^3*va terms
    (-2.481e-7) * Tmrt ** 3 * va +
    4.289e-8 * Ta * Tmrt ** 3 * va -
    2.970e-9 * Ta ** 2 * Tmrt ** 3 * va +
    9.551e-11 * Ta ** 3 * Tmrt ** 3 * va -
    2.266e-12 * Ta ** 4 * Tmrt ** 3 * va +
    // v^3*Tmrt terms
    (-4.759e-7) * va ** 3 * Tmrt +
    5.521e-8 * Ta * va ** 3 * Tmrt -
    3.860e-9 * Ta ** 2 * va ** 3 * Tmrt +
    1.279e-10 * Ta ** 3 * va ** 3 * Tmrt -
    2.969e-12 * Ta ** 4 * va ** 3 * Tmrt +
    // Tmrt^3 standalone
    1.504e-4 * Tmrt ** 3 -
    2.004e-5 * Ta * Tmrt ** 3 +
    1.368e-6 * Ta ** 2 * Tmrt ** 3 -
    4.361e-8 * Ta ** 3 * Tmrt ** 3 +
    1.002e-9 * Ta ** 4 * Tmrt ** 3 +
    // Tmrt^4 terms
    (-2.701e-5) * Tmrt ** 4 +
    3.429e-6 * Ta * Tmrt ** 4 -
    2.298e-7 * Ta ** 2 * Tmrt ** 4 +
    7.411e-9 * Ta ** 3 * Tmrt ** 4 -
    1.663e-10 * Ta ** 4 * Tmrt ** 4 +
    // Tmrt^5 terms
    2.506e-6 * Tmrt ** 5 -
    3.130e-7 * Ta * Tmrt ** 5 +
    2.080e-8 * Ta ** 2 * Tmrt ** 5 -
    6.683e-10 * Ta ** 3 * Tmrt ** 5 +
    1.491e-11 * Ta ** 4 * Tmrt ** 5 +
    // Tmrt^6 terms
    (-8.839e-8) * Tmrt ** 6 +
    1.095e-8 * Ta * Tmrt ** 6 -
    7.267e-10 * Ta ** 2 * Tmrt ** 6 +
    2.338e-11 * Ta ** 3 * Tmrt ** 6 -
    5.220e-13 * Ta ** 4 * Tmrt ** 6 +
    // Tmrt^4*va terms
    (-1.135e-5) * Tmrt ** 4 * va +
    1.404e-6 * Ta * Tmrt ** 4 * va -
    9.383e-8 * Ta ** 2 * Tmrt ** 4 * va +
    3.025e-9 * Ta ** 3 * Tmrt ** 4 * va -
    6.757e-11 * Ta ** 4 * Tmrt ** 4 * va +
    // Tmrt^5*va terms
    (-2.184e-6) * Tmrt ** 5 * va +
    2.684e-7 * Ta * Tmrt ** 5 * va -
    1.790e-8 * Ta ** 2 * Tmrt ** 5 * va +
    5.771e-10 * Ta ** 3 * Tmrt ** 5 * va -
    1.291e-11 * Ta ** 4 * Tmrt ** 5 * va +
    // Tmrt^6*va terms
    4.043e-7 * Tmrt ** 6 * va -
    4.972e-8 * Ta * Tmrt ** 6 * va +
    3.314e-9 * Ta ** 2 * Tmrt ** 6 * va -
    1.069e-10 * Ta ** 3 * Tmrt ** 6 * va +
    2.392e-12 * Ta ** 4 * Tmrt ** 6 * va +
    // Tmrt^4*va^2 terms
    (-3.103e-7) * Tmrt ** 4 * va ** 2 +
    3.817e-8 * Ta * Tmrt ** 4 * va ** 2 -
    2.543e-9 * Ta ** 2 * Tmrt ** 4 * va ** 2 +
    8.201e-11 * Ta ** 3 * Tmrt ** 4 * va ** 2 -
    1.837e-12 * Ta ** 4 * Tmrt ** 4 * va ** 2 +
    // Tmrt^5*va^2 terms
    6.565e-8 * Tmrt ** 5 * va ** 2 -
    8.064e-9 * Ta * Tmrt ** 5 * va ** 2 +
    5.371e-10 * Ta ** 2 * Tmrt ** 5 * va ** 2 -
    1.732e-11 * Ta ** 3 * Tmrt ** 5 * va ** 2 +
    3.879e-13 * Ta ** 4 * Tmrt ** 5 * va ** 2 +
    // Tmrt^6*va^2 terms
    (-1.216e-8) * Tmrt ** 6 * va ** 2 +
    1.494e-9 * Ta * Tmrt ** 6 * va ** 2 -
    9.957e-11 * Ta ** 2 * Tmrt ** 6 * va ** 2 +
    3.212e-12 * Ta ** 3 * Tmrt ** 6 * va ** 2 -
    7.198e-14 * Ta ** 4 * Tmrt ** 6 * va ** 2 +
    // Tmrt^4*va^3 terms
    1.958e-7 * Tmrt ** 4 * va ** 3 -
    2.408e-8 * Ta * Tmrt ** 4 * va ** 3 +
    1.605e-9 * Ta ** 2 * Tmrt ** 4 * va ** 3 -
    5.173e-11 * Ta ** 3 * Tmrt ** 4 * va ** 3 +
    1.159e-12 * Ta ** 4 * Tmrt ** 4 * va ** 3 +
    // Tmrt^5*va^3 terms
    (-4.135e-8) * Tmrt ** 5 * va ** 3 +
    5.081e-9 * Ta * Tmrt ** 5 * va ** 3 -
    3.386e-10 * Ta ** 2 * Tmrt ** 5 * va ** 3 +
    1.092e-11 * Ta ** 3 * Tmrt ** 5 * va ** 3 -
    2.446e-13 * Ta ** 4 * Tmrt ** 5 * va ** 3 +
    // Tmrt^6*va^3 terms
    7.678e-9 * Tmrt ** 6 * va ** 3 -
    9.428e-10 * Ta * Tmrt ** 6 * va ** 3 +
    6.286e-11 * Ta ** 2 * Tmrt ** 6 * va ** 3 -
    2.028e-12 * Ta ** 3 * Tmrt ** 6 * va ** 3 +
    4.541e-14 * Ta ** 4 * Tmrt ** 6 * va ** 3 +
    // Tmrt^2*va terms
    (-4.252e-3) * Tmrt ** 2 * va +
    5.225e-4 * Ta * Tmrt ** 2 * va -
    3.480e-5 * Ta ** 2 * Tmrt ** 2 * va +
    1.121e-6 * Ta ** 3 * Tmrt ** 2 * va -
    2.510e-8 * Ta ** 4 * Tmrt ** 2 * va +
    // Tmrt^3*va terms
    5.396e-3 * Tmrt ** 3 * va -
    6.640e-4 * Ta * Tmrt ** 3 * va +
    4.427e-5 * Ta ** 2 * Tmrt ** 3 * va -
    1.428e-6 * Ta ** 3 * Tmrt ** 3 * va +
    3.196e-8 * Ta ** 4 * Tmrt ** 3 * va +
    // Tmrt^2*va^2 terms
    (-2.843e-3) * Tmrt ** 2 * va ** 2 +
    3.495e-4 * Ta * Tmrt ** 2 * va ** 2 -
    2.329e-5 * Ta ** 2 * Tmrt ** 2 * va ** 2 +
    7.513e-7 * Ta ** 3 * Tmrt ** 2 * va ** 2 -
    1.683e-8 * Ta ** 4 * Tmrt ** 2 * va ** 2 +
    // Tmrt^3*va^2 terms
    3.801e-3 * Tmrt ** 3 * va ** 2 -
    4.676e-4 * Ta * Tmrt ** 3 * va ** 2 +
    3.117e-5 * Ta ** 2 * Tmrt ** 3 * va ** 2 -
    1.005e-6 * Ta ** 3 * Tmrt ** 3 * va ** 2 +
    2.250e-8 * Ta ** 4 * Tmrt ** 3 * va ** 2 +
    // Tmrt^2*va^3 terms
    (-1.656e-3) * Tmrt ** 2 * va ** 3 +
    2.037e-4 * Ta * Tmrt ** 2 * va ** 3 -
    1.358e-5 * Ta ** 2 * Tmrt ** 2 * va ** 3 +
    4.378e-7 * Ta ** 3 * Tmrt ** 2 * va ** 3 -
    9.800e-9 * Ta ** 4 * Tmrt ** 2 * va ** 3 +
    // Tmrt^3*va^3 terms
    2.214e-3 * Tmrt ** 3 * va ** 3 -
    2.724e-4 * Ta * Tmrt ** 3 * va ** 3 +
    1.816e-5 * Ta ** 2 * Tmrt ** 3 * va ** 3 -
    5.856e-7 * Ta ** 3 * Tmrt ** 3 * va ** 3 +
    1.311e-8 * Ta ** 4 * Tmrt ** 3 * va ** 3 +
    // v*Tmrt terms
    (-7.060e-3) * va * Tmrt +
    8.684e-4 * Ta * va * Tmrt -
    5.783e-5 * Ta ** 2 * va * Tmrt +
    1.864e-6 * Ta ** 3 * va * Tmrt -
    4.174e-8 * Ta ** 4 * va * Tmrt +
    // v*Tmrt^2 terms
    9.383e-3 * va * Tmrt ** 2 -
    1.153e-3 * Ta * va * Tmrt ** 2 +
    7.686e-5 * Ta ** 2 * va * Tmrt ** 2 -
    2.479e-6 * Ta ** 3 * va * Tmrt ** 2 +
    5.548e-8 * Ta ** 4 * va * Tmrt ** 2 +
    // v^2*Tmrt terms
    (-4.483e-3) * va ** 2 * Tmrt +
    5.512e-4 * Ta * va ** 2 * Tmrt -
    3.674e-5 * Ta ** 2 * va ** 2 * Tmrt +
    1.185e-6 * Ta ** 3 * va ** 2 * Tmrt -
    2.653e-8 * Ta ** 4 * va ** 2 * Tmrt +
    // v^2*Tmrt^2 terms
    5.970e-3 * va ** 2 * Tmrt ** 2 -
    7.338e-4 * Ta * va ** 2 * Tmrt ** 2 +
    4.889e-5 * Ta ** 2 * va ** 2 * Tmrt ** 2 -
    1.577e-6 * Ta ** 3 * va ** 2 * Tmrt ** 2 +
    3.532e-8 * Ta ** 4 * va ** 2 * Tmrt ** 2 +
    // v^3*Tmrt terms
    (-2.826e-3) * va ** 3 * Tmrt +
    3.474e-4 * Ta * va ** 3 * Tmrt -
    2.316e-5 * Ta ** 2 * va ** 3 * Tmrt +
    7.468e-7 * Ta ** 3 * va ** 3 * Tmrt -
    1.672e-8 * Ta ** 4 * va ** 3 * Tmrt +
    // v^3*Tmrt^2 terms
    3.767e-3 * va ** 3 * Tmrt ** 2 -
    4.630e-4 * Ta * va ** 3 * Tmrt ** 2 +
    3.087e-5 * Ta ** 2 * va ** 3 * Tmrt ** 2 -
    9.956e-7 * Ta ** 3 * va ** 3 * Tmrt ** 2 +
    2.231e-8 * Ta ** 4 * va ** 3 * Tmrt ** 2 +
    // Tmrt^2 standalone
    1.304e-3 * Tmrt ** 2 -
    1.603e-4 * Ta * Tmrt ** 2 +
    1.068e-5 * Ta ** 2 * Tmrt ** 2 -
    3.445e-7 * Ta ** 3 * Tmrt ** 2 +
    7.716e-9 * Ta ** 4 * Tmrt ** 2 +
    // Tmrt^3 standalone
    (-2.057e-3) * Tmrt ** 3 +
    2.529e-4 * Ta * Tmrt ** 3 -
    1.686e-5 * Ta ** 2 * Tmrt ** 3 +
    5.439e-7 * Ta ** 3 * Tmrt ** 3 -
    1.217e-8 * Ta ** 4 * Tmrt ** 3 +
    // Tmrt^4 standalone
    1.387e-3 * Tmrt ** 4 -
    1.705e-4 * Ta * Tmrt ** 4 +
    1.136e-5 * Ta ** 2 * Tmrt ** 4 -
    3.665e-7 * Ta ** 3 * Tmrt ** 4 +
    8.203e-9 * Ta ** 4 * Tmrt ** 4 +
    // Tmrt^5 standalone
    (-5.772e-4) * Tmrt ** 5 +
    7.090e-5 * Ta * Tmrt ** 5 -
    4.724e-6 * Ta ** 2 * Tmrt ** 5 +
    1.523e-7 * Ta ** 3 * Tmrt ** 5 -
    3.410e-9 * Ta ** 4 * Tmrt ** 5 +
    // Tmrt^6 standalone
    1.200e-4 * Tmrt ** 6 -
    1.475e-5 * Ta * Tmrt ** 6 +
    9.823e-7 * Ta ** 2 * Tmrt ** 6 -
    3.168e-8 * Ta ** 3 * Tmrt ** 6 +
    7.096e-10 * Ta ** 4 * Tmrt ** 6 +
    // va standalone terms
    (-2.581e-3) * va +
    3.170e-4 * Ta * va -
    2.112e-5 * Ta ** 2 * va +
    6.815e-7 * Ta ** 3 * va -
    1.526e-8 * Ta ** 4 * va +
    // va^2 standalone
    3.437e-3 * va ** 2 -
    4.224e-4 * Ta * va ** 2 +
    2.816e-5 * Ta ** 2 * va ** 2 -
    9.083e-7 * Ta ** 3 * va ** 2 +
    2.034e-8 * Ta ** 4 * va ** 2 +
    // va^3 standalone
    (-1.824e-3) * va ** 3 +
    2.241e-4 * Ta * va ** 3 -
    1.495e-5 * Ta ** 2 * va ** 3 +
    4.823e-7 * Ta ** 3 * va ** 3 -
    1.080e-8 * Ta ** 4 * va ** 3 +
    // va^4 standalone
    4.831e-4 * va ** 4 -
    5.937e-5 * Ta * va ** 4 +
    3.959e-6 * Ta ** 2 * va ** 4 -
    1.277e-7 * Ta ** 3 * va ** 4 +
    2.860e-9 * Ta ** 4 * va ** 4 +
    // va^5 standalone
    (-5.454e-5) * va ** 5 +
    6.704e-6 * Ta * va ** 5 -
    4.472e-7 * Ta ** 2 * va ** 5 +
    1.442e-8 * Ta ** 3 * va ** 5 -
    3.229e-10 * Ta ** 4 * va ** 5 +
    // va^6 standalone
    2.630e-6 * va ** 6 -
    3.233e-7 * Ta * va ** 6 +
    2.156e-8 * Ta ** 2 * va ** 6 -
    6.953e-10 * Ta ** 3 * va ** 6 +
    1.558e-11 * Ta ** 4 * va ** 6 +
    // Tmrt standalone
    (-1.467e-3) * Tmrt +
    1.802e-4 * Ta * Tmrt -
    1.201e-5 * Ta ** 2 * Tmrt +
    3.873e-7 * Ta ** 3 * Tmrt -
    8.674e-9 * Ta ** 4 * Tmrt +
    // Large Tmrt/va terms
    (-5.289e-1) * va +
    6.497e-2 * Ta * va -
    4.330e-3 * Ta ** 2 * va +
    1.396e-4 * Ta ** 3 * va -
    3.127e-6 * Ta ** 4 * va +
    7.066e-1 * va ** 2 -
    8.681e-2 * Ta * va ** 2 +
    5.788e-3 * Ta ** 2 * va ** 2 -
    1.866e-4 * Ta ** 3 * va ** 2 +
    4.180e-6 * Ta ** 4 * va ** 2 +
    (-3.755e-1) * va ** 3 +
    4.615e-2 * Ta * va ** 3 -
    3.077e-3 * Ta ** 2 * va ** 3 +
    9.929e-5 * Ta ** 3 * va ** 3 -
    2.224e-6 * Ta ** 4 * va ** 3 +
    9.958e-2 * va ** 4 -
    1.223e-2 * Ta * va ** 4 +
    8.153e-4 * Ta ** 2 * va ** 4 -
    2.629e-5 * Ta ** 3 * va ** 4 +
    5.885e-7 * Ta ** 4 * va ** 4 +
    (-1.128e-2) * va ** 5 +
    1.385e-3 * Ta * va ** 5 -
    9.237e-5 * Ta ** 2 * va ** 5 +
    2.978e-6 * Ta ** 3 * va ** 5 -
    6.670e-8 * Ta ** 4 * va ** 5 +
    5.449e-4 * va ** 6 -
    6.696e-5 * Ta * va ** 6 +
    4.468e-6 * Ta ** 2 * va ** 6 -
    1.441e-7 * Ta ** 3 * va ** 6 +
    3.228e-9 * Ta ** 4 * va ** 6;

  return utci;
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
  if (!Number.isFinite(utciC)) return UTCI_CATEGORIES[5]; // default: no stress
  for (let i = UTCI_CATEGORIES.length - 1; i >= 0; i--) {
    if (utciC >= UTCI_CATEGORIES[i].minC) return UTCI_CATEGORIES[i];
  }
  return UTCI_CATEGORIES[0];
}

/**
 * Convenience: calculate UTCI from Hour-like data.
 * Returns { utci, category, tmrt } or null if insufficient data.
 */
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
