import {useState,useMemo} from 'react';
import {ShieldCheck,Activity,MapPin} from 'lucide-react';
import type {Station,BestMatchModelInfo,RadarNowcast} from './weather';

export type ParameterQuality={
  label:string;
  source:'station'|'model'|'blend'|'radar'|'fallback';
  quality:'high'|'medium'|'low';
  detail:string;
  ageMinutes?:number;
};

function qualityColor(q:'high'|'medium'|'low'){
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

export function DataQualityIndicator({station,modelInfo,radarData,forecastFusionActive,updatedLabel,advancedMode}:{station:Station|null;modelInfo:BestMatchModelInfo|null;radarData:RadarNowcast|null;forecastFusionActive:boolean;updatedLabel:string;timezone?:string;advancedMode:boolean}){
  const[expanded,setExpanded]=useState<string|null>(null);

  const parameters=useMemo(()=>{
    const now=Date.now();
    const params:ParameterQuality[]=[];

    // Temperature
    const tempFresh=station?.temperature!==undefined&&station?.timestamp?now-new Date(station.timestamp).getTime()<30*60000:false;
    const tempStation=station?.fieldSources?.temperature?.[0];
    params.push({
      label:'Temperatur',
      source:tempFresh&&tempStation?'station':station?.blended?'blend':'model',
      quality:tempFresh&&tempStation?'high':station?.blended?'medium':'medium',
      detail:tempStation?`${tempStation.provider}${tempStation.stationName?` · ${tempStation.stationName}`:''}${tempStation.distanceKm?` · ${formatDecimal(tempStation.distanceKm,1)} km`:''}`:modelInfo?.summary||'Best Match',
      ageMinutes:station?.timestamp?(now-new Date(station.timestamp).getTime())/60000:undefined
    });

    // Wind
    const windFresh=station?.windSpeed!==undefined&&station?.timestamp?now-new Date(station.timestamp).getTime()<30*60000:false;
    const windStation=station?.fieldSources?.windSpeed?.[0]||station?.fieldSources?.windGust?.[0];
    params.push({
      label:'Wind',
      source:windFresh&&windStation?'station':station?.blended?'blend':'model',
      quality:windFresh&&windStation?'high':'medium',
      detail:windStation?`${windStation.provider}${windStation.distanceKm?` · ${formatDecimal(windStation.distanceKm,1)} km`:''}`:modelInfo?.summary||'Best Match',
      ageMinutes:station?.timestamp?(now-new Date(station.timestamp).getTime())/60000:undefined
    });

    // Precipitation
    const radarQuality=radarData?.quality;
    params.push({
      label:'Niederschlag',
      source:radarData?'radar':'model',
      quality:radarQuality==='high'?'high':radarQuality==='medium'?'medium':'low',
      detail:radarData?`${radarData.provider}${radarData.observedAt?` · ${ageLabel((now-new Date(radarData.observedAt).getTime())/60000)}`:''}`:'Modellvorhersage',
      ageMinutes:radarData?.observedAt?(now-new Date(radarData.observedAt).getTime())/60000:undefined
    });

    // Humidity
    const humFresh=station?.humidity!==undefined&&station?.timestamp?now-new Date(station.timestamp).getTime()<30*60000:false;
    const humStation=station?.fieldSources?.humidity?.[0];
    params.push({
      label:'Feuchte',
      source:humFresh&&humStation?'station':station?.blended?'blend':'model',
      quality:humFresh&&humStation?'high':'medium',
      detail:humStation?`${humStation.provider}${humStation.distanceKm?` · ${formatDecimal(humStation.distanceKm,1)} km`:''}`:'Best Match',
      ageMinutes:station?.timestamp?(now-new Date(station.timestamp).getTime())/60000:undefined
    });

    // Pressure
    const pressFresh=station?.pressure!==undefined&&station?.timestamp?now-new Date(station.timestamp).getTime()<30*60000:false;
    const pressStation=station?.fieldSources?.pressure?.[0];
    params.push({
      label:'Luftdruck',
      source:pressFresh&&pressStation?'station':station?.blended?'blend':'model',
      quality:pressFresh&&pressStation?'high':'medium',
      detail:pressStation?`${pressStation.provider}${pressStation.distanceKm?` · ${formatDecimal(pressStation.distanceKm,1)} km`:''}`:'Best Match',
      ageMinutes:station?.timestamp?(now-new Date(station.timestamp).getTime())/60000:undefined
    });

    return params;
  },[station,modelInfo,radarData]);

  const overallQuality=useMemo(()=>{
    const highCount=parameters.filter((p:ParameterQuality)=>p.quality==='high').length;
    if(highCount>=3)return'high';
    if(highCount>=1)return'medium';
    return'low';
  },[parameters]);

  const activeModels=modelInfo?.runs?.filter(r=>r.usageStatus==='active')||[];

  return(
    <section className="card data-quality-indicator" data-mid-view="data-quality">
      <header className="forecast-entry-head forecast-entry-head-data-quality">
        <span>
          <ShieldCheck size={16} style={{color:qualityColor(overallQuality)}}/>
          <small>Datenqualität</small>
          <strong>Pro-Parameter Qualitätsindikator</strong>
        </span>
        <em>{updatedLabel}</em>
      </header>
      <div className="data-quality-badges">
        {parameters.map(param=>(
          <button key={param.label} type="button"
            className={`quality-badge quality-${param.quality} source-${param.source}`}
            onClick={()=>setExpanded(e=>e===param.label?null:param.label)}
            aria-expanded={expanded===param.label}
            title={`${param.label}: ${qualityLabel(param.quality)} · ${sourceLabel(param.source)}`}>
            <span className="quality-dot" style={{background:qualityColor(param.quality)}}/>
            <span className="quality-badge-label">{param.label}</span>
            <span className="quality-badge-source">{sourceLabel(param.source)}</span>
            {param.ageMinutes!==undefined&&param.ageMinutes<60&&<span className="quality-badge-age">{ageLabel(param.ageMinutes)}</span>}
          </button>
        ))}
      </div>
      {expanded&&parameters.filter(p=>p.label===expanded).map(param=>(
        <div key={param.label} className="data-quality-detail">
          <div className="data-quality-detail-row">
            <span className="quality-dot" style={{background:qualityColor(param.quality)}}/>
            <strong>{param.label}</strong>
            <em>{qualityLabel(param.quality)}</em>
          </div>
          <div className="data-quality-detail-info">
            <span><MapPin size={14}/> Quelle: {param.detail}</span>
            {param.ageMinutes!==undefined&&<span><Activity size={14}/> Aktualität: {ageLabel(param.ageMinutes)}</span>}
          </div>
        </div>
      ))}
      {advancedMode&&activeModels.length>0&&(
        <details className="data-quality-models">
          <summary>Aktive Modellläufe ({activeModels.length})</summary>
          <div className="data-quality-model-list">
            {activeModels.map(run=>(
              <div key={`${run.kind}:${run.id}`} className="data-quality-model-row">
                <span>{run.label}{run.rapidUpdate?<em className="model-rapid-badge">RUC</em>:null}</span>
                <small>{run.initialisationTime?`Init: ${new Date(run.initialisationTime).toLocaleString('de-DE')}`:''}{run.resolutionKm?` · ${formatDecimal(run.resolutionKm,1)} km`:''}{run.forecastHorizonHours?` · +${Math.round(run.forecastHorizonHours)} h`:''}</small>
              </div>
            ))}
          </div>
        </details>
      )}
      <footer className="data-quality-footer">
        <small>
          {forecastFusionActive?'Modellfusion aktiv · Best Match mit lokaler Stationsvalidierung':'Best Match · automatische Modellkombination'}
          {station?.networkClass&&` · Stationsklasse: ${station.networkClass}`}
        </small>
      </footer>
    </section>
  );
}

function formatDecimal(value:number,decimals=1){
  return Number.isFinite(value)?value.toFixed(decimals):'–';
}
