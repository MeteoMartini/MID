import CurrentSurroundings from '../../src/CurrentSurroundings';
import React from 'react';
import {Map as MapLibreMap} from 'maplibre-gl';
const originalAddSource=MapLibreMap.prototype.addSource;MapLibreMap.prototype.addSource=function(...args:Parameters<typeof originalAddSource>){(window as any).__qaMap=this;return originalAddSource.apply(this,args)};
import {createRoot} from 'react-dom/client';
import MapWorkspacePanel from '../../src/MapWorkspacePanel';
import {MapTimelineRange} from '../../src/MapTimelineControls';
import {MapModelPicker} from '../../src/MapModelPicker';
import {groupedMapModelOptions} from '../../src/mapModelPresentation';
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

/** Pure browser fixture, no network or WebGL: actual graphical model selector at desktop width. */
function FlagPickerHarness(){
 const [model,setModel]=React.useState('icon-d2');
 const groups=groupedMapModelOptions([
  {id:'icon-d2',label:'DWD ICON-D2'},
  {id:'ifs',label:'ECMWF IFS'},
  {id:'gfs',label:'NOAA GFS'},
  {id:'gdps',label:'ECCC GDPS'}
 ]);
 return <section className="qa-map-flag-probe" style={{maxWidth:560,padding:16}}>
  <MapModelPicker label="Modell für Parameter" value={model} groups={groups} onChange={setModel}/>
  <output data-testid="qa-model-choice">{model}</output>
 </section>;
}

/** QA-only reproducer of the public CurrentSurroundings -> App -> MapWorkspace
 * handoff. The first WebGL map unmounts and the full map mounts with the same
 * original UTC request and geographic bounds, just as with a real tab change.
 */
function SurroundingsOpenMapHarness(){
 const [request,setRequest]=React.useState<{lat:number;lon:number;time?:number;bounds:{west:number;south:number;east:number;north:number};id:number}|null>(null);
 return request
  ?<MapWorkspacePanel lat={50.82} lon={7.14} timezone="Europe/Berlin"
   locationName="Niederkassel" analysis={null} thunder={null} isDay
   actualLocation={false} focusMode unit="kmh" favorites={[]}
   observationRequest={request}/>
  :<CurrentSurroundings lat={50.82} lon={7.14} timezone="Europe/Berlin"
   name="Niederkassel-Rheidt am Rhein" temperature={8}
   temperatureTime={now}
   onOpen={(time,bounds)=>{const req={lat:50.82,lon:7.14,time,id:Date.now(),bounds};
    document.body.dataset.surroundingsHandoff=JSON.stringify(req);
    setRequest(req);
   }}/>;
}

import '../../src/styles.css';
import '../../src/midPresentation.css';
document.documentElement.dataset.midDesign=new URLSearchParams(location.search).get('design')||'next';
document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
const now=new Date(Math.floor(Date.now()/3600000)*3600000).toISOString();
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).has('flag-probe')
 ? <FlagPickerHarness/>
 : new URLSearchParams(location.search).has('surroundings-handoff')
 ? <SurroundingsOpenMapHarness/>
 : new URLSearchParams(location.search).has('timeline-probe')
 ? <TimelineSeekHarness/>
 : new URLSearchParams(location.search).has('surroundings')
 ? <CurrentSurroundings lat={50.82} lon={7.14} timezone="Europe/Berlin" name="Niederkassel-Rheidt am Rhein" temperature={8} temperatureTime={now} onOpen={(time,bounds)=>{document.body.dataset.surroundingsHandoff=JSON.stringify({time,bounds})}}/>
 : <MapWorkspacePanel lat={50.82} lon={7.14} timezone="Europe/Berlin" locationName="Niederkassel" analysis={{source:'dwd',observedAt:now,timeline:[now]} as any} thunder={null} isDay actualLocation={false} focusMode unit="kmh" favorites={[{id:'nk',name:'Niederkassel-Rheidt',latitude:50.82,longitude:7.14},{id:'outside',name:'Kürecik',latitude:38.35,longitude:38.79}]}/>);
