import {useEffect,useMemo,useState,type CSSProperties} from 'react';
import {CloudRain,ExternalLink,Info,MapPin,RefreshCw} from 'lucide-react';
import {buildWorkerUrl,workerBaseCandidates} from './workerClient';
import type {Location} from './weather';

const DWD_PRODUCT_PAGE='https://www.dwd.de/DE/leistungen/wolken_niederschlagsart/wolken_niederschlagsart.html';
const DWD_DIRECT_IMAGE='https://www.dwd.de/DWD/wetter/sat/satwetter/njob_satrad.png';
const COVERAGE={west:5.45,east:15.55,south:47.0,north:55.2};
const IMAGE_BOUNDS={west:1.8,east:18.2,south:44.5,north:57.1};
const PRECIPITATION_TYPE_LEGEND=[
 {label:'großer Hagel',color:'#b000d6'},
 {label:'kleiner Hagel',color:'#d000f5'},
 {label:'Graupel',color:'#ffd633'},
 {label:'gefrierender Regen',color:'#ff1c00'},
 {label:'gefr. Sprühregen',color:'#d80000'},
 {label:'Schnee',color:'#ff21d1'},
 {label:'Schneeregen',color:'#ff70df'},
 {label:'Regen',color:'#00c778'},
 {label:'Sprühregen',color:'#19dca4'},
 {label:'nicht klassifizierbar',color:'#7f7f7f'},
 {label:'kein Niederschlag',color:'#c9c9c9'}
] as const;

function clamp(value:number,min:number,max:number){return Math.min(max,Math.max(min,value))}
function countryCode(location:Location){return String(location.country_code||location.country||'').trim().toUpperCase()}
function mercatorLatitude(latitude:number){const value=clamp(latitude,-85.05112878,85.05112878)*Math.PI/180;return Math.log(Math.tan(Math.PI/4+value/2))}
export function dwdPrecipitationTypeCoverage(location:Location){
 const latitude=Number(location.latitude),longitude=Number(location.longitude),code=countryCode(location),within=Number.isFinite(latitude)&&Number.isFinite(longitude)&&latitude>=COVERAGE.south&&latitude<=COVERAGE.north&&longitude>=COVERAGE.west&&longitude<=COVERAGE.east;
 if(code&&code!=='DE'&&code!=='DEU'&&code!=='GERMANY'&&code!=='DEUTSCHLAND')return false;
 return within;
}
export function dwdPrecipitationTypeImagePosition(location:Pick<Location,'latitude'|'longitude'>){
 const latitude=Number(location.latitude),longitude=Number(location.longitude),x=clamp((longitude-IMAGE_BOUNDS.west)/(IMAGE_BOUNDS.east-IMAGE_BOUNDS.west),0,1),north=mercatorLatitude(IMAGE_BOUNDS.north),south=mercatorLatitude(IMAGE_BOUNDS.south),y=clamp((north-mercatorLatitude(latitude))/(north-south),0,1);
 return{x:x*100,y:y*100};
}
function candidateImageUrls(slot:number){
 const workers=workerBaseCandidates('radar').map(base=>buildWorkerUrl(base,'dwd-precipitation-type-image',{slot}).toString());
 return[...new Set([...workers,`${DWD_DIRECT_IMAGE}?slot=${slot}`])];
}

export function DwdPrecipitationTypeRadar({location,enabled=true}:{location:Location;enabled?:boolean}){
 const covered=dwdPrecipitationTypeCoverage(location),[refreshSlot,setRefreshSlot]=useState(()=>Math.floor(Date.now()/300000)),[imageUrl,setImageUrl]=useState(''),[loading,setLoading]=useState(false),[failed,setFailed]=useState(false),position=useMemo(()=>dwdPrecipitationTypeImagePosition(location),[location.latitude,location.longitude]),urls=useMemo(()=>candidateImageUrls(refreshSlot),[refreshSlot]);
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
 const imageStyle={left:'50%',top:'50%',transform:`translate(-${position.x.toFixed(6)}%, -${position.y.toFixed(6)}%)`} as CSSProperties;
 return <section className="dwd-precip-type-radar" aria-label="DWD Niederschlagsarten-Radar"><header><span><small>DWD · Satellit + Radar</small><strong>Niederschlagsarten-Radar</strong><em>Ausschnitt um {location.name||'den gewählten Ort'}</em></span><div className="dwd-precip-type-radar__actions"><details className="dwd-precip-type-radar__info"><summary aria-label="Legende der Niederschlagsarten anzeigen" title="Legende"><Info size={16}/></summary><div className="dwd-precip-type-radar__legend" role="group" aria-label="DWD-Legende Niederschlagsarten"><strong>Niederschlagsart</strong>{PRECIPITATION_TYPE_LEGEND.map(item=><span key={item.label}><i style={{background:item.color}}/>{item.label}</span>)}</div></details><a href={DWD_PRODUCT_PAGE} target="_blank" rel="noreferrer" title="DWD-Originalprodukt öffnen"><ExternalLink size={16}/><span>DWD</span></a></div></header><div className={`dwd-precip-type-radar__viewport${loading?' loading':''}${failed?' failed':''}`} role="img" aria-label={`Gezoomter Ausschnitt des DWD-Produkts Wolken und Niederschlagsart um ${location.name||'den gewählten Ort'}`}>
  {!failed&&imageUrl&&<img className="dwd-precip-type-radar__image" src={imageUrl} alt="" aria-hidden="true" draggable={false} style={imageStyle}/>} 
  {loading&&<span className="dwd-precip-type-radar__status"><RefreshCw className="spin" size={18}/>DWD-Bild wird geladen …</span>}
  {failed&&<span className="dwd-precip-type-radar__status"><CloudRain size={18}/>DWD-Bild vorübergehend nicht verfügbar.</span>}
  {!loading&&!failed&&<span className="dwd-precip-type-radar__marker" aria-hidden="true"><MapPin size={22}/><i/></span>}
 </div><footer><span>Wolkenbild mit bodennaher Niederschlagsart. Legende über <b>(i)</b>.</span><small>Nur innerhalb der Deutschland-Abdeckung · Quelle: Deutscher Wetterdienst</small></footer></section>;
}
