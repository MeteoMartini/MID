import { describe, expect, it } from 'vitest';
import { planSurroundingsMercatorWms } from '../helpers/surroundingsMercatorWmsPlan';
import type { SurroundingsGeoExtent } from '../helpers/surroundingsMercatorWmsPlan';

const fixture = { west: 5.7, south: 50.17, east: 8.5, north: 51.47 };
const R = 6378137;
const toY = (lat: number) => R * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));

describe('MID #853: provider-independent EPSG:3857 WMS geometry (QA only)', () => {
  // These are independent, synthetic camera rectangles with progressively wider
  // visible horizons. The actual MapLibre viewport observer lives only in LC #858;
  // its integration MUST be tested there, not silently imported from an unmerged PR.
  it.each([
    ['320×220', { west: 5.7, south: 50.17, east: 8.5, north: 51.47 }],
    ['390×220', { west: 5.2, south: 50.17, east: 9, north: 51.47 }],
    ['430×220', { west: 4.8, south: 50.17, east: 9.4, north: 51.47 }],
    ['768×276', { west: 3.2, south: 50.17, east: 11, north: 51.47 }],
    ['1024×285', { west: 1.5, south: 50.17, east: 13.5, north: 51.47 }],
    ['1440×285', { west: -2, south: 50.17, east: 15.4, north: 51.47 }],
  ] as Array<[string, SurroundingsGeoExtent]>) (
    'projects representative %s camera bounds without losing the raster budget',
    (_label, visible) => {
      const plan = planSurroundingsMercatorWms(visible);
      expect(plan).toBeDefined();
      expect(plan!.imageBounds).toEqual(visible);
      expect(plan!.crs).toBe('EPSG:3857');
      expect(plan!.width).toBeGreaterThanOrEqual(16);
      expect(plan!.height).toBeGreaterThanOrEqual(16);
      expect(plan!.width).toBeLessThanOrEqual(512);
      expect(plan!.height).toBeLessThanOrEqual(256);
      expect(plan!.width * plan!.height).toBeLessThanOrEqual(512 * 256);
      const [xMin, yMin, xMax, yMax] = plan!.bbox.split(',').map(Number);
      const projectedAspect = (xMax - xMin) / (yMax - yMin);
      expect(Math.abs(plan!.width / plan!.height / projectedAspect - 1)).toBeLessThan(0.01);
    },
  );

  it('uses actual WebMercator metres in the xMin,yMin,xMax,yMax order, never raw degrees', () => {
    const plan = planSurroundingsMercatorWms(fixture)!;
    const [xMin, yMin, xMax, yMax] = plan.bbox.split(',').map(Number);
    expect(xMin).toBeCloseTo(R * fixture.west * Math.PI / 180, 2);
    expect(xMax).toBeCloseTo(R * fixture.east * Math.PI / 180, 2);
    expect(yMin).toBeCloseTo(toY(fixture.south), 2);
    expect(yMax).toBeCloseTo(toY(fixture.north), 2);
    expect(yMin).toBeLessThan(yMax);
    expect(xMin).toBeLessThan(xMax);
  });

  it('eliminates the intermediate-image-pixel latitude mismatch of EPSG:4326 on a Mercator quad', () => {
    const yCentre = (toY(fixture.north) + toY(fixture.south)) / 2;
    const trueLatitude = 360 / Math.PI * Math.atan(Math.exp(yCentre / R)) - 90;
    const fakeLatitudeFromLinearDegrees = (fixture.north + fixture.south) / 2;
    const mismatchMetres = Math.abs(trueLatitude - fakeLatitudeFromLinearDegrees) * 111_000;
    expect(mismatchMetres).toBeGreaterThan(400);
    expect(mismatchMetres).toBeLessThan(700);
    const [xMin, yMin, xMax, yMax] = planSurroundingsMercatorWms(fixture)!.bbox.split(',').map(Number);
    expect(Math.abs(((yMax + yMin) / 2 - yMin) / (yMax - yMin) - 0.5)).toBeLessThan(1e-10);
    expect(xMax).toBeGreaterThan(xMin);
  });

  it('retains exactly the geographical corners and determinism but no invented weather fields', () => {
    const before = planSurroundingsMercatorWms(fixture);
    expect(planSurroundingsMercatorWms({ ...fixture })).toEqual(before);
    expect(Object.keys(before!).sort()).toEqual(['bbox', 'crs', 'height', 'imageBounds', 'width']);
    expect((before as unknown as Record<string, unknown>).time).toBeUndefined();
    expect((before as unknown as Record<string, unknown>).rainfall).toBeUndefined();
    expect((before as unknown as Record<string, unknown>).coverage).toBeUndefined();
  });

  it('fails closed at poles, anti-meridian, nonfinite coordinates and degenerate rectangles', () => {
    const invalid = [
      undefined,
      { west: 170, east: -170, south: 40, north: 42 },
      { west: -181, east: -170, south: 40, north: 42 },
      { west: 170, east: 181, south: 40, north: 42 },
      { west: 6, east: 8, south: 85, north: 86 },
      { west: 6, east: 8, south: -86, north: -85 },
      { west: 8, east: 6, south: 50, north: 52 },
      { west: 6, east: 8, south: 52, north: 50 },
      { west: Number.NaN, east: 8, south: 50, north: 52 },
      { west: 6, east: Number.POSITIVE_INFINITY, south: 50, north: 52 },
      { west: 7, east: 7 + 1e-12, south: 50, north: 52 },
    ];
    for (const bounds of invalid) expect(planSurroundingsMercatorWms(bounds)).toBeUndefined();
  });
});
