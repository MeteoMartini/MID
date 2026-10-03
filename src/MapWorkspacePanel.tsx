import {lazy,memo,Suspense,useEffect,useState} from 'react';
import {CloudRain,Layers3} from 'lucide-react';
import {type WeatherMapFavoriteLocation} from './PrecipitationTotalsMap';
import {readMapWorkspaceView,saveMapWorkspaceView,type MapWorkspaceView} from './mapWorkspaceState';
import type {RadarNowcast,ThunderstormNowcast,WindUnit} from './weather';
import './MapWorkspace.css';

const LazyRadarPanel=lazy(()=>import('./RadarPanel'));
const MemoLazyRadarPanel=memo(LazyRadarPanel);
const LazyWeatherMapsPanel=lazy(()=>import('./WeatherMapsPanel'));

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
 unit:WindUnit;
 favorites:WeatherMapFavoriteLocation[];
};

const MAP_VIEWS:{id:MapWorkspaceView;label:string;icon:typeof CloudRain}[]=[
 {id:'radar',label:'Radar · Satellit · Blitz',icon:CloudRain},
 {id:'models',label:'Modellkarten',icon:Layers3}
];

function viewLabel(view:MapWorkspaceView){return MAP_VIEWS.find(item=>item.id===view)?.label||'Karten'}
function LoadingMapPanel(){return <section className="lazy-placeholder inner"><span>Kartenprodukt wird geladen …</span></section>}

export default function MapWorkspacePanel(props:MapWorkspacePanelProps){
 const[view,setView]=useState<MapWorkspaceView>(readMapWorkspaceView),[requestedProductId,setRequestedProductId]=useState<string>();
 const chooseView=(next:MapWorkspaceView)=>{setView(next);saveMapWorkspaceView(next)};
 useEffect(()=>{
  const handleChange=(event:Event)=>{const next=(event as CustomEvent<{view?:MapWorkspaceView|'totals'}>).detail?.view;if(next==='totals'){saveMapWorkspaceView('totals');setRequestedProductId('icon-d2-precipitation-totals');setView('models');return}if(next&&MAP_VIEWS.some(item=>item.id===next)){setView(next);saveMapWorkspaceView(next)}};
  window.addEventListener('mid:map-workspace-view',handleChange);
  return()=>window.removeEventListener('mid:map-workspace-view',handleChange);
 },[]);

 return <section className={`map-workspace-shell${props.focusMode?' focus':''}`} aria-label="Kartenarbeitsbereich">
  <div className="map-workspace-tabs" role="group" aria-label="Kartenprodukt auswählen">
   {MAP_VIEWS.map(item=>{const Icon=item.icon,active=view===item.id;return <button key={item.id} type="button" className={active?'active':''} aria-pressed={active} onClick={()=>chooseView(item.id)}><Icon size={16}/><span>{item.label}</span></button>})}
  </div>
  <div className="map-workspace-view" aria-live="polite" aria-label={viewLabel(view)}>
   {view==='radar'?<Suspense fallback={<LoadingMapPanel/>}><MemoLazyRadarPanel lat={props.lat} lon={props.lon} timezone={props.timezone} analysis={props.analysis} thunder={props.thunder} isDay={props.isDay} actualLocation={props.actualLocation} focusMode={props.focusMode}/></Suspense>:null}
   {view==='models'?<Suspense fallback={<LoadingMapPanel/>}><LazyWeatherMapsPanel latitude={props.lat} longitude={props.lon} timezone={props.timezone} locationName={props.locationName} favorites={props.favorites} windUnit={props.unit} requestedProductId={requestedProductId}/></Suspense>:null}
  </div>
 </section>
}