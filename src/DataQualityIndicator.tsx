import {useState,useMemo} from 'react';
import {Info} from 'lucide-react';
import type {Station,BestMatchModelInfo,RadarNowcast,StationAnalysisField} from './weather';
import {stationFieldObservationUsable} from './weather';

export type ParameterQuality={
  label:string;
  source:'station'|'model'|'blend'|'radar'|'fallback';
  quality:'high'|'medium'|'low';
  detail:string;
  ageMinutes?:number;
};

function qualityDotColor(q:'high'|'medium'|'low'){
  return q==='high'?'var(--param-wind)':q==='medium'?'var(--param-sunshine)':'var(--param-temperature-max)';
}

function qualityLabel(q:'high'|'medium'|'low'){
  return q==='high'?'hoch':q==='medium'?'mittel':'niedrig';
}

function sourceLabel(s:ParameterQuality['source']){
  return s==='station'?'Station':s==='model'?'Modell':s==='blend'?'Station+Modell':s==='radar'?'Radar':'Fallback';
}

function ageLabel(minutes?:number){
  if(!Number.isFinite(minutes??NaN))return'';
  const m=minutes??0;
  if(m<1)return'gerade eben';
  if(m<60)return`vor ${Math.round(m)} Min`;
  const h=Math.floor(m/60),rem=Math.round(m%60);
  return rem>0?`vor ${h} Std ${rem} Min`:`vor ${h} Std`;
}

/**
 * Dezenter Qualitätsindikator direkt an einem Wetter-Parameter.
 * Zeigt einen farbigen Dot + kurze Quellenangabe; auf kleinen Displays
 * (≤ 480 px) bleibt nur der Dot sichtbar – die Beschriftung ist über
 * title/aria-label weiterhin zugänglich. (P1-Fix v0.9.85.127)
 */
export function ParameterQualityIndicator({
  label,
  station,
  field,
  modelInfo,
  radarData,
  elevation,
  now=Date.now(),
}:{
  label:string;
  station:Station|null;
  field:StationAnalysisField|'radar';
  modelInfo?:BestMatchModelInfo|null;
  radarData?:RadarNowcast|null;
  elevation?:number;
  now?:number;
}){
  const[open,setOpen]=useState(false);

  const quality=useMemo(():ParameterQuality=>{
    if(field==='radar'){
      const rq=radarData?.quality;
      return{
        label,
        source:'radar',
        quality:rq==='high'?'high':rq==='medium'?'medium':'low',
        detail:radarData?`${radarData.provider}${radarData.observedAt?` · ${ageLabel((now-new Date(radarData.observedAt).getTime())/60000)}`:''}`:'Modellvorhersage',
        ageMinutes:radarData?.observedAt?(now-new Date(radarData.observedAt).getTime())/60000:undefined,
      };
    }
    // Nutzt die kanonische stationFieldObservationUsable-Prüfung aus weather.ts
    // (Aktualität, Entfernung, Höhenabweichung) statt pauschalem 30-min-Schnitt.
    const usable=station?stationFieldObservationUsable(station,field as StationAnalysisField,now,elevation):false;
    const src=station?.fieldSources?.[field as StationAnalysisField]?.[0];
    const ageMs=src?.observedAt?now-new Date(src.observedAt).getTime():
      station?.fieldObservedAt?.[field as StationAnalysisField]?now-new Date(station.fieldObservedAt[field as StationAnalysisField]!).getTime():
      station?.timestamp?now-new Date(station.timestamp).getTime():undefined;
    return{
      label,
      source:usable?'station':station?.blended?'blend':'model',
      quality:usable?'high':station?.blended?'medium':'medium',
      detail:usable&&src?`${src.provider}${src.stationName?` · ${src.stationName}`:''}${src.distanceKm!=null?` · ${src.distanceKm.toFixed(1)} km`:''}`:modelInfo?.summary||'Best Match',
      ageMinutes:ageMs!=null?ageMs/60000:undefined,
    };
  },[station,field,modelInfo,radarData,elevation,now,label]);

  const dot=<span className="parameter-quality-dot" style={{background:qualityDotColor(quality.quality)}} aria-hidden="true"/>;
  const tooltip=`${label}: Qualität ${qualityLabel(quality.quality)} · ${sourceLabel(quality.source)}${quality.ageMinutes!=null&&quality.ageMinutes<120?` · ${ageLabel(quality.ageMinutes)}`:''}`;

  return(
    <span
      className={`parameter-quality-indicator quality-${quality.quality} source-${quality.source}`}
      title={tooltip}
      aria-label={tooltip}
      onClick={()=>setOpen(v=>!v)}
      role="button"
      tabIndex={0}
      onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')setOpen(v=>!v)}}
    >
      {dot}
      {/* Auf kleinen Displays per CSS ausgeblendet (≤ 480 px); a11y via title/aria-label */}
      <span className="parameter-quality-source">{sourceLabel(quality.source)}</span>
      {open&&(
        <span className="parameter-quality-popover" role="tooltip">
          <Info size={12}/>
          <strong>{label}</strong>
          <span>{quality.detail}</span>
          {quality.ageMinutes!=null&&<span>{ageLabel(quality.ageMinutes)}</span>}
        </span>
      )}
    </span>
  );
}

/** @deprecated Bitte ParameterQualityIndicator direkt am Parameter verwenden. */
export function DataQualityIndicator({
  station:_s,
  modelInfo:_m,
  radarData:_r,
  forecastFusionActive:_f,
  updatedLabel:_u,
  advancedMode:_a,
}:{
  station:Station|null;
  modelInfo:BestMatchModelInfo|null;
  radarData:RadarNowcast|null;
  forecastFusionActive:boolean;
  updatedLabel:string;
  timezone?:string;
  advancedMode:boolean;
}){
  // Separate Qualitätssektion auf «Aktuell» wurde entfernt (P1-Fix v0.9.85.127).
  // DataQualityIndicator rendert nichts mehr; Qualitätsindikatoren stehen
  // jetzt dezent direkt an jedem Parameter via ParameterQualityIndicator.
  return null;
}
