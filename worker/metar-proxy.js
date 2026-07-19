const AWC_API='https://aviationweather.gov/api/data/metar';
const NWS_ALERTS='https://api.weather.gov/alerts/active';
const DWD_CAP_FEED='https://www.dwd.de/DWD/warnungen/cap-feed/de/rss.xml';
const METEOALARM_FEEDS='https://feeds.meteoalarm.org/feeds/';
const TWC_NEAR='https://api.weather.com/v3/location/near';
const TWC_PWS='https://api.weather.com/v2/pws/observations/current';
const CORS={'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','access-control-allow-methods':'GET,OPTIONS','cache-control':'public, max-age=180'};
const FEED_SLUGS={
 AD:'andorra',AT:'austria',BE:'belgium',BA:'bosnia-herzegovina',BG:'bulgaria',HR:'croatia',CY:'cyprus',CZ:'czechia',DK:'denmark',EE:'estonia',FI:'finland',FR:'france',GR:'greece',EL:'greece',HU:'hungary',IS:'iceland',IE:'ireland',IL:'israel',IT:'italy',LV:'latvia',LT:'lithuania',LU:'luxembourg',MT:'malta',MD:'moldova',ME:'montenegro',NL:'netherlands',MK:'north-macedonia',NO:'norway',PL:'poland',PT:'portugal',RO:'romania',RS:'serbia',SK:'slovakia',SI:'slovenia',ES:'spain',SE:'sweden',CH:'switzerland',UA:'ukraine',GB:'united-kingdom',UK:'united-kingdom',AM:'armenia'
};
function number(v){if(v===null||v===undefined||v==='')return undefined;const n=Number(v);return Number.isFinite(n)?n:undefined}
function distance(lat1,lon1,lat2,lon2){const r=6371000,t=x=>x*Math.PI/180,dLat=t(lat2-lat1),dLon=t(lon2-lon1),a=Math.sin(dLat/2)**2+Math.cos(t(lat1))*Math.cos(t(lat2))*Math.sin(dLon/2)**2;return 2*r*Math.asin(Math.sqrt(a))}
function at(v,i){return Array.isArray(v)?v[i]:undefined}
function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{...CORS,...headers}})}
function decodeXml(value=''){return String(value).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#39;/g,"'").replace(/&amp;/g,'&')}
function cleanText(value=''){return decodeXml(value).replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n\s+/g,'\n').trim()}
function blocks(xml,tag){const re=new RegExp(`<(?:(?:\\w+):)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:(?:\\w+):)?${tag}>`,'gi');return[...String(xml).matchAll(re)].map(m=>m[1])}
function tagValues(xml,tag){const re=new RegExp(`<(?:(?:\\w+):)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:(?:\\w+):)?${tag}>`,'gi');return[...String(xml).matchAll(re)].map(m=>cleanText(m[1])).filter(Boolean)}
function tagValue(xml,tag){return tagValues(xml,tag)[0]||''}
function attrValues(xml,tag,attr){const re=new RegExp(`<(?:(?:\\w+):)?${tag}\\b[^>]*\\b${attr}=["']([^"']+)["'][^>]*>`,'gi');return[...String(xml).matchAll(re)].map(m=>decodeXml(m[1])).filter(Boolean)}
function safeDate(v){if(!v)return undefined;const d=new Date(v);return Number.isFinite(d.getTime())?d.toISOString():undefined}
function pointInPolygon(lat,lon,coords){let inside=false;for(let i=0,j=coords.length-1;i<coords.length;j=i++){const yi=coords[i][0],xi=coords[i][1],yj=coords[j][0],xj=coords[j][1],intersect=((yi>lat)!==(yj>lat))&&(lon<(xj-xi)*(lat-yi)/((yj-yi)||1e-12)+xi);if(intersect)inside=!inside}return inside}
function parsePolygon(value){return String(value).trim().split(/\s+/).map(pair=>pair.split(',').map(Number)).filter(x=>x.length>=2&&x.every(Number.isFinite)).map(([lat,lon])=>[lat,lon])}
function parseCircle(value){const m=String(value).trim().match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\s+([\d.]+)$/);return m?{lat:Number(m[1]),lon:Number(m[2]),radiusKm:Number(m[3])}:null}
function localMatch(xml,lat,lon,name='',region=''){
 const polygons=tagValues(xml,'polygon').map(parsePolygon).filter(x=>x.length>=3);if(polygons.some(p=>pointInPolygon(lat,lon,p)))return true;
 const circles=tagValues(xml,'circle').map(parseCircle).filter(Boolean);if(circles.some(c=>distance(lat,lon,c.lat,c.lon)<=c.radiusKm*1000))return true;
 if(polygons.length||circles.length)return false;
 const area=tagValues(xml,'areaDesc').join(' ').toLowerCase(),terms=[name,region].map(x=>String(x||'').trim().toLowerCase()).filter(x=>x.length>=3);return terms.some(t=>area.includes(t));
}
function awarenessLevel(xml,severity){
 const params=blocks(xml,'parameter');let raw='';for(const p of params){const key=tagValue(p,'valueName').toLowerCase();if(key.includes('awareness_level')||key==='warnlevel'||key.includes('warning level')){raw=tagValue(p,'value');break}}
 const digit=String(raw).match(/\b([1-4])\b/)?.[1];if(digit==='4')return String(raw).toLowerCase().includes('red')?'red':'purple';if(digit==='3')return String(raw).toLowerCase().includes('orange')?'orange':'red';if(digit==='2')return String(raw).toLowerCase().includes('yellow')?'yellow':'orange';if(digit==='1')return'yellow';
 const s=String(severity||'').toLowerCase();if(s==='extreme')return'purple';if(s==='severe')return'red';if(s==='moderate')return'orange';if(s==='minor')return'yellow';return'unknown';
}
function bestInfo(xml,language='de'){
 const infos=blocks(xml,'info');if(!infos.length)return xml;
 return infos.find(x=>tagValue(x,'language').toLowerCase().startsWith(language.toLowerCase()))||infos.find(x=>tagValue(x,'language').toLowerCase().startsWith('en'))||infos[0];
}
function parseCap(xml,source,url,lat,lon,name,region,language='de'){
 const status=tagValue(xml,'status'),msgType=tagValue(xml,'msgType');if(status&&status.toLowerCase()!=='actual')return null;if(msgType&&['cancel','error'].includes(msgType.toLowerCase()))return null;
 const info=bestInfo(xml,language),expires=safeDate(tagValue(info,'expires')||tagValue(xml,'expires'));if(expires&&new Date(expires).getTime()<Date.now())return null;
 const combined=`${xml}\n${info}`;if(!localMatch(combined,lat,lon,name,region))return null;
 const headline=tagValue(info,'headline')||tagValue(info,'event')||tagValue(xml,'title');if(!headline)return null;
 const severity=tagValue(info,'severity'),description=tagValue(info,'description')||tagValue(xml,'description')||tagValue(xml,'summary'),instruction=tagValue(info,'instruction');
 return{id:tagValue(xml,'identifier')||tagValue(xml,'guid')||url||headline,headline,description:description||'Für diese amtliche Warnung liegt kein zusätzlicher Meldungstext vor.',instruction:instruction||undefined,level:awarenessLevel(info,severity),severity:severity||undefined,event:tagValue(info,'event')||undefined,source:tagValue(info,'senderName')||source,area:tagValues(info,'areaDesc').join(', ')||undefined,effective:safeDate(tagValue(info,'effective')),onset:safeDate(tagValue(info,'onset')),expires,url:url||tagValue(info,'web')||undefined};
}
function feedLinks(block){const hrefs=attrValues(block,'link','href'),plain=tagValues(block,'link');return[...hrefs,...plain].filter(u=>/^https?:\/\//i.test(u))}
async function fetchText(url,headers={}){const r=await fetch(url,{headers:{'User-Agent':'MID-weather-dashboard/0.6.0 (+https://github.com/MeteoMartini/MID)',...headers}});if(!r.ok)throw new Error(`${url} HTTP ${r.status}`);return r.text()}
async function capFeedAlerts(feedUrl,source,lat,lon,name,region,language='de'){
 const xml=await fetchText(feedUrl),items=blocks(xml,'item').length?blocks(xml,'item'):blocks(xml,'entry'),alerts=[];
 for(const item of items.slice(0,45)){
  let parsed=parseCap(item,source,feedLinks(item)[0],lat,lon,name,region,language);
  const links=feedLinks(item),capUrl=links.find(x=>/cap|\.xml(?:$|\?)/i.test(x))||links[0];
  if((!parsed||parsed.description.length<12)&&capUrl){try{const capXml=await fetchText(capUrl);parsed=parseCap(capXml,source,capUrl,lat,lon,name,region,language)}catch{}}
  if(parsed)alerts.push(parsed);
 }
 const seen=new Set();return alerts.filter(a=>{const key=a.id||`${a.headline}|${a.expires}`;if(seen.has(key))return false;seen.add(key);return true});
}
async function nwsAlerts(lat,lon){
 const u=new URL(NWS_ALERTS);u.searchParams.set('point',`${lat.toFixed(4)},${lon.toFixed(4)}`);u.searchParams.set('status','actual');u.searchParams.set('message_type','alert,update');
 const r=await fetch(u,{headers:{'User-Agent':'MID-weather-dashboard/0.6.0 (weather dashboard; https://github.com/MeteoMartini/MID)','Accept':'application/geo+json'}});if(!r.ok)throw new Error(`NWS HTTP ${r.status}`);const d=await r.json();
 return(d.features??[]).map(f=>{const p=f.properties??{},severity=String(p.severity||'');return{id:String(p.id||f.id||p.headline),headline:String(p.headline||p.event||'Amtliche Wetterwarnung'),description:String(p.description||'Für diese amtliche Warnung liegt kein zusätzlicher Meldungstext vor.'),instruction:p.instruction||undefined,level:awarenessLevel('',severity),severity,event:p.event||undefined,source:p.senderName||'NOAA / National Weather Service',area:p.areaDesc||undefined,effective:safeDate(p.effective),onset:safeDate(p.onset),expires:safeDate(p.expires),url:p['@id']||f.id||undefined}});
}
async function officialAlerts(lat,lon,country,name,region,language){
 const c=String(country||'').toUpperCase();
 if(c==='DE'){const alerts=await capFeedAlerts(DWD_CAP_FEED,'Deutscher Wetterdienst (DWD)',lat,lon,name,region,language);return{alerts,provider:'Deutscher Wetterdienst (DWD)',coverage:'Deutschland · amtliche CAP-Warnungen'}}
 if(c==='US'){const alerts=await nwsAlerts(lat,lon);return{alerts,provider:'NOAA / National Weather Service',coverage:'USA · amtliche CAP-Warnungen'}}
 const slug=FEED_SLUGS[c];if(slug){const url=`${METEOALARM_FEEDS}meteoalarm-legacy-atom-${slug}`,alerts=await capFeedAlerts(url,'MeteoAlarm / nationale Wetterbehörde',lat,lon,name,region,language);return{alerts,provider:'MeteoAlarm / nationale Wetterbehörde',coverage:'Europa · CAP-Warnungen nationaler Wetterdienste'}}
 return{alerts:[],provider:'CAP',coverage:'Für dieses Land ist im öffentlichen MID-Proxy derzeit kein amtlicher CAP-Feed hinterlegt.'};
}
async function metarRows(lat,lon,radiusKm){
 const dLat=radiusKm/111,dLon=radiusKm/(111*Math.max(.25,Math.cos(lat*Math.PI/180))),bbox=[lon-dLon,lat-dLat,lon+dLon,lat+dLat].map(v=>v.toFixed(3)).join(','),api=new URL(AWC_API);
 api.searchParams.set('format','json');api.searchParams.set('hours','2');api.searchParams.set('bbox',bbox);
 const response=await fetch(api,{headers:{'User-Agent':'MID-weather-dashboard/0.6.0'}});
 if(response.status===204)return[];if(!response.ok)throw new Error(`AviationWeather HTTP ${response.status}`);
 const raw=await response.json();
 return(Array.isArray(raw)?raw:raw?.data??[]).map(r=>{const rlat=number(r.lat??r.latitude),rlon=number(r.lon??r.longitude);if(rlat===undefined||rlon===undefined)return null;const dist=distance(lat,lon,rlat,rlon);if(dist>radiusKm*1000)return null;return{icaoId:r.icaoId??r.icao_id??r.station_id,name:r.name??r.site??r.icaoId??r.station_id,lat:rlat,lon:rlon,elevation:number(r.elev??r.elevation??r.elevation_m),reportTime:r.reportTime??r.obsTime??r.observation_time,temp:number(r.temp??r.temperature??r.temp_c),dewp:number(r.dewp??r.dewPoint??r.dewpoint_c),relativeHumidity:number(r.relativeHumidity??r.humidity),windDirection:number(r.wdir??r.windDirection??r.wind_dir_degrees),windSpeed:number(r.wspd??r.windSpeed??r.wind_speed_kt),windGust:number(r.wgst??r.windGust??r.wind_gust_kt),pressure:number(r.altim??r.pressureMsl??r.sea_level_pressure_mb),cloudCover:number(r.cloudCover),provider:'NOAA AviationWeather / METAR-WMO',distance:dist,windUnit:'kt'}}).filter(Boolean);
}
async function weatherUndergroundRows(lat,lon,radiusKm,apiKey){
 if(!apiKey)return[];
 const near=new URL(TWC_NEAR);near.searchParams.set('geocode',`${lat.toFixed(5)},${lon.toFixed(5)}`);near.searchParams.set('product','pws');near.searchParams.set('format','json');near.searchParams.set('apiKey',apiKey);
 const nr=await fetch(near);if(!nr.ok)return[];const nd=await nr.json(),loc=nd?.location??nd,ids=loc?.stationId??[],rows=[];
 for(let i=0;i<Math.min(8,Array.isArray(ids)?ids.length:0);i++){
  if(Number(at(loc?.qcStatus,i))===0)continue;
  const stationId=String(ids[i]??'');if(!stationId)continue;
  const stationLat=number(at(loc?.latitude,i)),stationLon=number(at(loc?.longitude,i)),dist=number(at(loc?.distanceKm,i));
  if(dist!==undefined&&dist>radiusKm)continue;
  const current=new URL(TWC_PWS);current.searchParams.set('stationId',stationId);current.searchParams.set('format','json');current.searchParams.set('units','m');current.searchParams.set('numericPrecision','decimal');current.searchParams.set('apiKey',apiKey);
  try{
   const cr=await fetch(current);if(!cr.ok)continue;const cd=await cr.json(),o=(cd?.observations??cd?.observation??[])[0]??cd,metric=o?.metric??{};
   rows.push({stationId,name:at(loc?.stationName,i)||stationId,lat:stationLat??number(o?.lat),lon:stationLon??number(o?.lon),elevation:number(o?.elev??o?.elevation),reportTime:o?.obsTimeUtc??o?.obsTimeLocal??at(loc?.updateTimeUtc,i),temp:number(metric?.temp??o?.temp),dewp:number(metric?.dewpt??o?.dewpt),relativeHumidity:number(o?.humidity),windDirection:number(o?.winddir),windSpeed:number(metric?.windSpeed??o?.windSpeed),windGust:number(metric?.windGust??o?.windGust),pressure:number(metric?.pressure??o?.pressure),precipitation:number(metric?.precipTotal??metric?.precipRate),provider:'Weather Underground PWS (lizenzierter API-Zugang)',distance:dist===undefined&&stationLat!==undefined&&stationLon!==undefined?distance(lat,lon,stationLat,stationLon):dist===undefined?undefined:dist*1000,windUnit:'kmh',qcStatus:Number(at(loc?.qcStatus,i))});
  }catch{}
 }
 return rows;
}
export default{async fetch(request,env){
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:CORS});
 const u=new URL(request.url),lat=Number(u.searchParams.get('lat')),lon=Number(u.searchParams.get('lon'));
 if(!Number.isFinite(lat)||!Number.isFinite(lon))return json({error:'lat/lon required'},400);
 if(u.searchParams.get('mode')==='alerts'){
  try{return json(await officialAlerts(lat,lon,u.searchParams.get('country')||'',u.searchParams.get('name')||'',u.searchParams.get('region')||'',u.searchParams.get('language')||'de'))}
  catch(error){return json({alerts:[],error:error instanceof Error?error.message:String(error)},502,{'cache-control':'no-store'})}
 }
 const radiusKm=Math.min(250,Math.max(25,Number(u.searchParams.get('radius_km'))||140));
 const settled=await Promise.allSettled([metarRows(lat,lon,radiusKm),weatherUndergroundRows(lat,lon,radiusKm,env?.WEATHER_COM_API_KEY||env?.WU_API_KEY)]),rows=settled.flatMap(x=>x.status==='fulfilled'?x.value:[]).sort((a,b)=>(a.distance??999999)-(b.distance??999999)).slice(0,80);
 return json({data:rows,providers:{metar:true,weatherUnderground:Boolean(env?.WEATHER_COM_API_KEY||env?.WU_API_KEY)}});
}};
