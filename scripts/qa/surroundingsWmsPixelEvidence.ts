/**
 * P1 #853: bounded, purely visual evidence for a decoded WMS RGBA image.
 *
 * Alpha is NOT a meteorological observation mask. In a radar PNG, a transparent
 * pixel can represent either a valid zero-echo observation or missing coverage;
 * in GeoColour an opaque pixel can be static NASA background, not cloud data.
 * This function must never classify any pixel as dry, wet or source-covered.
 *
 * Unused QA primitive. No active map or Worker behaviour is modified.
 */
export type SurroundingsWmsVisualEvidence = {
  schema: 'mid.surroundings.wms-visual-evidence.v1';
  width: number;
  height: number;
  pixelCount: number;
  transparentPixels: number;
  translucentPixels: number;
  opaquePixels: number;
  visiblePixels: number;
  visibleFraction: number;
  alphaStatus: 'fully-transparent' | 'partially-visible' | 'fully-opaque';
  meteorologicalCoverage: null;
  meteorologicalValidity: 'unverified';
  precipitationRate: null;
  provenance: 'decoded-rgba-alpha-only';
};

const MAX_WIDTH = 512;
const MAX_HEIGHT = 256;
const MAX_PIXELS = MAX_WIDTH * MAX_HEIGHT;

/** A visual-only summary. Undefined means the image buffer is not usable.
 * Never replace undefined/NoData with dry weather or a zero rate.
 */
export function inspectSurroundingsWmsAlpha(
  pixels: {
    width: number;
    height: number;
    data: Uint8Array | Uint8ClampedArray;
  } | undefined,
): SurroundingsWmsVisualEvidence | undefined {
  if (!pixels) return undefined;
  const {width, height, data} = pixels;
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
    width < 1 || height < 1 || width > MAX_WIDTH || height > MAX_HEIGHT ||
    width * height > MAX_PIXELS || !data ||
    !(data instanceof Uint8Array || data instanceof Uint8ClampedArray) ||
    data.length !== width * height * 4) return undefined;

  let transparentPixels = 0;
  let translucentPixels = 0;
  let opaquePixels = 0;
  for (let pixel = 0; pixel < width * height; pixel++) {
    const alpha = data[pixel * 4 + 3];
    if (alpha === 0) transparentPixels++;
    else if (alpha === 255) opaquePixels++;
    else translucentPixels++;
  }

  const pixelCount = width * height;
  const visiblePixels = opaquePixels + translucentPixels;
  const alphaStatus =
    visiblePixels === 0 ? 'fully-transparent' :
    transparentPixels === 0 && translucentPixels === 0 ? 'fully-opaque' :
    'partially-visible';

  return {
    schema: 'mid.surroundings.wms-visual-evidence.v1',
    width, height, pixelCount,
    transparentPixels, translucentPixels, opaquePixels, visiblePixels,
    visibleFraction: visiblePixels / pixelCount, alphaStatus,
    meteorologicalCoverage: null,
    meteorologicalValidity: 'unverified',
    precipitationRate: null,
    provenance: 'decoded-rgba-alpha-only',
  };
}
