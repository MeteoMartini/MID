import {useEffect,useState} from 'react';
import {fetchWorkerJson} from './workerClient';
import {CloudSun,RefreshCw} from 'lucide-react';

type PollenRegion={id:number,name:string,geometry:{type:string,coordinates:any[]}|null};
type PollenForecastEntry={regionId:number,regionName:string,pollenType:string,pollenValue:string,pollenInt:number,forecastDate:string,expires:string,effective:string};
type PollenResponse={regions:PollenRegion[],pollenTypes:string[],forecasts:PollenForecastEntry[],provider?:string,source?:string,version?:string,checkedAt?:string,error?:string};

const POLLEN_LABELS:Record<string,string>={Hasel:'Hasel',Erle:'Erle',Esche:'Esche',Birke:'Birke','Gräser':'Gräser',Roggen:'Roggen',Beifuss:'Beifuß',Ambrosia:'Ambrosia'};
const POLLEN_VALUE_LABELS:Record<string,string>={'keine':'keine','schwach':'schwach','mäßig':'mäßig','stark':'stark'};
const POLLEN_VALUE_INT:Record<string,number>={'keine':0,'schwach':1,'mäßig':2,'stark':3};

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
    if(!coords)continue;
    if(pointInPolygon(lat,lon,coords))return region;
  }
  return null;
}

const POLLEN_LEVEL_COLORS=['var(--param-wind)','var(--param-sunshine)','var(--param-temperature-max)','var(--param-precipitation-storm)'];

export function PollenForecast({lat,lon,enabled}:{lat:number,lon:number,enabled:boolean}){
  const[data,setData]=useState<PollenResponse|null>(null);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState('');

  useEffect(()=>{
    if(!enabled||!Number.isFinite(lat)||!Number.isFinite(lon))return;
    let cancelled=false;
    setLoading(true);setError('');
    fetchWorkerJson<PollenResponse>('dwd-pollen',{},{
      purpose:'general',timeoutMs:20000,maxAgeMs:30*60_000,staleIfErrorMs:60*60_000,cacheKey:'dwd-pollen:latest'
    }).then(response=>{
      if(cancelled)return;
      setData(response);setLoading(false);
    }).catch(err=>{
      if(cancelled)return;
      setError(err instanceof Error?err.message:String(err));setLoading(false);
    });
    return()=>{cancelled=true};
  },[lat,lon,enabled]);

  if(!enabled)return null;

  const header=<header className="pollen-header forecast-entry-head forecast-entry-head-pollen"><span><CloudSun size={16}/><small>Gesundheitswetter</small><strong>Pollenflug-Vorhersage</strong></span><em>DWD</em></header>;

  if(loading)return(
    <section className="card pollen-forecast" data-mid-view="pollen">
      {header}
      <div className="pollen-loading"><RefreshCw size={16} className="spin"/><span>DWD-Pollendaten werden geladen …</span></div>
    </section>
  );
  if(error||!data)return(
    <section className="card pollen-forecast" data-mid-view="pollen">
      {header}
      <div className="pollen-error"><span>{error||'Keine Pollendaten verfügbar'}</span></div>
    </section>
  );

  const region=findPollenRegion(lat,lon,data.regions);
  if(!region){
    return(
      <section className="card pollen-forecast" data-mid-view="pollen">
        {header}
        <p className="pollen-outside-coverage">Pollenflug-Vorhersagen des DWD decken nur Deutschland ab. Für den gewählten Standort sind keine Pollendaten verfügbar.</p>
      </section>
    );
  }

  const regionForecasts=data.forecasts.filter(f=>f.regionId===region.id);
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

  const allDates=[...new Set(regionForecasts.map(f=>f.forecastDate))].sort();
  const dateLabels=allDates.map(d=>{
    const dt=new Date(d);
    const today=new Date();
    today.setHours(0,0,0,0);
    const diff=Math.round((dt.getTime()-today.getTime())/(24*60*60*1000));
    if(diff===0)return'Heute';
    if(diff===1)return'Morgen';
    if(diff===2)return'Übermorgen';
    return dt.toLocaleDateString('de-DE',{weekday:'short',day:'numeric',month:'short'});
  });

  return(
    <section className="card pollen-forecast" data-mid-view="pollen">
      {header}
      <div className="pollen-region-info">
        <small>Pollenfluggebiet</small>
        <strong>{region.name}</strong>
      </div>
      <div className="pollen-grid" role="table" aria-label="Pollenflug-Vorhersage">
        <div className="pollen-grid-header" role="row">
          <span role="columnheader">Pollenart</span>
          {dateLabels.map((label,i)=><span key={i} role="columnheader">{label}</span>)}
        </div>
        {sortedTypes.map(pollenType=>{
          const entries=byPollenType.get(pollenType)||[];
          const sortedEntries=allDates.map(date=>entries.find(e=>e.forecastDate===date));
          return(
            <div key={pollenType} className="pollen-grid-row" role="row">
              <span role="rowheader" className="pollen-type-label">{POLLEN_LABELS[pollenType]||pollenType}</span>
              {sortedEntries.map((entry,i)=>{
                if(!entry)return<span key={i} role="cell" className="pollen-value pollen-na">–</span>;
                const valueLower=entry.pollenValue.toLowerCase();
                const intLevel=POLLEN_VALUE_INT[valueLower]??0;
                const label=POLLEN_VALUE_LABELS[valueLower]||entry.pollenValue;
                return(
                  <span key={i} role="cell" className={`pollen-value pollen-level-${intLevel}`}>
                    <span className="pollen-dot" style={{background:POLLEN_LEVEL_COLORS[intLevel]}}/>
                    {label}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
      <footer className="pollen-source">
        <small>Quelle: {data.provider||'DWD'} · {data.checkedAt?new Date(data.checkedAt).toLocaleString('de-DE'):'unbekannt'}</small>
      </footer>
    </section>
  );
}
