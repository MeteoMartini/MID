import {useEffect,useState} from 'react';
import type {Location} from './weather';
import {formatDisplayDateTime} from './timeDisplay';
import {DWD_REGIME_URL,ECMWF_REGIME_URL,dwdRegimeDescription,loadDwdWeatherRegimes,weatherRegimeRegion,type DwdRegimeData} from './weatherRegimeContext';
import './WeatherRegimePanel.css';

export default function WeatherRegimePanel({location}:{location:Location}){
 const region=weatherRegimeRegion(location),[data,setData]=useState<DwdRegimeData|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 useEffect(()=>{
  if(region!=='dwd'){setData(null);setError('');setLoading(false);return}
  const controller=new AbortController();let active=true;
  const load=()=>{setLoading(true);void loadDwdWeatherRegimes(controller.signal).then(value=>{if(active){setData(value);setError('')}}).catch(()=>{if(active){setData(null);setError('DWD-Wetterlagen derzeit nicht verfügbar.')}}).finally(()=>{if(active)setLoading(false)})};
  const resume=()=>{if(document.visibilityState==='visible')load()};load();
  const timer=window.setInterval(load,3600000);document.addEventListener('visibilitychange',resume);
  return()=>{active=false;controller.abort();window.clearInterval(timer);document.removeEventListener('visibilitychange',resume)};
 },[region]);
 useEffect(()=>{if(!data)return;const delay=Math.max(0,Date.parse(data.analysisAt)+48*3600000-Date.now()),timer=window.setTimeout(()=>{setData(null);setError('DWD-Wetterlagen derzeit nicht verfügbar.')},delay);return()=>window.clearTimeout(timer)},[data]);
 if(!region)return null;
 const now=Date.now(),zone=location.timezone||'Europe/Berlin',stamp=(value:string)=>formatDisplayDateTime(value,zone,{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}),future=data?.frames.filter(frame=>Date.parse(frame.validAt)>=now)??[];
 return <section className="weather-regime-context" aria-label="Großräumige Wetterlagen"><header><div><small>GROSSRÄUMIGE ZIRKULATION</small><h4>Wetterlagen & Regime</h4></div><span>{region==='dwd'?'Deutschland / Mitteleuropa':'Euro-Atlantik'}</span></header>
  {region==='dwd'&&<><p>Amtliche DWD-Wetterlagen · bis 7 Tage</p>{loading?<p role="status">Wetterlagen laden …</p>:error?<p role="status">{error}</p>:null}
  {data&&<><p className="weather-regime-stamp">Analyse {stamp(data.analysisAt)} · Regionalindex, keine Ortsprognose</p><div className="weather-regime-timeline" role="list" aria-label="DWD-Wetterlagenvorhersage">{future.map(frame=>{const info=frame.classId!==null&&frame.code?dwdRegimeDescription(frame.classId,frame.code):null;return <article key={frame.validAt} role="listitem" className={info?(info.wet?'wet':'dry'):'unknown'}><time dateTime={frame.validAt}>{stamp(frame.validAt)}</time><span className="weather-regime-flow" aria-hidden="true">{info?({NO:'↙',SO:'↖',SW:'↗',NW:'↘',XX:'·'} as Record<string,string>)[info.direction]:'–'}</span><strong>{info?.label??'Nicht verfügbar'}</strong><span>{info?.low??'–'}</span><details><summary>Einordnung</summary><p>{info?.detail??'Kein gültiger Klassifikationswert.'}</p><small>{frame.leadHours===0?'Analyse':`Vorhersage +${frame.leadHours} h`}{frame.code?` · ${frame.code} · Klasse ${frame.classId}`:''}</small></details></article>})}</div><a href={DWD_REGIME_URL} target="_blank" rel="noreferrer">Quelle & Verfahren: DWD</a></>}
  </>}
  <details className="weather-regime-ecmwf"><summary>ECMWF-Regime · Ausblick bis etwa 6 Wochen</summary><p>NAO+, NAO−, skandinavische Blockierung und Atlantikrücken: großräumige Ensemblewahrscheinlichkeiten für den Euro-Atlantik.</p><a href={ECMWF_REGIME_URL} target="_blank" rel="noreferrer">Offizielle Regimegrafik mit Vorhersagen öffnen</a><p className="weather-regime-note">Diese Regime erklären die Zirkulation; sie ersetzen keine lokale Wettervorhersage. Die Originalgrafik bleibt beim ECMWF.</p></details>
 </section>;
}
