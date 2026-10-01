import {useState,useEffect,type CSSProperties} from 'react';
import {fetchWorkerJson} from './workerClient';
import {CloudSun,ChevronDown} from 'lucide-react';

type PollenRegion={id:number,name:string,geometry:{type:string,coordinates:any[]}|null};
type PollenForecastEntry={regionId:number,regionName:string,pollenType:string,pollenValue:string,pollenInt:number,forecastDate:string,expires:string,effective:string};
type PollenResponse={regions:PollenRegion[],pollenTypes:string[],forecasts:PollenForecastEntry[],provider?:string,source?:string,version?:string,checkedAt?:string,productUpdatedAt?:string,productExpiresAt?:string,error?:string};

const POLLEN_LABELS:Record<string,string>={Hasel:'Hasel',Erle:'Erle',Esche:'Esche',Birke:'Birke','Gräser':'Gräser',Roggen:'Roggen',Beifuss:'Beifuß',Ambrosia:'Ambrosia'};
const POLLEN_CODE_LABELS:Record<string,string>={'0':'keine','0-1':'keine bis gering','1':'gering','1-2':'gering bis mittel','2':'mittel','2-3':'mittel bis hoch','3':'hoch'};
const POLLEN_LEVEL_COLORS:string[]=['var(--param-wind)','var(--param-sunshine)','var(--param-temperature-max)','var(--param-precipitation-storm)'];
function pollenSeverity(entry:PollenForecastEntry|undefined):number{
  if(!entry)return-1;
  const raw=String(entry.pollenValue||'').trim().toLocaleLowerCase('de-DE').replace(/[–—]/g,'-').replace(/\s+/g,' ');
  if(raw==='-1')return-1;
  if(raw==='0'||raw==='keine'||raw==='keine belastung')return 0;
  if(raw==='0-1'||raw.includes('keine bis gering'))return.5;
  if(raw==='1'||raw==='schwach'||raw==='gering'||raw==='geringe belastung')return 1;
  if(raw==='1-2'||raw.includes('gering bis mittel')||raw.includes('geringe bis mittlere'))return 1.5;
  if(raw==='2'||raw==='mäßig'||raw==='maessig'||raw==='mittel'||raw==='mittlere belastung')return 2;
  if(raw==='2-3'||raw.includes('mittel bis hoch')||raw.includes('mittlere bis hohe'))return 2.5;
  if(raw==='3'||raw==='stark'||raw==='hoch'||raw==='hohe belastung')return 3;
  const numeric=Number(entry.pollenInt);
  return Number.isFinite(numeric)?Math.max(0,Math.min(3,numeric)):0;
}
function pollenLabel(entry:PollenForecastEntry|undefined):string{
  if(!entry)return'–';
  const raw=String(entry.pollenValue||'').trim();
  return POLLEN_CODE_LABELS[raw]||raw||'–';
}
function pollenLevel(entry:PollenForecastEntry|undefined):number{return Math.max(0,Math.min(3,Math.ceil(pollenSeverity(entry))))}

function pointInPolygon(lat:number,lon:number,coordinates:any[]):boolean{
  const rings=Array.isArray(coordinates[0])&&Array.isArray(coordinates[0][0])?coordinates:[coordinates];
  for(const ring of rings){
    let inside=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];
      const intersect=((yi>lat)!==(yj>lat))&&(lon<(xj-xi)*(lat-yi)/(yj-yi)+xi);
      if(intersect)inside=!inside;
    }
    if(inside)return true;
  }
  return false;
}

function findPollenRegion(lat:number,lon:number,regions:PollenRegion[]):PollenRegion|null{
  for(const region of regions){
    if(!region.geometry)continue;
    const coords=region.geometry.coordinates;
    if(Array.isArray(coords)&&pointInPolygon(lat,lon,coords))return region;
  }
  return null;
}

export function PollenForecast({lat,lon,enabled}:{lat:number,lon:number,enabled:boolean}){
  const [data,setData]=useState<PollenResponse|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [expanded,setExpanded]=useState(false);
  const [showAll,setShowAll]=useState(false);
  const [loading,setLoading]=useState(false);

  // Der Pollenstand ist ein täglich aktualisiertes DWD-Produkt. Eine PWA kann
  // über den Aktualisierungstermin hinweg im Speicher bleiben; deshalb reicht
  // "einmal pro Mount" nicht. Wir laden initial, zyklisch und nach Rückkehr in
  // den Vordergrund neu. Der Worker-/Client-Cache begrenzt die Netzlast.
  useEffect(()=>{
    if(!enabled)return;
    let disposed=false,requestActive=false,firstRequest=true,lastRequestAt=0;
    const load=async()=>{
      if(requestActive||disposed)return;
      requestActive=true;lastRequestAt=Date.now();if(firstRequest)setLoading(true);
      try{
        const d=await fetchWorkerJson<PollenResponse>('dwd-pollen',{},{purpose:'general',maxAgeMs:10*60*1000,staleIfErrorMs:2*60*60*1000});
        if(disposed)return;
        if(d.error){setError(d.error);if(firstRequest)setData(null);}
        else{setData(d);setError(null);}
      }catch(err:any){
        if(!disposed){setError(err?.message||'Pollenflug-Daten konnten nicht geladen werden');if(firstRequest)setData(null);}
      }finally{
        if(!disposed&&firstRequest)setLoading(false);firstRequest=false;requestActive=false;
      }
    };
    void load();
    const timer=window.setInterval(()=>{void load()},10*60*1000);
    const onVisibility=()=>{if(document.visibilityState==='visible'&&Date.now()-lastRequestAt>=5*60*1000)void load()};
    document.addEventListener('visibilitychange',onVisibility);
    return()=>{disposed=true;window.clearInterval(timer);document.removeEventListener('visibilitychange',onVisibility)};
  },[enabled]);

  if(!enabled)return null;

  if(loading){
    return(
      <section className="card pollen-forecast pollen-compact" data-mid-view="pollen">
        <div className="pollen-summary pollen-summary-static"><span className="pollen-summary-title"><CloudSun size={17}/><span><small>Gesundheitswetter</small><strong>Pollenflug</strong></span></span><span className="pollen-status">DWD</span></div>
        <div className="pollen-loading"><small>Pollenflug-Daten werden geladen …</small></div>
      </section>
    );
  }

  if(error||!data){
    return null;
  }

  const region=findPollenRegion(lat,lon,data.regions);
  if(!region)return null;

  const regionForecasts=data.forecasts.filter(f=>f.regionId===region.id);
  if(regionForecasts.length===0)return null;

  const byPollenType=new Map<string,PollenForecastEntry[]>();
  for(const f of regionForecasts){
    const list=byPollenType.get(f.pollenType)||[];
    list.push(f);
    byPollenType.set(f.pollenType,list);
  }

  const sortedTypes=Array.from(byPollenType.keys()).sort((a,b)=>{
    const ia=data.pollenTypes.indexOf(a),ib=data.pollenTypes.indexOf(b);
    return ia===-1?99:ia-(ib===-1?99:ib);
  });

  const dateKey=(value:string|Date)=>{const date=value instanceof Date?value:new Date(value);if(Number.isNaN(date.getTime()))return String(value).slice(0,10);const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date),get=(type:string)=>parts.find(part=>part.type===type)?.value;return`${get('year')}-${get('month')}-${get('day')}`};
  const todayKey=dateKey(new Date()),allDates=[...new Set(regionForecasts.map(f=>String(f.forecastDate).slice(0,10)))].sort(),forecastDates=allDates.filter(date=>date>=todayKey).slice(0,3);
  const dateLabel=(date:string)=>{const [year,month,day]=date.split('-').map(Number),base=new Date(Date.UTC(year,Math.max(0,month-1),day,12)),todayBase=new Date(`${todayKey}T12:00:00Z`),diff=Math.round((base.getTime()-todayBase.getTime())/(24*60*60*1000));if(diff===0)return'Heute';if(diff===1)return'Morgen';if(diff===2)return'Übermorgen';return base.toLocaleDateString('de-DE',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'})};
  const todayDate=forecastDates.find(date=>date===todayKey);
  const todayEntries=sortedTypes.map(pt=>{
    const entries=byPollenType.get(pt)||[];
    return{type:pt,label:POLLEN_LABELS[pt]||pt,entry:entries.find(e=>e.forecastDate===todayDate)};
  }).filter(x=>x.entry);

  const rankedTodayEntries=todayEntries.map(item=>({...item,severity:pollenSeverity(item.entry)}))
    .filter(item=>item.severity>0)
    .sort((a,b)=>b.severity-a.severity||sortedTypes.indexOf(a.type)-sortedTypes.indexOf(b.type));
  const visibleTodayEntries=rankedTodayEntries.slice(0,3),hiddenActiveCount=Math.max(0,rankedTodayEntries.length-visibleTodayEntries.length);
  const maxTypeSeverity=(type:string)=>Math.max(0,...forecastDates.map(date=>pollenSeverity((byPollenType.get(type)||[]).find(entry=>entry.forecastDate===date))));
  const relevantTypes=sortedTypes.filter(type=>maxTypeSeverity(type)>0).sort((a,b)=>maxTypeSeverity(b)-maxTypeSeverity(a)||sortedTypes.indexOf(a)-sortedTypes.indexOf(b));
  const primaryTypes=relevantTypes.slice(0,4);
  const detailTypes=showAll?sortedTypes:primaryTypes;
  const strongestToday=rankedTodayEntries[0],todayAvailable=Boolean(todayDate),todayStatus=!todayAvailable?'DWD-Aktualisierung ausstehend':strongestToday?pollenLabel(strongestToday.entry):'keine';
  const statusLevel=strongestToday?pollenLevel(strongestToday.entry):0;
  const detailId='pollen-forecast-detail',allToggleId='pollen-forecast-all';
  const productUpdatedAt=data.productUpdatedAt?new Date(data.productUpdatedAt):null,checkedAt=data.checkedAt?new Date(data.checkedAt):null,displayUpdatedAt=productUpdatedAt&&!Number.isNaN(productUpdatedAt.getTime())?productUpdatedAt:checkedAt,checkedLabel=displayUpdatedAt&&!Number.isNaN(displayUpdatedAt.getTime())?displayUpdatedAt.toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'unbekannt',freshnessLabel=productUpdatedAt&&!Number.isNaN(productUpdatedAt.getTime())?'DWD · Produktstand':'DWD · Abruf';
  const toggleExpanded=()=>setExpanded(current=>{if(current)setShowAll(false);return!current});

  return(
    <section className={`card pollen-forecast pollen-compact${expanded?' expanded':''}`} data-mid-view="pollen">
      <button type="button" className="pollen-summary pollen-disclosure" onClick={toggleExpanded} aria-expanded={expanded} aria-controls={detailId}>
        <span className="pollen-summary-title"><CloudSun size={17}/><span><small>Gesundheitswetter</small><strong>Pollenflug</strong></span></span>
        <span className={`pollen-status pollen-level-${statusLevel}`}>{todayAvailable?'Heute':'Aktualisierung'} · {todayStatus}</span>
        <ChevronDown size={17} className={expanded?'rotated':''} aria-hidden="true"/>
      </button>
      <div className="pollen-meta"><span className="pollen-region" title={region.name} aria-label={`Pollenregion ${region.name}`}>{region.name}</span><span>{freshnessLabel} {checkedLabel}</span></div>
      {rankedTodayEntries.length>0&&<div className="pollen-chips" aria-label="Aktive Pollenbelastung heute">
        {visibleTodayEntries.map(({type,label,entry,severity})=><span key={type} className={`pollen-chip pollen-level-${Math.ceil(severity)}`} title={`${label}: ${pollenLabel(entry)}`}><span className="pollen-dot" style={{background:POLLEN_LEVEL_COLORS[Math.ceil(severity)]}} aria-hidden="true"/>{label}<b>{pollenLabel(entry)}</b></span>)}
        {hiddenActiveCount>0&&<span className="pollen-chip pollen-chip-more">+{hiddenActiveCount}</span>}
      </div>}
      {expanded&&<div id={detailId} className="pollen-detail">
        <header className="pollen-detail-head"><strong>3-Tage-Ausblick</strong><small>{relevantTypes.length?(relevantTypes.length>primaryTypes.length?`${relevantTypes.length} relevant · ${primaryTypes.length} angezeigt`:relevantTypes.length===1?'1 relevante Pollenart':`${relevantTypes.length} relevante Pollenarten`):'keine Belastung'}</small></header>
        {detailTypes.length>0?(
          <div className="pollen-grid" style={{'--pollen-days':Math.max(1,forecastDates.length)} as CSSProperties} role="table" aria-label="Pollenflug-Vorhersage ab heute">
            <div className="pollen-grid-header" role="row"><span role="columnheader">Pollenart</span>{forecastDates.map((date,i)=><span key={date} role="columnheader">{dateLabel(date)||`Tag ${i+1}`}</span>)}</div>
            {detailTypes.map(pollenType=>{
              const entries=byPollenType.get(pollenType)||[],sortedEntries=forecastDates.map(date=>entries.find(e=>e.forecastDate===date));
              return <div key={pollenType} className="pollen-grid-row" role="row"><span role="rowheader" className="pollen-type-label">{POLLEN_LABELS[pollenType]||pollenType}</span>{sortedEntries.map((entry,i)=>entry?<span key={i} role="cell" className={`pollen-value pollen-level-${pollenLevel(entry)}`} title={pollenLabel(entry)}><span className="pollen-dot" style={{background:POLLEN_LEVEL_COLORS[pollenLevel(entry)]}} aria-hidden="true"/><span>{pollenLabel(entry)}</span></span>:<span key={i} role="cell" className="pollen-value pollen-na">–</span>)}</div>;
            })}
          </div>
        ):<div className="pollen-three-day-clear">In den nächsten drei Tagen keine Pollenbelastung.</div>}
        {sortedTypes.length>primaryTypes.length&&<button id={allToggleId} type="button" className="pollen-all-toggle" onClick={()=>setShowAll(value=>!value)} aria-pressed={showAll}>{showAll?'Weniger anzeigen':'Alle 8 Pollenarten anzeigen'}</button>}
      </div>}
    </section>
  );
}
