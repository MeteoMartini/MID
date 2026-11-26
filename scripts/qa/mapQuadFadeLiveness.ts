/** Compatibility entry for previously SHA-tested MID Karten 1.15 QA imports.
 * Runtime implementation now lives under src/ and is shared with MapLibreCore.
 */
export {abandonMissingQuadFade} from '../../src/mapQuadFadeLiveness';
export type {QuadFadeMutable,AbandonedQuadFade} from '../../src/mapQuadFadeLiveness';
