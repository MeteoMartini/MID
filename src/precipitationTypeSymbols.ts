import {SYNOP_WEATHER_PATHS} from './synopWeatherGlyphPaths';
export type PrecipitationSymbolPhase='mixed'|'snow'|'snow-grains'|'snow-stars'|'ice-crystals'|'ice-pellets'|'freezing'|'graupel'|'hail'|'graupel-hail';

export const PRECIPITATION_SYMBOL_META:Record<PrecipitationSymbolPhase,{label:string;shortLabel:string}>={
 mixed:{label:'Schneeregen / Mischphase',shortLabel:'Schneeregen'},
 snow:{label:'Schnee',shortLabel:'Schnee'},
 'snow-grains':{label:'Schneegriesel',shortLabel:'Schneegriesel'},
 'snow-stars':{label:'Vereinzelte Schneesterne',shortLabel:'Schneesterne'},
 'ice-crystals':{label:'Eisnadeln',shortLabel:'Eisnadeln'},
 'ice-pellets':{label:'Eiskörner',shortLabel:'Eiskörner'},
 freezing:{label:'Gefrierender (Sprüh-)Regen',shortLabel:'Gefrierend'},
 graupel:{label:'Graupel',shortLabel:'Graupel'},
 hail:{label:'Hagel',shortLabel:'Hagel'},
 'graupel-hail':{label:'Graupel oder Hagel',shortLabel:'Graupel/Hagel'}
};

// Original WMO present-weather contours, OGC/MetPy, CC BY 4.0.
// Generic radar classifications use representative codes, not synthetic station reports.
const phaseCode:Record<PrecipitationSymbolPhase,number>={snow:71,mixed:68,'snow-grains':77,'snow-stars':78,'ice-crystals':76,'ice-pellets':79,freezing:66,graupel:87,hail:89,'graupel-hail':96};
export function precipitationTypeSymbolSvg(phase:PrecipitationSymbolPhase,verifiedCode?:number){
 const mark=SYNOP_WEATHER_PATHS[verifiedCode??phaseCode[phase]]??SYNOP_WEATHER_PATHS[phaseCode[phase]];
 return `<svg viewBox="0 0 32 24" width="100%" height="100%" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><rect x=".75" y=".75" width="30.5" height="22.5" rx="4" fill="#fff" stroke="#526575" stroke-width="1.5"/><g color="#14293b">${mark}</g></svg>`;
}
