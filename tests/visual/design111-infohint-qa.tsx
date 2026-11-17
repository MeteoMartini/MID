/** Real shared MID AppInfoHint + AppPortalPopover with deterministic QA-only labels. */
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AppInfoHint} from '../../src/AppInfoPopover';
declare global {interface Window {__midInfoHintQaRerender?:()=>void}}
function Fixture(){
 const [revision,setRevision]=useState(0);
 window.__midInfoHintQaRerender=()=>setRevision(value=>value+1);
 return <div className="qa-shell" data-render-revision={revision}>
  <h1>MID Info-Popover QA – keine Wetterdaten</h1>
  <div className="qa-controls">
   <AppInfoHint label="Info-Test eins" touchTargetSize={44} showClose><p>Erster Dialog: Testinhalt ohne Modell- oder Warnungsaussage.</p></AppInfoHint>
   <AppInfoHint label="Info-Test zwei" touchTargetSize={44} showClose><p>Zweiter Dialog: Eindeutige ID und Tastaturpfad.</p></AppInfoHint>
  </div>
  <div data-qa-backdrop>Außenbereich zum kontrollierten Schließen per Pointer.</div>
 </div>
}
document.documentElement.dataset.theme=new URLSearchParams(location.search).get('theme')==='dark'?'dark':'light';
createRoot(document.getElementById('root')!).render(<Fixture/>);
