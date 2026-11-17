/** Genuine parallel-mounted MID compact/full React components. Weather network blocked. */
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import CurrentSurroundings from '../../src/CurrentSurroundings';
import MapWorkspacePanel from '../../src/MapWorkspacePanel';
import {choosePrimaryMapOwner} from '../../src/primaryMapOwner';
type Section='current'|'composite'|'warnings';
function QaApp(){
 const [section,setSection]=useState<Section>('current');
 const [allowMapOpen,setAllowMapOpen]=useState(true);
 const owner=choosePrimaryMapOwner(section,true,true);
 return <main className="qa-app">
  <h1>MID GPU-Owner · beide Panels gleichzeitig im React-Baum</h1>
  <p data-testid="qa-app-alive">Andere Wetteransichten bleiben vorhanden.</p>
  <nav aria-label="QA Navigation">
   <button data-testid="qa-current" onClick={()=>setSection('current')}>Aktuell anzeigen</button>
   <button data-testid="qa-composite" onClick={()=>setSection('composite')}>Karten anzeigen</button>
   <button data-testid="qa-warnings" onClick={()=>setSection('warnings')}>Andere Ansicht anzeigen</button>
   <button data-testid="qa-stall-open" onClick={()=>setAllowMapOpen(false)}>Navigationstest ohne Bestätigung</button>
   <button data-testid="qa-restore-open" onClick={()=>setAllowMapOpen(true)}>Navigation erneut zulassen</button>
  </nav>
  <output data-testid="qa-owner">{owner}</output>
  <section data-testid="qa-compact">
   <CurrentSurroundings lat={50.82} lon={7.14} name="Niederkassel"
    timezone="Europe/Berlin" temperature={9} temperatureTime="2026-11-17T11:00"
    mapPaused={owner!=='compact'} onOpen={()=>{if(allowMapOpen)setSection('composite')}}/>
  </section>
  <section data-testid="qa-full">
   <MapWorkspacePanel lat={50.82} lon={7.14} timezone="Europe/Berlin"
    locationName="Niederkassel" unit="kmh" analysis={null} thunder={null}
    isDay actualLocation={false} focusMode favorites={[]}
    gpuPaused={owner!=='workspace'}/>
  </section>
 </main>;
}
createRoot(document.getElementById('root')!).render(<QaApp/>);