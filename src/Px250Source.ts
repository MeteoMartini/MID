export type Px250Meta={available:boolean;site?:string;siteName?:string;stationId?:string;radarLat?:number;radarLon?:number;distanceKm?:number;observedAt?:string;fileUrl?:string;nativeResolutionM?:number;rangeKm?:number;reason?:string};
type PxSite={code:string;wmo:string;name:string;lat:number;lon:number};
const DWD_PX250_ROOT='https://opendata.dwd.de/weather/radar/sites/px250';
const DWD_PX250_SITES:PxSite[]=[
 {code:'asb',wmo:'10103',name:'Borkum/Emden',lat:53.564011,lon:6.748292},{code:'boo',wmo:'10132',name:'Boostedt',lat:54.004381,lon:10.046899},
 {code:'drs',wmo:'10488',name:'Dresden',lat:51.124639,lon:13.768639},{code:'eis',wmo:'10780',name:'Eisberg',lat:49.540667,lon:12.402788},
 {code:'ess',wmo:'10410',name:'Essen',lat:51.405649,lon:6.967111},{code:'fbg',wmo:'10908',name:'Feldberg',lat:47.873611,lon:8.003611},
 {code:'fld',wmo:'10440',name:'Flechtdorf',lat:51.311197,lon:8.801998},{code:'hnr',wmo:'10339',name:'Hannover',lat:52.460083,lon:9.694533},
 {code:'isn',wmo:'10873',name:'Isen',lat:48.174705,lon:12.101779},{code:'mem',wmo:'10950',name:'Memmingen',lat:48.042145,lon:10.219222},
 {code:'neu',wmo:'10557',name:'Neuhaus',lat:50.500114,lon:11.135034},{code:'nhb',wmo:'10605',name:'Neuheilenbach',lat:50.109656,lon:6.548328},
 {code:'oft',wmo:'10629',name:'Offenthal',lat:49.984745,lon:8.712933},{code:'pro',wmo:'10392',name:'Prötzel',lat:52.648667,lon:13.858212},
 {code:'ros',wmo:'10169',name:'Rostock',lat:54.175660,lon:12.058076},{code:'tur',wmo:'10832',name:'Türkheim',lat:48.585379,lon:9.782675},
 {code:'umd',wmo:'10356',name:'Ummendorf',lat:52.160096,lon:11.176091}
];
function distanceM(lat1:number,lon1:number,lat2:number,lon2:number){const r=6371000,p1=lat1*Math.PI/180,p2=lat2*Math.PI/180,dp=(lat2-lat1)*Math.PI/180,dl=(lon2-lon1)*Math.PI/180,a=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*r*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}
function pxTimestamp(raw:string){const match=raw.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);return match?new Date(Date.UTC(+match[1],+match[2]-1,+match[3],+match[4],+match[5],+match[6])).toISOString():undefined}
export async function loadPx250Metadata(lat:number,lon:number):Promise<Px250Meta>{
 const site=[...DWD_PX250_SITES].sort((a,b)=>distanceM(lat,lon,a.lat,a.lon)-distanceM(lat,lon,b.lat,b.lon))[0],distance=distanceM(lat,lon,site.lat,site.lon),rangeKm=150;
 if(distance>rangeKm*1000)return{available:false,nativeResolutionM:250,rangeKm,site:site.code,siteName:site.name,distanceKm:Math.round(distance/100)/10,reason:`Kein DWD-PX250-Radarstandort innerhalb von ${rangeKm} km; nächster Standort ${site.name} in ${Math.round(distance/1000)} km.`};
 const directory=`${DWD_PX250_ROOT}/${site.code}/`;
 try{
  const response=await fetch(`${directory}?mid=${Date.now()}`,{cache:'no-store',mode:'cors',credentials:'omit'});if(!response.ok)throw new Error(`DWD-Verzeichnis HTTP ${response.status}`);const html=await response.text(),pattern=new RegExp(`rab02-tt_${site.wmo}-(\d{14})-de${site.code}-hd5`,'g'),matches=[...html.matchAll(pattern)].map(match=>({stamp:match[1],file:match[0]})).sort((a,b)=>a.stamp.localeCompare(b.stamp)),latest=matches.at(-1);
  if(!latest)return{available:false,nativeResolutionM:250,rangeKm,site:site.code,siteName:site.name,distanceKm:Math.round(distance/100)/10,reason:'Der DWD-Open-Data-Ordner enthält momentan keine aktuelle PX250-HDF5-Datei.'};
  return{available:true,site:site.code,siteName:site.name,stationId:site.wmo,radarLat:site.lat,radarLon:site.lon,distanceKm:Math.round(distance/100)/10,observedAt:pxTimestamp(latest.stamp),fileUrl:`${directory}${latest.file}`,nativeResolutionM:250,rangeKm};
 }catch(error){return{available:false,nativeResolutionM:250,rangeKm,site:site.code,siteName:site.name,distanceKm:Math.round(distance/100)/10,reason:`DWD-PX250 konnte im Browser nicht geprüft werden: ${error instanceof Error?error.message:String(error)}`}}
}
