import {niceStep} from './chartMath';
import type {NativeField} from './nativeModelFields';
import {modelMapDisplayFactor,modelMapUnit,modelMapValue} from './modelMapUnits';
import type {WindUnit} from './weather';

export type RasterExtreme={type:'Min'|'Max';lat:number;lon:number;value:number};
export type ScalarLine={level:number;label:string;path:number[][]};
export type NativeAnnotationOptions={lines?:boolean;extremes?:boolean;fill?:boolean};
export const scalarLineName=(kind:NativeField['kind'])=>({temperature:'Isothermen',wind:'Isotachen',gust:'Böen-Isolinien',cloud:'Bewölkungs-Isolinien',thetae:'Theta-E-Isolinien',precipitation:'Niederschlags-Isolinien',pressure:'Isobaren',sigwx:''}[kind]);
/** Every available cell participates, including boundary cells. Stable first-cell ties.
 * These are extrema of the published raster, never an assertion about the full model domain.
 */
export function nativeRasterExtremes(field:NativeField):RasterExtreme[]{
 if(field.kind==='sigwx')return [];
 let lo=-1,hi=-1;
 for(let i=0;i<field.values.length;i++)if(Number.isFinite(field.values[i])){
  if(lo<0||field.values[i]<field.values[lo])lo=i;
  if(hi<0||field.values[i]>field.values[hi])hi=i;
 }
 if(lo<0)return [];
 return ([['Min',lo],['Max',hi]] as const).map(([type,i])=>({type,lat:field.lats[Math.floor(i/field.lons.length)],lon:field.lons[i%field.lons.length],value:field.values[i]*field.scale}));
}
/** Piecewise-linear isolines of the published regular grid. No spatial thinning,
 * smoothing or extrapolation. Missing corners exclude the entire quad. A fixed
 * diagonal resolves saddle cells deterministically and retains closed extremes.
 */
export function nativeScalarLines(field:NativeField,unit:WindUnit='kn'):ScalarLine[]{
 if(field.kind==='pressure'||field.kind==='sigwx')return [];
 const extremes=nativeRasterExtremes(field);if(!extremes.length)return [];
 const factor=modelMapDisplayFactor(field.kind,unit),low=extremes[0].value*factor,high=extremes[1].value*factor;
 if(!(high>low))return [];
 const minimum={temperature:2,thetae:2,wind:5,gust:5,cloud:10,precipitation:1}[field.kind];
 const step=Math.max(minimum,niceStep((high-low)/12)),out:ScalarLine[]=[],w=field.lons.length,h=field.lats.length;
 for(let visible=Math.ceil(low/step)*step;visible<high;visible+=step){
  const level=visible/factor,segments:number[][][]=[],adj=new Map<string,number[]>();
  const key=(p:number[])=>p.map(v=>v.toFixed(9)).join(',');
  for(let r=0;r<h-1;r++)for(let c=0;c<w-1;c++){
   const ids=[r*w+c,r*w+c+1,(r+1)*w+c+1,(r+1)*w+c];
   if(ids.some(i=>!Number.isFinite(field.values[i])))continue;
   const vals=ids.map(i=>field.values[i]*field.scale);
   if(level<Math.min(...vals)||level>=Math.max(...vals))continue;
   const points=[[field.lons[c],field.lats[r]],[field.lons[c+1],field.lats[r]],[field.lons[c+1],field.lats[r+1]],[field.lons[c],field.lats[r+1]]];
   for(const triangle of [[0,1,2],[0,2,3]]){
    const hits:number[][]=[];
    for(let e=0;e<3;e++){
     let a=triangle[e],b=triangle[(e+1)%3];if(a>b)[a,b]=[b,a];
     if((vals[a]>level)===(vals[b]>level))continue;
     const t=(level-vals[a])/(vals[b]-vals[a]);
     hits.push([points[a][0]+t*(points[b][0]-points[a][0]),points[a][1]+t*(points[b][1]-points[a][1])]);
    }
    if(hits.length===2&&key(hits[0])!==key(hits[1]))segments.push(hits);
   }
  }
  segments.forEach((s,i)=>s.forEach(p=>{const k=key(p);adj.set(k,[...(adj.get(k)??[]),i])}));
  const used=new Set<number>();
  const walk=(i:number,start:number[])=>{
   const path=[start];let at=start;
   while(!used.has(i)){
    used.add(i);const s=segments[i],next=key(s[0])===key(at)?s[1]:s[0];path.push(next);at=next;
    const following=adj.get(key(at))?.find(j=>!used.has(j));if(following===undefined)break;i=following;
   }
   out.push({level,label:`${modelMapValue(field.kind,level,field.unit,unit)} ${modelMapUnit(field.kind,field.unit,unit)}`,path});
  };
  segments.forEach((s,i)=>{const end=s.find(p=>adj.get(key(p))?.length===1);if(end&&!used.has(i))walk(i,end)});
  segments.forEach((s,i)=>{if(!used.has(i))walk(i,s[0])});
 }
 return out;
}
export function scalarLineFeatures(lines:ScalarLine[]){return {type:'FeatureCollection' as const,features:lines.map(l=>({type:'Feature' as const,properties:{level:l.level,label:l.label},geometry:{type:'LineString' as const,coordinates:l.path}}))}}

export function nativeAnnotationSvg(field:NativeField,unit:WindUnit,options:NativeAnnotationOptions,x:(lon:number)=>number,y:(lat:number)=>number){
 const xml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
 const lines=options.lines?nativeScalarLines(field,unit):[],extremes=options.extremes===false?[]:nativeRasterExtremes(field);
 const text=(lon:number,lat:number,label:string,color='#20384d')=>`<text x="${x(lon).toFixed(1)}" y="${y(lat).toFixed(1)}" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="${color}" stroke="white" stroke-width="3" paint-order="stroke">${xml(label)}</text>`;
 const uniform=extremes.length===2&&extremes[0].value===extremes[1].value;
 return `<g class="native-scalar-annotations">${lines.map(l=>{const p=l.path[Math.floor(l.path.length/2)];return `<path d="${l.path.map(([lon,lat],i)=>`${i?'L':'M'}${x(lon).toFixed(1)},${y(lat).toFixed(1)}`).join(' ')}" fill="none" stroke="#20384d" stroke-width="1.2"/>${text(p[0],p[1],l.label)}`}).join('')}${extremes.filter((_,i)=>!uniform||i===0).map(p=>text(p.lon,p.lat,`${uniform?'Min = Max':p.type} ${modelMapValue(field.kind,p.value,field.unit,unit)} ${modelMapUnit(field.kind,field.unit,unit)}`,p.type==='Max'?'#9b1833':'#153c7b')).join('')}</g>`;
}
