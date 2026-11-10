/**
 * MID original DWD ICON-D2 seasonal map composites.
 * Two independently SHA-verified native fields from ONE model run and valid
 * time. Never infer snowfall, freezing rain, lightning or official warnings.
 */
import type {NativeField,NativeFieldKind,NativeFrameRef,NativeIndex} from './nativeModelFields';

export type SeasonalMapId='winter-berge'|'sommer-gewitter';
const CONFIG:Readonly<Record<SeasonalMapId,{primary:'precipitation';secondary:'temperature'|'gust'}>>={
 'winter-berge':{primary:'precipitation',secondary:'temperature'},
 'sommer-gewitter':{primary:'precipitation',secondary:'gust'},
};
export function seasonalMapKinds(id:string):{primary:NativeFieldKind;secondary:NativeFieldKind}|null{
 return Object.prototype.hasOwnProperty.call(CONFIG,id)?CONFIG[id as SeasonalMapId]:null;
}
/** Show only exact common hours with validated one-hour precipitation intervals. */
export function seasonalMapFrames(index:NativeIndex|null,id:string):NativeFrameRef[]{
 const c=seasonalMapKinds(id);
 if(!c||!index||!['mid.icon-d2.fields.v1','mid.icon-d2.native-fields.v2'].includes(index.schema)||
   (index.modelId!==undefined&&index.modelId!=='icon-d2')||
   (index.schema==='mid.icon-d2.native-fields.v2'&&index.productionApproved!==true))return [];
 const first=index.products[c.primary],second=index.products[c.secondary];
 if(!first?.frames?.length||!second?.frames?.length||
   first.unit!=='mm/1 h'||second.unit!==(c.secondary==='temperature'?'°C':'km/h'))return [];
 const secondary=new Map(second.frames.map(frame=>[frame.time,frame]));
 return first.frames.filter(frame=>{
  const pair=secondary.get(frame.time);
  return Boolean(pair&&frame.intervalHours===1&&Number.isInteger(frame.hour)&&frame.hour>0&&pair.hour===frame.hour&&
   Date.parse(frame.time)===Date.parse(index.run)+frame.hour*3600000&&
   Number.isInteger(pair.intervalHours)&&pair.intervalHours>=0&&pair.intervalHours<=pair.hour&&
   Number.isFinite(Date.parse(frame.time))&&Date.parse(frame.time)>Date.parse(index.run)&&
   typeof frame.sha256==='string'&&/^[a-f0-9]{64}$/.test(frame.sha256)&&
   typeof pair!.sha256==='string'&&/^[a-f0-9]{64}$/.test(pair!.sha256));
 });
}
export function seasonalPairValid(id:string,primary:NativeField|null,secondary:NativeField|null,expectedTime?:string):boolean{
 const c=seasonalMapKinds(id);
 if(!c||!primary||!secondary||primary.kind!==c.primary||secondary.kind!==c.secondary||
   primary.unit!=='mm/1 h'||secondary.unit!==(c.secondary==='temperature'?'°C':'km/h')||
   primary.run!==secondary.run||primary.time!==secondary.time||
   (expectedTime!==undefined&&primary.time!==expectedTime)||
   (primary.modelId!==undefined&&primary.modelId!=='icon-d2')||
   (secondary.modelId!==undefined&&secondary.modelId!=='icon-d2')||
   primary.lats.length<2||primary.lons.length<2||
   primary.lats.length!==secondary.lats.length||primary.lons.length!==secondary.lons.length||
   !Number.isFinite(primary.scale)||primary.scale<=0||
   !Number.isFinite(secondary.scale)||secondary.scale<=0||
   primary.values.length!==primary.lats.length*primary.lons.length||
   secondary.values.length!==secondary.lats.length*secondary.lons.length)return false;
 // The coordinate arrays must coincide, not merely have matching dimensions.
 for(let i=0;i<primary.lats.length;i++)
  if(!Number.isFinite(primary.lats[i])||primary.lats[i]!==secondary.lats[i])return false;
 for(let i=0;i<primary.lons.length;i++)
  if(!Number.isFinite(primary.lons[i])||primary.lons[i]!==secondary.lons[i])return false;
 // Individually valid rasters with disjoint NoData masks yield no drawable composite.
 // A physically real zero counts as shared valid data, never as missing.
 return primary.values.some((value,i)=>Number.isFinite(value)&&Number.isFinite(secondary.values[i]));
}
/** Missing in either field remains NoData, never zero or a fabricated phase. */
export function seasonalMaskedPrimary(id:string,primary:NativeField,secondary:NativeField):NativeField|null{
 if(!seasonalPairValid(id,primary,secondary))return null;
 return {...primary,values:primary.values.map((value,i)=>
   Number.isFinite(value)&&Number.isFinite(secondary.values[i])?value:NaN)};
}
export function seasonalMaskedSecondary(id:string,primary:NativeField,secondary:NativeField):NativeField|null{
 if(!seasonalPairValid(id,primary,secondary))return null;
 return {...secondary,values:secondary.values.map((value,i)=>
   Number.isFinite(value)&&Number.isFinite(primary.values[i])?value:NaN)};
}
