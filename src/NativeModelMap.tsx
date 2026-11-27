import {useDisplayPreference,useRawDisplayPreference,displayBoolean,displayChoice} from './useDisplayPreference';
import {NativeScalarOverlay,NativeScalarControls,scalarMapLayers} from './NativeScalarMapOverlay';
import {nativeScalarLines,scalarLineFeatures} from './nativeScalarAnnotations';
import {nativeFrameEvidence,nativePressureFrameRef,nativePresentationPressure} from './nativeMapFrameEvidence';
import {TemporalMapFrame,type TemporalMapFrameData,type TemporalMapGroup} from './TemporalMapFrame';
import {adaptiveContourLayers} from './adaptiveModelContours';
import {nativeIsobarFeatures} from './unifiedMapPresentation';
import {pressureCenterGroup} from './modelPressureCenters';
import {useEffect,useMemo,useState} from 'react';
import {HtmlMarker,MapCenter,MapFitBounds,MidMapLibre,RasterTileLayer} from './MapLibreCore';
import ModelMapContextOverlay from './ModelMapContextOverlay';
import UnifiedVectorBasemap from './UnifiedVectorBasemap';
import {WEATHER_MAP_BASEMAPS,type WeatherMapBasemapId} from './weatherMapBasemaps';
import {loadNativeField,loadNativeIndex,nativeFieldModel,nativeAt,nativeRaster,nativeMapScale,type NativeField,type NativeFieldKind,type NativeIndex} from './nativeModelFields';
import {modelMapUnit,modelMapValue} from './modelMapUnits';
import {mapScaleTicks,type MapColorMode} from './modelMapColorScale';
import ModelMapScaleLegend from './ModelMapScaleLegend';
import ModelMapProbe from './ModelMapProbe';
import type {WindUnit} from './weather';
import {CloudWeatherLegend} from './CloudSignificantWeather';
import {nativeCloudWeatherPair,cloudWeatherAt,cloudWeatherDescription,cloudWeatherRaster,CLOUD_WEATHER_ISOBARS_KEY,parseCloudWeatherToggle} from './cloudWeatherData';
import {nativeCloudIsobars} from './cloudWeatherIsobars';
import type {WeatherMapFavoriteLocation} from './PrecipitationTotalsMap';
import './weatherMapsTotals.css';
type NativePresentation={
 key:string;field:NativeField;cloud:NativeField|null;pressure:NativeField|null;
 raster:string;range:NonNullable<ReturnType<typeof nativeMapScale>>;fixed:NonNullable<ReturnType<typeof nativeMapScale>>;scale:NonNullable<ReturnType<typeof nativeMapScale>>;
 unit:WindUnit;lines:boolean;cloudIsobars:boolean;frame:TemporalMapFrameData;nativeD2Full:boolean;intervalHours:number|null;
};
const stamp=(value:string)=>new Intl.DateTimeFormat('de-DE',{timeZone:'UTC',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value))+' UTC';
export default function NativeModelMap({kind,label,favorites,basemap,unit='kn'}:{kind:NativeFieldKind;label:string;favorites:WeatherMapFavoriteLocation[];basemap:WeatherMapBasemapId;unit?:WindUnit}){
 const [catalog,setCatalog]=useState<{index:NativeIndex;base:string}|null>(null),[candidateField,setField]=useState<NativeField|null>(null),[hour,setHour]=useState(6),[error,setError]=useState(''),[revision,setRevision]=useState(0),[playing,setPlaying]=useState(false),[exporting,setExporting]=useState(false),[selected,setSelected]=useState('');
 const [showExtremes,setShowExtremes]=useDisplayPreference('NativeModelMap.showExtremes',true,displayBoolean),[showScalarLines,setShowScalarLines]=useDisplayPreference('NativeModelMap.showScalarLines',false,displayBoolean);
 const [cloudField,setCloudField]=useState<NativeField|null>(null);
 const [presented,setPresented]=useState<NativePresentation|null>(null),[loadedKey,setLoadedKey]=useState('');
 const shown=presented?.field.kind===kind?presented:null,field=shown?.field??null;
 const combined=useMemo(()=>kind==='sigwx'&&field&&shown?.cloud?nativeCloudWeatherPair(shown.cloud,field):null,[kind,field,shown?.cloud]);
 const combinedValue=(lat:number,lon:number)=>{const p=combined?cloudWeatherAt(combined,lat,lon):null;return p?`${p.cloud===null?'Wolken unbekannt':Math.round(p.cloud)+' % Wolken'} · ${cloudWeatherDescription(p.weather)}`:null;};
 const [colorMode,setColorMode]=useDisplayPreference<MapColorMode>('NativeModelMap.colorMode','field',displayChoice('field','absolute'));
 const [cloudIsobars,setCloudIsobars]=useRawDisplayPreference(CLOUD_WEATHER_ISOBARS_KEY,false,parseCloudWeatherToggle,String);
 const chooseCloudIsobars=(enabled:boolean)=>{setCloudIsobars(enabled)};
 useEffect(()=>{setPresented(null)},[kind]);
 useEffect(()=>{const resume=()=>setRevision(value=>value+1);window.addEventListener('mid:runtime-resume',resume);return()=>window.removeEventListener('mid:runtime-resume',resume)},[]);
 const places=useMemo(()=>favorites.filter(p=>p.name&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)).sort((a,b)=>a.name.localeCompare(b.name,'de-DE')),[favorites]),place=places.find(p=>p.id===selected),frames=catalog?.index.products[kind]?.frames??[],ref=frames.find(f=>f.hour===hour),activeBasemap=WEATHER_MAP_BASEMAPS[basemap];
 useEffect(()=>{const c=new AbortController();setCatalog(null);setField(null);setError('');setPlaying(false);void loadNativeIndex(c.signal).then(value=>{if(!c.signal.aborted)setCatalog(value)}).catch(e=>{if(!c.signal.aborted)setError(String(e.message||e))});return()=>c.abort()},[revision]);
 useEffect(()=>{setPlaying(false);if(frames.length&&!frames.some(f=>f.hour===hour))setHour(frames[0].hour);else if(catalog&&!frames.length)setError('Dieser Parameter ist im geprüften Modelllauf nicht verfügbar.')},[kind,catalog]);
 const requestKey=ref&&catalog?JSON.stringify([catalog.index.run,kind,ref.sha256,kind==='sigwx'?catalog.index.products.cloud?.frames.find(f=>f.time===ref.time)?.sha256:null,revision]):'';
 useEffect(()=>{const c=new AbortController();setField(previous=>previous?.kind===kind&&previous.run===catalog?.index.run?previous:null);setCloudField(previous=>kind==='sigwx'&&previous?.run===catalog?.index.run?previous:null);setError('');if(catalog&&ref)void (async()=>{const value=await loadNativeField(catalog.index,catalog.base,ref,kind,c.signal);let cloud:NativeField|null=null;if(kind==='sigwx'){const cloudRef=catalog.index.products.cloud?.frames.find(f=>f.time===ref.time);if(!cloudRef)throw Error('Kein gemeinsamer Wolken-/Wettertermin.');cloud=await loadNativeField(catalog.index,catalog.base,cloudRef,'cloud',c.signal);nativeCloudWeatherPair(cloud,value);}if(!c.signal.aborted){setCloudField(cloud);setField(value);setLoadedKey(requestKey);}})().catch(e=>{if(!c.signal.aborted){setPlaying(false);setError(String(e.message||e))}});return()=>c.abort()},[catalog,kind,ref,requestKey]);
 const activeMode:MapColorMode=playing?'absolute':colorMode;
 // A validated candidate is not a displayed field. All values and legends
 // stay tied to the last render-confirmed snapshot until the new bundle commits.
 const next=loadedKey===requestKey&&candidateField?.kind===kind&&candidateField.run===catalog?.index.run&&candidateField.time===ref?.time?candidateField:null;
 const nextCloud=kind==='sigwx'&&cloudField?.run===next?.run&&cloudField?.time===next?.time?cloudField:null;
 const nextCombined=useMemo(()=>next&&nextCloud?nativeCloudWeatherPair(nextCloud,next):null,[next,nextCloud]);
 const [pressureField,setPressureField]=useState<NativeField|null>(null),[pressureDone,setPressureDone]=useState(''),[pressureMessage,setPressureMessage]=useState('');
 const pressureRef=next&&catalog?nativePressureFrameRef(catalog.index,next,cloudIsobars):undefined;
 const pressureKey=pressureRef&&next?JSON.stringify([requestKey,nativeFieldModel(next),pressureRef.sha256]):'';
 useEffect(()=>{
  setPressureField(null);setPressureDone('');setPressureMessage('');
  if(!pressureRef||!catalog||!next)return;
  const c=new AbortController();const timer=window.setTimeout(()=>{c.abort();setPressureDone(pressureKey);setPressureMessage('Isobaren: Zeitüberschreitung.')},15000);
  void loadNativeField(catalog.index,catalog.base,pressureRef,'pressure',c.signal).then(value=>{if(!c.signal.aborted&&value.run===next.run&&value.time===next.time&&nativeFieldModel(value)===nativeFieldModel(next))setPressureField(value)}).catch(()=>{if(!c.signal.aborted)setPressureMessage('Isobaren nicht verfügbar.')}).finally(()=>{window.clearTimeout(timer);if(!c.signal.aborted)setPressureDone(pressureKey)});
  return()=>{window.clearTimeout(timer);c.abort()};
 },[catalog,pressureKey]);
 const nextPressure=next?nativePresentationPressure(next,pressureKey&&pressureDone===pressureKey?pressureField:null):null;
 const nextRange=useMemo(()=>next?nativeMapScale(next,'field',unit):null,[next,unit]),nextFixed=useMemo(()=>next?nativeMapScale(next,'absolute',unit):null,[next,unit]),nextScale=activeMode==='field'?nextRange:nextFixed;
 const nextRaster=useMemo(()=>kind==='sigwx'?nextCombined?cloudWeatherRaster(nextCombined):'':next&&nextScale?nativeRaster(next,nextScale):'',[kind,nextCombined,next,nextScale]);
 const nextPresentation=useMemo<NativePresentation|null>(()=>{
  if(!catalog||!next||!ref||!nextRaster||!nextRange||!nextFixed||!nextScale||(kind==='sigwx'&&!nextCombined)||(pressureKey&&pressureDone!==pressureKey))return null;
  const evidence=nativeFrameEvidence(catalog.index,next,ref);if(!evidence)return null;
  const selected=kind==='sigwx'&&cloudIsobars?nativeCloudIsobars(nextCombined,nextPressure):null;
  const pressure=nativeIsobarFeatures(kind==='sigwx'?selected?.contours??[]:nextPressure?.isobars??[]);
  const groups:TemporalMapGroup[]=[];
  if(pressure.features.length)groups.push({id:'isobars',data:pressure,zIndex:1,layers:adaptiveContourLayers('pressure','#192c3f',.8,{width:1.1})});
  if(showScalarLines){const lines=scalarLineFeatures(nativeScalarLines(next,unit));if(lines.features.length)groups.push({id:'scalar-isolines',data:lines,zIndex:620,hoverProperty:'label',layers:scalarMapLayers()})}
  if(kind==='pressure')groups.push(pressureCenterGroup(next.centers));
  const pressureIdentity=(kind==='sigwx'?selected:nextPressure)?(nextPressure===next?ref.sha256:pressureRef?.sha256??null):null;
  const key=JSON.stringify([nativeFieldModel(next),next.run,next.time,ref.sha256,kind==='sigwx'?catalog?.index.products.cloud?.frames.find(f=>f.time===next.time)?.sha256:null,pressureIdentity,unit,activeMode,showScalarLines,cloudIsobars,revision]);
  return {key,field:next,cloud:nextCloud,pressure:nextPressure,raster:nextRaster,range:nextRange,fixed:nextFixed,scale:nextScale,unit,lines:showScalarLines,cloudIsobars,intervalHours:evidence.intervalHours,nativeD2Full:evidence.nativeD2Full,frame:{key,raster:{url:nextRaster,bounds:evidence.bounds,resampling:kind==='sigwx'?'nearest':'linear',zIndex:0,opacity:.85},groups}};
 },[next,ref,nextCloud,nextCombined,nextPressure,nextRaster,nextRange,nextFixed,nextScale,pressureKey,pressureDone,pressureRef?.sha256,kind,unit,activeMode,showScalarLines,cloudIsobars,revision,catalog]);
 const ready=Boolean(shown&&nextPresentation&&shown.key===nextPresentation.key);
 useEffect(()=>{if(!playing||!ready||frames.length<2)return;const timer=window.setTimeout(()=>setHour(frames[(frames.findIndex(f=>f.hour===hour)+1)%frames.length].hour),2400);return()=>window.clearTimeout(timer)},[playing,ready,frames,hour]);
 const raster=shown?.raster??'',rangeScale=shown?.range??null,fixedScale=shown?.fixed??null,colorScale=shown?.scale??null,displayedUnit=shown?.unit??unit,rawUnit=field?.unit||catalog?.index.products[kind]?.unit||'',displayUnit=modelMapUnit(kind,rawUnit,displayedUnit),format=(v:number|null)=>modelMapValue(kind,v,rawUnit,displayedUnit);
 const pressureContours=shown?.pressure??null;
 const cloudContourSelection=kind==='sigwx'&&shown?.cloudIsobars?nativeCloudIsobars(combined,pressureContours):null;
 const cloudContours=cloudContourSelection?.contours??[];
 const nativeRuc=field?.modelId==='icon-d2-ruc'||(!field&&catalog?.index.modelId==='icon-d2-ruc');
 const nativeD2Full=Boolean(!nativeRuc&&shown?.nativeD2Full);
 const sourceLabel=nativeRuc?'DWD ICON-D2-RUC · nächster verifizierter nativer Gitterpunkt (bis 5 km)':nativeD2Full?'DWD ICON-D2 · signiertes Vollgebiets-Original · 542.040 native Zellen · nächster gültiger Gitterpunkt':'DWD ICON-D2 · bereitgestelltes reguläres GRIB2-Raster';
 const download=async(format:'png'|'svg')=>{if(!ready||!field||!raster||!colorScale||field.time!==ref?.time)return;setExporting(true);try{if(combined)await (await import('./cloudWeatherExport')).exportCloudWeather(combined,raster,places,format,'pseudo',cloudContourSelection);else await (await import('./nativeModelMapExport')).exportNativeField({...field,isobars:pressureContours?.isobars??[]},label,raster,places,format,shown?.intervalHours??NaN,displayedUnit,colorScale,{lines:shown?.lines??false,extremes:showExtremes})}catch(e){if(!(e instanceof DOMException&&e.name==='AbortError'))setError(String(e))}finally{setExporting(false)}};
 return <section className="weather-precipitation-totals" aria-label={label}><div className="weather-precipitation-layout">
  <section className="weather-precipitation-map-column"><div className="weather-precipitation-map-shell"><MidMapLibre center={[51.05,10.45]} zoom={4} minZoom={2.5} maxZoom={9} className="weather-precipitation-map" scrollZoom={false}>
   {place?<MapCenter latitude={place.latitude} longitude={place.longitude} zoom={6.8}/>:field?<MapFitBounds south={field.lats[0]} west={field.lons[0]} north={field.lats.at(-1)!} east={field.lons.at(-1)!} padding={20} maxZoom={6}/>:null}
   {combined?<UnifiedVectorBasemap cloudContrast zIndex={-10} dark={document.documentElement.dataset.theme==='dark'||document.documentElement.classList.contains('dark')}/>:<RasterTileLayer id={`native-basemap-${basemap}`} url={activeBasemap.url} tone={activeBasemap.tone} attribution={activeBasemap.attribution}/>}
   <TemporalMapFrame key={kind} id={`native-${kind}`} frame={nextPresentation?.frame??null} opacity={1} onReady={()=>{if(nextPresentation)setPresented(previous=>previous?.key===nextPresentation.key?previous:nextPresentation)}} onError={message=>{setPlaying(false);setError(message)}}/>
   {field&&field.kind===kind&&<NativeScalarOverlay field={field} unit={displayedUnit} lines={false} extremes={showExtremes&&ready}/>}
   <ModelMapContextOverlay/>
   {combined?<ModelMapProbe<string> showDisabledButton label={label} unit="" source={sourceLabel} enabled={ready&&!playing} contextKey={`${combined.run}-${combined.time}-${shown?.key}`} sample={combinedValue} format={value=>value??'–'}/>:<ModelMapProbe showDisabledButton label={label} unit={displayUnit} source={sourceLabel} enabled={ready&&!playing} contextKey={`${shown?.key}-${playing}`} sample={(lat,lon)=>field?nativeAt(field,lat,lon):null} format={format}/>}
   {places.filter(p=>field&&p.latitude>=field.lats[0]&&p.latitude<=field.lats.at(-1)!&&p.longitude>=field.lons[0]&&p.longitude<=field.lons.at(-1)!).map(p=><HtmlMarker key={p.id} latitude={p.latitude} longitude={p.longitude} anchor="center" zIndex={2} className="precipitation-favorite-marker" html={`<span class="${p.id===selected?'selected':''}"></span>`} onClick={()=>setSelected(p.id)}/>)}
  </MidMapLibre>{!field?<div className="weather-precipitation-data-state" role="status"><span><strong>{error?'Kein verifiziertes Modellfeld verfügbar':'Modellfeld wird geladen …'}</strong><small>{error}</small></span></div>:null}
  </div>{combined?<div><label className="unified-check"><input type="checkbox" checked={cloudIsobars} onChange={e=>chooseCloudIsobars(e.target.checked)}/>Isobaren · gleicher ICON-D2-Lauf und Termin</label>{cloudIsobars&&ready&&!cloudContours.length&&<p role="status">Für den gewählten Lauf und Termin keine geprüften Isobaren verfügbar. {pressureMessage}</p>}<CloudWeatherLegend state={{modelId:'icon-d2',mode:'pseudo'}}/></div>:colorScale&&rangeScale&&fixedScale?colorScale.categorical?<div className="weather-precipitation-legend-placeholder" aria-label={`Wettercode · ${displayUnit}`}><span>{displayUnit} · Wettercode</span>{mapScaleTicks(colorScale).map(([value,color])=><span key={value}><i style={{background:color}}/>{value}</span>)}</div>:<ModelMapScaleLegend label={label} unit={displayUnit} scale={colorScale} range={rangeScale} format={format} onModeChange={setColorMode} locked={playing}/>:null}
  {field&&field.kind===kind&&<NativeScalarControls field={field} unit={unit} extremes={showExtremes} onExtremes={setShowExtremes} lines={showScalarLines} onLines={setShowScalarLines}/>}
  <p className="weather-precipitation-attribution">Karte antippen für einen Ortswert. {nativeRuc?'DWD ICON-D2-RUC · natives DWD-Gitter, nächster gültiger Original-Gitterpunkt bis 5 km; Missing bleibt Missing · CC BY 4.0.':nativeD2Full?'DWD ICON-D2 · kryptografisch freigegebenes natives Vollgebiet mit 542.040 Originalzellen; fehlende Zellen bleiben transparent · CC BY 4.0.':'DWD ICON-D2 · DWD-Regular-Raster (Anbieter-Remapping), kein natives Vollgebiet · CC BY 4.0.'} Kartenbasis: © OpenStreetMap-Mitwirkende, ODbL. Grenzen und Ortsnamen: Natural Earth (Public Domain), über dem Wetterfeld.</p></section>
  <aside className="weather-precipitation-summary"><section className="weather-precipitation-period"><small>BESTÄTIGTE MODELLTERMINE</small><h4>{label}</h4><div className="weather-precipitation-window-options">{frames.map(f=><button key={f.hour} type="button" aria-pressed={hour===f.hour} onClick={()=>{setPlaying(false);setHour(f.hour)}}>+{f.hour} h</button>)}</div><p>Keine zeitliche Interpolation. {kind==='precipitation'?'Niederschlag in der letzten Stunde vor dem gewählten Termin.':kind==='gust'?(Number.isFinite(shown?.intervalHours??NaN)&&(shown?.intervalHours??0)>0?`Maximale Böe im nachgewiesenen ${shown!.intervalHours}-h-Modellintervall.`:'Modelliertes 10-m-Böenmaximum; das Bezugsintervall ist aus dem veröffentlichten Originalfeld nicht ausgewiesen.'):kind==='sigwx'?'WMO-Wettercode aus dem Modell; keine amtliche Warnung.':'Momentanwert zum gewählten Modelltermin.'}</p><button type="button" disabled={frames.length<2||!field} aria-pressed={playing} onClick={()=>setPlaying(v=>!v)}>{playing?'Animation pausieren':'Animation starten'}</button></section>
  <dl className="weather-precipitation-meta"><div><dt>Modelllauf</dt><dd>{field?stamp(field.run):'–'}</dd></div><div><dt>{field&&!ready?(error?'Bisheriges Bild · neuer Stand nicht verfügbar':'Bisheriges Bild · neue Darstellung lädt'):'Gültig'}</dt><dd>{field?stamp(field.time):'–'}</dd></div><div><dt>Ortswerte</dt><dd>{nativeRuc?'Nächste gültige native DWD-Gitterzelle (≤ 5 km)':nativeD2Full?'Nächster gültiger nativer ICON-D2-Gitterpunkt':'Nächster dargestellter regulärer DWD-Rasterpunkt'}</dd></div></dl><div className="weather-precipitation-exports" aria-busy={exporting}><button type="button" disabled={!ready||!field||field.time!==ref?.time||exporting} onClick={()=>void download('png')}>PNG herunterladen</button><button type="button" disabled={!ready||!field||field.time!==ref?.time||exporting} onClick={()=>void download('svg')}>SVG herunterladen</button>{exporting?<span className="mid-map-export-status" role="status">Export wird erstellt …</span>:null}</div></aside>
  <section className="weather-precipitation-favorites"><header><h4>Favoriten</h4><span>{displayUnit||'Wert'} · gleicher Rasterpunkt wie Karte</span></header><div className="weather-precipitation-table-wrap"><table><thead><tr><th>Ort</th><th>Wert</th><th>Datenstatus</th></tr></thead><tbody>{places.map(p=>{const v=field?nativeAt(field,p.latitude,p.longitude):null;return <tr key={p.id}><th><button type="button" className={p.id===selected?'selected':''} aria-pressed={p.id===selected} disabled={v===null} onClick={()=>setSelected(current=>current===p.id?'':p.id)}>{p.name}</button></th><td>{combined?combinedValue(p.latitude,p.longitude)??'–':`${format(v)} ${v!==null?displayUnit:''}`}</td><td>{v===null?'nicht abgedeckt / nicht verfügbar':nativeRuc?'Nativ, nächste gültige Zelle (≤ 5 km)':nativeD2Full?'Nativ, originale gültige DWD-Zelle':'DWD-Regular-Rasterpunkt'}</td></tr>})}{!places.length?<tr><td colSpan={3}>Noch keine Favoriten gespeichert.</td></tr>:null}</tbody></table></div></section>
 </div>{error&&field?<p role="alert">{error}</p>:null}<button type="button" className="weather-maps-reload" onClick={()=>setRevision(v=>v+1)}>Daten aktualisieren</button><p className="weather-precipitation-disclaimer">Modellprognose · keine Messwerte · keine amtliche Warnung.</p></section>
}
