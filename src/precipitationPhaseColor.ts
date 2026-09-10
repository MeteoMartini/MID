import type {PrecipType} from './precipitation';

export type PrecipitationPhaseVisualKind='liquid'|'snow'|'mixed'|'storm';

export const PRECIPITATION_PHASE_COLORS={
  liquid:'var(--param-precipitation)',
  snow:'var(--param-precipitation-snow)',
  mixed:'var(--param-precipitation-mixed)',
  storm:'var(--param-precipitation-storm)',
} as const;

export function precipitationPhaseVisualKind(type:PrecipType):PrecipitationPhaseVisualKind{
  if(type==='snow'||type==='snowShowers'||type==='snowGrains'||type==='graupelShowers')return'snow';
  if(type==='hailShowers'||type==='thunderstorm'||type==='thunderstormHail')return'storm';
  if(type==='freezingRain'||type==='freezingDrizzle'||type==='sleet'||type==='sleetShowers'||type==='wintryAfterThunder')return'mixed';
  return'liquid';
}

export function precipitationPhaseColor(type:PrecipType){return PRECIPITATION_PHASE_COLORS[precipitationPhaseVisualKind(type)]}

export function precipitationPhaseColorLabel(type:PrecipType){
  const kind=precipitationPhaseVisualKind(type);
  if(kind==='snow')return'Schnee/Graupel · hellblau';
  if(kind==='mixed')return'Misch-/gefrierende Phase · violett';
  if(kind==='storm')return'Gewitter/Hagel · purpur';
  return'Regen/Sprühregen/Schauer · blau';
}
