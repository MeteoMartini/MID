import type {CloudWeatherData} from './cloudWeatherData';
import type {NativeField} from './nativeModelFields';
import type {SynopticField} from './nativeSynopticFields';
export const CLOUD_ISOBAR_MODELS=Object.freeze(['icon-d2','icon-d2-ruc','icon-eu','icon'] as const);
export type CloudWeatherIsobar={level:number;spacingKm?:number;paths:number[][][]};
export type CloudIsobarLayer={model:string;run:string;time:string;contours:CloudWeatherIsobar[]};
export function eligibleCloudIsobarModel(model:string){return CLOUD_ISOBAR_MODELS.some(id=>id===model)}
export function matchingCloudIsobars(data:Pick<CloudWeatherData,'model'|'run'|'time'>|null,layer:CloudIsobarLayer|null):CloudWeatherIsobar[]{
 if(!data||!layer||!eligibleCloudIsobarModel(data.model)||layer.model!==data.model||layer.run!==data.run||layer.time!==data.time)return [];
 return layer.contours;
}
export function nativeCloudIsobars(data:CloudWeatherData|null,field:NativeField|null):CloudIsobarLayer|null{
 if(!data||data.model!=='icon-d2'||field?.kind!=='pressure'||field.modelId!==undefined||field.run!==data.run||field.time!==data.time||field.unit!=='hPa'||!field.isobars.length)return null;
 return {model:'icon-d2',run:field.run,time:field.time,contours:field.isobars};
}
export function synopticCloudIsobars(data:CloudWeatherData|null,field:SynopticField|null):CloudIsobarLayer|null{
 if(!data||!field||!eligibleCloudIsobarModel(data.model)||field.model!==data.model||field.run!==data.run||field.time!==data.time||field.pressure?.type!=='FeatureCollection')return null;
 const contours=field.pressure.features.filter(f=>Number.isFinite(f.properties.level)&&f.properties.level>=850&&f.properties.level<=1100&&f.geometry.type==='LineString'&&f.geometry.coordinates.length>=2&&f.geometry.coordinates.every(p=>p.length===2&&p.every(Number.isFinite))).map(f=>({level:f.properties.level,...(f.properties.spacingKm===undefined?{}:{spacingKm:f.properties.spacingKm}),paths:[f.geometry.coordinates.map(([lon,lat])=>[lat,lon])]}));
 return contours.length?{model:field.model,run:field.run,time:field.time,contours}:null;
}
export function cloudIsobarModelLabel(model:string){return model==='icon-d2-ruc'?'ICON-D2-RUC':model==='icon-d2'?'ICON-D2':model==='icon-eu'?'ICON-EU':model==='icon'?'ICON Global':null}


/** 500-hPa geopotential heights from a VERIFIED synoptic model frame.
 * Values are geopotential decametres (gpdm); they are not MSLP.
 * Never borrow contours from a different run, term, or model.
 */
export type CloudIsoheightLayer={model:string;run:string;time:string;contours:SynopticField['height']};
export function synopticCloudIsoheights(data:CloudWeatherData|null,field:SynopticField|null):CloudIsoheightLayer|null{
 if(!data||!field||!eligibleCloudIsobarModel(data.model)||field.model!==data.model||field.run!==data.run||field.time!==data.time||field.height?.type!=='FeatureCollection')return null;
 const features=field.height.features.filter(f=>Number.isFinite(f.properties?.level)&&f.properties.level>=350&&f.properties.level<=650&&f.geometry.type==='LineString'&&f.geometry.coordinates.length>=3&&f.geometry.coordinates.every(p=>p.length===2&&p.every(Number.isFinite)));
 if(!features.length)return null;
 return {model:field.model,run:field.run,time:field.time,contours:{type:'FeatureCollection',features:features.map(f=>({...f,properties:{...f.properties,label:`${Math.round(f.properties.level)} gpdm`}}))}};
}
export function matchingCloudIsoheights(data:Pick<CloudWeatherData,'model'|'run'|'time'>|null,layer:CloudIsoheightLayer|null):SynopticField['height']{
 if(!data||!layer||!eligibleCloudIsobarModel(data.model)||layer.model!==data.model||layer.run!==data.run||layer.time!==data.time)return {type:'FeatureCollection',features:[]};
 return layer.contours;
}
