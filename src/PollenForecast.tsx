import {useEffect,useState} from 'react';
import {fetchWorkerJson} from './workerClient';
import {CloudSun} from 'lucide-react';

type PollenRegion={id:number,name:string,geometry:{type:string,coordinates:any[]}|null};
type PollenForecastEntry={regionId:number,regionName:string,pollenType:string,pollenValue:string,pollenInt:number,forecastDate:string,expires:string,effective:string};
type PollenResponse={regions:PollenRegion[],pollenTypes:string[],forecasts:PollenForecastEntry[],provider?:string,source?:string,version?:string,checkedAt?:string,error?:string};

const POLLEN_LABELS:Record<string,string>={Hasel:'Hasel',Erle:'Erle',Esche:'Esche',Birke:'Birke','Gräser':'Gräser',Roggen:'Roggen',Beifuss:'Beifuß',Ambrosia:'Ambrosia'};
const POLLEN_VALUE_LABELS:Record<string,string>={'keine':'keine','schwach':'schwach','mäßig':'mäßig','stark':'stark'};
const POLLEN_VALUE_COLORS:Record<string,string>={'keine':'var(--param-wind)','schwach':'var(--param-sunshine)','mäßig':'var(--param-temperature-max)','stark':'var(--param-precipitation-storm)'};

function pointInPolygon(lat:number,lon:number,coordinates:any[]):boolean{
  // Coordinates can be [[[lon,lat],...]] for Polygon or [[[[lon,lat],...]],...] for MultiPolygon
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
  if(loading)return(
    <section className="card pollen-forecast" data-mid-view="pollen">
      <header><span><small>Gesundheitswetter</small><strong>Pollenflug-Vorhersage</strong></span></header>
      <div className="pollen-loading">DWD-Pollendaten werden geladen …</div>
    </section>
  );
  if(error||!data)return(
    <section className="card pollen-forecast" data-mid-view="pollen">
      <header><span><small>Gesundheitswetter</small><strong>Pollenflug-Vorhersage</strong></span></header>
      <div className="pollen-error">{error||'Keine Pollendaten verfügbar'}</div>
    </section>
  );

  const region=findPollenRegion(lat,lon,data.regions);
  if(!region){
    // Location outside Germany - show general info
    return(
      <section className="card pollen-forecast" data-mid-view="pollen">
        <header><span><small>Gesundheitswetter</small><strong>Pollenflug-Vorhersage</strong></span><em>DWD</em></header>
        <p className="pollen-outside-coverage">Pollenflug-Vorhersagen des DWD decken nur Deutschland ab. Für den gewählten Standort sind keine Pollendaten verfügbar.</p>
      </section>
    );
  }

  // Group forecasts by pollen type for this region
  const regionForecasts=data.forecasts.filter(f=>f.regionId===region.id);
  const byPollenType=new Map<string,PollenForecastEntry[]>();
  for(const f of regionForecasts){
    const list=byPollenType.get(f.pollenType)||[];
    list.push(f);
    byPollenType.set(f.pollenType,list);
  }

  // Sort by canonical pollen type order
  const sortedTypes=Array.from(byPollenType.keys()).sort((a,b)=>{
    const ia=data.pollenTypes.indexOf(a),ib=data.pollenTypes.indexOf(b);
    return ia===-1?99:ia-(ib===-1?99:ib);
  });

  // Get forecast dates
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
      <header>
        <span><CloudSun size={18}/><small>Gesundheitswetter</small><strong>Pollenflug-Vorhersage</strong></span>
        <em>DWD</em>
      </header>
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
                const color=POLLEN_VALUE_COLORS[valueLower]||'var(--muted)';
                const label=POLLEN_VALUE_LABELS[valueLower]||entry.pollenValue;
                return(
                  <span key={i} role="cell" className="pollen-value" style={{'--pollen-color':color}as React.CSSProperties}>
                    <span className="pollen-dot" style={{background:color}}/>
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
