export type PrecipitationSymbolPhase='mixed'|'snow'|'snow-grains'|'freezing'|'graupel'|'hail';

export const PRECIPITATION_SYMBOL_META:Record<PrecipitationSymbolPhase,{label:string;shortLabel:string}>={
 mixed:{label:'Schneeregen / Mischphase',shortLabel:'Schneeregen'},
 snow:{label:'Schnee',shortLabel:'Schnee'},
 'snow-grains':{label:'Schneekörner',shortLabel:'Schneekörner'},
 freezing:{label:'Gefrierender (Sprüh-)Regen',shortLabel:'Gefrierend'},
 graupel:{label:'Graupel / Eiskörner',shortLabel:'Graupel'},
 hail:{label:'Hagel',shortLabel:'Hagel'}
};

const svgOpen='<svg viewBox="0 0 32 24" width="100%" height="100%" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">';
const svgClose='</svg>';
const hex=(cx:number,cy:number,r:number,filled=false)=>{const points=Array.from({length:6},(_,i)=>{const a=Math.PI/3*i-Math.PI/6;return`${(cx+Math.cos(a)*r).toFixed(1)},${(cy+Math.sin(a)*r).toFixed(1)}`}).join(' ');return`<polygon points="${points}" ${filled?'fill="currentColor"':'fill="none" stroke="currentColor" stroke-width="1.8"'} stroke-linejoin="round"/>`};
const star=(cx:number,cy:number,r=3.2)=>`<g stroke="currentColor" stroke-width="1.65" stroke-linecap="round"><path d="M${cx-r} ${cy}H${cx+r}"/><path d="M${cx} ${cy-r}V${cy+r}"/><path d="M${(cx-r*.72).toFixed(1)} ${(cy-r*.72).toFixed(1)}L${(cx+r*.72).toFixed(1)} ${(cy+r*.72).toFixed(1)}"/><path d="M${(cx+r*.72).toFixed(1)} ${(cy-r*.72).toFixed(1)}L${(cx-r*.72).toFixed(1)} ${(cy+r*.72).toFixed(1)}"/></g>`;
const drop=(cx:number,cy:number,scale=1)=>`<path d="M${cx} ${(cy-3.7*scale).toFixed(1)}C${(cx-1.7*scale).toFixed(1)} ${(cy-1.4*scale).toFixed(1)} ${(cx-2.6*scale).toFixed(1)} ${(cy+.2*scale).toFixed(1)} ${(cx-2.6*scale).toFixed(1)} ${(cy+1.6*scale).toFixed(1)}A${(2.6*scale).toFixed(1)} ${(2.6*scale).toFixed(1)} 0 0 0 ${(cx+2.6*scale).toFixed(1)} ${(cy+1.6*scale).toFixed(1)}C${(cx+2.6*scale).toFixed(1)} ${(cy+.2*scale).toFixed(1)} ${(cx+1.7*scale).toFixed(1)} ${(cy-1.4*scale).toFixed(1)} ${cx} ${(cy-3.7*scale).toFixed(1)}Z" fill="currentColor"/>`;

export function precipitationTypeSymbolSvg(phase:PrecipitationSymbolPhase){
 let content='';
 if(phase==='graupel')content=`${hex(8,7,3.4)}${hex(20,8.5,3.4)}${hex(12.5,17,3.4)}`;
 else if(phase==='hail')content=`${hex(8,7,3.45,true)}${hex(20,8.5,3.45,true)}${hex(12.5,17,3.45,true)}`;
 else if(phase==='snow')content=`${star(8,7,3.3)}${star(20,8.5,3.3)}${star(12.5,17,3.3)}`;
 else if(phase==='snow-grains')content='<g fill="currentColor"><circle cx="8" cy="7" r="1.8"/><circle cx="20" cy="8.5" r="1.8"/><circle cx="12.5" cy="17" r="1.8"/></g>';
 else if(phase==='mixed')content=`${star(8,7.2,3.1)}${drop(19,9.2,.9)}${drop(13.5,18,.85)}`;
 else content='<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5.5 14.2c0-4 3.2-7.2 7.1-7.2 3.7 0 6.6 2.6 6.6 5.9 0 2.7-2.1 4.9-4.7 4.9-2.1 0-3.8-1.6-3.8-3.5 0-1.6 1.3-2.9 2.9-2.9"/><path d="M26.5 9.8c0 4-3.2 7.2-7.1 7.2"/></g><circle cx="6.2" cy="18.1" r="1.7" fill="currentColor"/><circle cx="25.6" cy="6.2" r="1.7" fill="currentColor"/>';
 return `${svgOpen}${content}${svgClose}`;
}
