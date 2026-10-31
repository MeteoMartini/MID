import {lazy,memo,Suspense,useEffect,useState} from 'react';
import {type WeatherMapFavoriteLocation} from './PrecipitationTotalsMap';
import {MAP_WORKSPACE_VIEW_KEY,readMapWorkspaceView,saveMapWorkspaceView} from './mapWorkspaceState';
import type {RadarNowcast,ThunderstormNowcast,WindUnit} from './weather';
import './MapWorkspace.css';

const LazyUnifiedWeatherMap=lazy(()=>import('./UnifiedWeatherMap'));
const MemoLazyUnifiedWeatherMap=memo(LazyUnifiedWeatherMap);

type MapWorkspacePanelProps={
 lat:number;
 lon:number;
 timezone:string;
 locationName:string;
 analysis:RadarNowcast|null;
 thunder:ThunderstormNowcast|null;
 isDay:boolean;
 actualLocation:boolean;
 focusMode:boolean;
 favorites:WeatherMapFavoriteLocation[];
 unit?:WindUnit;
};

function LoadingMapPanel(){return <section className="lazy-placeholder inner"><span>Kartenprodukt wird geladen …</span></section>}

export default function MapWorkspacePanel(props:MapWorkspacePanelProps){
 const[requestedProductId,setRequestedProductId]=useState<string|undefined>(()=>{try{if(localStorage.getItem('mid:unified-map:v1')||localStorage.getItem(MAP_WORKSPACE_VIEW_KEY)!=='totals')return undefined;readMapWorkspaceView();return'icon-d2-precipitation-totals'}catch{return undefined}});
 useEffect(()=>{
  const handleChange=(event:Event)=>{const next=(event as CustomEvent<{view?:string}>).detail?.view;if(next==='models'){saveMapWorkspaceView('models');return}if(next==='totals'){saveMapWorkspaceView('totals');setRequestedProductId(`icon-d2-precipitation-totals:${Date.now()}`)}};
  window.addEventListener('mid:map-workspace-view',handleChange);
  return()=>window.removeEventListener('mid:map-workspace-view',handleChange);
 },[]);

 return <section className={`map-workspace-shell${props.focusMode?' focus':''}`} aria-label="Kartenarbeitsbereich">
  <Suspense fallback={<LoadingMapPanel/>}><MemoLazyUnifiedWeatherMap {...props} requestedProductId={requestedProductId}/></Suspense>
 </section>
}
