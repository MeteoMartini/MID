import {useMemo,useState} from 'react';
import {CloudRain,Download,MapPinned} from 'lucide-react';
import {GeoJsonLayers,MidMapLibre,RasterTileLayer,type RasterTone} from './MapLibreCore';

export type WeatherMapFavoriteLocation={id:string;name:string;latitude:number;longitude:number};
export type PrecipitationTotalsBasemap={label:string;url:string;attribution:string;tone?:RasterTone};

function escapeHtml(value:string){return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]||char))}
function isGermanyLocation(place:WeatherMapFavoriteLocation){return place.latitude>=47&&place.latitude<=55.2&&place.longitude>=5.5&&place.longitude<=15.6}

export default function PrecipitationTotalsMap({favorites,basemapOptions,basemapId,onBasemapChange}:{favorites:WeatherMapFavoriteLocation[];basemapOptions:Record<string,PrecipitationTotalsBasemap>;basemapId:string;onBasemapChange:(value:string)=>void}){
 const sortedFavorites=useMemo(()=>favorites.filter(place=>place.id&&place.name.trim()&&Number.isFinite(place.latitude)&&Number.isFinite(place.longitude)&&Math.abs(place.latitude)<=90&&Math.abs(place.longitude)<=180).sort((a,b)=>a.name.localeCompare(b.name,'de-DE',{sensitivity:'base'})),[favorites]);
 const[selectedFavoriteId,setSelectedFavoriteId]=useState(''),selectedFavorite=sortedFavorites.find(place=>place.id===selectedFavoriteId&&isGermanyLocation(place)),activeBasemap=basemapOptions[basemapId]??Object.values(basemapOptions)[0];
 const center:[number,number]=selectedFavorite?[selectedFavorite.latitude,selectedFavorite.longitude]:[51.05,10.45],zoom=selectedFavorite?6.8:5.25;
 const locationFeature=selectedFavorite?{type:'Feature' as const,properties:{label:`<strong>${escapeHtml(selectedFavorite.name)}</strong><br/>MID-Favorit`},geometry:{type:'Point' as const,coordinates:[selectedFavorite.longitude,selectedFavorite.latitude]}}:null;

 return <div className="weather-precipitation-totals">
  <header className="weather-precipitation-heading">
   <div><small>DEUTSCHLAND · DWD ICON-D2</small><h3>Niederschlagssummen</h3><p>Gesamtniederschlag einschließlich Wasseräquivalent fester Niederschläge</p></div>
   <label><span>Kartenbasis</span><select aria-label="Kartenbasis für Niederschlagssummen" value={basemapId} onChange={event=>onBasemapChange(event.target.value)}>{Object.entries(basemapOptions).map(([id,item])=><option value={id} key={id}>{item.label}</option>)}</select></label>
  </header>
  <div className="weather-precipitation-layout">
   <section className="weather-precipitation-map-column" aria-label="Deutschlandkarte für Niederschlagssummen">
    <div className="weather-precipitation-map-shell">
     <MidMapLibre center={center} zoom={zoom} minZoom={4} maxZoom={9} className="weather-precipitation-map" scrollZoom={false}>
      <RasterTileLayer id={`weather-precipitation-basemap-${basemapId}`} url={activeBasemap.url} tone={activeBasemap.tone} attribution={activeBasemap.attribution}/>
      {locationFeature?<GeoJsonLayers id="weather-precipitation-favorite" data={{type:'FeatureCollection',features:[locationFeature]}} layers={[{id:'halo',type:'circle',paint:{'circle-radius':7,'circle-color':'#1675d1','circle-opacity':.82,'circle-stroke-color':'#ffffff','circle-stroke-width':2}},{id:'hit-target',type:'circle',paint:{'circle-radius':22,'circle-color':'#1675d1','circle-opacity':.001}}]} hoverProperty="label"/>:null}
     </MidMapLibre>
     <div className="weather-precipitation-data-state" role="status">
      <span className="weather-precipitation-data-icon"><CloudRain size={20}/></span>
      <span><strong>Keine verifizierte Summenkarte verfügbar</strong><small>Es fehlt ein vollständiges, laufgeprüftes ICON-D2-Niederschlagsraster. Deshalb werden keine Summen oder Flächenwerte angezeigt.</small></span>
     </div>
     <div className="weather-precipitation-legend-placeholder">Farblegende · mm · nach vollständiger Datenprüfung</div>
    </div>
    <p className="weather-precipitation-attribution">Kartengrundlage: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap-Mitwirkende</a>, ODbL 1.0. DWD ICON-D2 Open Data ist als Summenquelle noch nicht angebunden.</p>
   </section>
   <aside className="weather-precipitation-summary">
    <section className="weather-precipitation-period" aria-labelledby="weather-precipitation-period-title">
     <div className="weather-precipitation-section-heading"><div><small>ZEITFENSTER</small><h4 id="weather-precipitation-period-title">Kein Zeitraum verfügbar</h4></div></div>
     <p>6, 12, 24 und 48 Stunden werden erst angeboten, wenn alle benötigten Stunden desselben Modelllaufs vollständig vorliegen.</p>
    </section>
    <dl className="weather-precipitation-meta">
     <div><dt>Modelllauf</dt><dd>nicht verfügbar</dd></div>
     <div><dt>Gültigkeitszeitraum</dt><dd>noch nicht berechenbar</dd></div>
     <div><dt>Maximum</dt><dd>– mm</dd></div>
     <div><dt>Bezugsraum</dt><dd>keine vollständige Flächenberechnung</dd></div>
    </dl>
    <div className="weather-precipitation-exports" aria-label="Kartenexport">
     <button type="button" disabled title="PNG-Export ist erst mit einem verifizierten Datensatz verfügbar."><Download size={15}/>PNG herunterladen</button>
     <button type="button" disabled title="SVG-Export ist erst mit einem verifizierten Datensatz verfügbar."><Download size={15}/>SVG herunterladen</button>
    </div>
   </aside>
   <section className="weather-precipitation-favorites" aria-labelledby="weather-precipitation-favorites-title">
    <header><div><small>GESPEICHERTE ORTE</small><h4 id="weather-precipitation-favorites-title">Favoriten</h4></div><span>Werte erscheinen nur bei geprüfter Rasterabdeckung</span></header>
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
  <p className="weather-precipitation-disclaimer">Modellprognose, keine amtliche Warnung.</p>
 </div>
}