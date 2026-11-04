/** SYNOP/ww-inspired plot forms for the optional, model-derived radar phase overlay.
 * WMO-No.306 FM-12 ww and DWD ICON WW (a documented restricted subset).
 * Not a station report, not an official warning and never a generated ww code.
 * Keep all glyphs local: no remote image/font dependencies or missing=>zero.
 */
import type {PrecipitationSymbolPhase} from './precipitationTypeSymbols';
const phaseByCode:Record<number,PrecipitationSymbolPhase>={
 56:'freezing',57:'freezing',66:'freezing',67:'freezing',
 68:'mixed',69:'mixed',71:'snow',73:'snow',75:'snow',77:'snow-grains',
 78:'snow-stars',79:'ice-pellets',83:'mixed',84:'mixed',85:'snow',86:'snow',
 87:'graupel',88:'graupel',89:'hail',90:'hail',96:'graupel-hail',99:'graupel-hail'
};
export function synopPrecipitationPhase(ww:unknown):PrecipitationSymbolPhase|null{
 return typeof ww==='number'&&Number.isInteger(ww)&&ww>=0&&ww<=99?phaseByCode[ww]??null:null;
}
const circle=(x:number,y:number,r=2)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor"/>`;
const snow=(x:number,y:number)=>`<g stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M${x-3.4} ${y}h6.8M${x} ${y-3.4}v6.8M${x-2.4} ${y-2.4}l4.8 4.8M${x+2.4} ${y-2.4}l-4.8 4.8"/></g>`;
const comma=(x:number,y:number)=>`<path d="M${x-1.3} ${y-1.5}a1.8 1.8 0 1 1 2.1 2.7l-2 2.2" fill="currentColor" stroke="currentColor" stroke-width=".6"/>`;
const shower=(x=16,y=5)=>`<polygon points="${x-5},${y} ${x+5},${y} ${x},${y+8}" fill="none" stroke="currentColor" stroke-width="1.6"/>`;
const freezing=(x=16)=>`<path d="M${x-5} 21h10M${x} 18v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`;
/** Exact ww number is accepted only from a populated model-code field. */
export function synopPrecipitationSymbolSvg(code:unknown):string|null{
 const phase=synopPrecipitationPhase(code);if(!phase)return null;
 const ww=code as number;
 const count=[57,67,69,75,84,86,88,90,99].includes(ww)?3:ww===73?2:1;
 const locations=count===3?[[8,12],[16,15],[24,12]]:count===2?[[11,13],[21,13]]:[[16,13]];
 let marks='';
 if(phase==='snow'||phase==='snow-stars')marks=locations.map(([x,y])=>snow(x,y)).join('');
 else if(phase==='snow-grains')marks=locations.map(([x,y])=>circle(x,y,1.5)).join('');
 else if(phase==='mixed')marks=[69,84].includes(ww)?snow(8,14)+snow(21,14)+circle(16,7):snow(11,13)+circle(21,13,2.2);
 else if(phase==='freezing')marks=locations.map(([x,y])=>ww===56||ww===57?comma(x,y):circle(x,y)).join('')+freezing();
 else if(phase==='ice-pellets')marks=locations.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.4" fill="none" stroke="currentColor" stroke-width="1.5"/>`).join('');
 else if(phase==='graupel')marks=locations.map(([x,y])=>`<polygon points="${x},${y-2.7} ${x+2.7},${y+2.5} ${x-2.7},${y+2.5}" fill="none" stroke="currentColor" stroke-width="1.5"/>`).join('');
 else if(phase==='hail')marks=locations.map(([x,y])=>`<polygon points="${x},${y-2.7} ${x+2.7},${y+2.5} ${x-2.7},${y+2.5}" fill="currentColor"/>`).join('');
 else if(phase==='graupel-hail')marks=`<path d="M10 5l4 7-3 0 6 8" fill="none" stroke="currentColor" stroke-width="2"/>`+circle(24,13,2.5);
 if([83,84,85,86,87,88,89,90].includes(ww))marks=shower()+marks;
 return `<svg viewBox="0 0 32 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${marks}</svg>`;
}