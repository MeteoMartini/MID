import {lazy,Suspense,useState} from 'react';
import {ChevronDown,ChevronUp} from 'lucide-react';
import {readDurableStorageValue,writeDurableStorageValue} from './storageSafety';
import type {Location,Day,Hour,EnsembleDay,ModelRunMeta,WindUnit} from './weather';
const LazyRadar=lazy(()=>import('./PrognoseRadar').then(module=>({default:module.PrognoseRadar})));
const KEY='mid:prognose-radar:open:v1';
type Props={location:Location;locationName:string;data:EnsembleDay[];days:Day[];hours:Hour[];runs:ModelRunMeta[];timezone:string;unit:WindUnit};
export default function ForecastChangePanel(props:Props){
 const[open,setOpen]=useState(()=>readDurableStorageValue(KEY)==='1');
 const toggle=()=>setOpen(value=>{const next=!value;writeDurableStorageValue(KEY,next?'1':'0');return next});
 return <section className={`card module-shell ${open?'open':'collapsed'}`} aria-label="Prognoseänderungen"><button type="button" className="module-shell-toggle" aria-expanded={open} onClick={toggle}><span><strong>Prognose-Radar</strong><small>Prognoseänderungen · bisher und jetzt für {props.locationName}</small></span>{open?<ChevronUp size={20}/>:<ChevronDown size={20}/>}</button>{open&&<div className="module-shell-content"><Suspense fallback={<p role="status">Prognoseänderungen werden geladen …</p>}><LazyRadar {...props}/></Suspense></div>}</section>;
}
