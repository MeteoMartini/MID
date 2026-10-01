import {useCallback,useEffect,useMemo,useState} from 'react';
import {CloudRain,Download,MapPinned} from 'lucide-react';
import {CanvasOverlay,HtmlMarker,ImageQuadLayer,MapCenter,MapFitBounds,type MidMap,MidMapLibre,RasterTileLayer} from './MapLibreCore';
import {WEATHER_MAP_BASEMAPS,type WeatherMapBasemapId} from './weatherMapBasemaps';
import './weatherMapsTotals.css';
import {loadTotals,TOTALS_COLORS,totalsAt,totalsColor,totalsRaster,type TotalsData} from './precipitationTotals';
import germany from './precipitationGermany.json';
import {exportTotals} from './precipitationTotalsExport';
function stamp(value:string){return new Intl.DateTimeFormat('de-DE',{timeZone:'UTC',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value))+' UTC'}

export type WeatherMapFavoriteLocation={id:string;name:string;latitude:number;longitude:number};

function escapeHtml(value:string){return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]||char))}
function isGermanyLocation(place:WeatherMapFavoriteLocation){return place.latitude>=47&&place.latitude<=55.2&&place.longitude>=5.5&&place.longitude<=15.6}

export default function PrecipitationTotalsMap({favorites}:{favorites:WeatherMapFavoriteLocation[]}){
 const sortedFavorites=useMemo(()=>favorites.filter(place=>place.id&&place.name.trim()&&Number.isFinite(place.latitude)&&Number.isFinite(place.longitude)&&Math.abs(place.latitude)<=90&&Math.abs(place.longitude)<=180).sort((a,b)=>a.name.localeCompare(b.name,'de-DE',{sensitivity:'base'})),[favorites]);
 const[selectedFavoriteId,setSelectedFavoriteId]=useState(''),[basemapId,setBasemapId]=useState<WeatherMapBasemapId>('light'),selectedFavorite=sortedFavorites.find(place=>place.id===selectedFavoriteId&&isGermanyLocation(place)),activeBasemap=WEATHER_MAP_BASEMAPS[basemapId];
 const[data,setData]=useState<TotalsData|null>(null),[hours,setHours]=useState(24),[error,setError]=useState(''),[exporting,setExporting]=useState(false),[revision,setRevision]=useState(0);
 useEffect(()=>{const controller=new AbortController();setData(null);setError('');void loadTotals(controller.signal).then(setData).catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'Kartendaten nicht verfügbar.')});return()=>controller.abort()},[revision]);
 const frame=data?.frames.find(item=>item.hours===hours),raster=useMemo(()=>data&&frame?totalsRaster(data,frame):'',[data,frame]);
 const download=async(kind:'png'|'svg')=>{if(!data||!frame||!raster||exporting)return;setExporting(true);try{await exportTotals(data,frame,raster,sortedFavorites,kind)}catch(reason){if(!(reason instanceof DOMException&&reason.name==='AbortError'))setError(reason instanceof Error?reason.message:'Export fehlgeschlagen.')}finally{setExporting(false)}};
 const center:[number,number]=selectedFavorite?[selectedFavorite.latitude,selectedFavorite.longitude]:[51.05,10.45],zoom=selectedFavorite?6.8:5.25;
 const renderOutline=useCallback((map:MidMap,canvas:HTMLCanvasElement)=>{const base=map.getCanvas();canvas.width=base.width;canvas.height=base.height;const context=canvas.getContext('2d');if(!context)return;const ratio=base.width/base.clientWidth;context.scale(ratio,ratio);const polygons=germany.geometry.coordinates as number[][][][];for(const polygon of polygons)for(const ring of polygon){context.beginPath();ring.forEach(([lon,lat],i)=>{const point=map.project([lon,lat]);if(i)context.lineTo(point.x,point.y);else context.moveTo(point.x,point.y)});context.closePath();context.strokeStyle='#fff';context.lineWidth=3;context.stroke();context.strokeStyle='#263f59';context.lineWidth=1.1;context.stroke()}},[]);

 return <section className="weather-precipitation-totals" aria-label="Niederschlagssummenkarte">
  <header className="weather-precipitation-heading">
   <div><small>DEUTSCHLAND · DWD ICON-D2</small><h3>Niederschlagssummen</h3><p>Gesamtniederschlag einschließlich Wasseräquivalent fester Niederschläge</p></div>
   <label><span>Kartenbasis</span><select aria-label="Kartenbasis für Niederschlagssummen" value={basemapId} onChange={event=>setBasemapId(event.target.value as WeatherMapBasemapId)}>{Object.entries(WEATHER_MAP_BASEMAPS).map(([id,item])=><option value={id} key={id}>{item.label}</option>)}</select></label>
  </header>
  <div className="weather-precipitation-layout">
   <section className="weather-precipitation-map-column" aria-label="Deutschlandkarte für Niederschlagssummen">
    <div className="weather-precipitation-map-shell">
     <MidMapLibre center={center} zoom={zoom} minZoom={4} maxZoom={9} className="weather-precipitation-map" scrollZoom={false}>
      {selectedFavorite?<MapCenter latitude={center[0]} longitude={center[1]} zoom={zoom}/>:<MapFitBounds south={47} west={5.5} north={55.2} east={15.6} padding={20} maxZoom={6}/>}
      <RasterTileLayer id={`weather-precipitation-basemap-${basemapId}`} url={activeBasemap.url} tone={activeBasemap.tone} attribution={activeBasemap.attribution}/>
      {data&&frame&&raster?<ImageQuadLayer id={`precipitation-totals-${data.run}-${hours}`} url={raster} bounds={[[data.lats[0],data.lons[0]],[data.lats.at(-1)!,data.lons.at(-1)!]]} opacity={.85}/>:null}
      <CanvasOverlay id="precipitation-country-outline" zIndex={1} render={renderOutline}/>
      {sortedFavorites.filter(isGermanyLocation).map(place=><HtmlMarker key={place.id} latitude={place.latitude} longitude={place.longitude} zIndex={2} anchor="center" className="precipitation-favorite-marker" html={`<span class="${place.id===selectedFavoriteId?'selected':''}"></span>`} popupHtml={`<strong>${escapeHtml(place.name)}</strong>${data&&frame?`<br/>${totalsAt(data,frame,place.latitude,place.longitude)?.toFixed(1)??'–'} mm`:''}`} onClick={()=>setSelectedFavoriteId(place.id)}/>)}
     </MidMapLibre>
     {!frame?<div className="weather-precipitation-data-state" role="status" data-product-status="unavailable">
      <span className="weather-precipitation-data-icon"><CloudRain size={20}/></span>
      <span><strong>Keine verifizierte Summenkarte verfügbar</strong><small>{error||'DWD-Summenraster wird geladen …'}</small></span>
     </div>:null}
     <div className="weather-precipitation-legend-placeholder">{frame?TOTALS_COLORS.map(([value,color],i)=><span key={value}><i style={{background:color}}/>{value}{i===TOTALS_COLORS.length-1?'+':''}</span>):'Farblegende · mm · erst mit vollständig geprüften Rasterwerten'}</div>
    </div>
    <p className="weather-precipitation-attribution">Kartengrundlage: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap-Mitwirkende</a>, ODbL 1.0. Summen: DWD Open Data · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>, bearbeitet durch MID. DWD-Lat/Lon-Raster, Ortswerte vom nächsten Rasterpunkt.</p>
   </section>
   <aside className="weather-precipitation-summary">
    <section className="weather-precipitation-period" aria-labelledby="weather-precipitation-period-title">
     <div className="weather-precipitation-section-heading"><div><small>ZEITFENSTER</small><h4 id="weather-precipitation-period-title">{frame?`${frame.hours} Stunden ab Laufstart`:'Kein Zeitraum verfügbar'}</h4></div></div>
     <div className="weather-precipitation-window-options" aria-label="Niederschlagsfenster">
      {[6,12,24,48].map(hours=><button key={hours} type="button" disabled={!data?.frames.some(frame=>frame.hours===hours)} aria-pressed={frame?.hours===hours} onClick={()=>setHours(hours)} title="Akkumuliert ab Laufstart desselben verifizierten Modelllaufs.">{hours} h</button>)}
     </div>
     <p>Summe vom angegebenen Modelllaufstart bis zur Gültigkeitszeit. Ein neuer DWD-Lauf kann die Prognose verändern.</p>
    </section>
    <dl className="weather-precipitation-meta">
     <div><dt>Modelllauf</dt><dd>{data?stamp(data.run):'nicht verfügbar'}</dd></div>
     <div><dt>Gültigkeitszeitraum</dt><dd>{data&&frame?`${stamp(data.run)} – ${stamp(frame.validTo)}`:'nicht verfügbar'}</dd></div>
     <div><dt>Maximum</dt><dd>{frame?`${frame.maximum.toFixed(1)} mm · Kartenausschnitt`:'– mm'}</dd></div>
     <div><dt>Quelle</dt><dd>{data?'DWD ICON-D2 · TOT_PREC':'kein verifiziertes Raster'}</dd></div>
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
      <td style={{borderLeft:`4px solid ${data&&frame?totalsColor(totalsAt(data,frame,place.latitude,place.longitude)??0):'transparent'}`}}>{data&&frame&&totalsAt(data,frame,place.latitude,place.longitude)!==null?`${totalsAt(data,frame,place.latitude,place.longitude)!.toFixed(1)} mm`:'–'}</td>
      <td>{data&&frame&&totalsAt(data,frame,place.latitude,place.longitude)!==null?'DWD-Rasterpunkt':isGermanyLocation(place)?'kein verifiziertes Raster':'außerhalb des Kartenausschnitts'}</td>
     </tr>):<tr><td colSpan={3} className="weather-precipitation-no-favorites">Noch keine Favoriten gespeichert.</td></tr>}</tbody>
    </table></div>
   </section>
  </div>
  {error&&frame?<p role="alert">{error}</p>:null}<button type="button" className="weather-maps-reload" onClick={()=>setRevision(value=>value+1)}>Daten aktualisieren</button>
  <p className="weather-precipitation-disclaimer">Modellprognose, keine amtliche Warnung. Es werden ausschließlich vollständig geprüfte Daten angezeigt.</p>
 </section>
}