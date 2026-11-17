/**
 * P1 #853: candidate geometry for native EPSG:3857 WMS images shown on MapLibre.
 * This module is deliberately additive; it does not change active WMS requests.
 * The projected image and its MapLibre ImageSource must share the same geographic
 * bounds, and source pixels must not be interpreted as weather measurements.
 */
export type SurroundingsGeoExtent = {
  west: number;
  south: number;
  east: number;
  north: number;
};
export type SurroundingsMercatorWmsPlan = {
  bbox: string; // EPSG:3857 WMS xMin,yMin,xMax,yMax in metres
  width: number;
  height: number;
  crs: 'EPSG:3857';
  imageBounds: SurroundingsGeoExtent; // the same lng/lat corners used by ImageSource
};

const RADIUS_METRES = 6378137;
const MAX_MERCATOR_LATITUDE = 85.0511287798066;
const RADIANS = Math.PI / 180;
const MAX_WIDTH = 512;
const MAX_HEIGHT = 256;
const MAX_PIXELS = MAX_WIDTH * MAX_HEIGHT;
const MILLIMETRES = 1000;

const xMercator = (longitude: number) => RADIUS_METRES * longitude * RADIANS;
const yMercator = (latitude: number) =>
  RADIUS_METRES * Math.log(Math.tan(Math.PI / 4 + latitude * RADIANS / 2));
const floorOutwards = (metres: number) => Math.floor(metres * MILLIMETRES) / MILLIMETRES;
const ceilOutwards = (metres: number) => Math.ceil(metres * MILLIMETRES) / MILLIMETRES;

/**
 * Project a camera/overscan geographic rectangle into the matching projected WMS
 * rectangle. WMS 1.1.1 uses srs=EPSG:3857 (DWD RV), WMS 1.3.0 uses
 * crs=EPSG:3857 (EUMETSAT MTG). The caller must select that protocol parameter.
 *
 * A geographic image requested with EPSG:4326 but draped over Web Mercator
 * has the correct four corners but WRONG intermediate source-pixel latitudes.
 * This plan avoids that distortion without resampling NoData or observations.
 *
 * Fail closed on anti-meridian, poles, out-of-bounds or pathological aspect.
 * The provider must still independently confirm that the given layer supports
 * the projected GetMap, requested valid time, and actual non-NoData pixels.
 */
export function planSurroundingsMercatorWms(
  geographic: SurroundingsGeoExtent | undefined,
): SurroundingsMercatorWmsPlan | undefined {
  if (!geographic) return undefined;
  const { west, south, east, north } = geographic;
  if (![west, south, east, north].every(Number.isFinite) ||
      west >= east || south >= north || west < -180 || east > 180 ||
      south <= -MAX_MERCATOR_LATITUDE || north >= MAX_MERCATOR_LATITUDE) return undefined;

  const xMin = floorOutwards(xMercator(west));
  const xMax = ceilOutwards(xMercator(east));
  const yMin = floorOutwards(yMercator(south));
  const yMax = ceilOutwards(yMercator(north));
  const projectedWidth = xMax - xMin;
  const projectedHeight = yMax - yMin;
  if (![xMin, xMax, yMin, yMax, projectedWidth, projectedHeight].every(Number.isFinite) ||
      projectedWidth <= 0 || projectedHeight <= 0) return undefined;

  // Source pixels are distributed linearly in projected METRES, not degrees.
  const scale = Math.min(MAX_WIDTH / projectedWidth, MAX_HEIGHT / projectedHeight);
  const width = Math.floor(projectedWidth * scale);
  const height = Math.floor(projectedHeight * scale);
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
      width < 16 || height < 16 || width > MAX_WIDTH || height > MAX_HEIGHT ||
      width * height > MAX_PIXELS) return undefined;

  return {
    bbox: [xMin, yMin, xMax, yMax].map(value => value.toFixed(3)).join(','),
    width,
    height,
    crs: 'EPSG:3857',
    imageBounds: { west, south, east, north },
  };
}
