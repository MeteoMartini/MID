import CurrentSurroundings from '../../src/CurrentSurroundings';
import React from 'react';
import {Map as MapLibreMap} from 'maplibre-gl';
const originalAddSource=MapLibreMap.prototype.addSource;MapLibreMap.prototype.addSource=function(...args:Parameters<typeof originalAddSource>){(window as any).__qaMap=this;return originalAddSource.apply(this,args)};
import {createRoot} from 'react-dom/client';
import MapWorkspacePanel from '../../src/MapWorkspacePanel';
import {MapTimelineRange} from '../../src/MapTimelineControls';
import {useCloudWeatherMap,type CloudWeatherState} from '../../src/CloudSignificantWeather';
import type {SynopticIndex} from '../../src/nativeSynopticFields';
// Real React hook, real SHA-validated synthetic frames, controlled presentation callbacks.
function CloudFrameCallbackHarness(){
 const config=(window as unknown as {__qaCloudConfig:{index:SynopticIndex;base:string;times:number[]}}).__qaCloudConfig;
 const [term,setTerm]=React.useState(0);
 const state=useCloudWeatherMap(true,config.times[term],'icon-d2',0,null,config,true);
 const previous=React.useRef<CloudWeatherState|null>(null);
 return <section aria-label="Cloud frame callback QA">
  <output data-testid="qa-cloud-state">{JSON.stringify({time:state.time,dataTime:state.data?.time,displayed:state.displayedTime??null,ready:state.ready,error:state.error,current:state.nativeDataCurrent})}</output>
  <button onClick={()=>{previous.current=state;setTerm(1)}}>Successor</button>
  <button onClick={()=>{if(state.data)state.markDisplayed(state.data)}}>Current ready</button>
  <button onClick={()=>{const old=previous.current;if(old?.data)old.markDisplayed(old.data)}}>Stale ready</button>
  <button onClick={()=>previous.current?.failNativeFrame('stale failure',false)}>Stale error</button>
  <button onClick={()=>state.failNativeFrame('retained failure',true)}>Retained error</button>
  <button onClick={()=>state.failNativeFrame('lost frame',false)}>Lost error</button>
 </section>;
}
/** QA-only: simulate a model term request whose first acknowledgement is delayed. */
function TimelineSeekHarness(){
 const [index,setIndex]=React.useState(3);
 const [acknowledge,setAcknowledge]=React.useState(false);
 const [requests,setRequests]=React.useState<number[]>([]);
 return <section aria-label="Kontrollierter Kartenzeitachsen-Test">
  <MapTimelineRange className="qa-map-timeline" markerClassName="qa-map-markers"
   index={index} count={5} canAnimate={true} countLabel={null}
   rangeLabel="QA-Zeitschritt wählen" valueText={`Modellgültigkeit ${index}`}
   onSeek={next=>{setRequests(prior=>[...prior,next]);if(acknowledge)setIndex(next)}}/>
  <output data-testid="qa-timeline-index">{index}</output>
  <output data-testid="qa-timeline-requests">{requests.join(',')}</output>
  <button type="button" onClick={()=>{setIndex(2);setAcknowledge(true)}}>Modelllauf wechseln</button>
 </section>;
}

import '../../src/styles.css';
import '../../src/midPresentation.css';
document.documentElement.dataset.midDesign=new URLSearchParams(location.search).get('design')||'next';
document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
const now=new Date(Math.floor(Date.now()/3600000)*3600000).toISOString();
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).has('cloud-callback-probe')
 ? <CloudFrameCallbackHarness/>
 : new URLSearchParams(location.search).has('timeline-probe')
 ? <TimelineSeekHarness/>
 : new URLSearchParams(location.search).has('surroundings')
 ? <CurrentSurroundings lat={50.82} lon={7.14} timezone="Europe/Berlin" name="Niederkassel-Rheidt am Rhein" temperature={8} temperatureTime={now} onOpen={(time,bounds)=>{document.body.dataset.surroundingsHandoff=JSON.stringify({time,bounds})}}/>
 : <MapWorkspacePanel lat={50.82} lon={7.14} timezone="Europe/Berlin" locationName="Niederkassel" analysis={{source:'dwd',observedAt:now,timeline:[now]} as any} thunder={null} isDay actualLocation={false} focusMode unit="kmh" favorites={[{id:'nk',name:'Niederkassel-Rheidt',latitude:50.82,longitude:7.14},{id:'outside',name:'Kürecik',latitude:38.35,longitude:38.79}]}/>);
