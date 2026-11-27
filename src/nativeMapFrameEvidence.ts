import {nativeFieldModel,type NativeField,type NativeIndex,type NativeFrameRef} from './nativeModelFields';

/** Display evidence is attached to the candidate's admitted run and term.
 * A zero/unknown gust interval is not a measured zero-hour duration. */
export function nativeFrameEvidence(index:NativeIndex,field:NativeField,ref:NativeFrameRef){
 if(index.run!==field.run||ref.time!==field.time||(index.modelId??'icon-d2')!==nativeFieldModel(field))return null;
 const bounds:[[number,number],[number,number]]=[[field.lats[0],field.lons[0]],[field.lats.at(-1)!,field.lons.at(-1)!]];
 if(!bounds.flat().every(Number.isFinite)||bounds[0][0]>=bounds[1][0]||bounds[0][1]>=bounds[1][1])return null;
 return {bounds,nativeD2Full:nativeFieldModel(field)==='icon-d2'&&index.schema==='mid.icon-d2.native-fields.v2'&&index.productionApproved===true&&field.schema==='mid.icon-d2.native-field.v2',intervalHours:Number.isFinite(ref.intervalHours)&&ref.intervalHours>0&&ref.intervalHours<=ref.hour?ref.intervalHours:null};
}
/** Resolve the currently displayed field, not the next slider selection.
 * The validated field must still belong to an admitted catalogue frame. */
export function nativeDisplayedFrameEvidence(index:NativeIndex,field:NativeField){
 const ref=index.products[field.kind]?.frames.find(frame=>frame.time===field.time);
 return ref?nativeFrameEvidence(index,field,ref):null;
}
/** Theta-E and precipitation retain the established same-term pressure fallback.
 * SigWx requires a separately verified hPa pressure field only when requested. */
export function nativePressureFrameRef(index:NativeIndex,field:NativeField,cloudIsobars:boolean){
 if(index.run!==field.run||(index.modelId??'icon-d2')!==nativeFieldModel(field))return undefined;
 const requested=field.kind==='thetae'||field.kind==='precipitation'||(field.kind==='sigwx'&&cloudIsobars);
 if(!requested||(field.kind!=='sigwx'&&field.isobars.length))return undefined;
 return index.products.pressure?.frames.find(frame=>frame.time===field.time);
}
export function nativePresentationPressure(field:NativeField,fallback:NativeField|null){
 if(field.kind!=='sigwx'&&field.isobars.length)return field;
 if(!['thetae','precipitation','sigwx'].includes(field.kind))return null;
 return fallback&&fallback.kind==='pressure'&&fallback.unit==='hPa'&&fallback.run===field.run&&fallback.time===field.time&&nativeFieldModel(fallback)===nativeFieldModel(field)&&fallback.isobars.length?fallback:null;
}
