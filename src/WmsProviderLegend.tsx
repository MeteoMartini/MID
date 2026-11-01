import {useState} from 'react';
import './WmsProviderLegend.css';

/** A real WMS legend image, never an inferred numeric scale. */
export default function WmsProviderLegend({url,label,provider}:{url:string;label:string;provider:string}){
 const[failed,setFailed]=useState(false);
 if(!url)return null;
 return <details className="unified-wms-provider-legend">
  <summary>Farblegende · {provider} (Original)</summary>
  <div className="unified-wms-provider-legend__content">
   {failed?<p role="status">Originallegende derzeit nicht verfügbar. MID schätzt keine Ersatzfarben oder Grenzwerte.</p>:<img loading="lazy" decoding="async" src={url} alt={`Originalfarblegende des Kartenanbieters für ${label}. Farbgrenzen und Klassen stammen ausschließlich aus dem gewählten WMS-Stil.`} onError={()=>setFailed(true)}/>}
   <small>Die Darstellung stammt unverändert vom Kartenanbieter und gilt nur für das ausgewählte Kartenprodukt und seinen Stil. Keine amtliche Wetterwarnskala.</small>
  </div>
 </details>;
}
