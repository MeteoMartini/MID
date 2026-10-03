import {useEffect,useMemo,useState} from 'react';
import {CloudRain,Download,MapPinned} from 'lucide-react';
import {HtmlMarker,ImageQuadLayer,MapCenter,MapFitBounds,MidMapLibre,RasterTileLayer} from './MapLibreCore';
import {WEATHER_MAP_BASEMAPS,type WeatherMapBasemapId} from './weatherMapBasemaps';
import './weatherMapsTotals.css';
import {loadTotals,totalsStartAt,totalsAt,totalsMapScale,totalsRaster,type TotalsData} from './precipitationTotals';
import {compactPrecipitationAmount} from './forecastAmountFormat';
import {mapColorAt,type MapColorMode} from './modelMapColorScale';
import ModelMapScaleLegend from './ModelMapScaleLegend';
import ModelMapContextOverlay from './ModelMapContextOverlay';
import {exportTotals} from './precipitationTotalsExport';
function stamp(value:string){return new Intl.DateTimeFormat('de-DE',{timeZone:'UTC',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value))+' UTC'}

export type WeatherMapFavoriteLocation={id:string;name:string;latitude:number;longitude:number};

function escapeHtml(value:string){return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]||char))}
function isGermanyLocation(place:WeatherMapFavoriteLocation){return place.latitude>=47&&place.latitude<=55.2&&place.longitude>=5.5&&place.longitude<=15.6}

export default function PrecipitationTotalsMap({favorites,embedded=false,basemap:controlledBasemap,kind='forecast'}:{favorites:WeatherMapFavoriteLocation[];embedded?:boolean;basemap?:WeatherMapBasemapId;kind?:'forecast'|'observed'}){
 const sortedFavorites=useMemo(()=>favorites.filter(place=>place.id&&place.name.trim()&&Number.isFinite(place.latitude)&&Number.isFinite(place.longitude)&&Math.abs(place.latitude)<=90&&Math.abs(place.longitude)<=180).sort((a,b)=>a.name.localeCompare(b.name,'de-DE',{sensitivity:'base'})),[favorites]);
 const[selectedFavoriteId,setSelectedFavoriteId]=useState(''),[basemapId,setBasemapId]=useState<WeatherMapBasemapId>('light'),selectedFavorite=sortedFavorites.find(place=>place.id===selectedFavoriteId&&isGermanyLocation(place)),activeBasemapId=controlledBasemap??basemapId,activeBasemap=WEATHER_MAP_BASEMAPS[activeBasemapId];
 const[data,setData]=useState<TotalsData|null>(null),[hours,setHours]=useState(24),[error,setError]=useState(''),[exporting,setExporting]=useState(false),[revision,setRevision]=useState(0);
 useEffect(()=>{const controller=new AbortController();setData(null);setError('');void loadTotals(controller.signal,kind).then(result=>{setData(result);setHours(current=>result.frames.some(frame=>frame.hours===current)?current:result.frames[0].hours)}).catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'Kartendaten nicht verfügbar.')});return()=>controller.abort()},[revision,kind]);
 const[colorMode,setColorMode]=useState<MapColorMode>('field');
 const frame=data?.frames.find(item=>item.hours===hours),rangeScale=useMemo(()=>data&&frame?totalsMapScale(data,frame,'field'):null,[data,frame]),fixedScale=useMemo(()=>data&&frame?totalsMapScale(data,frame,'absolute'):null,[data,frame]),colorScale=colorMode==='field'?rangeScale:fixedScale,raster=useMemo(()=>data&&frame&&colorScale?totalsRaster(data,frame,colorScale):'',[data,frame,colorScale]);
 const download=async(kind:'png'|'svg')=>{if(!data||!frame||!raster||exporting)return;setExporting(true);try{await exportTotals(data,frame,raster,sortedFavorites,kind,colorScale??undefined)}catch(reason){if(!(reason instanceof DOMException&&reason.name==='AbortError'))setError(reason instanceof Error?reason.message:'Export fehlgeschlagen.')}finally{setExporting(false)}};
 const center:[number,number]=selectedFavorite?[selectedFavorite.latitude,selectedFavorite.longitude]:[51.05,10.45],zoom=selectedFavorite?6.8:5.25;


 return <section className="weather-precipitation-totals" aria-label="Niederschlagssummenkarte">
  {!embedded&&<header className="weather-precipitation-heading">
   <div><small>DEUTSCHLAND · {kind==='observed'?'DWD RADOLAN':'DWD ICON-D2'}</small><h3>{kind==='observed'?'Gefallener Niederschlag':'Niederschlagssummen'}</h3><p>Gesamtniederschlag einschließlich Wasseräquivalent fester Niederschläge</p></div>
   <label><span>Kartenbasis</span><select aria-label="Kartenbasis für Niederschlagssummen" value={basemapId} onChange={event=>setBasemapId(event.target.value as WeatherMapBasemapId)}>{Object.entries(WEATHER_MAP_BASEMAPS).map(([id,item])=><option value={id} key={id}>{item.label}</option>)}</select></label>
  </header>}
  <div className="weather-precipitation-layout">
   <section className="weather-precipitation-map-column" aria-label="Deutschlandkarte für Niederschlagssummen">
    <div className="weather-precipitation-map-shell">
     <MidMapLibre center={center} zoom={zoom} minZoom={4} maxZoom={9} className="weather-precipitation-map" scrollZoom={false}>
      {selectedFavorite?<MapCenter latitude={center[0]} longitude={center[1]} zoom={zoom}/>:<MapFitBounds south={47} west={5.5} north={55.2} east={15.6} padding={20} maxZoom={6}/>}
      <RasterTileLayer id={`weather-precipitation-basemap-${activeBasemapId}`} url={activeBasemap.url} tone={activeBasemap.tone} attribution={activeBasemap.attribution}/>
      {data&&frame&&raster?<ImageQuadLayer id={`precipitation-totals-${data.run}-${hours}`} url={raster} bounds={[[data.lats[0],data.lons[0]],[data.lats.at(-1)!,data.lons.at(-1)!]]} opacity={.85}/>:null}
      <ModelMapContextOverlay/>
      {sortedFavorites.filter(isGermanyLocation).map(place=><HtmlMarker key={place.id} latitude={place.latitude} longitude={place.longitude} zIndex={2} anchor="center" className="precipitation-favorite-marker" html={`<span class="${place.id===selectedFavoriteId?'selected':''}"></span>`} popupHtml={`<strong>${escapeHtml(place.name)}</strong>${data&&frame?`<br/>${compactPrecipitationAmount(totalsAt(data,frame,place.latitude,place.longitude)??NaN)} mm`:''}`} onClick={()=>setSelectedFavoriteId(place.id)}/>)}
     </MidMapLibre>
     {!frame?<div className="weather-precipitation-data-state" role="status" data-product-status="unavailable">
      <span className="weather-precipitation-data-icon"><CloudRain size={20}/></span>
      <span><strong>Keine verifizierte Summenkarte verfügbar</strong><small>{error||'DWD-Summenraster wird geladen …'}</small></span>
     </div>:null}
    </div>
    {colorScale&&rangeScale&&fixedScale?<ModelMapScaleLegend label="Niederschlagssumme" unit="mm" scale={colorScale} range={rangeScale} format={value=>compactPrecipitationAmount(value)} onModeChange={setColorMode}/>:<div className="weather-precipitation-legend-placeholder">Farblegende · mm · erst mit vollständig geprüften Rasterwerten</div>}
    <p className="weather-precipitation-attribution">Kartengrundlage: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap-Mitwirkende</a>, ODbL 1.0. Summen: DWD Open Data · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>, bearbeitet durch MID. {data?.grid||'DWD-Lat/Lon-Raster'}, Ortswerte vom nächsten dargestellten Rasterpunkt. Grenzen und Ortsnamen: Natural Earth (Public Domain), zoomabhängig über dem Modellfeld.</p>
   </section>
   <aside className="weather-precipitation-summary">
    <section className="weather-precipitation-period" aria-labelledby="weather-precipitation-period-title">
     <div className="weather-precipitation-section-heading"><div><small>ZEITFENSTER</small><h4 id="weather-precipitation-period-title">{frame?kind==='observed'?`Letzte ${frame.hours} Stunden`:`${frame.hours} Stunden ab Laufstart`:'Kein Zeitraum verfügbar'}</h4></div></div>
     <div className="weather-precipitation-window-options" aria-label="Niederschlagsfenster">
      {(kind==='observed'?[1,6,12,24,48]:[6,12,24,48]).map(hours=><button key={hours} type="button" disabled={!data?.frames.some(frame=>frame.hours===hours)} aria-pressed={frame?.hours===hours} onClick={()=>setHours(hours)} title={kind==='observed'?'Gefallener Niederschlag aus nicht überlappenden vollständigen Messstunden.':'Akkumuliert ab Laufstart desselben verifizierten Modelllaufs.'}>{hours} h</button>)}
     </div>
     <p>{kind==='observed'?'Stationsangeeichte Radaranalyse. Grau markiert fehlende Messdaten, nicht trockene Gebiete.':'Summe ab Modelllaufstart. Ein neuer Lauf kann die Prognose verändern.'}</p>
    </section>
    <dl className="weather-precipitation-meta">
     <div><dt>{kind==='observed'?'Messstand':'Modelllauf'}</dt><dd>{data?stamp(data.run):'nicht verfügbar'}</dd></div>
     <div><dt>Gültigkeitszeitraum</dt><dd>{data&&frame?`${stamp(totalsStartAt(data,frame))} – ${stamp(frame.validTo)}`:'nicht verfügbar'}</dd></div>
     <div><dt>Maximum</dt><dd>{frame?`${compactPrecipitationAmount(frame.maximum)} mm · Kartenausschnitt`:'– mm'}</dd></div>
     <div><dt>Quelle</dt><dd>{data?data.source:'kein verifiziertes Raster'}</dd></div>
    </dl>
    <div className="weather-precipitation-exports" aria-label="Kartenexport">
     <button type="button" disabled={!frame||exporting} onClick={()=>void download('png')}><Download size={15}/>PNG herunterladen</button>
     <button type="button" disabled={!frame||exporting} onClick={()=>void download('svg')}><Download size={15}/>SVG herunterladen</button>
    </div>
   </aside>
   <section className="weather-precipitation-favorites" aria-labelledby="weather-precipitation-favorites-title">
    <header><div><small>GESPEICHERTE ORTE</small><h4 id="weather-precipitation-favorites-title">Favoriten</h4></div><span>Werte nur bei geprüfter Rasterabdeckung</span></header>
    <div className="weather-precipitation-table-wrap"><table>
     <thead><tr><th scope="col">Ort</th><th scope="col">Summe</th><th scope="col">Datenstatus</th></tr></thead>
     <tbody>{sortedFavorites.length?sortedFavorites.map(place=><tr key={place.id}>
      <th scope="row">{isGermanyLocation(place)?<button type="button" className={place.id===selectedFavoriteId?'selected':''} onClick={()=>setSelectedFavoriteId(current=>current===place.id?'':place.id)}><MapPinned size={14}/>{place.name}</button>:<span className="weather-precipitation-place-outside">{place.name}</span>}</th>
      <td style={{borderLeft:`4px solid ${data&&frame&&colorScale?mapColorAt(colorScale,totalsAt(data,frame,place.latitude,place.longitude)??NaN):'transparent'}`}}>{data&&frame&&totalsAt(data,frame,place.latitude,place.longitude)!==null?`${compactPrecipitationAmount(totalsAt(data,frame,place.latitude,place.longitude)!)} mm`:'–'}</td>
      <td>{data&&frame&&totalsAt(data,frame,place.latitude,place.longitude)!==null?'DWD-Rasterpunkt':isGermanyLocation(place)?'kein verifiziertes Raster':'außerhalb des Kartenausschnitts'}</td>
     </tr>):<tr><td colSpan={3} className="weather-precipitation-no-favorites">Noch keine Favoriten gespeichert.</td></tr>}</tbody>
    </table></div>
   </section>
  </div>
  {error&&frame?<p role="alert">{error}</p>:null}<button type="button" className="weather-maps-reload" onClick={()=>setRevision(value=>value+1)}>Daten aktualisieren</button>
  <p className="weather-precipitation-disclaimer">{kind==='observed'?'Radargestützte Messanalyse, keine Modellprognose. Fehlende Werte bleiben unbekannt.':'Modellprognose, keine amtliche Warnung. Es werden ausschließlich vollständig geprüfte Daten angezeigt.'}</p>
 </section>
}
