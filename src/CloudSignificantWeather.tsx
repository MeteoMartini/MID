import {useEffect,useMemo,useRef,useState} from 'react';
import {ImageQuadLayer,WmsTileLayer} from './MapLibreCore';
import ModelMapProbe from './ModelMapProbe';
import {loadNativeField,type NativeIndex} from './nativeModelFields';
import {loadSynopticField,type SynopticIndex} from './nativeSynopticFields';
import {loadWeatherMapMetadata,weatherMapWmsProxy,type WeatherMapMetadata} from './WeatherMapsData';
import {nearestUnifiedTime} from './unifiedMapCatalog';
import {CLOUD_WEATHER_LABEL,GDPS_CLOUD_LAYER,GDPS_WEATHER_LAYER,SIGNIFICANT_WEATHER_STYLES,cloudWeatherAt,cloudWeatherDescription,cloudWeatherRaster,gdpsCloudWeatherPlan,nativeCloudWeatherPair,synopticCloudWeather,type CloudWeatherData} from './cloudWeatherData';
import './CloudSignificantWeather.css';

export function useCloudWeatherMap(enabled:boolean,target:number,modelId:string,revision:number,native:{index:NativeIndex;base:string}|null,synoptic:{index:SynopticIndex;base:string}|null){
 const [data,setData]=useState<CloudWeatherData|null>(null),[metadata,setMetadata]=useState<WeatherMapMetadata[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[tiles,setTiles]=useState<Set<string>>(()=>new Set());
 const cache=useRef(new Map<string,CloudWeatherData>());
 const nativeTimes=modelId==='icon-d2'?native?.index.products.sigwx?.frames.filter(w=>native.index.products.cloud?.frames.some(c=>c.time===w.time)).map(f=>f.time)??[]:synoptic?.index.models[modelId]?.frames.filter(f=>f.cloudWeather===true).map(f=>f.time)??[];
 const nativeTime=nearestUnifiedTime(nativeTimes,target),gdpsPlan=useMemo(()=>gdpsCloudWeatherPlan(metadata,target),[metadata,target]);
 const time=modelId==='gdps'?gdpsPlan?.time:nativeTime,run=modelId==='gdps'?gdpsPlan?.run:modelId==='icon-d2'?native?.index.run:synoptic?.index.models[modelId]?.run,context=`${modelId}:${run}:${time}`;
 const currentContext=useRef(context);currentContext.current=context;
 useEffect(()=>{const c=new AbortController();setMetadata([]);setError('');if(!enabled||modelId!=='gdps')return()=>c.abort();setLoading(true);
  void Promise.all([loadWeatherMapMetadata(GDPS_CLOUD_LAYER,c.signal),loadWeatherMapMetadata(GDPS_WEATHER_LAYER,c.signal)]).then(rows=>{if(!c.signal.aborted)setMetadata(rows)}).catch(e=>{if(!c.signal.aborted)setError(String(e.message||e))}).finally(()=>{if(!c.signal.aborted)setLoading(false)});return()=>c.abort();
 },[enabled,modelId,revision]);
 useEffect(()=>{const c=new AbortController();setData(null);if(!enabled||modelId==='gdps')return()=>c.abort();setError('');setLoading(false);if(!time||!run)return()=>c.abort();
  const refs=modelId==='icon-d2'?[native?.index.products.cloud?.frames.find(f=>f.time===time),native?.index.products.sigwx?.frames.find(f=>f.time===time)]:[synoptic?.index.models[modelId]?.frames.find(f=>f.time===time&&f.cloudWeather===true)];
  if(refs.some(r=>!r))return()=>c.abort();const key=`${context}:${refs.map(r=>r!.sha256).join(':')}`,cached=cache.current.get(key);if(cached){setData(cached);return()=>c.abort();}
  setLoading(true);const timer=window.setTimeout(()=>{setError('Wolken-/Wetterfeld: Zeitüberschreitung.');setLoading(false);c.abort()},30000);
  const load=async()=>{
   if(modelId==='icon-d2'&&native){const cloudRef=native.index.products.cloud?.frames.find(f=>f.time===time),weatherRef=native.index.products.sigwx?.frames.find(f=>f.time===time);if(!cloudRef||!weatherRef)return null;const [cloud,weather]=await Promise.all([loadNativeField(native.index,native.base,cloudRef,'cloud',c.signal),loadNativeField(native.index,native.base,weatherRef,'sigwx',c.signal)]);return nativeCloudWeatherPair(cloud,weather);}
   const model=synoptic?.index.models[modelId],frame=model?.frames.find(f=>f.time===time&&f.cloudWeather===true);return synoptic&&model&&frame?synopticCloudWeather(await loadSynopticField(synoptic.base,modelId,model,frame,c.signal)):null;
  };
  void load().then(value=>{if(!c.signal.aborted&&value){cache.current.set(key,value);while(cache.current.size>4)cache.current.delete(cache.current.keys().next().value!);setData(value)}}).catch(e=>{if(!c.signal.aborted)setError(String(e.message||e))}).finally(()=>{window.clearTimeout(timer);if(!c.signal.aborted)setLoading(false)});
  return()=>{window.clearTimeout(timer);c.abort()};
 },[enabled,modelId,context,native,synoptic,revision]);
 useEffect(()=>{setError('')},[context]);
 const raster=useMemo(()=>enabled&&data?cloudWeatherRaster(data):'',[enabled,data]);
 const ready=enabled&&!error&&(modelId==='gdps'?Boolean(gdpsPlan&&tiles.has(`${context}:cloud`)&&tiles.has(`${context}:weather`)):Boolean(data&&data.model===modelId&&data.time===time&&data.run===run));
 const markTile=(role:string)=>{const key=`${context}:${role}`;if(currentContext.current!==context)return;setTiles(current=>{if(current.has(key))return current;const next=new Set(current);next.add(key);while(next.size>12)next.delete(next.values().next().value!);return next})};
 const failTile=()=>{if(currentContext.current===context)setError('Wolken oder Niederschlagsart sind nicht vollständig erreichbar. Die Kombination wird ausgeblendet.')};
 const sample=(lat:number,lon:number)=>{if(!ready||!data)return null;const p=cloudWeatherAt(data,lat,lon);return p&&(p.cloud!==null||p.weather!==null)?`${p.cloud===null?'Wolken nicht verfügbar':`${Math.round(p.cloud)} % Wolken`} · ${cloudWeatherDescription(p.weather)}`:null};
 return {enabled,modelId,data,raster,time,run,context,ready,loading,error,times:modelId==='gdps'?gdpsPlan?.times??[]:nativeTimes,gdpsPlan,markTile,failTile,sample};
}
export type CloudWeatherState=ReturnType<typeof useCloudWeatherMap>;
export function CloudWeatherLayers({state,opacity,modelLabel}:{state:CloudWeatherState;opacity:number;modelLabel:string}){
 if(!state.enabled)return null;
 return <>{state.modelId==='gdps'&&state.gdpsPlan?(['cloud','weather'] as const).map(role=><WmsTileLayer key={`${state.context}:${role}`} id={`cloud-weather-${state.context}-${role}`} resampling={role==='weather'?'nearest':'linear'} baseUrl={weatherMapWmsProxy('geomet')} zIndex={role==='cloud'?300:305} opacity={state.ready?opacity/100:.001} params={{layers:role==='cloud'?GDPS_CLOUD_LAYER:GDPS_WEATHER_LAYER,styles:role==='cloud'?'CLOUD':'INSTPRECIPITATIONTYPE',format:'image/png',transparent:true,version:'1.1.1',width:512,height:512,time:state.gdpsPlan!.time,dim_reference_time:state.gdpsPlan!.run}} attribution="Wolken / Niederschlagsart © ECCC · Open Government Licence – Canada" onReady={()=>state.markTile(role)} onError={state.failTile}/>):state.data&&state.raster?<ImageQuadLayer id={`cloud-weather-${state.context}`} resampling="nearest" url={state.raster} bounds={[[state.data.lats[0],state.data.lons[0]],[state.data.lats.at(-1)!,state.data.lons.at(-1)!]]} opacity={state.ready?opacity/100:0} zIndex={300} onError={state.failTile}/>:null}
 {state.data&&<ModelMapProbe<string> label={CLOUD_WEATHER_LABEL} unit="" source={`${modelLabel} · gleicher Rasterpunkt, Lauf und Termin`} enabled={state.ready} contextKey={state.context} sample={state.sample} format={value=>value??'–'}/>}</>;
}
export function CloudWeatherLegend({state}:{state:Pick<CloudWeatherState,'modelId'>}){
 return <details className="cloud-weather-legend"><summary>Legende · Wolken und Wetterfarben</summary>
  <div className="cloud-weather-cover"><span>Wolken</span><i/><span>0–100 %</span></div>
  {state.modelId==='gdps'?<><div className="cloud-weather-provider-legend">{[[GDPS_CLOUD_LAYER,'CLOUD','Wolkenbedeckung'],[GDPS_WEATHER_LAYER,'INSTPRECIPITATIONTYPE','Momentane Niederschlagsart']].map(([layer,style,label])=><img key={layer} alt={`ECCC-Legende · ${label}`} src={`${weatherMapWmsProxy('geomet')}&request=GetLegendGraphic&layers=${encodeURIComponent(layer)}&styles=${style}&format=image/png`}/>)}</div><p>GDPS: Wolken plus momentane Niederschlagsart in der ECCC-Originaldarstellung. Keine vollständige Nebel-/Gewitterdiagnostik; keine Stundensumme.</p></>:<><div className="cloud-weather-colors">{SIGNIFICANT_WEATHER_STYLES.map(s=><span key={s.label}><i style={{background:s.color}}/>{s.label}</span>)}</div><p>Graustufen: Gesamtbewölkung. Farbflächen: direktes Modellwetter nach WMO-Code. Kategorien werden nicht räumlich interpoliert; fehlende Werte bleiben unbekannt. Modellprognose, keine amtliche Warnung.</p></>}
 </details>;
}
