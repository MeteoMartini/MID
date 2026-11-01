import {useState} from 'react';
import './WmsProviderLegend.css';

/** Provider-original WMS legend; never infer numerical classes or official warning colors. */
export default function WmsProviderLegend({url,label,provider}:{url:string;label:string;provider:string}){
 const [failedUrl,setFailedUrl]=useState('');
 if(!url)return null;
 const failed=failedUrl===url;
 return <details className="unified-wms-provider-legend">
  <summary>Farblegende · {provider} (Original)</summary>
  <div className="unified-wms-provider-legend__content">
   {failed?<p role="status">Originallegende derzeit nicht verfügbar. MID schätzt keine Ersatzfarben oder Grenzwerte.</p>:<>
    <img loading="lazy" decoding="async" src={url} alt={`Originalfarblegende des Kartenanbieters für ${label}. Farbklassen sind im Anbieterbild dargestellt, nicht als separate Texttabelle.`} onError={()=>setFailedUrl(url)}/>
    <a className="unified-wms-provider-legend__open" href={url} target="_blank" rel="noopener noreferrer" aria-label={`Originalfarblegende von ${provider} für ${label} separat in voller Größe öffnen`}>Originallegende in voller Größe öffnen</a>
   </>}
   <small>Das unveränderte Anbieterbild gilt nur für das ausgewählte Kartenprodukt und seinen Stil. Es ist keine amtliche Wetterwarnskala. Eine numerisch barrierefreie Texttabelle wird nicht behauptet.</small>
   <small>Die reine WMS-Wetterfläche kann mit der Originallegende als PNG exportiert werden, sobald Modelllauf, Termin, Stil und Kartenausschnitt bestätigt sind. Basiskarte, Radar und Satellit sind nicht Teil dieses Bildes; ein SVG-Vektorexport oder native Rasterwerte werden nicht behauptet.</small>
  </div>
 </details>;
}
