import {useEffect,useMemo,useState} from 'react';
import {WmsTileLayer} from './MapLibreCore';
import {loadWeatherMapMetadata,weatherMapWmsProxy,type WeatherMapMetadata} from './WeatherMapsData';
import {SYNOPTIC_COMPONENTS,synopticCompositePlan} from './synopticComposite';
export function useSynopticComposite(enabled:boolean,target:number,revision:number,showFill:boolean){
 const [metadata,setMetadata]=useState<WeatherMapMetadata[]>([]),[error,setError]=useState(''),[loaded,setLoaded]=useState<string[]>([]);
 useEffect(()=>{setMetadata([]);setError('');setLoaded([]);if(!enabled)return;const c=new AbortController();void Promise.all(SYNOPTIC_COMPONENTS.map(p=>loadWeatherMapMetadata(p.layer,c.signal))).then(data=>{if(!c.signal.aborted)setMetadata(data)}).catch(e=>{if(!c.signal.aborted)setError(String(e.message||e))});return()=>c.abort()},[enabled,revision]);
 const plan=useMemo(()=>enabled?synopticCompositePlan(metadata,target):null,[enabled,metadata,target]);
 const key=plan?`${plan.run}:${plan.time}`:'',ready=Boolean(plan&&plan.components.filter(c=>showFill||!c.fill).every(c=>loaded.includes(`${key}:${c.layer}`)));
 const onReady=(layer:string)=>setLoaded(old=>old.includes(`${key}:${layer}`)?old:[...old.slice(-20),`${key}:${layer}`]);
 return {plan,error,ready,onReady,onError:()=>setError('Synoptik-Kacheln derzeit nicht vollständig erreichbar.')};
}
export function SynopticCompositeLayers({state,opacity,showFill}:{state:ReturnType<typeof useSynopticComposite>;opacity:number;showFill:boolean}){
 const baseUrl=weatherMapWmsProxy();if(!state.plan||!baseUrl)return null;
 return <>{state.plan.components.filter(c=>showFill||!c.fill).map(c=><WmsTileLayer key={`${c.layer}:${state.plan!.run}:${state.plan!.time}`} id={`synoptic-${c.layer}`} baseUrl={baseUrl} zIndex={c.fill?300:c.level?675:680} opacity={opacity/100} params={{layers:c.layer,styles:c.style,format:'image/png',transparent:true,version:'1.1.1',width:512,height:512,time:state.plan!.time,dim_reference_time:state.plan!.run,...(c.level!==undefined?{elevation:c.level}:{})}} attribution="Synoptik © DWD · CC BY 4.0" onReady={()=>state.onReady(c.layer)} onError={state.onError}/>)}</>;
}

export function SynopticCompositeLegend({state}:{state:ReturnType<typeof useSynopticComposite>}){
 const base=weatherMapWmsProxy(),temperature=state.plan?.components.find(c=>c.fill);
 if(!base||!temperature)return null;
 const url=new URL(base);url.searchParams.set('request','GetLegendGraphic');url.searchParams.set('layers',temperature.layer);url.searchParams.set('styles',temperature.style);url.searchParams.set('format','image/png');url.searchParams.set('width','20');url.searchParams.set('height','20');
 return <details className="unified-source-info"><summary>Farblegende · Temperatur 850 hPa (°C)</summary><img loading="lazy" src={url.toString()} alt="Originale DWD-Farbskala für Temperatur in 850 hPa" style={{maxWidth:'100%',maxHeight:420,objectFit:'contain'}}/><p>Temperaturfläche: °C · Höhenlinien 500 hPa: dam · MSL-Isobaren: hPa. DWD · CC BY 4.0.</p></details>;
}
