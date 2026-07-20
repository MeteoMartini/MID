const AWC_API='https://aviationweather.gov/api/data/metar';
const NWS_ALERTS='https://api.weather.gov/alerts/active';
const DWD_WFS_PRIMARY='https://maps.dwd.de/geoserver/dwd/ows';
const DWD_WFS_BACKUP='https://brz-maps.dwd.de/geoserver/dwd/ows';
const DWD_CAP_FEED='https://www.dwd.de/DWD/warnungen/cap-feed/de/atom.xml';
const METEOALARM_FEEDS='https://feeds.meteoalarm.org/feeds/';
const TWC_NEAR='https://api.weather.com/v3/location/near';
const TWC_PWS='https://api.weather.com/v2/pws/observations/current';
const BIGDATA_REVERSE='https://api.bigdatacloud.net/data/reverse-geocode-client';
const NETATMO_PUBLIC='https://api.netatmo.com/api/getpublicdata';
const SYNOPTIC_LATEST='https://api.synopticdata.com/v2/stations/latest';
const XWEATHER_OBS='https://data.api.xweather.com/observations/closest';
const GEOSPHERE_META='https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min/metadata';
const GEOSPHERE_CURRENT='https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min';
const WORKER_VERSION='0.7.1';
const CORS={'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','access-control-allow-methods':'GET,OPTIONS','cache-control':'public, max-age=180'};
const FEED_SLUGS={
 AD:'andorra',AT:'austria',BE:'belgium',BA:'bosnia-herzegovina',BG:'bulgaria',HR:'croatia',CY:'cyprus',CZ:'czechia',DK:'denmark',EE:'estonia',FI:'finland',FR:'france',DE:'germany',GR:'greece',EL:'greece',HU:'hungary',IS:'iceland',IE:'ireland',IL:'israel',IT:'italy',LV:'latvia',LT:'lithuania',LU:'luxembourg',MT:'malta',MD:'moldova',ME:'montenegro',NL:'netherlands',MK:'republic-of-north-macedonia',NO:'norway',PL:'poland',PT:'portugal',RO:'romania',RS:'serbia',SK:'slovakia',SI:'slovenia',ES:'spain',SE:'sweden',CH:'switzerland',UA:'ukraine',GB:'united-kingdom',UK:'united-kingdom',AM:'armenia'
};
const COUNTRY_ALIASES={
 DE:'DE',GERMANY:'DE',DEUTSCHLAND:'DE',ALLEMAGNE:'DE',GERMANIA:'DE',
 AT:'AT',AUSTRIA:'AT',OESTERREICH:'AT',OSTERREICH:'AT',ÖSTERREICH:'AT',
 IT:'IT',ITALY:'IT',ITALIA:'IT',ITALIEN:'IT',ITALIE:'IT',
 US:'US',USA:'US','UNITED STATES':'US','UNITED STATES OF AMERICA':'US',VEREINIGTESTAATEN:'US',
 GB:'GB',UK:'GB','UNITED KINGDOM':'GB',GROSSBRITANNIEN:'GB',
 CH:'CH',SWITZERLAND:'CH',SCHWEIZ:'CH',SUISSE:'CH',SVIZZERA:'CH',
 FR:'FR',FRANCE:'FR',FRANKREICH:'FR',
 ES:'ES',SPAIN:'ES',SPANIEN:'ES',ESPANA:'ES',ESPAÑA:'ES',
 PT:'PT',PORTUGAL:'PT',NL:'NL',NETHERLANDS:'NL',NIEDERLANDE:'NL',NIEDERLANDE:'NL',
 BE:'BE',BELGIUM:'BE',BELGIEN:'BE',DK:'DK',DENMARK:'DK',DAENEMARK:'DK',DÄNEMARK:'DK',
 NO:'NO',NORWAY:'NO',NORWEGEN:'NO',SE:'SE',SWEDEN:'SE',SCHWEDEN:'SE',FI:'FI',FINLAND:'FI',
 IE:'IE',IRELAND:'IE',IRLAND:'IE',IS:'IS',ICELAND:'IS',ISLAND:'IS',
 PL:'PL',POLAND:'PL',POLEN:'PL',CZ:'CZ',CZECHIA:'CZ','CZECH REPUBLIC':'CZ',TSCHECHIEN:'CZ',
 SK:'SK',SLOVAKIA:'SK',SLOWAKEI:'SK',SI:'SI',SLOVENIA:'SI',SLOWENIEN:'SI',
 HR:'HR',CROATIA:'HR',KROATIEN:'HR',GR:'GR',EL:'GR',GREECE:'GR',GRIECHENLAND:'GR',
 HU:'HU',HUNGARY:'HU',UNGARN:'HU',RO:'RO',ROMANIA:'RO',RUMAENIEN:'RO',RUMÄNIEN:'RO',
 BG:'BG',BULGARIA:'BG',BULGARIEN:'BG',RS:'RS',SERBIA:'RS',SERBIEN:'RS',
 BA:'BA','BOSNIA AND HERZEGOVINA':'BA',BOSNIENHERZEGOWINA:'BA',ME:'ME',MONTENEGRO:'ME',
 MK:'MK','NORTH MACEDONIA':'MK',NORDMAZEDONIEN:'MK',AL:'AL',ALBANIA:'AL',ALBANIEN:'AL',
 EE:'EE',ESTONIA:'EE',ESTLAND:'EE',LV:'LV',LATVIA:'LV',LETTLAND:'LV',LT:'LT',LITHUANIA:'LT',LITAUEN:'LT',
 LU:'LU',LUXEMBOURG:'LU',LUXEMBURG:'LU',MT:'MT',MALTA:'MT',CY:'CY',CYPRUS:'CY',ZYPERN:'CY',
 UA:'UA',UKRAINE:'UA',MD:'MD',MOLDOVA:'MD',MOLDAU:'MD',IL:'IL',ISRAEL:'IL',AD:'AD',ANDORRA:'AD'
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
function safeDate(v){if(v===null||v===undefined||v==='')return undefined;let raw=v;if(typeof raw==='string'&&/^\d{10,13}$/.test(raw.trim()))raw=Number(raw);if(typeof raw==='number'&&Number.isFinite(raw))raw=raw<1e12?raw*1000:raw;const d=new Date(raw);return Number.isFinite(d.getTime())?d.toISOString():undefined}
function normalize(value=''){return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function directCountryCode(value=''){
 const raw=String(value||'').trim();if(!raw)return'';const upper=raw.toUpperCase();if(/^[A-Z]{2}$/.test(upper))return upper==='UK'?'GB':upper;
 const key=normalize(raw).toUpperCase();return COUNTRY_ALIASES[key]||COUNTRY_ALIASES[key.replace(/ /g,'')]||'';
}
function namedCountryHeuristic(name='',region=''){
 const text=normalize(`${name} ${region}`);
 if(/cagliari|sardegna|sardinia|sardinien|italia|italien|italy/.test(text))return'IT';
 return'';
}
function coordinateCountryFallback(lat,lon){
 // Nur konservative Rückfälle: breite Länder-Rechtecke würden Grenzregionen falsch zuordnen.
 if(lat>=38.75&&lat<=41.4&&lon>=8.0&&lon<=9.95)return'IT'; // Sardinien
 if(lat>=24&&lat<=50&&lon>=-125&&lon<=-66)return'US';
 return'';
}
async function resolveCountryCode(value,lat,lon,name='',region=''){
 const direct=directCountryCode(value);if(direct)return direct;
 const named=namedCountryHeuristic(name,region);if(named)return named;
 try{
  const u=new URL(BIGDATA_REVERSE);u.searchParams.set('latitude',String(lat));u.searchParams.set('longitude',String(lon));u.searchParams.set('localityLanguage','en');
  const data=await fetchJson(u.toString());const reverse=directCountryCode(data?.countryCode||data?.countryName);if(reverse)return reverse;
 }catch{}
 return coordinateCountryFallback(lat,lon);
}
const AREA_TERM_GROUPS=[['sardegna','sardinia','sardinien']];
function termsFor(...values){
 const terms=values.flatMap(v=>normalize(v).split(/\s+/)).filter(x=>x.length>=3&&!['stadt','gemeinde','bezirk','landkreis','kreis','region','bundesland'].includes(x));
 const expanded=new Set(terms);for(const group of AREA_TERM_GROUPS)if(group.some(x=>expanded.has(x)))for(const x of group)expanded.add(x);return[...expanded];
}
function pointInRing(lat,lon,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const xi=Number(ring[i]?.[0]),yi=Number(ring[i]?.[1]),xj=Number(ring[j]?.[0]),yj=Number(ring[j]?.[1]);if(![xi,yi,xj,yj].every(Number.isFinite))continue;const hit=((yi>lat)!==(yj>lat))&&(lon<(xj-xi)*(lat-yi)/((yj-yi)||1e-12)+xi);if(hit)inside=!inside}return inside}
function pointInPolygonCoords(lat,lon,rings){if(!Array.isArray(rings)||!rings.length||!pointInRing(lat,lon,rings[0]))return false;return !rings.slice(1).some(r=>pointInRing(lat,lon,r))}
function pointInGeometry(lat,lon,g){if(!g)return false;if(g.type==='Polygon')return pointInPolygonCoords(lat,lon,g.coordinates);if(g.type==='MultiPolygon')return(g.coordinates||[]).some(p=>pointInPolygonCoords(lat,lon,p));if(g.type==='GeometryCollection')return(g.geometries||[]).some(x=>pointInGeometry(lat,lon,x));return false}
function parseCapPolygon(value){return String(value).trim().split(/\s+/).map(pair=>pair.split(',').map(Number)).filter(x=>x.length>=2&&x.every(Number.isFinite)).map(([lat,lon])=>[lon,lat])}
function parseCircle(value){const m=String(value).trim().match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\s+([\d.]+)$/);return m?{lat:Number(m[1]),lon:Number(m[2]),radiusKm:Number(m[3])}:null}
function localMatch(xml,lat,lon,name='',region='',district=''){
 const polygons=tagValues(xml,'polygon').map(parseCapPolygon).filter(x=>x.length>=3);if(polygons.some(p=>pointInRing(lat,lon,p)))return true;
 const circles=tagValues(xml,'circle').map(parseCircle).filter(Boolean);if(circles.some(c=>distance(lat,lon,c.lat,c.lon)<=c.radiusKm*1000))return true;
 if(polygons.length||circles.length)return false;
 const area=normalize(tagValues(xml,'areaDesc').join(' ')),terms=termsFor(name,region,district);return terms.some(t=>area.includes(t));
}
function awarenessLevel(xml,severity,explicit){
 const direct=String(explicit??'').toLowerCase();if(['purple','red','orange','yellow'].includes(direct))return direct;
 const n=Number(explicit);if(Number.isFinite(n)){if(n>=4)return'purple';if(n===3)return'red';if(n===2)return'orange';if(n===1)return'yellow'}
 const params=blocks(xml,'parameter');let raw='';for(const p of params){const key=tagValue(p,'valueName').toLowerCase();if(key.includes('awareness_level')||key==='warnlevel'||key.includes('warning level')){raw=tagValue(p,'value');break}}
 const digit=String(raw).match(/\b([1-4])\b/)?.[1];if(digit==='4')return String(raw).toLowerCase().includes('red')?'red':'purple';if(digit==='3')return String(raw).toLowerCase().includes('orange')?'orange':'red';if(digit==='2')return String(raw).toLowerCase().includes('yellow')?'yellow':'orange';if(digit==='1')return'yellow';
 const s=String(severity||'').toLowerCase();if(s==='extreme')return'purple';if(s==='severe')return'red';if(s==='moderate')return'orange';if(s==='minor')return'yellow';return'unknown';
}
function bestInfo(xml,language='de'){
 const infos=blocks(xml,'info');if(!infos.length)return xml;const lang=String(language||'de').toLowerCase();
 return infos.find(x=>tagValue(x,'language').toLowerCase().startsWith(lang))||infos.find(x=>tagValue(x,'language').toLowerCase().startsWith('de'))||infos.find(x=>tagValue(x,'language').toLowerCase().startsWith('en'))||infos[0];
}
function parseCap(xml,source,url,lat,lon,name,region,district,language='de'){
 const status=tagValue(xml,'status'),msgType=tagValue(xml,'msgType');if(status&&status.toLowerCase()!=='actual')return null;if(msgType&&['cancel','error'].includes(msgType.toLowerCase()))return null;
 const info=bestInfo(xml,language),expires=safeDate(tagValue(info,'expires')||tagValue(xml,'expires'));if(expires&&new Date(expires).getTime()<Date.now())return null;
 const combined=`${xml}\n${info}`;if(!localMatch(combined,lat,lon,name,region,district))return null;
 const headline=tagValue(info,'headline')||tagValue(info,'event')||tagValue(xml,'title');if(!headline)return null;
 const severity=tagValue(info,'severity'),description=tagValue(info,'description')||tagValue(xml,'description')||tagValue(xml,'summary'),instruction=tagValue(info,'instruction');
 return{id:tagValue(xml,'identifier')||tagValue(xml,'guid')||url||headline,headline,description:description||'Für diese amtliche Warnung liegt kein zusätzlicher Meldungstext vor.',instruction:instruction||undefined,level:awarenessLevel(info,severity),severity:severity||undefined,event:tagValue(info,'event')||undefined,source:tagValue(info,'senderName')||source,area:tagValues(info,'areaDesc').join(', ')||undefined,effective:safeDate(tagValue(info,'effective')),onset:safeDate(tagValue(info,'onset')),expires,url:tagValue(info,'web')||url||undefined};
}
function linkObjects(block){const out=[];for(const m of String(block).matchAll(/<(?:(?:\w+):)?link\b([^>]*)\/?\s*>/gi)){const attrs={};for(const a of m[1].matchAll(/([\w:-]+)=["']([^"']*)["']/g))attrs[a[1].toLowerCase()]=decodeXml(a[2]);if(attrs.href)out.push(attrs)}return out}
function capLink(block,base=''){
 const links=linkObjects(block),contentSrc=attrValues(block,'content','src')[0],raw=links.find(x=>String(x.type||'').toLowerCase().includes('cap+xml'))?.href||links.find(x=>/\/api\/v\d+\/warnings\//i.test(x.href||''))?.href||links.find(x=>/cap|\.xml(?:$|\?)/i.test(x.href||''))?.href||contentSrc||links.find(x=>String(x.rel||'').toLowerCase()==='alternate'&&/^https?:/i.test(x.href||''))?.href||links.find(x=>/^https?:/i.test(x.href||''))?.href||tagValues(block,'link').find(x=>/^https?:/i.test(x));
 if(!raw)return'';try{return new URL(raw,base||undefined).toString()}catch{return raw}
}
function embeddedCap(block){
 const decoded=decodeXml(block);const start=decoded.search(/<(?:\w+:)?alert\b/i);if(start<0)return'';return decoded.slice(start);
}
async function fetchText(url,headers={}){const r=await fetch(url,{headers:{'User-Agent':`MID-weather-dashboard/${WORKER_VERSION} (+https://github.com/MeteoMartini/MID)`,...headers},redirect:'follow'});if(!r.ok)throw new Error(`${url} HTTP ${r.status}`);return r.text()}
async function fetchJson(url,headers={}){const r=await fetch(url,{headers:{'User-Agent':`MID-weather-dashboard/${WORKER_VERSION} (+https://github.com/MeteoMartini/MID)`,'Accept':'application/json',...headers},redirect:'follow'});if(!r.ok)throw new Error(`${url} HTTP ${r.status}`);return r.json()}
function dedupeAlerts(alerts){const seen=new Set();return alerts.filter(a=>{const key=a.id||`${a.headline}|${a.expires}`;if(seen.has(key))return false;seen.add(key);return true}).sort((a,b)=>{const order={purple:4,red:3,orange:2,yellow:1,unknown:0};return(order[b.level]??0)-(order[a.level]??0)||String(a.onset||a.effective||'').localeCompare(String(b.onset||b.effective||''))})}
function featureProp(properties,...keys){if(!properties||typeof properties!=='object')return undefined;const map=new Map(Object.entries(properties).map(([k,v])=>[k.toLowerCase(),v]));for(const k of keys){const v=map.get(k.toLowerCase());if(v!==undefined&&v!==null&&v!=='')return v}return undefined}
function dwdColorLevel(value){const rgb=String(value||'').match(/\d+(?:\.\d+)?/g)?.slice(0,3).map(Number);if(!rgb||rgb.length<3)return undefined;const[r,g,b]=rgb;if((b>120&&b>g)||(r>170&&b>130&&g<190))return'purple';if(r>190&&g<110)return'red';if(r>190&&g>=110&&g<220)return'orange';if(r>170&&g>=170)return'yellow';return undefined}
function dwdFeatureAlert(feature){
 const p=feature?.properties??{},expires=safeDate(featureProp(p,'EXPIRES'));if(expires&&new Date(expires).getTime()<Date.now())return null;
 const status=String(featureProp(p,'STATUS')||'Actual').toLowerCase(),msgType=String(featureProp(p,'MSGTYPE')||'Alert').toLowerCase();if(status!=='actual'||['cancel','error'].includes(msgType))return null;
 const headline=String(featureProp(p,'HEADLINE','EVENT')||'Amtliche Wetterwarnung'),severity=String(featureProp(p,'SEVERITY')||'');
 return{id:String(featureProp(p,'IDENTIFIER')||feature?.id||headline),headline,description:cleanText(String(featureProp(p,'DESCRIPTION')||'Für diese amtliche Warnung liegt kein zusätzlicher Meldungstext vor.')),instruction:cleanText(String(featureProp(p,'INSTRUCTION')||''))||undefined,level:awarenessLevel('',severity,dwdColorLevel(featureProp(p,'EC_AREA_COLOR'))||featureProp(p,'WARNLEVEL','WARNING_LEVEL','LEVEL')),severity:severity||undefined,event:String(featureProp(p,'EVENT')||'')||undefined,source:String(featureProp(p,'SENDERNAME','CONTACT')||'Deutscher Wetterdienst (DWD)'),area:String(featureProp(p,'NAME','AREADESC')||'')||undefined,effective:safeDate(featureProp(p,'EFFECTIVE','SENT')),onset:safeDate(featureProp(p,'ONSET')),expires,url:String(featureProp(p,'WEB')||'https://www.dwd.de/warnungen')};
}
async function dwdWfsFrom(base,lat,lon){
 const delta=.025,u=new URL(base);u.searchParams.set('service','WFS');u.searchParams.set('version','2.0.0');u.searchParams.set('request','GetFeature');u.searchParams.set('typeName','dwd:Warnungen_Gemeinden');u.searchParams.set('outputFormat','application/json');u.searchParams.set('CRS','CRS:84');u.searchParams.set('srsName','CRS:84');u.searchParams.set('bbox',`${(lon-delta).toFixed(5)},${(lat-delta).toFixed(5)},${(lon+delta).toFixed(5)},${(lat+delta).toFixed(5)},CRS:84`);
 const data=await fetchJson(u.toString()),features=Array.isArray(data?.features)?data.features:[];
 const exact=features.filter(f=>pointInGeometry(lat,lon,f.geometry));return dedupeAlerts((exact.length?exact:features.filter(f=>{const b=f?.bbox;return Array.isArray(b)&&b.length>=4&&lon>=Number(b[0])&&lon<=Number(b[2])&&lat>=Number(b[1])&&lat<=Number(b[3])})).map(dwdFeatureAlert).filter(Boolean));
}
async function dwdWfsAlerts(lat,lon){let lastError;for(const base of[DWD_WFS_PRIMARY,DWD_WFS_BACKUP]){try{return{alerts:await dwdWfsFrom(base,lat,lon),endpoint:base}}catch(e){lastError=e}}throw lastError||new Error('DWD-WFS nicht erreichbar')}
function entryScore(item,name,region,district){const text=normalize(cleanText(item)),terms=termsFor(name,district,region);let score=0;for(const t of terms){if(text.includes(t))score+=t===normalize(name)?12:5}if(tagValues(item,'polygon').length||tagValues(item,'circle').length)score+=20;const updated=safeDate(tagValue(item,'updated')||tagValue(item,'published')||tagValue(item,'sent'));if(updated)score+=Math.max(0,5-(Date.now()-new Date(updated).getTime())/86400000);return score}
async function capFeedAlerts(feedUrl,source,lat,lon,name,region,district,language='de',maxDocuments=24){
 const xml=await fetchText(feedUrl),rawItems=blocks(xml,'entry').length?blocks(xml,'entry'):blocks(xml,'item'),items=rawItems.map((item,index)=>({item,index,score:entryScore(item,name,region,district),link:capLink(item,feedUrl),embedded:embeddedCap(item)})).sort((a,b)=>b.score-a.score||a.index-b.index),alerts=[],candidates=[];
 for(const x of items){
  const directXml=x.embedded||x.item,direct=parseCap(directXml,source,x.link,lat,lon,name,region,district,language);if(direct){alerts.push(direct);continue}
  if(x.link)candidates.push(x);
 }
 for(let i=0;i<Math.min(candidates.length,maxDocuments);i+=6){const batch=candidates.slice(i,i+6);const results=await Promise.allSettled(batch.map(async x=>{const capXml=await fetchText(x.link,{'Accept':'application/cap+xml, application/xml, text/xml, application/atom+xml;q=0.8, */*;q=0.5'});return parseCap(embeddedCap(capXml)||capXml,source,x.link,lat,lon,name,region,district,language)}));for(const r of results)if(r.status==='fulfilled'&&r.value)alerts.push(r.value)}
 return dedupeAlerts(alerts);
}
async function dwdAlerts(lat,lon,name,region,district,language){
 try{const wfs=await dwdWfsAlerts(lat,lon);return{alerts:wfs.alerts,provider:'Deutscher Wetterdienst (DWD)',coverage:'Deutschland · amtliche DWD-WFS-Warnungen auf Gemeindeebene',sourceStatus:{primary:'DWD WFS',endpoint:wfs.endpoint}}}
 catch(wfsError){const alerts=await capFeedAlerts(DWD_CAP_FEED,'Deutscher Wetterdienst (DWD)',lat,lon,name,region,district,language,16);return{alerts,provider:'Deutscher Wetterdienst (DWD)',coverage:'Deutschland · amtliche DWD-CAP-Warnungen (Fallback)',sourceStatus:{primary:'DWD CAP',fallbackReason:wfsError instanceof Error?wfsError.message:String(wfsError)}}}
}
async function nwsAlerts(lat,lon){
 const u=new URL(NWS_ALERTS);u.searchParams.set('point',`${lat.toFixed(4)},${lon.toFixed(4)}`);u.searchParams.set('status','actual');u.searchParams.set('message_type','alert,update');
 const d=await fetchJson(u.toString(),{'Accept':'application/geo+json'});return(d.features??[]).map(f=>{const p=f.properties??{},severity=String(p.severity||'');return{id:String(p.id||f.id||p.headline),headline:String(p.headline||p.event||'Amtliche Wetterwarnung'),description:String(p.description||'Für diese amtliche Warnung liegt kein zusätzlicher Meldungstext vor.'),instruction:p.instruction||undefined,level:awarenessLevel('',severity),severity,event:p.event||undefined,source:p.senderName||'NOAA / National Weather Service',area:p.areaDesc||undefined,effective:safeDate(p.effective),onset:safeDate(p.onset),expires:safeDate(p.expires),url:p['@id']||f.id||undefined}});
}
async function officialAlerts(lat,lon,country,name,region,district,language){
 const c=await resolveCountryCode(country,lat,lon,name,region);if(c==='DE'){const result=await dwdAlerts(lat,lon,name,region,district,language);return{...result,countryCode:c}}
 if(c==='US'){const alerts=await nwsAlerts(lat,lon);return{alerts:dedupeAlerts(alerts),provider:'NOAA / National Weather Service',coverage:'USA · amtliche CAP-Warnungen',countryCode:c}}
 const slug=FEED_SLUGS[c];if(slug){const url=`${METEOALARM_FEEDS}meteoalarm-legacy-atom-${slug}`,alerts=await capFeedAlerts(url,'MeteoAlarm / nationale Wetterbehörde',lat,lon,name,region,district,language,30);return{alerts,provider:'MeteoAlarm / nationale Wetterbehörde',coverage:`Europa · amtliche CAP-Warnungen · ${c}`,countryCode:c,sourceStatus:{primary:'MeteoAlarm Atom/CAP',endpoint:url}}}
 return{alerts:[],provider:'CAP',coverage:'Das Land konnte nicht sicher bestimmt werden oder besitzt keinen im öffentlichen MID-Proxy hinterlegten amtlichen CAP-Feed.',countryCode:c||undefined};
}
async function metarRows(lat,lon,radiusKm){
 const dLat=radiusKm/111,dLon=radiusKm/(111*Math.max(.25,Math.cos(lat*Math.PI/180))),bbox=[lon-dLon,lat-dLat,lon+dLon,lat+dLat].map(v=>v.toFixed(3)).join(','),api=new URL(AWC_API);
 api.searchParams.set('format','json');api.searchParams.set('hoursBeforeNow','2');api.searchParams.set('bbox',bbox);
 const response=await fetch(api,{headers:{'User-Agent':`MID-weather-dashboard/${WORKER_VERSION} (+https://github.com/MeteoMartini/MID)`,'Accept':'application/json'}});
 if(response.status===204)return[];if(!response.ok)throw new Error(`AviationWeather HTTP ${response.status}`);
 const raw=await response.json();
 return(Array.isArray(raw)?raw:raw?.data??[]).map(r=>{const rlat=number(r.lat??r.latitude),rlon=number(r.lon??r.longitude);if(rlat===undefined||rlon===undefined)return null;const dist=distance(lat,lon,rlat,rlon);if(dist>radiusKm*1000)return null;return{icaoId:r.icaoId??r.icao_id??r.station_id,name:r.name??r.site??r.icaoId??r.station_id,lat:rlat,lon:rlon,elevation:number(r.elev??r.elevation??r.elevation_m),reportTime:safeDate(r.reportTime??r.obsTime??r.observation_time??r.receiptTime),temp:number(r.temp??r.temperature??r.temp_c),dewp:number(r.dewp??r.dewPoint??r.dewpoint_c),relativeHumidity:number(r.relativeHumidity??r.humidity),windDirection:number(r.wdir??r.windDirection??r.wind_dir_degrees),windSpeed:number(r.wspd??r.windSpeed??r.wind_speed_kt),windGust:number(r.wgst??r.windGust??r.wind_gust_kt),pressure:number(r.altim??r.pressureMsl??r.sea_level_pressure_mb),cloudCover:number(r.cloudCover),provider:'NOAA AviationWeather / METAR-WMO',distance:dist,windUnit:'kt'}}).filter(Boolean);
}

let geoSphereMetadataCache={expires:0,stations:[]};
function geoSphereApplies(lat,lon){return lat>=46.35&&lat<=49.05&&lon>=9.45&&lon<=17.3}
function geoSphereStationArray(data){if(Array.isArray(data?.stations))return data.stations;if(Array.isArray(data?.station_metadata))return data.station_metadata;if(Array.isArray(data?.metadata?.stations))return data.metadata.stations;if(Array.isArray(data?.data?.stations))return data.data.stations;return[]}
async function geoSphereMetadata(){
 if(geoSphereMetadataCache.expires>Date.now()&&geoSphereMetadataCache.stations.length)return geoSphereMetadataCache.stations;
 const raw=await fetchJson(GEOSPHERE_META),stations=geoSphereStationArray(raw).map(st=>({id:String(st?.id??st?.station_id??''),name:String(st?.name??st?.station_name??st?.id??'GeoSphere-Station'),lat:number(st?.lat??st?.latitude),lon:number(st?.lon??st?.longitude),elevation:number(st?.altitude??st?.height??st?.elevation),active:st?.is_active!==false})).filter(st=>st.id&&st.active&&st.lat!==undefined&&st.lon!==undefined);
 geoSphereMetadataCache={expires:Date.now()+6*60*60*1000,stations};return stations;
}
function geoSphereLast(value){const raw=value?.data??value?.values??value?.value??value;if(Array.isArray(raw)){for(let i=raw.length-1;i>=0;i--){const n=number(raw[i]);if(n!==undefined)return n}return undefined}return number(raw)}
function geoSphereParam(feature,name){const props=feature?.properties??feature,parameters=props?.parameters??props?.parameter??props;return geoSphereLast(parameters?.[name]??parameters?.[name.toLowerCase()]??parameters?.[name.toUpperCase()])}
function geoSphereFeatureId(feature){const station=feature?.properties?.station;return String(feature?.properties?.station_id??(station&&typeof station==='object'?station.id:station)??feature?.station_id??feature?.id??'')}
async function geoSphereRows(lat,lon,radiusKm){
 if(!geoSphereApplies(lat,lon))return[];
 const meta=await geoSphereMetadata(),nearby=meta.map(st=>({...st,distance:distance(lat,lon,st.lat,st.lon)})).filter(st=>st.distance<=Math.min(120,radiusKm)*1000).sort((a,b)=>a.distance-b.distance).slice(0,14);if(!nearby.length)return[];
 const current=new URL(GEOSPHERE_CURRENT);current.searchParams.set('parameters','TL,TP,RF,P,FF,DD,FFX,RR');current.searchParams.set('station_ids',nearby.map(st=>st.id).join(','));current.searchParams.set('output_format','geojson');
 let raw;try{raw=await fetchJson(current.toString())}catch{current.searchParams.set('parameters','TL,RR,FF');raw=await fetchJson(current.toString())}
 const features=Array.isArray(raw?.features)?raw.features:Array.isArray(raw?.data)?raw.data:Array.isArray(raw)?raw:[],byId=new Map(nearby.map(st=>[st.id,st])),timestamp=safeDate(Array.isArray(raw?.timestamps)?raw.timestamps.at(-1):raw?.timestamp);
 return features.map(feature=>{const id=geoSphereFeatureId(feature),metaStation=byId.get(id),coordinates=feature?.geometry?.coordinates??[],slon=metaStation?.lon??number(coordinates[0]),slat=metaStation?.lat??number(coordinates[1]);if(!metaStation||slat===undefined||slon===undefined)return null;const temp=geoSphereParam(feature,'TL');if(temp===undefined)return null;return{stationId:id,name:metaStation.name,lat:slat,lon:slon,elevation:metaStation.elevation,reportTime:timestamp??safeDate(feature?.properties?.timestamp),temp,dewp:geoSphereParam(feature,'TP'),relativeHumidity:geoSphereParam(feature,'RF'),pressure:geoSphereParam(feature,'P'),windSpeed:(()=>{const v=geoSphereParam(feature,'FF');return v===undefined?undefined:v*3.6})(),windDirection:geoSphereParam(feature,'DD'),windGust:(()=>{const v=geoSphereParam(feature,'FFX');return v===undefined?undefined:v*3.6})(),precipitation:geoSphereParam(feature,'RR'),provider:'GeoSphere Austria / TAWES',distance:metaStation.distance,windUnit:'kmh',qcStatus:1}}).filter(Boolean);
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
function latestNetatmoMeasure(measures){
 const out={timestamp:0};for(const module of Object.values(measures||{})){const types=Array.isArray(module?.type)?module.type:[],res=module?.res&&typeof module.res==='object'?module.res:{},latest=Object.keys(res).map(Number).filter(Number.isFinite).sort((a,b)=>b-a)[0];if(!latest)continue;const values=res[String(latest)]??res[latest]??[];if(latest<out.timestamp)continue;out.timestamp=latest;types.forEach((type,i)=>{const v=number(values?.[i]);if(v!==undefined)out[String(type).toLowerCase()]=v});for(const key of['rain_60min','rain_24h','rain_live','wind_strength','wind_angle','gust_strength','gust_angle']){const v=number(module?.[key]);if(v!==undefined)out[key]=v}}
 return out;
}
async function netatmoRows(lat,lon,radiusKm,accessToken){
 if(!accessToken)return[];const r=Math.min(45,Math.max(8,radiusKm)),dLat=r/111,dLon=r/(111*Math.max(.25,Math.cos(lat*Math.PI/180))),u=new URL(NETATMO_PUBLIC);u.searchParams.set('lat_ne',String(lat+dLat));u.searchParams.set('lon_ne',String(lon+dLon));u.searchParams.set('lat_sw',String(lat-dLat));u.searchParams.set('lon_sw',String(lon-dLon));u.searchParams.set('filter','true');u.searchParams.set('required_data','temperature');
 const response=await fetch(u,{headers:{Authorization:`Bearer ${accessToken}`,Accept:'application/json'}});if(!response.ok)throw new Error(`Netatmo HTTP ${response.status}`);const raw=await response.json(),stations=raw?.body??raw?.data??[];
 return(Array.isArray(stations)?stations:[]).map(st=>{const location=st?.place?.location??st?.location??[],slon=number(location?.[0]??st?.lon),slat=number(location?.[1]??st?.lat);if(slat===undefined||slon===undefined)return null;const dist=distance(lat,lon,slat,slon);if(dist>r*1000)return null;const m=latestNetatmoMeasure(st?.measures),temp=number(m.temperature);if(temp===undefined||!m.timestamp)return null;return{stationId:st?._id??st?.id,name:st?.place?.city||st?.place?.street||'Netatmo PWS',lat:slat,lon:slon,elevation:number(st?.place?.altitude),reportTime:new Date(m.timestamp*1000).toISOString(),temp,relativeHumidity:number(m.humidity),pressure:number(m.pressure),windSpeed:number(m.wind_strength),windDirection:number(m.wind_angle),windGust:number(m.gust_strength),precipitation:number(m.rain_60min??m.rain_live),provider:'Netatmo Weathermap PWS (autorisierter API-Zugang)',distance:dist,windUnit:'kmh',qcStatus:1}}).filter(Boolean).slice(0,35);
}
function synopticObservation(observations,names){for(const name of names){const key=Object.keys(observations||{}).find(k=>k===name||k.startsWith(`${name}_value`));if(!key)continue;const raw=observations[key],value=number(raw?.value??raw?.[0]?.value??raw),date=raw?.date_time??raw?.[0]?.date_time; if(value!==undefined)return{value,date}}return{};}
async function synopticRows(lat,lon,radiusKm,token){
 if(!token)return[];const miles=Math.min(60,Math.max(8,radiusKm))*0.621371,u=new URL(SYNOPTIC_LATEST);u.searchParams.set('token',token);u.searchParams.set('radius',`${lat.toFixed(5)},${lon.toFixed(5)},${miles.toFixed(1)}`);u.searchParams.set('limit','35');u.searchParams.set('within','120');u.searchParams.set('status','active');u.searchParams.set('vars','air_temp,relative_humidity,dew_point_temperature,sea_level_pressure,pressure,wind_speed,wind_direction,wind_gust,precip_accum_one_hour');u.searchParams.set('units','temp|C,speed|kts,pres|mb,height|m,precip|mm');u.searchParams.set('qc','on');u.searchParams.set('qc_remove_data','on');u.searchParams.set('output','json');
 const response=await fetch(u,{headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`Synoptic HTTP ${response.status}`);const raw=await response.json();if(Number(raw?.SUMMARY?.RESPONSE_CODE)===200)throw new Error('Synoptic-Token nicht autorisiert');
 return(Array.isArray(raw?.STATION)?raw.STATION:[]).map(st=>{const slat=number(st?.LATITUDE),slon=number(st?.LONGITUDE);if(slat===undefined||slon===undefined)return null;const obs=st?.OBSERVATIONS??{},temp=synopticObservation(obs,['air_temp']),hum=synopticObservation(obs,['relative_humidity']),dew=synopticObservation(obs,['dew_point_temperature']),pressure=synopticObservation(obs,['sea_level_pressure','pressure','altimeter']),wind=synopticObservation(obs,['wind_speed']),direction=synopticObservation(obs,['wind_direction']),gust=synopticObservation(obs,['wind_gust']),precip=synopticObservation(obs,['precip_accum_one_hour']),dist=number(st?.DISTANCE)!==undefined?number(st.DISTANCE)*1609.344:distance(lat,lon,slat,slon);if(temp.value===undefined||dist>Math.min(60,radiusKm)*1000)return null;return{stationId:st?.STID,name:st?.NAME||st?.STID,lat:slat,lon:slon,elevation:number(st?.ELEVATION),reportTime:temp.date||hum.date||wind.date,temp:temp.value,dewp:dew.value,relativeHumidity:hum.value,pressure:pressure.value,windSpeed:wind.value,windDirection:direction.value,windGust:gust.value,precipitation:precip.value,provider:`Synoptic Data / MesoWest-MADIS${st?.MNET_ID?` (${st.MNET_ID})`:''}`,distance:dist,windUnit:'kt',qcStatus:st?.QC_FLAGGED?1:2}}).filter(Boolean);
}
async function xweatherRows(lat,lon,radiusKm,clientId,clientSecret){
 if(!clientId||!clientSecret)return[];const u=new URL(XWEATHER_OBS);u.searchParams.set('p',`${lat.toFixed(5)},${lon.toFixed(5)}`);u.searchParams.set('limit','20');u.searchParams.set('filter','pws');u.searchParams.set('client_id',clientId);u.searchParams.set('client_secret',clientSecret);
 const response=await fetch(u,{headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`Xweather HTTP ${response.status}`);const raw=await response.json();if(raw?.success===false)throw new Error(raw?.error?.description||'Xweather-Abruf fehlgeschlagen');const list=Array.isArray(raw?.response)?raw.response:raw?.response?[raw.response]:[];
 return list.map(st=>{const ob=st?.ob??{},slat=number(st?.loc?.lat),slon=number(st?.loc?.long);if(slat===undefined||slon===undefined)return null;const dist=number(st?.relativeTo?.distanceKM)!==undefined?number(st.relativeTo.distanceKM)*1000:distance(lat,lon,slat,slon),trust=number(ob?.trustFactor),qc=number(ob?.QCcode);if(dist>Math.min(60,radiusKm)*1000||qc===0||(trust!==undefined&&trust<65))return null;return{stationId:st?.id,name:st?.place?.name||st?.id,lat:slat,lon:slon,elevation:number(st?.profile?.elevM),reportTime:ob?.dateTimeISO||st?.obDateTime,temp:number(ob?.tempC),dewp:number(ob?.dewpointC),relativeHumidity:number(ob?.humidity),pressure:number(ob?.pressureMB),windSpeed:number(ob?.windSpeedKTS),windDirection:number(ob?.windDirDEG),windGust:number(ob?.windGustKTS),cloudCover:number(ob?.sky),precipitation:number(ob?.precipMM),provider:`Xweather Observations${st?.dataSource?` / ${st.dataSource}`:''} (lizenzierter API-Zugang)`,distance:dist,windUnit:'kt',qcStatus:qc===undefined?1:qc>0?2:0,trustFactor:trust}}).filter(x=>x&&number(x.temp)!==undefined);
}

export default{async fetch(request,env){
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:CORS});
 const u=new URL(request.url),mode=u.searchParams.get('mode')||'';
 if(mode==='health')return json({ok:true,version:WORKER_VERSION,services:['stations','alerts','hyperlocal-networks'],providers:{'NOAA AviationWeather':true,'GeoSphere Austria':true,'Weather Underground':Boolean(env?.WEATHER_COM_API_KEY||env?.WU_API_KEY),Netatmo:Boolean(env?.NETATMO_ACCESS_TOKEN),'Synoptic Data':Boolean(env?.SYNOPTIC_TOKEN),Xweather:Boolean(env?.XWEATHER_CLIENT_ID&&env?.XWEATHER_CLIENT_SECRET)},timestamp:new Date().toISOString()});
 const lat=Number(u.searchParams.get('lat')),lon=Number(u.searchParams.get('lon'));if(!Number.isFinite(lat)||!Number.isFinite(lon))return json({error:'lat/lon required',version:WORKER_VERSION},400);
 if(mode==='alerts'){
  try{const result=await officialAlerts(lat,lon,u.searchParams.get('country')||'',u.searchParams.get('name')||'',u.searchParams.get('region')||'',u.searchParams.get('district')||'',u.searchParams.get('language')||'de');return json({...result,version:WORKER_VERSION,checkedAt:new Date().toISOString()})}
  catch(error){return json({alerts:[],error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 const radiusKm=Math.min(250,Math.max(25,Number(u.searchParams.get('radius_km'))||140)),sources=[
  {name:'NOAA AviationWeather',enabled:true,promise:metarRows(lat,lon,radiusKm)},
  {name:'GeoSphere Austria',enabled:geoSphereApplies(lat,lon),promise:geoSphereRows(lat,lon,radiusKm)},
  {name:'Weather Underground',enabled:Boolean(env?.WEATHER_COM_API_KEY||env?.WU_API_KEY),promise:weatherUndergroundRows(lat,lon,radiusKm,env?.WEATHER_COM_API_KEY||env?.WU_API_KEY)},
  {name:'Netatmo',enabled:Boolean(env?.NETATMO_ACCESS_TOKEN),promise:netatmoRows(lat,lon,radiusKm,env?.NETATMO_ACCESS_TOKEN)},
  {name:'Synoptic Data',enabled:Boolean(env?.SYNOPTIC_TOKEN),promise:synopticRows(lat,lon,radiusKm,env?.SYNOPTIC_TOKEN)},
  {name:'Xweather',enabled:Boolean(env?.XWEATHER_CLIENT_ID&&env?.XWEATHER_CLIENT_SECRET),promise:xweatherRows(lat,lon,radiusKm,env?.XWEATHER_CLIENT_ID,env?.XWEATHER_CLIENT_SECRET)}
 ],settled=await Promise.allSettled(sources.map(x=>x.promise)),rows=settled.flatMap(x=>x.status==='fulfilled'?x.value:[]).sort((a,b)=>(a.distance??999999)-(b.distance??999999)).slice(0,140),errors=settled.map((x,i)=>x.status==='rejected'?`${sources[i].name}: ${x.reason instanceof Error?x.reason.message:String(x.reason)}`:'').filter(Boolean),providers=Object.fromEntries(sources.map(x=>[x.name,x.enabled]));
 return json({data:rows,providers,diagnostics:{radiusKm,rows:rows.length,errors,sourceRows:Object.fromEntries(sources.map((x,i)=>[x.name,settled[i].status==='fulfilled'?settled[i].value.length:0]))},version:WORKER_VERSION});
}};
