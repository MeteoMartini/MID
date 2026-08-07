import {useEffect,useMemo,useState,type CSSProperties} from 'react';
import {CloudRain,ExternalLink,MapPin,RefreshCw} from 'lucide-react';
import {buildWorkerUrl,workerBaseCandidates} from './workerClient';
import type {Location} from './weather';

const DWD_PRODUCT_PAGE='https://www.dwd.de/DE/leistungen/wolken_niederschlagsart/wolken_niederschlagsart.html';
const DWD_DIRECT_IMAGE='https://www.dwd.de/DWD/wetter/sat/satwetter/njob_satrad.png';
const COVERAGE={west:5.45,east:15.55,south:47.0,north:55.2};
const IMAGE_BOUNDS={west:1.8,east:18.2,south:44.5,north:57.1};

function clamp(value:number,min:number,max:number){return Math.min(max,Math.max(min,value))}
function countryCode(location:Location){return String(location.country_code||location.country||'').trim().toUpperCase()}
export function dwdPrecipitationTypeCoverage(location:Location){
 const code=countryCode(location),within=location.latitude>=COVERAGE.south&&location.latitude<=COVERAGE.north&&location.longitude>=COVERAGE.west&&location.longitude<=COVERAGE.east;
 if(code&&code!=='DE'&&code!=='DEU'&&code!=='GERMANY'&&code!=='DEUTSCHLAND')return false;
 return within;
}
function imagePosition(location:Location){
 const x=clamp((location.longitude-IMAGE_BOUNDS.west)/(IMAGE_BOUNDS.east-IMAGE_BOUNDS.west)*100,3,97),y=clamp((IMAGE_BOUNDS.north-location.latitude)/(IMAGE_BOUNDS.north-IMAGE_BOUNDS.south)*100,3,97);
 return{x,y};
}
function candidateImageUrls(slot:number){
 const workers=workerBaseCandidates('radar').map(base=>buildWorkerUrl(base,'dwd-precipitation-type-image',{slot}).toString());
 return[...new Set([...workers,`${DWD_DIRECT_IMAGE}?slot=${slot}`])];
}

export function DwdPrecipitationTypeRadar({location,enabled=true}:{location:Location;enabled?:boolean}){
 const covered=dwdPrecipitationTypeCoverage(location),[refreshSlot,setRefreshSlot]=useState(()=>Math.floor(Date.now()/300000)),[imageUrl,setImageUrl]=useState(''),[loading,setLoading]=useState(false),[failed,setFailed]=useState(false),position=useMemo(()=>imagePosition(location),[location.latitude,location.longitude]),urls=useMemo(()=>candidateImageUrls(refreshSlot),[refreshSlot]);
 useEffect(()=>{const timer=window.setInterval(()=>setRefreshSlot(Math.floor(Date.now()/300000)),60000);return()=>window.clearInterval(timer)},[]);
 useEffect(()=>{
  if(!enabled||!covered){setImageUrl('');setFailed(false);setLoading(false);return}
  let cancelled=false,index=0,probe:HTMLImageElement|undefined;
  setLoading(true);setFailed(false);
  const next=()=>{
   if(cancelled)return;
   const url=urls[index++];
   if(!url){setLoading(false);setFailed(true);return}
   probe=new Image();
   probe.referrerPolicy='no-referrer';
   probe.onload=()=>{if(cancelled)return;setImageUrl(url);setLoading(false);setFailed(false)};
   probe.onerror=next;
   probe.src=url;
  };
  next();
  return()=>{cancelled=true;if(probe){probe.onload=null;probe.onerror=null}}
 },[enabled,covered,urls]);
 if(!enabled||!covered)return null;
 const radarStyle={backgroundImage:imageUrl?`url("${imageUrl.replace(/"/g,'%22')}")`:undefined,backgroundPosition:`${position.x.toFixed(2)}% ${position.y.toFixed(2)}%`,'--dwd-radar-x':`${position.x}%`,'--dwd-radar-y':`${position.y}%`} as CSSProperties;
 return <section className="dwd-precip-type-radar" aria-label="DWD Niederschlagsarten-Radar"><header><span><small>DWD · Satellit + Radar</small><strong>Niederschlagsarten-Radar</strong><em>Ausschnitt um {location.name||'den gewählten Ort'}</em></span><a href={DWD_PRODUCT_PAGE} target="_blank" rel="noreferrer" title="DWD-Originalprodukt öffnen"><ExternalLink size={16}/><span>DWD</span></a></header><div className={`dwd-precip-type-radar__viewport${loading?' loading':''}${failed?' failed':''}`} style={radarStyle} role="img" aria-label={`Gezoomter Ausschnitt des DWD-Produkts Wolken und Niederschlagsart um ${location.name||'den gewählten Ort'}`}>
  {loading&&<span className="dwd-precip-type-radar__status"><RefreshCw className="spin" size={18}/>DWD-Bild wird geladen …</span>}
  {failed&&<span className="dwd-precip-type-radar__status"><CloudRain size={18}/>DWD-Bild vorübergehend nicht verfügbar.</span>}
  {!loading&&!failed&&<span className="dwd-precip-type-radar__marker" aria-hidden="true"><MapPin size={22}/><i/></span>}
 </div><footer><span>Wolkenbild mit bodennaher Niederschlagsart: Regen, Sprühregen, Schnee, Graupel und Hagel.</span><small>Nur innerhalb der Deutschland-Abdeckung · Quelle: Deutscher Wetterdienst</small></footer></section>;
}
