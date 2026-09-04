import type {PrecipType} from './precipitation';

export type PrecipitationPhaseVisualKind='liquid'|'snow'|'mixed'|'storm';

export const PRECIPITATION_PHASE_COLORS={
  liquid:'var(--param-precipitation)',
  snow:'#66bce8',
  mixed:'#a769d8',
  storm:'#7869e8',
} as const;

export function precipitationPhaseVisualKind(type:PrecipType):PrecipitationPhaseVisualKind{
  if(type==='snow'||type==='snowShowers'||type==='snowGrains')return'snow';
  if(type==='freezingRain'||type==='freezingDrizzle'||type==='sleet'||type==='sleetShowers')return'mixed';
  if(type==='thunderstorm'||type==='thunderstormHail')return'storm';
  return'liquid';
}

export function precipitationPhaseColor(type:PrecipType){return PRECIPITATION_PHASE_COLORS[precipitationPhaseVisualKind(type)]}

export function precipitationPhaseColorLabel(type:PrecipType){
  const kind=precipitationPhaseVisualKind(type);
  if(kind==='snow')return'Schnee · hellblau';
  if(kind==='mixed')return'Misch-/gefrierende Phase · violett';
  if(kind==='storm')return'Gewitter/Hagel · purpur';
  return'Regen/Sprühregen/Schauer · blau';
}
