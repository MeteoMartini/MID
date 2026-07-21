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
const BRIGHTSKY_CURRENT='https://api.brightsky.dev/current_weather';
const OPENSENSEMAP_BOXES='https://api.opensensemap.org/boxes';
const WORKER_VERSION='0.7.30';
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

function stationSiteClass(name='',provider=''){
 const text=normalize(`${name} ${provider}`);if(/innenstadt|stadtmitte|city center|urban/.test(text))return'urban';if(/vorstadt|suburban/.test(text))return'suburban';if(/flughafen|airport|flugplatz|feld|warte|berg|gipfel|forst|wald/.test(text))return'rural';return'unknown';
}
function inGermanyBounds(lat,lon){return lat>=47.0&&lat<=55.3&&lon>=5.4&&lon<=15.7}
function offsetKm(lat,lon,northKm,eastKm){return{lat:lat+northKm/111,lon:lon+eastKm/(111*Math.max(.25,Math.cos(lat*Math.PI/180)))}}
async function brightSkyRows(lat,lon,radiusKm){
 if(!inGermanyBounds(lat,lon))return[];
 const reach=Math.min(48,Math.max(14,radiusKm*.42)),points=[[0,0],[reach*.33,0],[-reach*.33,0],[0,reach*.33],[0,-reach*.33],[reach*.7,reach*.35],[reach*.7,-reach*.35],[-reach*.7,reach*.35],[-reach*.7,-reach*.35]].map(([n,e])=>offsetKm(lat,lon,n,e));
 const settled=await Promise.allSettled(points.map(async point=>{const u=new URL(BRIGHTSKY_CURRENT);u.searchParams.set('lat',point.lat.toFixed(5));u.searchParams.set('lon',point.lon.toFixed(5));u.searchParams.set('max_dist',String(Math.round(Math.min(90000,radiusKm*1000))));return fetchJson(u.toString())}));
 const rows=[],seen=new Set();for(const result of settled){if(result.status!=='fulfilled')continue;const d=result.value,w=d?.weather,sources=Array.isArray(d?.sources)?d.sources:[];if(!w)continue;const source=sources.find(x=>String(x?.id??x?.source_id)===String(w?.source_id))||sources[0]||{},slat=number(source?.lat??source?.latitude),slon=number(source?.lon??source?.longitude);if(slat===undefined||slon===undefined)continue;const id=String(source?.dwd_station_id??source?.wmo_station_id??source?.id??`${slat.toFixed(4)}:${slon.toFixed(4)}`);if(seen.has(id))continue;seen.add(id);const dist=distance(lat,lon,slat,slon);if(dist>radiusKm*1000)continue;const temp=number(w?.temperature);if(temp===undefined)continue;rows.push({stationId:id,name:source?.station_name??source?.name??`DWD ${id}`,lat:slat,lon:slon,elevation:number(source?.height??source?.elevation),reportTime:safeDate(w?.timestamp??w?.observation_time),temp,dewp:number(w?.dew_point),relativeHumidity:number(w?.relative_humidity),pressureMsl:number(w?.pressure_msl),windDirection:number(w?.wind_direction_10??w?.wind_direction),windSpeed:number(w?.wind_speed_10??w?.wind_speed),windGust:number(w?.wind_gust_speed_10??w?.wind_gust_speed),cloudCover:number(w?.cloud_cover),precipitation:number(w?.precipitation_10??w?.precipitation),provider:'DWD Open Data / Bright Sky',distance:dist,windUnit:'kmh',qcStatus:2,trustFactor:98,networkClass:'official',siteClass:stationSiteClass(source?.station_name??source?.name,source?.observation_type??'DWD')});}
 return rows.sort((a,b)=>a.distance-b.distance).slice(0,18);
}
function senseMetricKey(title='',unit=''){const text=normalize(`${title} ${unit}`);if(/temperatur|temperature|lufttemperatur|air temp/.test(text)&&!/boden|soil|wasser|water/.test(text))return'temp';if(/luftfeuchte|humidity|relative humidity/.test(text))return'relativeHumidity';if(/taupunkt|dew point/.test(text))return'dewp';return''}
async function openSenseMapRows(lat,lon,radiusKm){
 const radius=Math.min(22,Math.max(6,radiusKm*.18)),dLat=radius/111,dLon=radius/(111*Math.max(.25,Math.cos(lat*Math.PI/180))),u=new URL(OPENSENSEMAP_BOXES);u.searchParams.set('bbox',`${(lon-dLon).toFixed(5)},${(lat-dLat).toFixed(5)},${(lon+dLon).toFixed(5)},${(lat+dLat).toFixed(5)}`);u.searchParams.set('exposure','outdoor');u.searchParams.set('minimal','false');
 const raw=await fetchJson(u.toString()),boxes=Array.isArray(raw)?raw:Array.isArray(raw?.data)?raw.data:[],rows=[];
 for(const box of boxes.slice(0,120)){const coords=box?.currentLocation?.coordinates??box?.loc??box?.location?.coordinates,slon=number(coords?.[0]??box?.lon),slat=number(coords?.[1]??box?.lat);if(slat===undefined||slon===undefined)continue;const dist=distance(lat,lon,slat,slon);if(dist>radius*1000)continue;const row={stationId:String(box?._id??box?.id??`${slat}:${slon}`),name:String(box?.name??box?.title??'senseBox'),lat:slat,lon:slon,elevation:number(coords?.[2]??box?.elevation),provider:'openSenseMap / senseBox (ODbL)',distance:dist,windUnit:'kmh',qcStatus:1,trustFactor:42,networkClass:'citizen',siteClass:'unknown'};let newest=0;
  for(const sensor of Array.isArray(box?.sensors)?box.sensors:[]){const measurement=sensor?.lastMeasurement??sensor?.last_measurement??{},value=number(measurement?.value??sensor?.value),timestamp=safeDate(measurement?.createdAt??measurement?.timestamp??sensor?.updatedAt),key=senseMetricKey(sensor?.title??sensor?.phenomenon,sensor?.unit);if(!key||value===undefined||!timestamp)continue;const age=Date.now()-new Date(timestamp).getTime();if(age<0||age>50*60000)continue;if(key==='temp'&&(value<-45||value>55))continue;if(key==='relativeHumidity'&&(value<0||value>100))continue;if(key==='dewp'&&(value<-60||value>40))continue;row[key]=value;newest=Math.max(newest,new Date(timestamp).getTime());}
  if(number(row.temp)===undefined)continue;row.reportTime=new Date(newest).toISOString();rows.push(row);
 }
 return rows.sort((a,b)=>a.distance-b.distance).slice(0,32);
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
function plausibleQff(value,height,stationPressure){const qff=number(value),elevation=number(height),surface=number(stationPressure);if(qff===undefined||qff<870||qff>1085)return false;if(elevation!==undefined&&elevation>=600&&qff<950)return false;if(elevation!==undefined&&surface!==undefined&&elevation>=150){const expectedLift=Math.min(155,Math.max(12,elevation*.055));if(qff-surface<expectedLift)return false}return true}
async function geoSphereRows(lat,lon,radiusKm){
 if(!geoSphereApplies(lat,lon))return[];
 const meta=await geoSphereMetadata(),nearby=meta.map(st=>({...st,distance:distance(lat,lon,st.lat,st.lon)})).filter(st=>st.distance<=Math.min(120,radiusKm)*1000).sort((a,b)=>a.distance-b.distance).slice(0,14);if(!nearby.length)return[];
 const current=new URL(GEOSPHERE_CURRENT);current.searchParams.set('parameters','TL,TP,RF,PRED,P,FF,DD,FFX,RR');current.searchParams.set('station_ids',nearby.map(st=>st.id).join(','));current.searchParams.set('output_format','geojson');
 let raw;try{raw=await fetchJson(current.toString())}catch{current.searchParams.set('parameters','TL,RR,FF');raw=await fetchJson(current.toString())}
 const features=Array.isArray(raw?.features)?raw.features:Array.isArray(raw?.data)?raw.data:Array.isArray(raw)?raw:[],byId=new Map(nearby.map(st=>[st.id,st])),timestamp=safeDate(Array.isArray(raw?.timestamps)?raw.timestamps.at(-1):raw?.timestamp);
 return features.map(feature=>{const id=geoSphereFeatureId(feature),metaStation=byId.get(id),coordinates=feature?.geometry?.coordinates??[],slon=metaStation?.lon??number(coordinates[0]),slat=metaStation?.lat??number(coordinates[1]);if(!metaStation||slat===undefined||slon===undefined)return null;const temp=geoSphereParam(feature,'TL');if(temp===undefined)return null;const stationPressure=geoSphereParam(feature,'P'),pred=geoSphereParam(feature,'PRED'),pressureMsl=plausibleQff(pred,metaStation.elevation,stationPressure)?pred:undefined;return{stationId:id,name:metaStation.name,lat:slat,lon:slon,elevation:metaStation.elevation,reportTime:timestamp??safeDate(feature?.properties?.timestamp),temp,dewp:geoSphereParam(feature,'TP'),relativeHumidity:geoSphereParam(feature,'RF'),pressureMsl,pressure:stationPressure,windSpeed:(()=>{const v=geoSphereParam(feature,'FF');return v===undefined?undefined:v*3.6})(),windDirection:geoSphereParam(feature,'DD'),windGust:(()=>{const v=geoSphereParam(feature,'FFX');return v===undefined?undefined:v*3.6})(),precipitation:geoSphereParam(feature,'RR'),provider:'GeoSphere Austria / TAWES',distance:metaStation.distance,windUnit:'kmh',qcStatus:1}}).filter(Boolean);
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
 if(!token)return[];const miles=Math.min(60,Math.max(8,radiusKm))*0.621371,u=new URL(SYNOPTIC_LATEST);u.searchParams.set('token',token);u.searchParams.set('radius',`${lat.toFixed(5)},${lon.toFixed(5)},${miles.toFixed(1)}`);u.searchParams.set('limit','35');u.searchParams.set('within','120');u.searchParams.set('status','active');u.searchParams.set('vars','air_temp,relative_humidity,dew_point_temperature,sea_level_pressure,pressure,wind_speed,wind_direction,wind_gust,precip_accum_one_hour');u.searchParams.set('units','temp|C,speed|kts,pres|mb,height|m,precip|mm');u.searchParams.set('qc','on');u.searchParams.set('qc_checks','synopticlabs');u.searchParams.set('qc_remove_data','on');u.searchParams.set('output','json');
 const response=await fetch(u,{headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`Synoptic HTTP ${response.status}`);const raw=await response.json();if(Number(raw?.SUMMARY?.RESPONSE_CODE)===200)throw new Error('Synoptic-Token nicht autorisiert');
 return(Array.isArray(raw?.STATION)?raw.STATION:[]).map(st=>{const slat=number(st?.LATITUDE),slon=number(st?.LONGITUDE);if(slat===undefined||slon===undefined)return null;const obs=st?.OBSERVATIONS??{},temp=synopticObservation(obs,['air_temp']),hum=synopticObservation(obs,['relative_humidity']),dew=synopticObservation(obs,['dew_point_temperature']),pressure=synopticObservation(obs,['sea_level_pressure','pressure','altimeter']),wind=synopticObservation(obs,['wind_speed']),direction=synopticObservation(obs,['wind_direction']),gust=synopticObservation(obs,['wind_gust']),precip=synopticObservation(obs,['precip_accum_one_hour']),dist=number(st?.DISTANCE)!==undefined?number(st.DISTANCE)*1609.344:distance(lat,lon,slat,slon);if(temp.value===undefined||dist>Math.min(60,radiusKm)*1000)return null;return{stationId:st?.STID,name:st?.NAME||st?.STID,lat:slat,lon:slon,elevation:number(st?.ELEVATION),reportTime:temp.date||hum.date||wind.date,temp:temp.value,dewp:dew.value,relativeHumidity:hum.value,pressure:pressure.value,windSpeed:wind.value,windDirection:direction.value,windGust:gust.value,precipitation:precip.value,provider:`Synoptic Data / MesoWest-MADIS${st?.MNET_ID?` (${st.MNET_ID})`:''}`,distance:dist,windUnit:'kt',qcStatus:st?.QC_FLAGGED?1:2}}).filter(Boolean);
}
async function xweatherRows(lat,lon,radiusKm,clientId,clientSecret){
 if(!clientId||!clientSecret)return[];const u=new URL(XWEATHER_OBS);u.searchParams.set('p',`${lat.toFixed(5)},${lon.toFixed(5)}`);u.searchParams.set('limit','20');u.searchParams.set('filter','pws');u.searchParams.set('client_id',clientId);u.searchParams.set('client_secret',clientSecret);
 const response=await fetch(u,{headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`Xweather HTTP ${response.status}`);const raw=await response.json();if(raw?.success===false)throw new Error(raw?.error?.description||'Xweather-Abruf fehlgeschlagen');const list=Array.isArray(raw?.response)?raw.response:raw?.response?[raw.response]:[];
 return list.map(st=>{const ob=st?.ob??{},slat=number(st?.loc?.lat),slon=number(st?.loc?.long);if(slat===undefined||slon===undefined)return null;const dist=number(st?.relativeTo?.distanceKM)!==undefined?number(st.relativeTo.distanceKM)*1000:distance(lat,lon,slat,slon),trust=number(ob?.trustFactor),qc=number(ob?.QCcode);if(dist>Math.min(60,radiusKm)*1000||qc===0||(trust!==undefined&&trust<65))return null;return{stationId:st?.id,name:st?.place?.name||st?.id,lat:slat,lon:slon,elevation:number(st?.profile?.elevM),reportTime:ob?.dateTimeISO||st?.obDateTime,temp:number(ob?.tempC),dewp:number(ob?.dewpointC),relativeHumidity:number(ob?.humidity),pressure:number(ob?.pressureMB),windSpeed:number(ob?.windSpeedKTS),windDirection:number(ob?.windDirDEG),windGust:number(ob?.windGustKTS),cloudCover:number(ob?.sky),precipitation:number(ob?.precipMM),provider:`Xweather Observations${st?.dataSource?` / ${st.dataSource}`:''} (lizenzierter API-Zugang)`,distance:dist,windUnit:'kt',qcStatus:qc===undefined?1:qc>0?2:0,trustFactor:trust}}).filter(x=>x&&number(x.temp)!==undefined);
}

// --- Radar-Nowcast v0.7.13 --------------------------------------------------
const DWD_RADAR_WMS_PRIMARY='https://maps.dwd.de/geoserver/wms';
const DWD_RADAR_WMS_BACKUP='https://brz-maps.dwd.de/geoserver/wms';
// Das explizite RV-Produkt steht zuerst, weil nur seine eigene Zeitdimension
// zuverlässig Beobachtungen und den Nowcast bis +2 Stunden beschreibt.
const DWD_RADAR_LAYERS=['dwd:Radar_rv_product_1x1km_ger','dwd:Niederschlagsradar'];
const OPERA_POSITION='https://api.meteogate.eu/eu-eumetnet-weather-radar/collections/observations/position';
const RAINVIEWER_META='https://api.rainviewer.com/public/weather-maps.json';
const RADAR_RATE_LIMIT=400;
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function dwdRadarApplies(lat,lon,country=''){return directCountryCode(country)==='DE'}
function operaRadarApplies(lat,lon){return lat>=31.5&&lat<=72.5&&lon>=-30.5&&lon<=50.5}
function offsetPoint(lat,lon,northKm,eastKm){return{lat:lat+northKm/111,lon:lon+eastKm/(111*Math.max(.2,Math.cos(lat*Math.PI/180)))}}
function isoFloor5(epochMs=Date.now()){return new Date(Math.floor(epochMs/300000)*300000).toISOString().replace('.000Z','Z')}
function mmhFromDbz(dbz){const z=10**(dbz/10);return Math.max(0,(z/200)**(1/1.6))}
function validRadarRate(value){const v=number(value);return v===undefined||v<0||v>RADAR_RATE_LIMIT?undefined:v}
function radarRateLabel(rate){if(rate>=50)return'extremes Radarecho';if(rate>=20)return'sehr stark';if(rate>=8)return'stark';if(rate>=2.5)return'mäßig';if(rate>=.5)return'leicht';if(rate>=.1)return'sehr leicht';return'kein messbarer Niederschlag'}
function normaliseDwdRate(value,key='',mapRate){
 const v=number(value);if(v===undefined||v<0)return undefined;const k=String(key).toLowerCase();
 if(Number.isFinite(mapRate)&&Number(mapRate)===0)return 0;
 if(k.includes('dbz'))return validRadarRate(mmhFromDbz(v));
 // GeoServer bezeichnet ein einzelnes Rasterband generisch als GRAY_INDEX.
 // Für RV sind die Nutzwerte mm/h; reservierte/auffällige Bandwerte werden
 // nur akzeptiert, wenn sie zur sichtbaren Kartenfarbe plausibel sind.
 if(/gray_index|grayindex|rain.?rate|precip|rate|^rv$/i.test(k)){
  if(v<=120)return validRadarRate(v);
  if(Number.isFinite(mapRate)&&Number(mapRate)>=20&&v<=RADAR_RATE_LIMIT)return Math.min(80,Number(mapRate));
 }
 return undefined;
}
function dwdRateFromFeatureInfo(data,text='',mapRate){
 const propertySets=[];
 if(Array.isArray(data?.features))for(const feature of data.features)if(feature?.properties&&typeof feature.properties==='object')propertySets.push(feature.properties);
 if(data?.properties&&typeof data.properties==='object')propertySets.push(data.properties);
 if(data&&typeof data==='object'&&!Array.isArray(data))propertySets.push(data);
 for(const properties of propertySets){
  const entries=Object.entries(properties);
  const preferred=entries.find(([key,value])=>/^(GRAY_INDEX|GRAYINDEX|RAIN_RATE|RAINRATE|RATE|PRECIPITATION|RV)$/i.test(key)&&number(value)!==undefined)
   ||entries.find(([key,value])=>/(gray.?index|rain.?rate|precip|(?:^|_)rate(?:$|_)|^rv$)/i.test(key)&&number(value)!==undefined);
  if(preferred){const rate=normaliseDwdRate(preferred[1],preferred[0],mapRate);if(rate!==undefined)return rate}
 }
 const raw=String(text);
 const match=raw.match(/(?:GRAY_INDEX|GRAYINDEX|RAIN_RATE|RAINRATE|PRECIPITATION|RATE|RV)\s*(?:<\/[^>]+>\s*<[^>]+>|["':= ]+)\s*(-?\d+(?:\.\d+)?)/i)
  ||raw.match(/<(?:[^:>]+:)?(?:GRAY_INDEX|GRAYINDEX|RAIN_RATE|RAINRATE|PRECIPITATION|RATE|RV)[^>]*>\s*(-?\d+(?:\.\d+)?)\s*</i);
 return match?normaliseDwdRate(Number(match[1]),match[0],mapRate):undefined;
}
function parseIsoDurationMs(value){const m=String(value||'').match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);if(!m)return 0;return((Number(m[1]||0)*24+Number(m[2]||0))*60+Number(m[3]||0))*60000+Number(m[4]||0)*1000}
function xmlLayerBlock(xml,layer){
 const source=String(xml||''),tokens=/<\/?Layer\b[^>]*>|<Name>\s*([^<]+?)\s*<\/Name>/gi,stack=[];let match;
 while((match=tokens.exec(source))){const token=match[0];if(/^<Layer\b/i.test(token)){stack.push({start:match.index,names:[]})}else if(/^<\/Layer/i.test(token)){const item=stack.pop();if(item&&item.names.includes(layer))return source.slice(item.start,tokens.lastIndex)}else if(match[1]&&stack.length){stack.at(-1).names.push(match[1].trim())}}
 return'';
}
function parseWmsTimeContent(block){const times=[];for(const match of String(block||'').matchAll(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z/gi)){const t=Date.parse(match[0]);if(Number.isFinite(t))times.push(t)}for(const part of String(block||'').split(',')){const fields=part.trim().split('/');if(fields.length!==3)continue;const start=Date.parse(fields[0]),end=Date.parse(fields[1]),step=parseIsoDurationMs(fields[2]);if(!Number.isFinite(start)||!Number.isFinite(end)||step<60000||step>6*3600000)continue;for(let t=start;t<=end&&times.length<2500;t+=step)times.push(t)}return[...new Set(times)].sort((a,b)=>a-b)}
function dwdTimesFromCapabilities(xml,layer=''){
 const source=String(xml||'');if(!layer){const blocks=[...source.matchAll(/<(?:\w+:)?(?:Dimension|Extent)\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?(?:Dimension|Extent)>/gi)].filter(match=>/\bname\s*=\s*["']time["']/i.test(match[1]||''));return[...new Set(blocks.flatMap(match=>parseWmsTimeContent(match[2])))].sort((a,b)=>a-b)}
 // WMS-Zeitdimensionen dürfen vererbt werden. Der Parser sammelt deshalb nur
 // die Dimensionen des Ziel-Layers und seiner tatsächlichen Eltern. Ein
 // früherer Rückfall auf die gesamte Capabilities-Datei vermischte Zeitachsen
 // verschiedener Produkte und erzeugte dadurch leere Karten mit falscher Zeit.
 const token=/<(?:\w+:)?Layer\b[^>]*>|<\/(?:\w+:)?Layer>|<(?:\w+:)?Name>\s*([^<]+?)\s*<\/(?:\w+:)?Name>|<(?:\w+:)?(?:Dimension|Extent)\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?(?:Dimension|Extent)>/gi,stack=[];let match;
 while((match=token.exec(source))){const raw=match[0];if(/^<(?:\w+:)?Layer\b/i.test(raw)){stack.push({name:'',times:[]});continue}if(/^<\/(?:\w+:)?Layer/i.test(raw)){const current=stack.at(-1);if(current?.name===layer)return[...new Set(stack.flatMap(item=>item.times))].sort((a,b)=>a-b);stack.pop();continue}if(match[1]&&stack.length){stack.at(-1).name=decodeXml(match[1]).trim();continue}if(match[2]&&stack.length&&/\bname\s*=\s*["']time["']/i.test(match[2]))stack.at(-1).times.push(...parseWmsTimeContent(match[3]))
 }
 return[];
}
function generatedDwdTimes(now=Date.now()){const base=Math.floor(now/300000)*300000,out=[];for(let minute=-60;minute<=120;minute+=5)out.push(base+minute*60000);return out}
function selectDwdTimes(times,now=Date.now()){
 // Gewünschtes Kartenfenster: eine Stunde Beobachtung bis zwei Stunden
 // Nowcast. Vergangenheit bleibt 5-minütig, die Zukunft wird auf etwa
 // 10 Minuten ausgedünnt, damit die Kartenanimation flüssig und vertretbar bleibt.
 const usable=(times.length?times:generatedDwdTimes(now)).filter(t=>t>=now-60*60000&&t<=now+120*60000).sort((a,b)=>a-b),observed=usable.filter(t=>t<=now+90000).slice(-13),allFuture=usable.filter(t=>t>now+90000),future=allFuture.filter((_,i)=>i===0||i%2===1||i===allFuture.length-1);
 return[...new Set([...observed,...future])].sort((a,b)=>a-b);
}
function dwdAnalysisTimes(times,now,validatedTime){const observed=times.filter(t=>t<=now+90000),future=times.filter(t=>t>now+90000),sample=[...observed.filter((_,i)=>i%2===0||i===observed.length-1),...future.filter((_,i)=>i%2===0||i===future.length-1),validatedTime].filter(Number.isFinite).sort((a,b)=>a-b);if(sample.length<=18)return[...new Set(sample)];const step=Math.ceil(sample.length/18),reduced=sample.filter((_,i)=>i%step===0);if(reduced.at(-1)!==sample.at(-1))reduced.push(sample.at(-1));return[...new Set(reduced)]}
function dwdCapabilitiesUrl(base){const u=new URL(base);u.searchParams.set('service','WMS');u.searchParams.set('version','1.3.0');u.searchParams.set('request','GetCapabilities');return u.toString()}
async function dwdAvailableTimes(base,layer){const response=await fetch(dwdCapabilitiesUrl(base),{headers:{Accept:'application/xml,text/xml,*/*'},cf:{cacheTtl:300,cacheEverything:true}});if(!response.ok)throw new Error(`DWD Capabilities HTTP ${response.status}`);const text=await response.text(),times=dwdTimesFromCapabilities(text,layer);if(!times.length)throw new Error('DWD Capabilities ohne passende Zeitdimension');return times}
function rgbHsl(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));if(max===r)h=60*((g-b)/d%6);else if(max===g)h=60*((b-r)/d+2);else h=60*((r-g)/d+4);if(h<0)h+=360}return{h,s,l}}
function dwdPixelRate(r,g,b,a){
 if(a<18)return 0;const{h,s,l}=rgbHsl(r,g,b),max=Math.max(r,g,b),min=Math.min(r,g,b);
 // transparente/nahezu graue Hintergrund- und NoData-Pixel
 if(s<.12&&(max-min<28||l<.18||l>.94))return 0;
 // Vereinfachte Dekodierung der DWD-RV-Layerfarben. Sie dient nur als
 // Rückfall, wenn GetFeatureInfo für einen sichtbaren Pixel keinen Nutzwert liefert.
 if(h>=255&&h<340)return 50;
 if(h<18||h>=340)return 25;
 if(h<43)return 12;
 if(h<68)return 6;
 if(h<155)return 2.5;
 if(h<195)return 1.2;
 if(h<255)return l<.42?1:.35;
 return .2;
}
function dwdMapSample(image,lat,latDelta,lonDelta){
 const cx=Math.floor(image.width/2),cy=Math.floor(image.height/2),sample=(x,y)=>{x=clamp(Math.round(x),0,image.width-1);y=clamp(Math.round(y),0,image.height-1);const i=(y*image.width+x)*4;return dwdPixelRate(image.rgba[i],image.rgba[i+1],image.rgba[i+2],image.rgba[i+3])},center=sample(cx,cy),kmPerPixelX=Math.max(.05,2*lonDelta*111*Math.cos(lat*Math.PI/180)/image.width),kmPerPixelY=Math.max(.05,2*latDelta*111/image.height),near=[];
 for(const km of[2,4,7]){const ox=km/kmPerPixelX,oy=km/kmPerPixelY;for(const[x,y]of[[cx+ox,cy],[cx-ox,cy],[cx,cy+oy],[cx,cy-oy],[cx+ox*.7,cy+oy*.7],[cx-ox*.7,cy+oy*.7]])near.push(sample(x,y))}
 return{center,nearby:Math.max(...near,0),visible:center>0||near.some(v=>v>0)};
}
async function dwdMapFrame(base,layer,lat,lon,time){
 const latDelta=.075,lonDelta=.075/Math.max(.35,Math.cos(lat*Math.PI/180)),u=new URL(base);u.searchParams.set('service','WMS');u.searchParams.set('version','1.1.1');u.searchParams.set('request','GetMap');u.searchParams.set('layers',layer);u.searchParams.set('styles','');u.searchParams.set('srs','EPSG:4326');u.searchParams.set('bbox',`${lon-lonDelta},${lat-latDelta},${lon+lonDelta},${lat+latDelta}`);u.searchParams.set('width','129');u.searchParams.set('height','129');u.searchParams.set('format','image/png');u.searchParams.set('transparent','true');u.searchParams.set('exceptions','application/vnd.ogc.se_xml');if(Number.isFinite(time))u.searchParams.set('time',new Date(time).toISOString());
 const response=await fetch(u.toString(),{headers:{Accept:'image/png,*/*'},cf:{cacheTtl:120,cacheEverything:true}});if(!response.ok)throw new Error(`DWD GetMap HTTP ${response.status}`);const type=String(response.headers.get('content-type')||'');const buffer=await response.arrayBuffer();if(!type.includes('image/png')&&new Uint8Array(buffer)[0]!==137)throw new Error('DWD GetMap liefert kein PNG');const sampled=dwdMapSample(await decodePng(buffer),lat,latDelta,lonDelta);return{...sampled,time:Number.isFinite(time)?time:Math.floor(Date.now()/300000)*300000};
}
async function dwdPointRate(base,layer,lat,lon,time,mapRate){
 if(Number(mapRate)===0)return 0;const delta=.018;
 for(const infoFormat of['application/json','text/plain','text/html']){const u=new URL(base);u.searchParams.set('service','WMS');u.searchParams.set('version','1.1.1');u.searchParams.set('request','GetFeatureInfo');u.searchParams.set('layers',layer);u.searchParams.set('query_layers',layer);u.searchParams.set('styles','');u.searchParams.set('srs','EPSG:4326');u.searchParams.set('bbox',`${lon-delta},${lat-delta},${lon+delta},${lat+delta}`);u.searchParams.set('width','101');u.searchParams.set('height','101');u.searchParams.set('x','50');u.searchParams.set('y','50');u.searchParams.set('format','image/png');u.searchParams.set('info_format',infoFormat);u.searchParams.set('feature_count','1');u.searchParams.set('exceptions','application/vnd.ogc.se_xml');if(Number.isFinite(time))u.searchParams.set('time',new Date(time).toISOString());
  try{const response=await fetch(u.toString(),{headers:{Accept:`${infoFormat},application/json,text/plain,text/html,*/*`},cf:{cacheTtl:120,cacheEverything:true}});if(!response.ok)continue;const text=await response.text();if(/ServiceException|ExceptionReport/i.test(text))continue;let parsed=null;try{parsed=JSON.parse(text)}catch{}const rate=dwdRateFromFeatureInfo(parsed,text,mapRate);if(rate!==undefined)return rate}catch{}
 }
 return validRadarRate(mapRate);
}
async function findDwdQuery(lat,lon,now=Date.now()){
 const errors=[];
 for(const base of[DWD_RADAR_WMS_PRIMARY,DWD_RADAR_WMS_BACKUP])for(const layer of DWD_RADAR_LAYERS){
  let times=[],fromCapabilities=true;try{times=await dwdAvailableTimes(base,layer)}catch(error){fromCapabilities=false;errors.push(`${new URL(base).hostname}/${layer}: ${error instanceof Error?error.message:String(error)}`)}
  const selected=selectDwdTimes(times,now),observedCandidates=selected.filter(t=>t<=now+90000).slice(-3).reverse();
  for(const time of observedCandidates){try{const sample=await dwdMapFrame(base,layer,lat,lon,time);return{base,layer,times:selected,validatedTime:time,validatedSample:sample,fromCapabilities,errors}}catch(error){errors.push(`${new URL(base).hostname}/${layer}/GetMap: ${error instanceof Error?error.message:String(error)}`)}}
  // Die WMS-Voreinstellung liefert den aktuellsten Frame und ist ein robuster
  // letzter DWD-Test, falls die Zeitdimension verzögert oder anders formatiert ist.
  try{const sample=await dwdMapFrame(base,layer,lat,lon,undefined);return{base,layer,times:[sample.time],validatedTime:sample.time,validatedSample:sample,fromCapabilities:false,errors}}catch(error){errors.push(`${new URL(base).hostname}/${layer}/GetMap-default: ${error instanceof Error?error.message:String(error)}`)}
 }
 throw new Error(`DWD-Radarkarte nicht lesbar${errors.length?`: ${errors.slice(-4).join(' | ')}`:''}`);
}
async function dwdRadarNowcast(lat,lon){
 const now=Date.now(),query=await findDwdQuery(lat,lon,now),frames=[],analysisTimes=dwdAnalysisTimes(query.times,now,query.validatedTime);
 for(const time of analysisTimes){let sample;if(time===query.validatedTime)sample=query.validatedSample;else{try{sample=await dwdMapFrame(query.base,query.layer,lat,lon,time)}catch{continue}}let center=sample.center;if(center>0){const precise=await dwdPointRate(query.base,query.layer,lat,lon,time,center);if(precise!==undefined)center=precise}frames.push({time,center,nearby:sample.nearby,future:time>now+90000,validPoints:19})}
 if(!frames.length)throw new Error('DWD-Radar liefert keine verwertbare Kartenzeitreihe.');
 const result=radarResultFromFrames('dwd','DWD-RV −1 h bis +2 h',query.fromCapabilities?'high':'medium',frames,'Daten: Deutscher Wetterdienst; MID-Pixel- und Punkt-Auswertung',{rateApproximate:false});
 const displayTimes=query.fromCapabilities&&query.times.length>1?query.times:frames.map(x=>x.time);return{...result,radarLayer:query.layer,timeline:[...new Set(displayTimes)].sort((a,b)=>a-b).map(x=>new Date(x).toISOString()),diagnostics:{...(result.diagnostics||{}),endpoint:query.base,layer:query.layer,method:'WMS GetMap + optional GetFeatureInfo',capabilitiesTimeAxis:query.fromCapabilities,displayWindowMinutes:[-60,120],queryErrors:query.errors.slice(-8)}};
}
function coverageSeries(data){
 const collections=Array.isArray(data?.coverages)?data.coverages:[data],out=[];
 for(const cov of collections){if(!cov||typeof cov!=='object')continue;const axes=cov.domain?.axes??{},times=axes.t?.values??axes.time?.values??[],ranges=cov.ranges??{};const rangeKey=Object.keys(ranges).find(k=>/RATE/i.test(k))||Object.keys(ranges)[0],range=rangeKey?ranges[rangeKey]:null,values=range?.values??range?.data??[];if(!Array.isArray(values))continue;
  const flat=values.flat?values.flat(Infinity):values;for(let i=0;i<Math.min(times.length,flat.length);i++){const rate=validRadarRate(flat[i]);if(rate!==undefined)out.push({time:Date.parse(times[i]),rate})}
 }
 return out.filter(x=>Number.isFinite(x.time)).sort((a,b)=>a.time-b.time);
}
async function operaPointSeries(lat,lon){
 const end=new Date(),start=new Date(end.getTime()-100*60000),datetime=`${start.toISOString().replace('.000Z','Z')}/${end.toISOString().replace('.000Z','Z')}`,variants=[
  {'parameter-name':'RATE:comp',method:'comp'},
  {standard_name:'RATE',method:'comp'},
  {'parameter-name':'RATE',method:'comp'},
  {'parameter-name':'RATE:comp',method:'comp',format:'ODIM'}
 ];
 let lastError;for(const variant of variants){try{const u=new URL(OPERA_POSITION);u.searchParams.set('coords',`POINT(${lon.toFixed(5)} ${lat.toFixed(5)})`);u.searchParams.set('datetime',datetime);u.searchParams.set('f','CoverageJSON');for(const[k,v]of Object.entries(variant))u.searchParams.set(k,v);const response=await fetch(u.toString(),{headers:{Accept:'application/prs.coverage+json,application/json'},cf:{cacheTtl:180,cacheEverything:true}});if(response.status===204)continue;if(!response.ok)throw new Error(`OPERA HTTP ${response.status}`);const data=await response.json(),series=coverageSeries(data);if(series.length)return series}catch(error){lastError=error}}
 throw lastError||new Error('OPERA/ORD liefert keine Punktzeitreihe.');
}
async function operaRadarNowcast(lat,lon){
 const points=[[0,0],[4,0],[-4,0],[0,4],[0,-4]].map(([n,e])=>offsetPoint(lat,lon,n,e)),series=await Promise.all(points.map(p=>operaPointSeries(p.lat,p.lon))),times=[...new Set(series.flatMap(s=>s.map(x=>x.time)))].sort((a,b)=>a-b).slice(-10),frames=times.map(time=>{const atTime=series.map(s=>{let best=null;for(const item of s)if(!best||Math.abs(item.time-time)<Math.abs(best.time-time))best=item;return best&&Math.abs(best.time-time)<=8*60000?best.rate:0});return{time,center:atTime[0]||0,nearby:Math.max(...atTime.slice(1),0),future:false}});
 if(!frames.length)throw new Error('OPERA/ORD ohne auswertbare RATE-Daten.');
 const result=radarResultFromFrames('opera','EUMETNET OPERA/ORD RATE','medium',frames,'EUMETNET OPERA composite products, CC BY 4.0; MID-Bewegungsnäherung',{rateApproximate:false});return{...result,timeline:frames.map(frame=>new Date(frame.time).toISOString())};
}
function u32(bytes,o){return((bytes[o]<<24)|(bytes[o+1]<<16)|(bytes[o+2]<<8)|bytes[o+3])>>>0}
function paeth(a,b,c){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c}
async function decodePng(buffer){
 const bytes=new Uint8Array(buffer);if(bytes.length<24||bytes[0]!==137||bytes[1]!==80)throw new Error('Ungültige PNG-Kachel');let pos=8,width=0,height=0,bitDepth=8,colorType=6,palette=null,transparency=null,idat=[];
 while(pos+12<=bytes.length){const len=u32(bytes,pos),type=String.fromCharCode(...bytes.slice(pos+4,pos+8)),data=bytes.slice(pos+8,pos+8+len);pos+=12+len;if(type==='IHDR'){width=u32(data,0);height=u32(data,4);bitDepth=data[8];colorType=data[9]}else if(type==='PLTE')palette=data;else if(type==='tRNS')transparency=data;else if(type==='IDAT')idat.push(data);else if(type==='IEND')break}
 if(bitDepth!==8||!width||!height)throw new Error('PNG-Format nicht unterstützt');const compressed=new Uint8Array(idat.reduce((n,x)=>n+x.length,0));let off=0;for(const chunk of idat){compressed.set(chunk,off);off+=chunk.length}const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate')),raw=new Uint8Array(await new Response(stream).arrayBuffer()),bpp=colorType===6?4:colorType===2?3:colorType===4?2:1,stride=width*bpp,out=new Uint8Array(height*stride);let rp=0;
 for(let y=0;y<height;y++){const filter=raw[rp++],row=raw.slice(rp,rp+stride);rp+=stride;for(let x=0;x<stride;x++){const left=x>=bpp?out[y*stride+x-bpp]:0,up=y?out[(y-1)*stride+x]:0,upLeft=y&&x>=bpp?out[(y-1)*stride+x-bpp]:0,v=row[x];out[y*stride+x]=filter===0?v:filter===1?(v+left)&255:filter===2?(v+up)&255:filter===3?(v+Math.floor((left+up)/2))&255:filter===4?(v+paeth(left,up,upLeft))&255:v}}
 const rgba=new Uint8Array(width*height*4);for(let i=0;i<width*height;i++){let r=0,g=0,b=0,a=255;if(colorType===6){r=out[i*4];g=out[i*4+1];b=out[i*4+2];a=out[i*4+3]}else if(colorType===2){r=out[i*3];g=out[i*3+1];b=out[i*3+2]}else if(colorType===3){const idx=out[i];r=palette?.[idx*3]??0;g=palette?.[idx*3+1]??0;b=palette?.[idx*3+2]??0;a=transparency?.[idx]??255}else if(colorType===4){r=g=b=out[i*2];a=out[i*2+1]}else{r=g=b=out[i]}rgba.set([r,g,b,a],i*4)}return{width,height,rgba};
}
// Offizielle Schlüsselstufen der RainViewer-Farbskala 2 (Universal Blue).
// Die öffentliche API liefert nur eingefärbte PNGs; die Rate ist daher eine
// aus der nächstgelegenen Palettenfarbe und Marshall-Palmer abgeleitete Näherung.
const RAINVIEWER_BLUE=[
 [-10,99,97,89,20],[-5,114,110,97,46],[0,130,123,105,73],[5,146,136,113,100],[10,210,196,139,160],[13,216,221,238,255],[16,81,197,232,255],[19,0,163,224,255],[20,0,163,224,255],[25,0,136,191,255],[30,0,85,136,255],[35,255,238,0,255],[40,255,170,0,255],[45,255,102,0,255],[50,193,0,0,255],[52,214,0,13,255],[54,215,0,19,255],[55,255,79,255,255],[57,255,95,255,255],[59,255,111,255,255],[60,255,98,255,255],[63,255,88,255,255],[66,245,231,251,255],[70,255,255,255,255]
];
function rainViewerPixelDbz(r,g,b,a){if(a<10)return undefined;let best=null,bestDistance=Infinity;for(const [dbz,pr,pg,pb,pa]of RAINVIEWER_BLUE){const distance=(r-pr)**2+(g-pg)**2+(b-pb)**2+.18*(a-pa)**2;if(distance<bestDistance){bestDistance=distance;best=dbz}}return bestDistance>30000?undefined:best}
function rainViewerPixelRate(r,g,b,a){const dbz=rainViewerPixelDbz(r,g,b,a);return dbz===undefined||dbz<10?0:validRadarRate(mmhFromDbz(dbz))??0}
function sampleRadarTile(image,lat){const cx=Math.floor(image.width/2),cy=Math.floor(image.height/2),kmPerPixel=156.54303392*Math.cos(lat*Math.PI/180)/(2**7),sample=(x,y)=>{x=clamp(Math.round(x),0,image.width-1);y=clamp(Math.round(y),0,image.height-1);const i=(y*image.width+x)*4;return rainViewerPixelRate(image.rgba[i],image.rgba[i+1],image.rgba[i+2],image.rgba[i+3])},center=sample(cx,cy),offsets=[3,5,8].map(k=>Math.max(1,k/kmPerPixel)),near=[];for(const o of offsets)for(const[a,b]of[[o,0],[-o,0],[0,o],[0,-o],[o*.7,o*.7],[-o*.7,o*.7]])near.push(sample(cx+a,cy+b));return{center,nearby:Math.max(...near,0)}}
async function rainViewerRadarNowcast(lat,lon){
 const meta=await fetchJson(RAINVIEWER_META),past=(meta?.radar?.past??[]).slice(-6),host=meta?.host;if(!host||!past.length)throw new Error('RainViewer ohne aktuelle Frames.');
 const coverageUrl=`${host}/v2/coverage/0/256/7/${lat.toFixed(5)}/${lon.toFixed(5)}/0/0_0.png`,coverageResponse=await fetch(coverageUrl,{cf:{cacheTtl:86400,cacheEverything:true}});if(coverageResponse.ok){try{const coverage=await decodePng(await coverageResponse.arrayBuffer()),i=(Math.floor(coverage.height/2)*coverage.width+Math.floor(coverage.width/2))*4;if(coverage.rgba[i+3]>200&&coverage.rgba[i]<20&&coverage.rgba[i+1]<20&&coverage.rgba[i+2]<20)throw new Error('Keine RainViewer-Radarabdeckung.')}catch(error){if(String(error).includes('Keine RainViewer'))throw error}}
 const frames=[];for(const frame of past){const url=`${host}${frame.path}/256/7/${lat.toFixed(5)}/${lon.toFixed(5)}/2/0_0.png`,response=await fetch(url,{cf:{cacheTtl:600,cacheEverything:true}});if(!response.ok)continue;const sampled=sampleRadarTile(await decodePng(await response.arrayBuffer()),lat);frames.push({time:Number(frame.time)*1000,center:sampled.center,nearby:sampled.nearby,future:false})}
 if(!frames.length)throw new Error('RainViewer-Kacheln nicht auswertbar.');const fresh=Date.now()-frames.at(-1).time<25*60000,quality=fresh&&frames.length>=5?'medium':'low';return radarResultFromFrames('rainviewer','RainViewer-Radarnäherung',quality,frames,'Weather data by RainViewer; MID-Bewegungsnäherung',{rateApproximate:true});
}

async function rainViewerMetadata(){
 const response=await fetch(RAINVIEWER_META,{headers:{Accept:'application/json'},cf:{cacheTtl:120,cacheEverything:true}});if(!response.ok)throw new Error(`RainViewer Metadata HTTP ${response.status}`);const data=await response.json(),host=String(data?.host||''),normalise=rows=>(Array.isArray(rows)?rows:[]).map(row=>({time:Number(row?.time),path:String(row?.path||'')})).filter(row=>Number.isFinite(row.time)&&row.path).sort((a,b)=>a.time-b.time);
 const past=normalise(data?.radar?.past).slice(-12),nowcast=normalise(data?.radar?.nowcast).slice(0,18);if(!host||!past.length)throw new Error('RainViewer liefert aktuell keine nutzbaren Radarframes.');return{host,generated:Number(data?.generated)||undefined,radar:{past,nowcast},coverage:'Weltweite öffentliche RainViewer-Radarkacheln; Zukunft nur wenn vom Anbieter geliefert',historyMinutes:120,forecastMinutes:nowcast.length?120:0};
}

function coherentDisplayRate(frame){const center=validRadarRate(frame?.center)??0,nearby=validRadarRate(frame?.nearby)??0;if(center>=120&&nearby<Math.max(8,center*.12))return{rate:Math.max(nearby,50),raw:center,uncertain:true};return{rate:center,raw:center,uncertain:center>=50}}
function contiguousWetEvent(future,firstIndex,wet){const event=[];let dryCount=0;for(let i=firstIndex;i<future.length;i++){const frame=future[i];if(wet(frame)){event.push(frame);dryCount=0}else if(event.length&&++dryCount>1)break}return event}
function ongoingWetEnd(future,wet,observedTime){if(!future.length)return{};let firstDryTime,consecutiveDry=0,lastWetTime=observedTime;
 for(const frame of future){if(wet(frame)){lastWetTime=frame.time;firstDryTime=undefined;consecutiveDry=0;continue}if(firstDryTime===undefined)firstDryTime=frame.time;consecutiveDry++;if(consecutiveDry>=2)return{endAt:firstDryTime,endMinutes:Math.max(5,Math.round((firstDryTime-observedTime)/60000)),endOpenEnded:false}}
 if(firstDryTime!==undefined)return{endAt:firstDryTime,endMinutes:Math.max(5,Math.round((firstDryTime-observedTime)/60000)),endOpenEnded:false,endUncertain:true};
 const horizon=future.at(-1)?.time;return Number.isFinite(horizon)?{endAt:horizon,endMinutes:Math.max(5,Math.round((horizon-observedTime)/60000)),endOpenEnded:true}:{}
}
function radarResultFromFrames(source,provider,quality,frames,license,options={}){
 frames=frames.filter(x=>Number.isFinite(x.time)).sort((a,b)=>a.time-b.time);const observed=frames.filter(x=>!x.future),latestObserved=observed.at(-1)||frames[0],future=frames.filter(x=>x.future),siteWet=x=>Number(x.center)>=.05,nearbyWet=x=>Number(x.nearby)>=.18;let radarProbability=5,arrivalMinutes,endMinutes,arrivalStartAt,arrivalEndAt,endAt,endOpenEnded=false,endUncertain=false,arrivalKind,peakRate=0,rateUncertain=false,summary='Kein relevantes Radarecho am Standort oder in unmittelbarer Umgebung.';
 const current=coherentDisplayRate(latestObserved);
 if(current.rate>=.05){radarProbability=98;arrivalMinutes=0;arrivalKind='site';peakRate=current.rate;rateUncertain=current.uncertain;const ending=ongoingWetEnd(future,siteWet,latestObserved.time);endAt=ending.endAt?new Date(ending.endAt).toISOString():undefined;endMinutes=ending.endMinutes;endOpenEnded=Boolean(ending.endOpenEnded);endUncertain=Boolean(ending.endUncertain);summary=`Niederschlag am Standort erkannt: ${radarRateLabel(current.rate)}.`}
 else if(future.length){const firstIndex=future.findIndex(siteWet);if(firstIndex>=0){const first=future[firstIndex],event=contiguousWetEvent(future,firstIndex,siteWet),firstRate=coherentDisplayRate(first),eventRates=event.map(coherentDisplayRate),peak=eventRates.reduce((best,item)=>item.rate>best.rate?item:best,firstRate);arrivalMinutes=Math.max(0,Math.round((first.time-latestObserved.time)/60000));arrivalKind='site';const nextTime=future[firstIndex+1]?.time??first.time+5*60000,windowEnd=Math.min(nextTime,frames.at(-1).time);arrivalStartAt=new Date(first.time).toISOString();arrivalEndAt=new Date(Math.max(first.time,windowEnd)).toISOString();radarProbability=clamp(Math.round(96-arrivalMinutes*.28+(first.center>0?5:0)),45,96);const last=event.at(-1);if(last){endAt=new Date(last.time).toISOString();endMinutes=Math.max(arrivalMinutes,Math.round((last.time-latestObserved.time)/60000))}peakRate=peak.rate;rateUncertain=eventRates.some(x=>x.uncertain);summary=`Radarecho erreicht den Standort voraussichtlich in etwa ${arrivalMinutes} Minuten · ${radarRateLabel(peakRate)}.`}else{const nearbyIndex=future.findIndex(nearbyWet);if(nearbyIndex>=0){const first=future[nearbyIndex];arrivalMinutes=Math.max(0,Math.round((first.time-latestObserved.time)/60000));arrivalKind='nearby';arrivalStartAt=new Date(first.time).toISOString();arrivalEndAt=new Date(Math.min(future[nearbyIndex+1]?.time??first.time+10*60000,frames.at(-1).time)).toISOString();peakRate=validRadarRate(first.nearby)??0;rateUncertain=true;radarProbability=clamp(Math.round(32+Math.min(28,peakRate*5)-arrivalMinutes*.12),20,68);summary=`Radarecho erreicht voraussichtlich die Standortumgebung; ein Treffer am Standort ist noch unsicher · ${radarRateLabel(peakRate)}.`}}}
 else if(Number(latestObserved?.nearby)>=.18){const earlier=observed[Math.max(0,observed.length-4)],trend=Number(latestObserved.nearby)-Number(earlier?.nearby||0),strength=Number(latestObserved.nearby);arrivalMinutes=trend>.05?20:35;arrivalKind='approximate';arrivalStartAt=new Date(latestObserved.time+Math.max(0,arrivalMinutes-10)*60000).toISOString();arrivalEndAt=new Date(latestObserved.time+(arrivalMinutes+15)*60000).toISOString();radarProbability=clamp(Math.round(38+Math.min(32,strength*9)+(trend>0?14:-4)),25,82);peakRate=validRadarRate(latestObserved.nearby)??0;rateUncertain=true;summary=`Niederschlagsfeld in Standortnähe; ein Standorttreffer ist nur grob abschätzbar · ${radarRateLabel(peakRate)}.`}
 else if(observed.length>=2&&Number(observed.at(-2).center)>=.05){radarProbability=12;summary='Das Radarecho hat den Standort zuletzt verlassen; kurzfristig nur geringes Wiederholungsrisiko.'}
 return{source,provider,quality,radarProbability,currentRate:current.rate,rawCurrentRate:current.raw,peakRate,rateApproximate:Boolean(options.rateApproximate),rateUncertain,arrivalMinutes,endMinutes,arrivalKind,arrivalStartAt,arrivalEndAt,endAt,endOpenEnded,endUncertain,observedAt:latestObserved?new Date(latestObserved.time).toISOString():undefined,summary,coverage:true,license,diagnostics:{frames:frames.length,observedFrames:observed.length,futureFrames:future.length,latestNearbyRate:Number(latestObserved?.nearby||0),rawCurrentRate:current.raw}};
}
async function radarNowcastForPoint(lat,lon,country=''){
 const errors=[],dwdExpected=dwdRadarApplies(lat,lon,country),operaExpected=operaRadarApplies(lat,lon);
 if(dwdExpected){try{return await dwdRadarNowcast(lat,lon)}catch(error){errors.push(`DWD: ${error instanceof Error?error.message:String(error)}`)}}
 if(operaExpected){try{return await operaRadarNowcast(lat,lon)}catch(error){errors.push(`OPERA: ${error instanceof Error?error.message:String(error)}`)}}
 try{return await rainViewerRadarNowcast(lat,lon)}catch(error){errors.push(`RainViewer: ${error instanceof Error?error.message:String(error)}`)}
 const expectedSource=dwdExpected?'DWD-RV':operaExpected?'EUMETNET OPERA/ORD':undefined;
 return{source:'model',provider:'Open-Meteo Best Match',quality:'low',radarProbability:0,currentRate:0,summary:expectedSource?'Radarabdeckung ist für den Standort grundsätzlich vorhanden, die externe Radarauswertung war vorübergehend nicht abrufbar.':'Für den Standort ist derzeit keine verwertbare Radarabdeckung verfügbar.',coverage:false,coverageExpected:Boolean(expectedSource),temporaryUnavailable:Boolean(expectedSource),expectedSource,diagnostics:{errors}};
}


// --- Kompositbild-Daten v0.7.30 --------------------------------------------
const DWD_PX250_ROOT='https://opendata.dwd.de/weather/radar/sites/px250';
const DWD_HX_ROOTS=['https://opendata.dwd.de/weather/radar/composite/hx','https://opendatao.dwd.de/weather/radar/composite/hx'];
const DWD_PX250_SITES=[
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
function pxTimestamp(raw){const match=String(raw).match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);return match?new Date(Date.UTC(+match[1],+match[2]-1,+match[3],+match[4],+match[5],+match[6])).toISOString():undefined}
function nearestPxSites(lat,lon,rangeKm=150){return DWD_PX250_SITES.map(site=>({...site,distanceKm:distance(lat,lon,site.lat,site.lon)/1000})).filter(site=>site.distanceKm<=rangeKm).sort((a,b)=>a.distanceKm-b.distanceKm)}
async function pxSiteLatest(site){
 const directory=`${DWD_PX250_ROOT}/${site.code}/`,response=await fetch(directory,{headers:{Accept:'text/html,*/*'},cf:{cacheTtl:120,cacheEverything:true}});
 if(!response.ok)throw new Error(`${site.name}: DWD-PX250-Verzeichnis HTTP ${response.status}`);
 const html=await response.text(),pattern=new RegExp(`rab02-tt_${site.wmo}-(\\d{14})-de${site.code}-hd5`,'g'),matches=[...html.matchAll(pattern)].map(match=>({stamp:match[1],file:match[0]})).sort((a,b)=>a.stamp.localeCompare(b.stamp)),latest=matches.at(-1);
 if(!latest)throw new Error(`${site.name}: keine PX250-HDF5-Datei`);
 const observedAt=pxTimestamp(latest.stamp),observedMs=observedAt?Date.parse(observedAt):NaN,ageMinutes=Number.isFinite(observedMs)?Math.round((Date.now()-observedMs)/60000):Infinity;
 return{...site,latest,observedAt,observedMs,ageMinutes};
}
async function hxLatest(){
 const errors=[];
 for(const root of DWD_HX_ROOTS){try{
  const response=await fetch(`${root}/`,{headers:{Accept:'text/html,*/*'},cf:{cacheTtl:90,cacheEverything:true}});if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const html=await response.text(),matches=[...html.matchAll(/composite_hx_(\d{8})_(\d{4})-hd5/g)].map(match=>({stamp:`${match[1]}${match[2]}00`,file:match[0]})).sort((a,b)=>a.stamp.localeCompare(b.stamp)),latest=matches.at(-1);if(!latest)throw new Error('keine HX-HDF5-Datei');
  const observedAt=pxTimestamp(latest.stamp),observedMs=observedAt?Date.parse(observedAt):NaN,ageMinutes=Number.isFinite(observedMs)?Math.round((Date.now()-observedMs)/60000):Infinity;
  return{root,latest,observedAt,observedMs,ageMinutes};
 }catch(error){errors.push(`${root}: ${error instanceof Error?error.message:String(error)}`)}}
 throw new Error(errors.join(' | ')||'DWD-HX-Verzeichnis nicht erreichbar');
}
async function px250Metadata(request,lat,lon){
 // Das nationale HX-Komposit besitzt dieselbe native Rasterweite wie PX250,
 // ist aber für deutsche Orte die robustere und flächendeckende erste Wahl.
 if(inGermanyBounds(lat,lon)){try{const hx=await hxLatest();if(Number.isFinite(hx.observedMs)&&hx.ageMinutes<=30&&hx.ageMinutes>=-10){const fileUrl=new URL(request.url);fileUrl.search='';fileUrl.searchParams.set('mode','px250-file');fileUrl.searchParams.set('product','hx');fileUrl.searchParams.set('file',hx.latest.file);return{available:true,product:'hx',productName:'DWD HX Deutschlandkomposit',site:'hx',siteName:'Deutschlandkomposit HX',coverage:'Deutschland',distanceKm:0,observedAt:hx.observedAt,ageMinutes:hx.ageMinutes,fileUrl:fileUrl.toString(),nativeResolutionM:250,rangeKm:650}}}catch{}}
 const rangeKm=150,candidates=nearestPxSites(lat,lon,rangeKm).slice(0,5);
 if(!candidates.length){const nearest=[...DWD_PX250_SITES].sort((a,b)=>distance(lat,lon,a.lat,a.lon)-distance(lat,lon,b.lat,b.lon))[0],distanceKm=distance(lat,lon,nearest.lat,nearest.lon)/1000;return{available:false,nativeResolutionM:250,rangeKm,site:nearest.code,siteName:nearest.name,distanceKm:Math.round(distanceKm*10)/10,reason:`Kein aktuelles DWD-HX-Komposit und kein DWD-PX250-Radarstandort innerhalb von ${rangeKm} km; nächster Standort ${nearest.name} in ${Math.round(distanceKm)} km.`}}
 const diagnostics=[];
 for(const site of candidates){try{const item=await pxSiteLatest(site);diagnostics.push(`${item.name}: ${Number.isFinite(item.ageMinutes)?item.ageMinutes:'?'} min`);if(!Number.isFinite(item.observedMs)||item.ageMinutes>30||item.ageMinutes<-10)continue;const fileUrl=new URL(request.url);fileUrl.search='';fileUrl.searchParams.set('mode','px250-file');fileUrl.searchParams.set('product','px250');fileUrl.searchParams.set('site',item.code);fileUrl.searchParams.set('file',item.latest.file);return{available:true,product:'px250',productName:'DWD PX250 Standortradar',site:item.code,siteName:item.name,stationId:item.wmo,radarLat:item.lat,radarLon:item.lon,distanceKm:Math.round(item.distanceKm*10)/10,observedAt:item.observedAt,ageMinutes:item.ageMinutes,fileUrl:fileUrl.toString(),nativeResolutionM:250,rangeKm}}catch(error){diagnostics.push(error instanceof Error?error.message:String(error))}}
 const nearest=candidates[0];return{available:false,stale:true,nativeResolutionM:250,rangeKm,site:nearest.code,siteName:nearest.name,distanceKm:Math.round(nearest.distanceKm*10)/10,reason:`DWD HX und die erreichbaren PX250-Standorte liefern derzeit keinen höchstens 30 Minuten alten Stand. ${diagnostics.slice(0,4).join(' · ')}`};
}
async function px250FileResponse(request){
 const url=new URL(request.url),product=String(url.searchParams.get('product')||'px250').toLowerCase(),file=String(url.searchParams.get('file')||'');
 if(product==='hx'){
  const match=file.match(/^composite_hx_(\d{8})_(\d{4})-hd5$/);if(!match)return json({error:'Ungültige DWD-HX-Dateianforderung.',version:WORKER_VERSION},400,{'cache-control':'no-store'});
  const observedAt=pxTimestamp(`${match[1]}${match[2]}00`),ageMinutes=observedAt?(Date.now()-Date.parse(observedAt))/60000:Infinity;if(!Number.isFinite(ageMinutes)||ageMinutes>40||ageMinutes<-10)return json({error:'Der angeforderte DWD-HX-Stand ist nicht aktuell.',version:WORKER_VERSION,observedAt},409,{'cache-control':'no-store'});
  let lastStatus=502;for(const root of DWD_HX_ROOTS){const upstream=await fetch(`${root}/${file}`,{headers:{Accept:'application/octet-stream,*/*'},cf:{cacheTtl:180,cacheEverything:true}});lastStatus=upstream.status;if(!upstream.ok)continue;const headers=new Headers();headers.set('content-type',upstream.headers.get('content-type')||'application/x-hdf5');headers.set('cache-control','public, max-age=180');headers.set('access-control-allow-origin','*');headers.set('access-control-allow-methods','GET,OPTIONS');const length=upstream.headers.get('content-length');if(length)headers.set('content-length',length);return new Response(upstream.body,{status:200,headers})}return json({error:`DWD-HX-Datei HTTP ${lastStatus}`,version:WORKER_VERSION},lastStatus,{'cache-control':'no-store'});
 }
 const siteCode=String(url.searchParams.get('site')||'').toLowerCase(),site=DWD_PX250_SITES.find(item=>item.code===siteCode),stamp=file.match(/-(\d{14})-/)?.[1],observedAt=stamp?pxTimestamp(stamp):undefined,ageMinutes=observedAt?(Date.now()-Date.parse(observedAt))/60000:Infinity;
 if(!site||!new RegExp(`^rab02-tt_${site.wmo}-\\d{14}-de${site.code}-hd5$`).test(file))return json({error:'Ungültige PX250-Dateianforderung.',version:WORKER_VERSION},400,{'cache-control':'no-store'});
 if(!Number.isFinite(ageMinutes)||ageMinutes>40||ageMinutes<-10)return json({error:'Der angeforderte PX250-Stand ist nicht aktuell und wird nicht als Livebild ausgeliefert.',version:WORKER_VERSION,observedAt},409,{'cache-control':'no-store'});
 const upstream=await fetch(`${DWD_PX250_ROOT}/${site.code}/${file}`,{headers:{Accept:'application/octet-stream,*/*'},cf:{cacheTtl:180,cacheEverything:true}});if(!upstream.ok)return json({error:`DWD-PX250-Datei HTTP ${upstream.status}`,version:WORKER_VERSION},upstream.status,{'cache-control':'no-store'});const headers=new Headers();headers.set('content-type',upstream.headers.get('content-type')||'application/x-hdf5');headers.set('cache-control','public, max-age=180');headers.set('access-control-allow-origin','*');headers.set('access-control-allow-methods','GET,OPTIONS');const length=upstream.headers.get('content-length');if(length)headers.set('content-length',length);return new Response(upstream.body,{status:200,headers});
}
async function operaGrid(lat,lon){
 const spacingKm=42,offsets=[-2,-1,0,1,2],locations=[];for(const north of offsets)for(const east of offsets){const point=offsetPoint(lat,lon,north*spacingKm,east*spacingKm);locations.push(point)}
 const settled=await Promise.allSettled(locations.map(point=>operaPointSeries(point.lat,point.lon))),seriesByLocation=settled.map(result=>result.status==='fulfilled'?result.value:[]),allTimes=[...new Set(seriesByLocation.flatMap(series=>series.map(item=>item.time)))].filter(Number.isFinite).sort((a,b)=>a-b),latest=allTimes.at(-1);
 if(!latest)throw new Error('EUMETNET OPERA/ORD liefert aktuell kein darstellbares Raster.');
 const candidates=allTimes.filter(time=>time>=latest-65*60000),targets=[];for(const time of candidates){if(!targets.length||time-targets.at(-1)>=8*60000)targets.push(time)}if(targets.at(-1)!==latest)targets.push(latest);const selectedTargets=targets.slice(-8),frames=[];
 for(const target of selectedTargets){const points=[];seriesByLocation.forEach((series,index)=>{if(!series.length)return;let nearest=series[0];for(const item of series)if(Math.abs(item.time-target)<Math.abs(nearest.time-target))nearest=item;if(Math.abs(nearest.time-target)>8*60000)return;const point=locations[index];points.push({lat:point.lat,lon:point.lon,rate:validRadarRate(nearest.rate)??0,observedAt:new Date(nearest.time).toISOString()})});if(points.length)frames.push({time:new Date(target).toISOString(),points})}
 if(!frames.length)throw new Error('EUMETNET OPERA/ORD liefert aktuell kein darstellbares Raster.');
 const current=frames.at(-1),observedAt=current.time;return{points:current.points,frames,provider:'EUMETNET OPERA/ORD RATE',observedAt,spacingKm,nativeResolutionKm:2,temporalResolutionMinutes:15,coverage:'Europa · 5×5-Stützraster aus dem OPERA-Komposit · Film bis 60 Minuten',license:'CC BY 4.0'};
}
function flattenCoordinatePairs(value,out=[]){if(!Array.isArray(value))return out;if(value.length>=2&&Number.isFinite(Number(value[0]))&&Number.isFinite(Number(value[1]))){out.push([Number(value[0]),Number(value[1])]);return out}for(const child of value)flattenCoordinatePairs(child,out);return out}
function geometryCentre(geometry){const pairs=flattenCoordinatePairs(geometry?.coordinates);if(!pairs.length)return null;const valid=pairs.filter(([lon,lat])=>lon>=-180&&lon<=180&&lat>=-90&&lat<=90);if(!valid.length)return null;return{lon:valid.reduce((sum,p)=>sum+p[0],0)/valid.length,lat:valid.reduce((sum,p)=>sum+p[1],0)/valid.length}}
function lightningTimestamp(feature){const props=feature?.properties&&typeof feature.properties==='object'?feature.properties:{},preferred=Object.entries(props).filter(([key])=>/(time|date|valid|reference|start|end|timestamp)/i.test(key));for(const[,value]of preferred){const parsed=safeDate(value);if(parsed)return parsed}for(const value of[feature?.id,...Object.values(props)]){if(typeof value!=='string')continue;const match=value.match(/20\d{2}-?\d{2}-?\d{2}[T_ -]?\d{2}:?\d{2}(?::?\d{2})?/);if(match){const parsed=safeDate(match[0].replace('_','T'));if(parsed)return parsed}}return undefined}
function lightningNumber(properties,pattern){for(const[key,value]of Object.entries(properties||{}))if(pattern.test(key)&&number(value)!==undefined)return number(value);return undefined}
async function dwdLightningPoints(lat,lon){
 const latSpan=2.1,lonSpan=2.1/Math.max(.28,Math.cos(lat*Math.PI/180)),bbox=[lon-lonSpan,lat-latSpan,lon+lonSpan,lat+latSpan].map(value=>value.toFixed(5)).join(','),errors=[];
 for(const base of[DWD_WFS_PRIMARY,DWD_WFS_BACKUP])for(const version of['2.0.0','1.0.0']){try{const url=new URL(base);url.searchParams.set('service','WFS');url.searchParams.set('version',version);url.searchParams.set('request','GetFeature');url.searchParams.set(version==='2.0.0'?'typeNames':'typeName','dwd:Accumulated_Flash_Geometry');url.searchParams.set('outputFormat','application/json');url.searchParams.set('srsName','EPSG:4326');url.searchParams.set(version==='2.0.0'?'count':'maxFeatures','750');url.searchParams.set('bbox',`${bbox},EPSG:4326`);const response=await fetch(url.toString(),{headers:{Accept:'application/geo+json,application/json'},cf:{cacheTtl:120,cacheEverything:true}});if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json(),features=Array.isArray(data?.features)?data.features:[],points=[];
   for(const feature of features){const centre=geometryCentre(feature.geometry);if(!centre)continue;const properties=feature.properties||{},observedAt=lightningTimestamp(feature),count=lightningNumber(properties,/(count|anzahl|flash|stroke|density|number)/i),intensity=lightningNumber(properties,/(intensity|current|amplitude|strength)/i);points.push({id:String(feature.id||`${centre.lat.toFixed(5)}:${centre.lon.toFixed(5)}:${points.length}`),lat:centre.lat,lon:centre.lon,observedAt,count,intensity})}
   if(points.length)return{points:points.slice(0,750),provider:'DWD NowCastMIX Accumulated Flash Geometry',observedAt:points.map(point=>point.observedAt).filter(Boolean).sort().at(-1),coverage:'Deutschland · DWD-WFS-Blitzgeometrien'};throw new Error('keine Features')
  }catch(error){errors.push(`${new URL(base).hostname}/WFS ${version}: ${error instanceof Error?error.message:String(error)}`)}}
 throw new Error(`DWD-Blitzpunkte nicht verfügbar: ${errors.slice(-3).join(' | ')}`);
}

const XWEATHER_LIGHTNING='https://data.api.xweather.com/lightning/closest';
function mtgLightningApplies(lat,lon){return lat>=-60&&lat<=72&&lon>=-75&&lon<=80}
async function xweatherLightningPoints(lat,lon,clientId,clientSecret,enterprise=false){
 const url=new URL(XWEATHER_LIGHTNING);url.searchParams.set('p',`${lat.toFixed(5)},${lon.toFixed(5)}`);url.searchParams.set('radius','100km');url.searchParams.set('limit',enterprise?'2500':'1000');url.searchParams.set('filter','all');if(enterprise)url.searchParams.set('from','-1hour');url.searchParams.set('format','json');url.searchParams.set('client_id',clientId);url.searchParams.set('client_secret',clientSecret);
 const response=await fetch(url.toString(),{headers:{Accept:'application/json'},cf:{cacheTtl:45,cacheEverything:true}});if(!response.ok)throw new Error(`Xweather Lightning HTTP ${response.status}`);const raw=await response.json();if(raw?.success===false)throw new Error(raw?.error?.description||'Xweather Lightning nicht autorisiert');const rows=Array.isArray(raw?.response)?raw.response:[],points=[];
 for(const row of rows){const plat=number(row?.loc?.lat),plon=number(row?.loc?.long),observedAt=safeDate(row?.ob?.dateTimeISOMS||row?.ob?.dateTimeISO||row?.ob?.timestampMS||Number(row?.ob?.timestamp)*1000);if(plat===undefined||plon===undefined||!observedAt)continue;points.push({id:String(row?.id||`${plat.toFixed(5)}:${plon.toFixed(5)}:${observedAt}`),lat:plat,lon:plon,observedAt,intensity:number(row?.ob?.pulse?.peakamp),pulseType:String(row?.ob?.pulse?.type||''),count:number(row?.ob?.pulse?.numSensors),accuracyKm:1})}
 return{points,provider:'Vaisala Xweather / GLD360',observedAt:points.map(point=>point.observedAt).sort().at(-1),coverage:'Weltweit · lizenzierte Bodenblitzdaten bis 100 km Umkreis',nativeResolutionKm:1,historyMinutes:enterprise?60:5,commercial:true,enterprise};
}
async function bestLightningPoints(lat,lon,env){
 if(env?.XWEATHER_CLIENT_ID&&env?.XWEATHER_CLIENT_SECRET){try{return await xweatherLightningPoints(lat,lon,env.XWEATHER_CLIENT_ID,env.XWEATHER_CLIENT_SECRET,env?.XWEATHER_LIGHTNING_ENTERPRISE==='true')}catch(error){if(!inGermanyBounds(lat,lon)&&!mtgLightningApplies(lat,lon))throw error}}
 if(inGermanyBounds(lat,lon)){try{return{...await dwdLightningPoints(lat,lon),nativeResolutionKm:1,historyMinutes:60,commercial:false}}catch(error){if(!mtgLightningApplies(lat,lon))throw error}}
 if(mtgLightningApplies(lat,lon))return{points:[],provider:'EUMETSAT MTG-LI AFA',coverage:'Europa, Afrika und angrenzende Ozeane · satellitengestütztes 2-km-Raster',fallback:'mtg-li',nativeResolutionKm:2,historyMinutes:60,commercial:false};
 return{points:[],provider:'Keine freie Echtzeit-Blitzquelle',coverage:'Außerhalb der freien DWD- und MTG-LI-Abdeckung',fallback:'none',reason:'Weltweite Punktdaten benötigen lizenzierte Xweather-/GLD360-, nowcast/LINET- oder Earth-Networks-Zugangsdaten.',commercial:false};
}


const EUMETSAT_WMS='https://view.eumetsat.int/geoserver/wms';
const SATELLITE_DAY_CANDIDATES=[
 {provider:'eumetsat',layer:'mtg_fd:vis06_hrfi',label:'MTG FCI VIS 0,6 HRFI',resolutionKm:.5},
 {provider:'eumetsat',layer:'msg_fes:rgb_eview',label:'MSG European HRV RGB',resolutionKm:1},
 {provider:'dwd',layer:'dwd:Satellite_meteosat_1km_euat_rgb_clouds_day_and_night',label:'DWD Meteosat Europa RGB/IR',resolutionKm:1},
 {provider:'dwd',layer:'dwd:SAT_EU_RGB',label:'DWD Meteosat Europa RGB',resolutionKm:1}
];
const SATELLITE_IR_CANDIDATES=[
 {provider:'eumetsat',layer:'mtg_fd:ir105_hrfi',label:'MTG FCI IR 10,5 HRFI',resolutionKm:1},
 {provider:'eumetsat',layer:'msg_fes:ir108',label:'MSG SEVIRI IR 10,8',resolutionKm:3},
 {provider:'dwd',layer:'dwd:Satellite_meteosat_1km_euat_rgb_clouds_day_and_night',label:'DWD Meteosat Europa Tag/Nacht',resolutionKm:1},
 {provider:'dwd',layer:'dwd:SAT_EU_RGB',label:'DWD Meteosat Europa RGB',resolutionKm:1}
];
// H40B ist das operative MTG-FCI-Niederschlagsprodukt. Es wird automatisch
// bevorzugt, sobald EUMETView einen entsprechenden WMS-Layer veröffentlicht.
// Bis dahin ist das öffentlich verfügbare MSG/H SAF H60B der belastbare WMS-Fallback.
const SATELLITE_PRECIP_CANDIDATES=[
 {provider:'eumetsat',layer:'mtg_fd:h40b',label:'H SAF MTG H40B Niederschlagsrate',resolutionKm:2},
 {provider:'eumetsat',layer:'mtg_fd:precipitation_rate',label:'MTG FCI Niederschlagsrate',resolutionKm:2},
 {provider:'eumetsat',layer:'msg_fes:h60b',label:'H SAF Satelliten-Niederschlagsrate',resolutionKm:3}
];
async function wmsCapabilitiesText(base,label){const response=await fetch(dwdCapabilitiesUrl(base),{headers:{Accept:'application/xml,text/xml,*/*'},cf:{cacheTtl:300,cacheEverything:true}});if(!response.ok)throw new Error(`${label} Capabilities HTTP ${response.status}`);return response.text()}
async function firstWmsCapabilities(bases,label){const errors=[];for(const base of bases){try{return await wmsCapabilitiesText(base,label)}catch(error){errors.push(error instanceof Error?error.message:String(error))}}throw new Error(errors.join(' | ')||`${label} Capabilities nicht verfügbar`)}
function recentObservedTimes(times,now=Date.now(),historyMinutes=135,maxFrames=28,futureMinutes=10){const unique=[...new Set((times||[]).filter(Number.isFinite).filter(time=>time>=now-historyMinutes*60000&&time<=now+futureMinutes*60000))].sort((a,b)=>a-b);if(unique.length<=maxFrames)return unique;const step=Math.max(1,Math.ceil(unique.length/maxFrames)),selected=unique.filter((_,index)=>index%step===0);if(selected.at(-1)!==unique.at(-1))selected.push(unique.at(-1));return selected.slice(-maxFrames)}
function hasWmsLayer(xml,layer){const target=String(layer).trim().toLowerCase();return tagValues(xml,'Name').some(value=>value.trim().toLowerCase()===target)}
function satelliteProduct(capabilities,candidates,now=Date.now()){
 const products=[],latestOnly=[];
 for(const candidate of candidates){const xml=capabilities[candidate.provider];if(!xml||!hasWmsLayer(xml,candidate.layer))continue;const all=dwdTimesFromCapabilities(xml,candidate.layer),latest=all.at(-1);
  // Satellitenprodukte erscheinen häufig einige Minuten nach ihrem nominellen
  // Aufnahmezeitpunkt. Deshalb gilt ein großzügiger Publikationspuffer.
  if(Number.isFinite(latest)&&latest>=now-190*60000&&latest<=now+15*60000){const times=recentObservedTimes(all,now,150,30,15);if(times.length)products.push({...candidate,times:times.map(time=>new Date(time).toISOString()),latest,fresh:latest>=now-80*60000})}
  else latestOnly.push({...candidate,times:[],latestOnly:true,fresh:false});
 }
 products.sort((a,b)=>Number(b.fresh)-Number(a.fresh)||Number(b.provider==='eumetsat')-Number(a.provider==='eumetsat')||(a.resolutionKm??99)-(b.resolutionKm??99)||b.latest-a.latest);let chosen=products[0];
 if(!chosen){latestOnly.sort((a,b)=>Number(b.provider==='eumetsat')-Number(a.provider==='eumetsat')||(a.resolutionKm??99)-(b.resolutionKm??99));chosen=latestOnly[0]}
 if(!chosen)return undefined;const{latest,...product}=chosen;return{...product,fallback:product.provider!=='eumetsat'||(!product.layer.startsWith('mtg_fd:')&&product.layer!=='msg_fes:h60b')}
}
async function compositeTimes(lat,lon){const serverTime=new Date().toISOString(),now=Date.now(),result={satelliteDay:[],satelliteIr:[],satellitePrecip:[],mtgLightning:[],dwdLightning:[],dwdRadar:[],dwdRadarLayer:'',checkedAt:serverTime,serverTime},capabilities={},errors=[];
 const requests=[];
 if(mtgLightningApplies(lat,lon))requests.push(firstWmsCapabilities([EUMETSAT_WMS],'EUMETSAT').then(xml=>{capabilities.eumetsat=xml}).catch(error=>errors.push(error instanceof Error?error.message:String(error))));
 if(mtgLightningApplies(lat,lon)||inGermanyBounds(lat,lon))requests.push(firstWmsCapabilities([DWD_RADAR_WMS_PRIMARY,DWD_RADAR_WMS_BACKUP],'DWD').then(xml=>{capabilities.dwd=xml}).catch(error=>errors.push(error instanceof Error?error.message:String(error))));
 await Promise.all(requests);
 if(capabilities.eumetsat)result.mtgLightning=recentObservedTimes(dwdTimesFromCapabilities(capabilities.eumetsat,'mtg_fd:li_afa'),now,130,28,10).map(time=>new Date(time).toISOString());
 if(capabilities.dwd&&inGermanyBounds(lat,lon)){
  result.dwdLightning=recentObservedTimes(dwdTimesFromCapabilities(capabilities.dwd,'dwd:Blitzdichte'),now,130,28,10).map(time=>new Date(time).toISOString());
  for(const layer of DWD_RADAR_LAYERS){const available=dwdTimesFromCapabilities(capabilities.dwd,layer);if(!available.length)continue;const selected=selectDwdTimes(available,now);if(selected.length){result.dwdRadar=selected.map(time=>new Date(time).toISOString());result.dwdRadarLayer=layer;break}}
 }
 if(mtgLightningApplies(lat,lon)){result.satelliteDayProduct=satelliteProduct(capabilities,SATELLITE_DAY_CANDIDATES,now);result.satelliteIrProduct=satelliteProduct(capabilities,SATELLITE_IR_CANDIDATES,now);result.satellitePrecipProduct=satelliteProduct(capabilities,SATELLITE_PRECIP_CANDIDATES,now);result.satelliteDay=result.satelliteDayProduct?.times||[];result.satelliteIr=result.satelliteIrProduct?.times||[];result.satellitePrecip=result.satellitePrecipProduct?.times||[]}
 return{...result,errors};
}

function interpolatePoint(a,b,level){const av=Number(a.value),bv=Number(b.value),den=bv-av,ratio=Math.abs(den)<1e-9?.5:clamp((level-av)/den,0,1);return[a.lat+(b.lat-a.lat)*ratio,a.lon+(b.lon-a.lon)*ratio]}
function distanceKm(a,b){const rad=Math.PI/180,lat1=a[0]*rad,lat2=b[0]*rad,dLat=(b[0]-a[0])*rad,dLon=(b[1]-a[1])*rad,h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;return 12742*Math.asin(Math.min(1,Math.sqrt(h)))}
function median(values){const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b);if(!sorted.length)return NaN;const middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2}
function pressureContourStep(values,lats,lons){const gradients=[];for(let row=0;row<values.length;row++)for(let col=0;col<values[row].length;col++){const value=values[row][col];if(!Number.isFinite(value))continue;if(col+1<values[row].length&&Number.isFinite(values[row][col+1])){const km=distanceKm([lats[row],lons[col]],[lats[row],lons[col+1]]);if(km>0)gradients.push(Math.abs(values[row][col+1]-value)/km)}if(row+1<values.length&&Number.isFinite(values[row+1][col])){const km=distanceKm([lats[row],lons[col]],[lats[row+1],lons[col]]);if(km>0)gradients.push(Math.abs(values[row+1][col]-value)/km)}}const changePer100Km=median(gradients)*100;if(!Number.isFinite(changePer100Km))return 4;if(changePer100Km<1.5)return 1;if(changePer100Km<3)return 2;return 4}
function upsampleGrid(values,lats,lons,factor=2){if(factor<=1)return{values,lats,lons};const rows=(values.length-1)*factor+1,cols=(values[0].length-1)*factor+1,out=Array.from({length:rows},()=>Array(cols).fill(NaN)),outLats=Array(rows),outLons=Array(cols);for(let row=0;row<rows;row++){const sourceRow=row/factor,r0=Math.floor(sourceRow),r1=Math.min(values.length-1,r0+1),fy=sourceRow-r0;outLats[row]=lats[r0]+(lats[r1]-lats[r0])*fy;for(let col=0;col<cols;col++){const sourceCol=col/factor,c0=Math.floor(sourceCol),c1=Math.min(values[0].length-1,c0+1),fx=sourceCol-c0;if(row===0)outLons[col]=lons[c0]+(lons[c1]-lons[c0])*fx;const q00=values[r0][c0],q10=values[r0][c1],q01=values[r1][c0],q11=values[r1][c1];if([q00,q10,q01,q11].every(Number.isFinite))out[row][col]=q00*(1-fx)*(1-fy)+q10*fx*(1-fy)+q01*(1-fx)*fy+q11*fx*fy}}return{values:out,lats:outLats,lons:outLons}}
function pointKey(point){return`${point[0].toFixed(5)},${point[1].toFixed(5)}`}
function stitchSegments(segments){if(!segments.length)return[];const endpointMap=new Map();segments.forEach((segment,index)=>segment.forEach(point=>{const key=pointKey(point),items=endpointMap.get(key)||[];items.push(index);endpointMap.set(key,items)}));const used=new Set(),paths=[];for(let seed=0;seed<segments.length;seed++){if(used.has(seed))continue;const segment=segments[seed],aKey=pointKey(segment[0]),bKey=pointKey(segment[1]),start=(endpointMap.get(aKey)?.length||0)===1?segment[0]:(endpointMap.get(bKey)?.length||0)===1?segment[1]:segment[0],path=[start];let current=start;while(true){const candidates=(endpointMap.get(pointKey(current))||[]).filter(index=>!used.has(index));if(!candidates.length)break;const index=candidates[0],nextSegment=segments[index];used.add(index);const next=pointKey(nextSegment[0])===pointKey(current)?nextSegment[1]:nextSegment[0];path.push(next);current=next;if(path.length>segments.length+2)break}if(path.length>1)paths.push(path)}return paths}
function smoothPath(path,iterations=2){if(path.length<3)return path;let result=path.map(point=>[point[0],point[1]]),closed=pointKey(result[0])===pointKey(result[result.length-1]);if(closed)result=result.slice(0,-1);for(let iteration=0;iteration<iterations;iteration++){const next=[];if(!closed)next.push(result[0]);const count=closed?result.length:result.length-1;for(let index=0;index<count;index++){const a=result[index],b=result[(index+1)%result.length];next.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}if(!closed)next.push(result[result.length-1]);result=next}if(closed)result.push(result[0]);return result}
function contourSegments(values,lats,lons,step,maxLevels=90){const interpolated=upsampleGrid(values,lats,lons,2),field=interpolated.values,fieldLats=interpolated.lats,fieldLons=interpolated.lons,finite=field.flat().filter(Number.isFinite);if(!finite.length)return[];const min=Math.min(...finite),max=Math.max(...finite),first=Math.ceil(min/step)*step,levels=[];for(let level=first;level<=max&&levels.length<maxLevels;level+=step){const segments=[];for(let row=0;row<field.length-1;row++)for(let col=0;col<field[row].length-1;col++){const corners=[{lat:fieldLats[row],lon:fieldLons[col],value:field[row][col]},{lat:fieldLats[row],lon:fieldLons[col+1],value:field[row][col+1]},{lat:fieldLats[row+1],lon:fieldLons[col+1],value:field[row+1][col+1]},{lat:fieldLats[row+1],lon:fieldLons[col],value:field[row+1][col]}];if(corners.some(point=>!Number.isFinite(point.value)))continue;const edges=[[0,1],[1,2],[2,3],[3,0]],hits=[];for(const[i,j]of edges){const av=corners[i].value-level,bv=corners[j].value-level;if(av===0&&bv===0)continue;if(av===0||bv===0||av*bv<0)hits.push(interpolatePoint(corners[i],corners[j],level))}if(hits.length===2)segments.push([hits[0],hits[1]]);else if(hits.length>=4){const center=(corners[0].value+corners[1].value+corners[2].value+corners[3].value)/4;if(center>=level){segments.push([hits[0],hits[3]],[hits[1],hits[2]])}else{segments.push([hits[0],hits[1]],[hits[2],hits[3]])}}}const paths=stitchSegments(segments).filter(path=>path.length>2).map(path=>smoothPath(path,2));if(paths.length)levels.push({level:Number(level.toFixed(2)),paths})}return levels}
function openMeteoRows(data){return Array.isArray(data)?data:Array.isArray(data?.results)?data.results:[data]}

const METEOGRAM_LEVELS=[1000,975,950,925,900,850,800,700,600,500,400,300];
const METEOGRAM_MODELS=new Map([
 ['best_match','Best Match'],['dwd_icon_d2','DWD ICON-D2'],['dwd_icon_eu','DWD ICON-EU'],['meteofrance_arpege_europe','Météo-France ARPEGE Europa'],['ecmwf_ifs','ECMWF IFS HRES'],['ncep_gfs013','NOAA GFS 0,11°'],['dwd_icon','DWD ICON Global']
]);
const METEOGRAM_SURFACE=['temperature_2m','relative_humidity_2m','pressure_msl','wind_speed_10m','wind_direction_10m','wind_gusts_10m','precipitation','rain','showers','snowfall','snow_depth','weather_code','freezing_level_height'];
const METEOGRAM_PROFILE=METEOGRAM_LEVELS.flatMap(level=>[`temperature_${level}hPa`,`relative_humidity_${level}hPa`,`cloud_cover_${level}hPa`,`wind_speed_${level}hPa`,`wind_direction_${level}hPa`,`geopotential_height_${level}hPa`]);
async function meteogramData(lat,lon,model,elevation){
 const selected=METEOGRAM_MODELS.has(model)?model:'best_match',url=new URL('https://api.open-meteo.com/v1/forecast');url.searchParams.set('latitude',String(lat));url.searchParams.set('longitude',String(lon));if(Number.isFinite(elevation))url.searchParams.set('elevation',String(Math.max(-500,Math.min(9000,elevation))));url.searchParams.set('hourly',[...METEOGRAM_SURFACE,...METEOGRAM_PROFILE].join(','));url.searchParams.set('forecast_hours','168');url.searchParams.set('models',selected);url.searchParams.set('timezone','GMT');url.searchParams.set('timeformat','unixtime');url.searchParams.set('wind_speed_unit','kn');url.searchParams.set('precipitation_unit','mm');url.searchParams.set('temperature_unit','celsius');url.searchParams.set('cell_selection','nearest');
 const response=await fetch(url.toString(),{headers:{Accept:'application/json','User-Agent':`MID-weather-dashboard/${WORKER_VERSION}`},cf:{cacheTtl:600,cacheEverything:true}}),text=await response.text();let data={};try{data=JSON.parse(text)}catch{}if(!response.ok||data?.error)throw new Error(data?.reason||data?.error||`Open-Meteo Meteogramm HTTP ${response.status}`);
 let meta=null;if(selected!=='best_match'){try{const metaResponse=await fetch(`https://api.open-meteo.com/data/${selected}/static/meta.json`,{headers:{Accept:'application/json','User-Agent':`MID-weather-dashboard/${WORKER_VERSION}`},cf:{cacheTtl:600,cacheEverything:true}});if(metaResponse.ok)meta=await metaResponse.json()}catch{}}
 const initial=number(meta?.last_run_initialisation_time),available=number(meta?.last_run_availability_time);return{data,requestedModel:selected,modelLabel:METEOGRAM_MODELS.get(selected),runInitialisationTime:Number.isFinite(initial)?new Date(initial*1000).toISOString():undefined,runAvailabilityTime:Number.isFinite(available)?new Date(available*1000).toISOString():undefined,checkedAt:new Date().toISOString()};
}

function modelContourDomain(lat,lon){
 if(lat>=30&&lat<=72&&lon>=-30&&lon<=48)return{scope:'Europa',south:33,north:70,west:-23,east:45,rows:17,cols:25,model:'dwd_icon_eu',modelLabel:'DWD ICON-EU'};
 if(lat>=15&&lat<=72&&lon>=-170&&lon<=-45)return{scope:'Nordamerika',south:20,north:68,west:-145,east:-52,rows:17,cols:25,model:'ncep_gfs013',modelLabel:'NOAA GFS 0,11°'};
 const latSpan=34,cos=Math.max(.35,Math.cos(lat*Math.PI/180)),lonSpan=Math.min(90,52/cos),south=Math.max(-80,lat-latSpan/2),north=Math.min(80,lat+latSpan/2),west=Math.max(-180,lon-lonSpan/2),east=Math.min(180,lon+lonSpan/2);return{scope:'Großregion',south,north,west,east,rows:17,cols:25,model:'ecmwf_ifs',modelLabel:'ECMWF IFS HRES'}
}
async function modelContours(lat,lon){
 const domain=modelContourDomain(lat,lon),{rows,cols,south,north,west,east}=domain,lats=Array.from({length:rows},(_,index)=>north-index*(north-south)/(rows-1)),lons=Array.from({length:cols},(_,index)=>west+index*(east-west)/(cols-1)),latitudes=[],longitudes=[];for(const y of lats)for(const x of lons){latitudes.push(y.toFixed(4));longitudes.push(x.toFixed(4))}
 const url=new URL('https://api.open-meteo.com/v1/forecast');url.searchParams.set('latitude',latitudes.join(','));url.searchParams.set('longitude',longitudes.join(','));url.searchParams.set('hourly','pressure_msl,geopotential_height_500hPa');url.searchParams.set('past_hours','2');url.searchParams.set('forecast_hours','5');url.searchParams.set('models',domain.model);url.searchParams.set('timezone','GMT');url.searchParams.set('cell_selection','nearest');url.searchParams.set('elevation','nan');
 const response=await fetch(url.toString(),{headers:{Accept:'application/json','User-Agent':`MID-weather-dashboard/${WORKER_VERSION}`},cf:{cacheTtl:900,cacheEverything:true}});if(!response.ok)throw new Error(`Open-Meteo Modelllinien HTTP ${response.status}`);const points=openMeteoRows(await response.json());if(points.length!==rows*cols)throw new Error(`Open-Meteo lieferte ${points.length} statt ${rows*cols} Rasterpunkte.`);const times=points[0]?.hourly?.time||[],frames=[];
 for(let ti=0;ti<times.length;ti++){const pressure=Array.from({length:rows},()=>Array(cols).fill(NaN)),height=Array.from({length:rows},()=>Array(cols).fill(NaN));for(let pi=0;pi<points.length;pi++){const row=Math.floor(pi/cols),col=pi%cols;pressure[row][col]=number(points[pi]?.hourly?.pressure_msl?.[ti])??NaN;height[row][col]=number(points[pi]?.hourly?.geopotential_height_500hPa?.[ti])??NaN}const stamp=safeDate(times[ti]);if(!stamp)continue;const isobarStep=pressureContourStep(pressure,lats,lons);frames.push({time:stamp,isobarStep,isoheightStepGpdm:8,isobars:contourSegments(pressure,lats,lons,isobarStep),isoheights:contourSegments(height,lats,lons,80,35)})}
 if(!frames.length)throw new Error('Open-Meteo lieferte keine auswertbaren Modelllinien.');return{frames,provider:'Open-Meteo',model:domain.modelLabel,resolutionNote:`${domain.scope} · einheitliches ${domain.modelLabel} · ${rows}×${cols} Stützraster, bilinear verdichtet und geglättet`,grid:{rows,cols,latSpan:north-south,lonSpan:east-west,scope:domain.scope,bounds:{south,north,west,east}},contours:{isobars:'dynamisch 1/2/4 hPa nach Druckgradient; Zielabstand ungefähr 100 km',isoheights:'8 gpdm'},checkedAt:new Date().toISOString()};
}
const WMS_ALLOWED_LAYERS={
 dwd:new Set([...DWD_RADAR_LAYERS,'dwd:Blitzdichte',...SATELLITE_DAY_CANDIDATES.filter(item=>item.provider==='dwd').map(item=>item.layer),...SATELLITE_IR_CANDIDATES.filter(item=>item.provider==='dwd').map(item=>item.layer)]),
 eumetsat:new Set(['mtg_fd:vis06_hrfi','mtg_fd:ir105_hrfi','mtg_fd:li_afa','msg_fes:rgb_eview','msg_fes:ir108',...SATELLITE_PRECIP_CANDIDATES.map(item=>item.layer)])
};
async function compositeWmsResponse(request){
 const url=new URL(request.url),provider=String(url.searchParams.get('provider')||'').toLowerCase(),bases=provider==='dwd'?[DWD_RADAR_WMS_PRIMARY,DWD_RADAR_WMS_BACKUP]:provider==='eumetsat'?[EUMETSAT_WMS]:[];
 if(!bases.length)return json({error:'Ungültiger WMS-Provider',version:WORKER_VERSION},400,{'cache-control':'no-store'});
 const layers=String(url.searchParams.get('layers')||'').split(',').map(value=>value.trim()).filter(Boolean),allowedLayers=WMS_ALLOWED_LAYERS[provider];
 if(!layers.length||layers.some(layer=>!allowedLayers?.has(layer)))return json({error:'Nicht freigegebener WMS-Layer',version:WORKER_VERSION},400,{'cache-control':'no-store'});
 const requestedTime=url.searchParams.get('time'),requestedMs=requestedTime?Date.parse(requestedTime):NaN;if(requestedTime&&!Number.isFinite(requestedMs))return json({error:'Ungültiger WMS-Zeitpunkt',version:WORKER_VERSION},400,{'cache-control':'no-store'});
 if(Number.isFinite(requestedMs)){const now=Date.now(),isRadar=layers.some(layer=>DWD_RADAR_LAYERS.includes(layer)),isLightning=layers.some(layer=>layer==='dwd:Blitzdichte'||layer==='mtg_fd:li_afa'),isSatellitePrecip=layers.some(layer=>SATELLITE_PRECIP_CANDIDATES.some(item=>item.layer===layer)),minimum=now-(isRadar?70:isLightning?135:isSatellitePrecip?195:195)*60000,maximum=now+(isRadar?125:15)*60000;if(requestedMs<minimum||requestedMs>maximum)return json({error:'Der angeforderte WMS-Zeitpunkt liegt außerhalb des zulässigen Live-/Nowcast-Fensters.',version:WORKER_VERSION,serverTime:new Date(now).toISOString()},409,{'cache-control':'no-store'})}
 const allowed=new Set(['service','request','version','layers','styles','format','transparent','crs','srs','bbox','width','height','time','exceptions','bgcolor','tiled']),errors=[];
 for(const base of bases){try{
  const upstream=new URL(base);for(const[key,value]of url.searchParams){const normalized=key.toLowerCase();if(allowed.has(normalized))upstream.searchParams.set(normalized,value)}
  if(!upstream.searchParams.has('service'))upstream.searchParams.set('service','WMS');if(!upstream.searchParams.has('request'))upstream.searchParams.set('request','GetMap');
  const response=await fetch(upstream.toString(),{headers:{Accept:'image/png,image/webp,image/jpeg,*/*','User-Agent':`MID-weather-dashboard/${WORKER_VERSION}`},cf:{cacheTtl:120,cacheEverything:true}}),type=String(response.headers.get('content-type')||'').toLowerCase();
  if(!response.ok)throw new Error(`${new URL(base).hostname} HTTP ${response.status}`);if(!type.startsWith('image/')){const text=(await response.text()).slice(0,240).replace(/\s+/g,' ');throw new Error(`${new URL(base).hostname} lieferte kein Kartenbild${text?`: ${text}`:''}`)}
  return new Response(response.body,{status:200,headers:{'content-type':type,'access-control-allow-origin':'*','cache-control':'public, max-age=120','x-mid-wms-provider':provider,'x-mid-wms-layer':layers.join(','),'x-mid-worker-version':WORKER_VERSION}})
 }catch(error){errors.push(error instanceof Error?error.message:String(error))}}
 return new Response(errors.join(' | ')||'WMS-Karte nicht verfügbar',{status:502,headers:{'content-type':'text/plain; charset=utf-8','access-control-allow-origin':'*','cache-control':'no-store','x-mid-worker-version':WORKER_VERSION}});
}

export default{async fetch(request,env){
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:CORS});
 const u=new URL(request.url),mode=u.searchParams.get('mode')||'';
 if(mode==='px250-file')return px250FileResponse(request);
 if(mode==='composite-wms')return compositeWmsResponse(request);
 if(mode==='health')return json({ok:true,version:WORKER_VERSION,services:['stations','alerts','hyperlocal-networks','model-assisted-local-analysis','radar-nowcast','px250-proxy','opera-grid-history','rainviewer-metadata','best-location-lightning','composite-product-times','model-contours','pressure-level-meteogram','cors-safe-composite-wms'],providers:{'NOAA AviationWeather':true,'DWD Open Data / Bright Sky':true,'GeoSphere Austria':true,'openSenseMap / senseBox':env?.ENABLE_OPENSENSEMAP!=='false','Weather Underground':Boolean(env?.WEATHER_COM_API_KEY||env?.WU_API_KEY),Netatmo:Boolean(env?.NETATMO_ACCESS_TOKEN),'Synoptic Data':Boolean(env?.SYNOPTIC_TOKEN),Xweather:Boolean(env?.XWEATHER_CLIENT_ID&&env?.XWEATHER_CLIENT_SECRET)},timestamp:new Date().toISOString()});
 const lat=Number(u.searchParams.get('lat')),lon=Number(u.searchParams.get('lon'));if(!Number.isFinite(lat)||!Number.isFinite(lon))return json({error:'lat/lon required',version:WORKER_VERSION},400);
 if(mode==='rainviewer-meta'){
  try{return json({...await rainViewerMetadata(),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=120'})}
  catch(error){return json({host:'',radar:{past:[],nowcast:[]},error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='model-contours'){
  try{return json({...await modelContours(lat,lon),version:WORKER_VERSION},200,{'cache-control':'public, max-age=900'})}
  catch(error){return json({frames:[],error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='meteogram'){
  try{return json({...await meteogramData(lat,lon,String(u.searchParams.get('model')||'best_match'),Number(u.searchParams.get('elevation'))),version:WORKER_VERSION},200,{'cache-control':'public, max-age=600'})}
  catch(error){return json({error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='px250-meta'){
  try{return json({...await px250Metadata(request,lat,lon),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=120'})}
  catch(error){return json({available:false,error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='opera-grid'){
  try{return json({...await operaGrid(lat,lon),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=180'})}
  catch(error){return json({points:[],error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='composite-times'){
  try{return json({...await compositeTimes(lat,lon),version:WORKER_VERSION},200,{'cache-control':'public, max-age=60'})}
  catch(error){return json({satelliteDay:[],satelliteIr:[],satellitePrecip:[],mtgLightning:[],dwdLightning:[],dwdRadar:[],dwdRadarLayer:'',serverTime:new Date().toISOString(),error:error instanceof Error?error.message:String(error),version:WORKER_VERSION},502,{'cache-control':'no-store'})}
 }
 if(mode==='lightning-points'){
  try{return json({...await bestLightningPoints(lat,lon,env),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=60'})}
  catch(error){return json({points:[],error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='radar-nowcast'){
  try{const result=await radarNowcastForPoint(lat,lon,u.searchParams.get('country')||'');return json({...result,version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=120'})}
  catch(error){return json({error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='alerts'){
  try{const result=await officialAlerts(lat,lon,u.searchParams.get('country')||'',u.searchParams.get('name')||'',u.searchParams.get('region')||'',u.searchParams.get('district')||'',u.searchParams.get('language')||'de');return json({...result,version:WORKER_VERSION,checkedAt:new Date().toISOString()})}
  catch(error){return json({alerts:[],error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 const radiusKm=Math.min(250,Math.max(25,Number(u.searchParams.get('radius_km'))||140)),openSenseEnabled=env?.ENABLE_OPENSENSEMAP!=='false',sources=[
  {name:'NOAA AviationWeather',enabled:true,promise:metarRows(lat,lon,radiusKm)},
  {name:'DWD Open Data / Bright Sky',enabled:inGermanyBounds(lat,lon),promise:brightSkyRows(lat,lon,radiusKm)},
  {name:'GeoSphere Austria',enabled:geoSphereApplies(lat,lon),promise:geoSphereApplies(lat,lon)?geoSphereRows(lat,lon,radiusKm):Promise.resolve([])},
  {name:'openSenseMap / senseBox',enabled:openSenseEnabled,promise:openSenseEnabled?openSenseMapRows(lat,lon,radiusKm):Promise.resolve([])},
  {name:'Weather Underground',enabled:Boolean(env?.WEATHER_COM_API_KEY||env?.WU_API_KEY),promise:weatherUndergroundRows(lat,lon,radiusKm,env?.WEATHER_COM_API_KEY||env?.WU_API_KEY)},
  {name:'Netatmo',enabled:Boolean(env?.NETATMO_ACCESS_TOKEN),promise:netatmoRows(lat,lon,radiusKm,env?.NETATMO_ACCESS_TOKEN)},
  {name:'Synoptic Data',enabled:Boolean(env?.SYNOPTIC_TOKEN),promise:synopticRows(lat,lon,radiusKm,env?.SYNOPTIC_TOKEN)},
  {name:'Xweather',enabled:Boolean(env?.XWEATHER_CLIENT_ID&&env?.XWEATHER_CLIENT_SECRET),promise:xweatherRows(lat,lon,radiusKm,env?.XWEATHER_CLIENT_ID,env?.XWEATHER_CLIENT_SECRET)}
 ],settled=await Promise.allSettled(sources.map(x=>x.promise)),rows=settled.flatMap(x=>x.status==='fulfilled'?x.value:[]).sort((a,b)=>(a.distance??999999)-(b.distance??999999)).slice(0,180),errors=settled.map((x,i)=>x.status==='rejected'?`${sources[i].name}: ${x.reason instanceof Error?x.reason.message:String(x.reason)}`:'').filter(Boolean),providers=Object.fromEntries(sources.map(x=>[x.name,x.enabled]));
 return json({data:rows,providers,diagnostics:{radiusKm,rows:rows.length,errors,sourceRows:Object.fromEntries(sources.map((x,i)=>[x.name,settled[i].status==='fulfilled'?settled[i].value.length:0]))},version:WORKER_VERSION});
}};
