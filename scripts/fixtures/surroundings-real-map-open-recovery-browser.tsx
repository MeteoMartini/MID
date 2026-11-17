/** Genuine compact -> full MID map React component path.
 * Sources are intentionally blocked in browser QA so no weather original,
 * licensed service or paid API is misrepresented.
 */
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import CurrentSurroundings from '../../src/CurrentSurroundings';
import MapWorkspacePanel from '../../src/MapWorkspacePanel';
import {MapWorkspaceErrorBoundary} from '../../src/MapWorkspaceErrorBoundary';

declare global{
 interface Window{__midMapOpenRequest?:{lat:number;lon:number;time?:number;bounds:any;id:number}}
}

function Fault({enabled}:{enabled:boolean}){
 if(enabled)throw new Error('SYNTHETIC_MAP_QA_RENDER_FAILURE');
 return <p data-testid="qa-map-recovered">Kartenunterbereich wieder verfügbar</p>;
}
function QaApp(){
 const [request,setRequest]=useState<{lat:number;lon:number;time?:number;bounds:any;id:number}>();
 const [broken,setBroken]=useState(true),[retry,setRetry]=useState(0);
 const fault=new URLSearchParams(location.search).has('fault');
 return <main className="qa-app">
  <h1>MID Umfeldkarte zu Kartenbereich – isolierter React-Pfad</h1>
  <p data-testid="qa-app-alive">Restliche Wetteransicht bleibt erhalten.</p>
  {fault?<section>
   <MapWorkspaceErrorBoundary key={retry} onRetry={()=>{setBroken(false);setRetry(v=>v+1)}}>
    <Fault enabled={broken}/>
   </MapWorkspaceErrorBoundary>
  </section>:request?<section data-testid="qa-full-map">
    <MapWorkspacePanel lat={request.lat} lon={request.lon} timezone="Europe/Berlin"
     locationName="Niederkassel" unit="kmh" analysis={null} thunder={null}
     isDay actualLocation={false} focusMode favorites={[]}
     observationRequest={request}/>
   </section>:<CurrentSurroundings lat={50.82} lon={7.14} name="Niederkassel"
    timezone="Europe/Berlin" temperature={9} temperatureTime="2026-11-17T11:00"
    onOpen={(time,bounds)=>{
     const next={lat:50.82,lon:7.14,time,bounds,id:Date.now()};
     window.__midMapOpenRequest=next;setRequest(next);
    }}/>
  }
 </main>;
}
createRoot(document.getElementById('root')!).render(<QaApp/>);
