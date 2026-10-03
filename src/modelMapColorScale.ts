export type MapColorStop=[number,string];
export type MapColorMode='field'|'absolute';
export type MapColorScale={stops:MapColorStop[];mode:MapColorMode;minimum:number;maximum:number;transparentBelow?:number;categorical:boolean;displayFactor?:number;displayStep?:number};

function niceStep(span:number,minimumStep:number){
 const rough=Math.max(minimumStep,span/4),power=10**Math.floor(Math.log10(rough));
 return Math.max(minimumStep,[1,2,5,10].find(v=>v*power>=rough-1e-12)!*power);
}
const clean=(value:number)=>Number(value.toPrecision(12));
/** Bounds are rounded OUTWARD in the displayed unit; raw data stay unchanged. */
export function roundMapScale(scale:MapColorScale,factor=1,minimumStep=1):MapColorScale{
 if(scale.categorical)return scale;
 const low=scale.minimum*factor,high=scale.maximum*factor,step=niceStep(high-low,minimumStep);
 const isRound=(v:number)=>Math.abs(v/minimumStep-Math.round(v/minimumStep))<1e-9;
 if(scale.mode==='absolute'&&isRound(low)&&isRound(high))return {...scale,displayFactor:factor,displayStep:minimumStep};
 const minimum=clean(Math.floor((low+1e-10)/step)*step/factor),maximum=clean(Math.max(Math.ceil((high-1e-10)/step)*step,minimum*factor+2*minimumStep)/factor);
 if(scale.mode==='absolute')return {...scale,minimum,maximum,displayFactor:factor,displayStep:minimumStep};
 const span=scale.maximum-scale.minimum;
 return {...scale,minimum,maximum,displayFactor:factor,displayStep:minimumStep,stops:scale.stops.map(([v,color])=>[clean(minimum+(v-scale.minimum)/span*(maximum-minimum)),color])};
}

function channels(color:string){
 if(/^#[\da-f]{6}$/i.test(color))return [1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
 const match=color.match(/^rgb\((\d+)[ ,]+(\d+)[ ,]+(\d+)\)$/);
 if(!match)throw new Error('Ungültige Kartenfarbe.');
 return match.slice(1).map(Number);
}
export function mapColorAt(scale:MapColorScale,value:number){
 if(!Number.isFinite(value)||(scale.transparentBelow!==undefined&&value<scale.transparentBelow))return 'transparent';
 const stops=scale.stops;
 const hex=(color:string)=>'#'+channels(color).map(v=>v.toString(16).padStart(2,'0')).join('');
 if(value<=stops[0][0])return hex(stops[0][1]);
 for(let i=1;i<stops.length;i++)if(value<stops[i][0]){
  if(scale.categorical)return stops[i-1][1];
  const previous=stops[i-1],next=stops[i],ratio=(value-previous[0])/(next[0]-previous[0]);
  const a=channels(previous[1]),b=channels(next[1]);
  return '#'+a.map((v,j)=>Math.round(v+(b[j]-v)*ratio).toString(16).padStart(2,'0')).join('');
 }
 return hex(stops.at(-1)![1]);
}
export function createMapColorScale(stops:MapColorStop[],values:Iterable<number>,mode:MapColorMode,options:{categorical?:boolean;transparentBelow?:number;minimumSpan?:number;nonnegative?:boolean}={}):MapColorScale{
 const categorical=Boolean(options.categorical),first=stops[0][0],last=stops.at(-1)![0];
 const fixed=():MapColorScale=>({stops,mode:'absolute',minimum:first,maximum:last,categorical,transparentBelow:options.transparentBelow});
 if(mode==='absolute'||categorical)return fixed();
 let low=Infinity,high=-Infinity;
 for(const value of values)if(Number.isFinite(value)&&(!options.nonnegative||value>=0)){low=Math.min(low,value);high=Math.max(high,value)}
 if(!Number.isFinite(low)||high===low)return fixed();
 const minimumSpan=options.minimumSpan??.1;
 if(high-low<minimumSpan){const middle=(high+low)/2;low=middle-minimumSpan/2;high=middle+minimumSpan/2}
 if(options.nonnegative)low=Math.max(0,low);
 if(options.transparentBelow!==undefined)low=Math.max(low,options.transparentBelow);
 high=Math.max(high,low+minimumSpan);
 return {stops:stops.map(([v,color])=>[low+(v-first)/(last-first)*(high-low),color]),mode:'field',minimum:low,maximum:high,categorical,transparentBelow:options.transparentBelow};
}
export function mapScaleTicks(scale:MapColorScale,count=3):MapColorStop[]{
 if(scale.categorical)return scale.stops;
 if(count===3&&scale.displayFactor!==undefined)return mapDisplayTicks(scale,scale.displayFactor,scale.displayStep);
 return Array.from({length:count},(_,i)=>{const value=scale.minimum+(scale.maximum-scale.minimum)*i/(count-1);return [value,mapColorAt(scale,value)]});
}
export function mapDisplayTicks(scale:MapColorScale,factor=1,minimumStep=1):MapColorStop[]{
 if(scale.categorical)return scale.stops;
 const low=scale.minimum*factor,high=scale.maximum*factor,step=niceStep(high-low,minimumStep);
 const middle=clean(Math.round((low+high)/2/step)*step/factor);
 const value=middle>scale.minimum&&middle<scale.maximum?middle:clean((scale.minimum+scale.maximum)/2);
 return [scale.minimum,value,scale.maximum].map(v=>[v,mapColorAt(scale,v)]);
}
export function mapScaleGradient(scale:MapColorScale){
 return `linear-gradient(90deg in srgb,${paintStops(scale).map(([v,color])=>`${color} ${(v-scale.minimum)/(scale.maximum-scale.minimum)*100}%`).join(',')})`;
}
function paintStops(scale:MapColorScale):MapColorStop[]{
 const threshold=scale.transparentBelow;
 return threshold!==undefined&&scale.minimum<threshold?[[scale.minimum,'transparent'],[threshold,'transparent'],[threshold,mapColorAt(scale,threshold)],...scale.stops.filter(([v])=>v>threshold)]:scale.stops;
}
export function mapScaleSvg(scale:MapColorScale,format:(value:number)=>string,unit:string,x:number,y:number,width=630,ticks:MapColorStop[]=mapScaleTicks(scale)){
 const esc=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
 if(scale.categorical)return scale.stops.map(([v,color],i)=>`<rect x="${x+i*80}" y="${y}" width="60" height="12" fill="${color}"/><text x="${x+i*80}" y="${y+32}" font-size="12">${esc(format(v))}</text>`).join('');
 return `<defs><linearGradient id="mid-map-scale" color-interpolation="sRGB">${paintStops(scale).map(([v,color])=>`<stop offset="${(v-scale.minimum)/(scale.maximum-scale.minimum)*100}%" stop-color="${color}"/>`).join('')}</linearGradient></defs><rect x="${x}" y="${y}" width="${width}" height="12" fill="url(#mid-map-scale)"/>${ticks.map(([v],i)=>`<text x="${x+(v-scale.minimum)/(scale.maximum-scale.minimum)*width}" y="${y+32}" text-anchor="${i===0?'start':i===ticks.length-1?'end':'middle'}" font-size="12">${esc(format(v))}</text>`).join('')}<text x="${x}" y="${y+57}" font-size="13">${esc(unit)} · ${scale.mode==='field'?'Wertebereich · relative Farbskala':'Feste Skala'}</text>`;
}
