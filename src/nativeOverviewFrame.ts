/** Candidate overview core, deliberately not yet wired to the product selector.
 * Only original, verified DWD native fields. Hourly amount and instantaneous WW
 * are independent: never paint the whole interval as the endpoint phase.
 */
import {nativeFrameIdentity,nativeVerifiedFrameIdentity,nativeFieldModel,nativeMapScale,type NativeField,type NativeIndex} from './nativeModelFields';
import {mapColorAt} from './modelMapColorScale';
import {mercatorY} from './precipitationTotals';

const OVERVIEW_KINDS=['cloud','precipitation','pressure','temperature','sigwx'] as const;
const OVERVIEW_UNITS={'cloud':'%','precipitation':'mm/1 h','pressure':'hPa','temperature':'°C','sigwx':'WMO'} as const;

/** Catalogue eligibility is not loaded-field evidence. Do not expose RUC or a
 * different grid using a coincident timestamp alone. RUC WW needs its own
 * independently qualified native sidecar before this path can be extended.
 */
export function nativeOverviewPlan(index:NativeIndex|null,time:string){
 if(!index||!['mid.icon-d2.fields.v1','mid.icon-d2.native-fields.v2'].includes(index.schema)||
  (index.modelId!==undefined&&index.modelId!=='icon-d2')||
  (index.schema==='mid.icon-d2.native-fields.v2'&&index.productionApproved!==true))return null;
 const runMs=Date.parse(index.run),timeMs=Date.parse(time),lead=(timeMs-runMs)/3600000;
 if(!Number.isInteger(lead)||lead<1)return null;
 const refs=[];
 for(const kind of OVERVIEW_KINDS){
  const product=index.products[kind];
  if(!product||product.unit!==OVERVIEW_UNITS[kind])return null;
  const matches=product.frames.filter(ref=>ref.time===time);
  if(matches.length!==1)return null;
  const ref=matches[0];
  if(ref.hour!==lead||ref.intervalHours!==(kind==='precipitation'?1:0)||
   !/^[a-f0-9]{64}$/.test(ref.sha256)||!Number.isSafeInteger(ref.bytes)||ref.bytes<1)return null;
  refs.push({kind,ref,identity:nativeFrameIdentity(index,ref,kind)});
 }
 return {model:'icon-d2' as const,run:index.run,time,intervalStart:new Date(timeMs-3600000).toISOString(),
  refs,key:JSON.stringify(refs.map(row=>row.identity))};
}

/** Do not clone the full grids. The loaded frame evidence is an existing
 * WeakMap populated only by the verified byte loader, not a caller boolean.
 */
export function prepareNativeOverview(index:NativeIndex|null,time:string,fields:readonly NativeField[]){
 const plan=nativeOverviewPlan(index,time);
 if(!plan||fields.length!==OVERVIEW_KINDS.length)return null;
 const ordered:NativeField[]=[];
 const primary=fields[0];
 const width=primary.lons.length,height=primary.lats.length;
 if(width<2||height<2||width*height>4000000||
  primary.lats.some((v,i)=>!Number.isFinite(v)||(i>0&&v<=primary.lats[i-1]))||
  primary.lons.some((v,i)=>!Number.isFinite(v)||(i>0&&v<=primary.lons[i-1])))return null;
 for(const row of plan.refs){
  const matched=fields.filter(field=>field.kind===row.kind);
  if(matched.length!==1)return null;
  const field=matched[0];
  if(nativeVerifiedFrameIdentity(field)!==row.identity||
   nativeFieldModel(field)!==plan.model||field.schema!==primary.schema||
   field.run!==plan.run||field.time!==plan.time||field.unit!==OVERVIEW_UNITS[row.kind]||
   !Number.isFinite(field.scale)||field.scale<=0||field.values.length!==width*height||
   field.lats.length!==height||field.lons.length!==width||
   field.lats.some((v,i)=>v!==primary.lats[i])||field.lons.some((v,i)=>v!==primary.lons[i]))return null;
  ordered.push(field);
 }
 const [cloud,precipitation,pressure,temperature,weather]=ordered;
 const frame={...plan,cloud,precipitation,pressure,temperature,weather,width,height};
 if(!cloud.values.some((_,i)=>nativeOverviewCellValid(frame,i)))return null;
 return frame;
}
export type NativeOverviewFrame=NonNullable<ReturnType<typeof prepareNativeOverview>>;

function nativeOverviewCellValid(frame:NativeOverviewFrame,i:number){
 return Number.isFinite(frame.cloud.values[i])&&Number.isFinite(frame.precipitation.values[i])&&
  Number.isFinite(frame.pressure.values[i])&&Number.isFinite(frame.temperature.values[i])&&Number.isFinite(frame.weather.values[i]);
}

/** One shared sampled cell for map probe and later export. Amount is mm/1 h,
 * WW is instantaneous original WMO 4677; no phase/intensity inference.
 */
export function nativeOverviewCell(frame:NativeOverviewFrame,i:number){
 if(!Number.isInteger(i)||i<0||i>=frame.width*frame.height||!nativeOverviewCellValid(frame,i))return null;
 return {cloud:frame.cloud.values[i]*frame.cloud.scale,
  precipitation:frame.precipitation.values[i]*frame.precipitation.scale,
  pressure:frame.pressure.values[i]*frame.pressure.scale,
  temperature:frame.temperature.values[i]*frame.temperature.scale,
  weatherCode:Math.round(frame.weather.values[i]*frame.weather.scale),
  intervalStart:frame.intervalStart,time:frame.time,run:frame.run,model:frame.model};
}

/** A single canvas for neutral cloud and quantitative hourly precipitation.
 * Pressure/temperature/WW remain separate original vector/label consumers.
 * No per-cell object or additional grid allocation in the raster loop.
 */
export function nativeOverviewRaster(frame:NativeOverviewFrame){
 const canvas=document.createElement('canvas');
 canvas.width=frame.width;canvas.height=frame.height;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Overview-Raster nicht verfügbar.');
 const image=ctx.createImageData(frame.width,frame.height);
 const north=mercatorY(frame.cloud.lats[frame.height-1]),south=mercatorY(frame.cloud.lats[0]);
 const step=frame.cloud.lats[1]-frame.cloud.lats[0],scale=nativeMapScale(frame.precipitation,'absolute');
 for(let y=0;y<frame.height;y++){
  const lat=(2*Math.atan(Math.exp(north-(y+.5)/frame.height*(north-south)))-Math.PI/2)*180/Math.PI;
  const row=Math.min(frame.height-1,Math.max(0,Math.round((lat-frame.cloud.lats[0])/step)));
  for(let x=0;x<frame.width;x++){
   const i=row*frame.width+x,p=(y*frame.width+x)*4;
   if(!nativeOverviewCellValid(frame,i))continue;
   const rain=frame.precipitation.values[i]*frame.precipitation.scale;
   const color=mapColorAt(scale,rain);
   if(color!=='transparent'){
    image.data[p]=parseInt(color.slice(1,3),16);image.data[p+1]=parseInt(color.slice(3,5),16);
    image.data[p+2]=parseInt(color.slice(5,7),16);image.data[p+3]=215;
   }else{
    const cloud=frame.cloud.values[i]*frame.cloud.scale;
    image.data[p]=image.data[p+1]=image.data[p+2]=142;
    image.data[p+3]=Math.round(1.7*cloud);
   }
  }
 }
 ctx.putImageData(image,0,0);
 return canvas.toDataURL('image/png');
}
