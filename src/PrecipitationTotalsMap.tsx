import {useMemo,useState} from 'react';
import {CloudRain,Download,MapPinned} from 'lucide-react';
import {GeoJsonLayers,MapCenter,MidMapLibre,RasterTileLayer} from './MapLibreCore';
import {WEATHER_MAP_BASEMAPS,type WeatherMapBasemapId} from './weatherMapBasemaps';
import './weatherMapsTotals.css';

export type WeatherMapFavoriteLocation={id:string;name:string;latitude:number;longitude:number};

function escapeHtml(value:string){return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]||char))}
function isGermanyLocation(place:WeatherMapFavoriteLocation){return place.latitude>=47&&place.latitude<=55.2&&place.longitude>=5.5&&place.longitude<=15.6}

export default function PrecipitationTotalsMap({favorites}:{favorites:WeatherMapFavoriteLocation[]}){
 const sortedFavorites=useMemo(()=>favorites.filter(place=>place.id&&place.name.trim()&&Number.isFinite(place.latitude)&&Number.isFinite(place.longitude)&&Math.abs(place.latitude)<=90&&Math.abs(place.longitude)<=180).sort((a,b)=>a.name.localeCompare(b.name,'de-DE',{sensitivity:'base'})),[favorites]);
 const[selectedFavoriteId,setSelectedFavoriteId]=useState(''),[basemapId,setBasemapId]=useState<WeatherMapBasemapId>('light'),selectedFavorite=sortedFavorites.find(place=>place.id===selectedFavoriteId&&isGermanyLocation(place)),activeBasemap=WEATHER_MAP_BASEMAPS[basemapId];
 const center:[number,number]=selectedFavorite?[selectedFavorite.latitude,selectedFavorite.longitude]:[51.05,10.45],zoom=selectedFavorite?6.8:5.25;
 const locationFeature=selectedFavorite?{type:'Feature' as const,properties:{label:`<strong>${escapeHtml(selectedFavorite.name)}</strong><br/>MID-Favorit`},geometry:{type:'Point' as const,coordinates:[selectedFavorite.longitude,selectedFavorite.latitude]}}:null;

 return <section className="weather-precipitation-totals" aria-label="Niederschlagssummenkarte">
  <header className="weather-precipitation-heading">
   <div><small>DEUTSCHLAND · DWD ICON-D2</small><h3>Niederschlagssummen</h3><p>Gesamtniederschlag einschließlich Wasseräquivalent fester Niederschläge</p></div>
   <label><span>Kartenbasis</span><select aria-label="Kartenbasis für Niederschlagssummen" value={basemapId} onChange={event=>setBasemapId(event.target.value as WeatherMapBasemapId)}>{Object.entries(WEATHER_MAP_BASEMAPS).map(([id,item])=><option value={id} key={id}>{item.label}</option>)}</select></label>
  </header>
  <div className="weather-precipitation-layout">
   <section className="weather-precipitation-map-column" aria-label="Deutschlandkarte für Niederschlagssummen">
    <div className="weather-precipitation-map-shell">
     <MidMapLibre center={center} zoom={zoom} minZoom={4} maxZoom={9} className="weather-precipitation-map" scrollZoom={false}>
      <MapCenter latitude={center[0]} longitude={center[1]} zoom={zoom}/>
      <RasterTileLayer id={`weather-precipitation-basemap-${basemapId}`} url={activeBasemap.url} tone={activeBasemap.tone} attribution={activeBasemap.attribution}/>
      {locationFeature?<GeoJsonLayers id="weather-precipitation-favorite" data={{type:'FeatureCollection',features:[locationFeature]}} layers={[{id:'halo',type:'circle',paint:{'circle-radius':7,'circle-color':'#1675d1','circle-opacity':.82,'circle-stroke-color':'#ffffff','circle-stroke-width':2}},{id:'hit-target',type:'circle',paint:{'circle-radius':22,'circle-color':'#1675d1','circle-opacity':.001}}]} hoverProperty="label"/>:null}
     </MidMapLibre>
     <div className="weather-precipitation-data-state" role="status" data-product-status="unavailable">
      <span className="weather-precipitation-data-icon"><CloudRain size={20}/></span>
      <span><strong>Keine verifizierte Summenkarte verfügbar</strong><small>Ein vollständiges, laufgeprüftes ICON-D2-Niederschlagsraster ist derzeit nicht angebunden. Deshalb erscheinen keine Summen, Flächenwerte oder geschätzten Maxima.</small></span>
     </div>
     <div className="weather-precipitation-legend-placeholder">Farblegende · mm · erst mit vollständig geprüften Rasterwerten</div>
    </div>
    <p className="weather-precipitation-attribution">Kartengrundlage: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap-Mitwirkende</a>, ODbL 1.0. ICON-D2-Summenwerte und Modelllauf sind noch nicht als vollständiges Kartenprodukt verfügbar.</p>
   </section>
   <aside className="weather-precipitation-summary">
    <section className="weather-precipitation-period" aria-labelledby="weather-precipitation-period-title">
     <div className="weather-precipitation-section-heading"><div><small>ZEITFENSTER</small><h4 id="weather-precipitation-period-title">Kein Zeitraum verfügbar</h4></div></div>
     <div className="weather-precipitation-window-options" aria-label="Niederschlagsfenster">
      {[6,12,24,48].map(hours=><button key={hours} type="button" disabled title="Erst wählbar, wenn der vollständige Zeitraum desselben Modelllaufs verifiziert vorliegt.">{hours} h</button>)}
     </div>
     <p>Ein Zeitraum wird erst freigegeben, wenn alle nötigen Modellschritte desselben Laufs räumlich vollständig vorliegen. Der 14-Stunden-RUC-Punktpfad wird nicht auf 24 oder 48 Stunden verlängert.</p>
    </section>
    <dl className="weather-precipitation-meta">
     <div><dt>Modelllauf</dt><dd>nicht verfügbar</dd></div>
     <div><dt>Gültigkeitszeitraum</dt><dd>nicht verfügbar</dd></div>
     <div><dt>Maximum</dt><dd>– mm</dd></div>
     <div><dt>Quelle</dt><dd>kein verifiziertes Raster</dd></div>
    </dl>
    <div className="weather-precipitation-exports" aria-label="Kartenexport">
     <button type="button" disabled title="PNG-Export wird erst mit vollständig verifizierten Rasterwerten freigegeben."><Download size={15}/>PNG herunterladen</button>
     <button type="button" disabled title="SVG-Export wird erst mit vollständig verifizierten Rasterwerten freigegeben."><Download size={15}/>SVG herunterladen</button>
    </div>
   </aside>
   <section className="weather-precipitation-favorites" aria-labelledby="weather-precipitation-favorites-title">
    <header><div><small>GESPEICHERTE ORTE</small><h4 id="weather-precipitation-favorites-title">Favoriten</h4></div><span>Werte nur bei geprüfter Rasterabdeckung</span></header>
    <div className="weather-precipitation-table-wrap"><table>
     <thead><tr><th scope="col">Ort</th><th scope="col">Summe</th><th scope="col">Datenstatus</th></tr></thead>
     <tbody>{sortedFavorites.length?sortedFavorites.map(place=><tr key={place.id}>
      <th scope="row">{isGermanyLocation(place)?<button type="button" className={place.id===selectedFavoriteId?'selected':''} onClick={()=>setSelectedFavoriteId(current=>current===place.id?'':place.id)}><MapPinned size={14}/>{place.name}</button>:<span className="weather-precipitation-place-outside">{place.name}</span>}</th>
      <td aria-label="Niederschlagssumme nicht verfügbar">–</td>
      <td>{isGermanyLocation(place)?'kein verifiziertes Raster':'außerhalb des Deutschlandausschnitts'}</td>
     </tr>):<tr><td colSpan={3} className="weather-precipitation-no-favorites">Noch keine Favoriten gespeichert.</td></tr>}</tbody>
    </table></div>
   </section>
  </div>
  <p className="weather-precipitation-disclaimer">Modellprognose, keine amtliche Warnung. Es werden ausschließlich vollständig geprüfte Daten angezeigt.</p>
 </section>
}