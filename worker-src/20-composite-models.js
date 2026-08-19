// --- Kompositbild-Daten v0.7.30 --------------------------------------------
const DWD_PX250_ROOTS=['https://opendata.dwd.de/weather/radar/sites/px250','https://opendatao.dwd.de/weather/radar/sites/px250'];
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
 const errors=[];
 for(const root of DWD_PX250_ROOTS){try{const directory=`${root}/${site.code}/`,response=await fetch(directory,{headers:{Accept:'text/html,*/*'},cf:{cacheTtl:120,cacheEverything:true}});if(!response.ok)throw new Error(`HTTP ${response.status}`);const html=await response.text(),pattern=new RegExp(`rab02-tt_${site.wmo}-(\\d{14})-de${site.code}-hd5`,'g'),matches=[...html.matchAll(pattern)].map(match=>({stamp:match[1],file:match[0]})).sort((a,b)=>a.stamp.localeCompare(b.stamp)),latest=matches.at(-1);if(!latest)throw new Error('keine HDF5-Datei');const observedAt=pxTimestamp(latest.stamp),observedMs=observedAt?Date.parse(observedAt):NaN,ageMinutes=Number.isFinite(observedMs)?Math.round((Date.now()-observedMs)/60000):Infinity;return{...site,root,latest,observedAt,observedMs,ageMinutes}}catch(error){errors.push(`${root}: ${error instanceof Error?error.message:String(error)}`)}}
 throw new Error(`${site.name}: ${errors.join(' | ')||'PX250-Verzeichnis nicht erreichbar'}`);
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
 // Das nationale HX-Produkt ist das amtliche 250-m-Reflektivitätskomposit.
 // Es wird für Deutschland zuerst verwendet, damit die hochaufgelöste Ansicht
 // denselben flächigen Wetterzustand wie das 1-km-Komposit beschreibt. Lokale
 // PX250-Standortradare bleiben als transparenter Ausweichweg erhalten.
 const rangeKm=150,candidates=nearestPxSites(lat,lon,rangeKm).slice(0,5),diagnostics=[];
 if(inGermanyBounds(lat,lon)){try{const hx=await hxLatest();diagnostics.push(`HX: ${Number.isFinite(hx.ageMinutes)?hx.ageMinutes:'?'} min`);if(Number.isFinite(hx.observedMs)&&hx.ageMinutes<=45&&hx.ageMinutes>=-10){const fileUrl=new URL(request.url);fileUrl.search='';fileUrl.searchParams.set('mode','px250-file');fileUrl.searchParams.set('product','hx');fileUrl.searchParams.set('file',hx.latest.file);return{available:true,product:'hx',productName:'DWD HX 250-m-Deutschlandkomposit',site:'hx',siteName:'Deutschlandkomposit HX',coverage:'Deutschland',distanceKm:0,observedAt:hx.observedAt,ageMinutes:hx.ageMinutes,fileUrl:fileUrl.toString(),nativeResolutionM:250,rangeKm:650,georeferencing:'projected-national',warning:'250-m-Reflektivität wird für die gemeinsame Niederschlagsskala in eine äquivalente Regenrate umgerechnet.'}}}catch(error){diagnostics.push(error instanceof Error?error.message:String(error))}}
 for(const site of candidates){try{const item=await pxSiteLatest(site);diagnostics.push(`${item.name}: ${Number.isFinite(item.ageMinutes)?item.ageMinutes:'?'} min`);if(!Number.isFinite(item.observedMs)||item.ageMinutes>45||item.ageMinutes<-10)continue;const fileUrl=new URL(request.url);fileUrl.search='';fileUrl.searchParams.set('mode','px250-file');fileUrl.searchParams.set('product','px250');fileUrl.searchParams.set('site',item.code);fileUrl.searchParams.set('file',item.latest.file);return{available:true,product:'px250',productName:'DWD PX250 Standortradar · Fallback',site:item.code,siteName:`${item.name} · Fallback`,stationId:item.wmo,radarLat:item.lat,radarLon:item.lon,distanceKm:Math.round(item.distanceKm*10)/10,observedAt:item.observedAt,ageMinutes:item.ageMinutes,fileUrl:fileUrl.toString(),nativeResolutionM:250,rangeKm,georeferencing:'local-site-fallback',warning:'Das nationale HX-Komposit war nicht aktuell verfügbar; angezeigt wird ersatzweise das nächstgelegene Standortradar.'}}catch(error){diagnostics.push(error instanceof Error?error.message:String(error))}}
 const nearest=[...DWD_PX250_SITES].sort((a,b)=>distance(lat,lon,a.lat,a.lon)-distance(lat,lon,b.lat,b.lon))[0],distanceKm=distance(lat,lon,nearest.lat,nearest.lon)/1000;
 return{available:false,stale:Boolean(candidates.length),nativeResolutionM:250,rangeKm,site:nearest.code,siteName:nearest.name,distanceKm:Math.round(distanceKm*10)/10,reason:`Kein höchstens 45 Minuten altes HX-Deutschlandkomposit und kein aktuelles lokales PX250-Fallback verfügbar. Nächster Standort ${nearest.name} in ${Math.round(distanceKm)} km. ${diagnostics.slice(0,6).join(' · ')}`};
}

async function px250FileResponse(request){
 const url=new URL(request.url),product=String(url.searchParams.get('product')||'px250').toLowerCase(),file=String(url.searchParams.get('file')||'');
 if(product==='hx'){
  const match=file.match(/^composite_hx_(\d{8})_(\d{4})-hd5$/);if(!match)return json({error:'Ungültige DWD-HX-Dateianforderung.',version:WORKER_VERSION},400,{'cache-control':'no-store'});
  const observedAt=pxTimestamp(`${match[1]}${match[2]}00`),ageMinutes=observedAt?(Date.now()-Date.parse(observedAt))/60000:Infinity;if(!Number.isFinite(ageMinutes)||ageMinutes>45||ageMinutes<-10)return json({error:'Der angeforderte DWD-HX-Stand ist nicht aktuell.',version:WORKER_VERSION,observedAt},409,{'cache-control':'no-store'});
  let lastStatus=502;for(const root of DWD_HX_ROOTS){const upstream=await fetch(`${root}/${file}`,{headers:{Accept:'application/octet-stream,*/*'},cf:{cacheTtl:180,cacheEverything:true}});lastStatus=upstream.status;if(!upstream.ok)continue;const headers=new Headers();headers.set('content-type',upstream.headers.get('content-type')||'application/x-hdf5');headers.set('cache-control','public, max-age=180');headers.set('access-control-allow-origin','*');headers.set('access-control-allow-methods','GET,OPTIONS');const length=upstream.headers.get('content-length');if(length)headers.set('content-length',length);return new Response(upstream.body,{status:200,headers})}return json({error:`DWD-HX-Datei HTTP ${lastStatus}`,version:WORKER_VERSION},lastStatus,{'cache-control':'no-store'});
 }
 const siteCode=String(url.searchParams.get('site')||'').toLowerCase(),site=DWD_PX250_SITES.find(item=>item.code===siteCode),stamp=file.match(/-(\d{14})-/)?.[1],observedAt=stamp?pxTimestamp(stamp):undefined,ageMinutes=observedAt?(Date.now()-Date.parse(observedAt))/60000:Infinity;
 if(!site||!new RegExp(`^rab02-tt_${site.wmo}-\\d{14}-de${site.code}-hd5$`).test(file))return json({error:'Ungültige PX250-Dateianforderung.',version:WORKER_VERSION},400,{'cache-control':'no-store'});
 if(!Number.isFinite(ageMinutes)||ageMinutes>55||ageMinutes<-10)return json({error:'Der angeforderte PX250-Stand ist nicht aktuell und wird nicht als Livebild ausgeliefert.',version:WORKER_VERSION,observedAt},409,{'cache-control':'no-store'});
 let upstream,lastStatus=502;for(const root of DWD_PX250_ROOTS){upstream=await fetch(`${root}/${site.code}/${file}`,{headers:{Accept:'application/octet-stream,*/*'},cf:{cacheTtl:180,cacheEverything:true}});lastStatus=upstream.status;if(upstream.ok)break}if(!upstream?.ok)return json({error:`DWD-PX250-Datei HTTP ${lastStatus}`,version:WORKER_VERSION},lastStatus,{'cache-control':'no-store'});const headers=new Headers();headers.set('content-type',upstream.headers.get('content-type')||'application/x-hdf5');headers.set('cache-control','public, max-age=180');headers.set('access-control-allow-origin','*');headers.set('access-control-allow-methods','GET,OPTIONS');const length=upstream.headers.get('content-length');if(length)headers.set('content-length',length);return new Response(upstream.body,{status:200,headers});
}
const OPERA_S3_ROOT='https://s3.waw3-1.cloudferro.com/openradar-24h';
function operaNominalTime(value=Date.now()){const date=new Date(value);date.setUTCSeconds(0,0);date.setUTCMinutes(Math.floor(date.getUTCMinutes()/5)*5);return date.getTime()}
function operaStamp(value){const date=new Date(value),pad=number=>String(number).padStart(2,'0');return`${date.getUTCFullYear()}${pad(date.getUTCMonth()+1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}`}
function operaObjectKey(value){const date=new Date(value),pad=number=>String(number).padStart(2,'0');return`${date.getUTCFullYear()}/${pad(date.getUTCMonth()+1)}/${pad(date.getUTCDate())}/OPERA/COMP/OPERA@${operaStamp(value)}@0@DBZH.h5`}
function operaS3UrlFromKey(key){return`${OPERA_S3_ROOT}/${key}`}
function operaS3Url(value){return operaS3UrlFromKey(operaObjectKey(value))}
function decodeXmlText(value){return String(value||'').replace(/&quot;/g,'\"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')}
function operaTimeFromKey(key){const match=String(key||'').match(/^(\d{4})\/(\d{2})\/(\d{2})\/OPERA\/COMP\/OPERA@(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})@0@DBZH\.h5$/);if(!match||match[1]!==match[4]||match[2]!==match[5]||match[3]!==match[6])return NaN;const value=Date.UTC(Number(match[4]),Number(match[5])-1,Number(match[6]),Number(match[7]),Number(match[8])),date=new Date(value);return date.getUTCFullYear()===Number(match[4])&&date.getUTCMonth()+1===Number(match[5])&&date.getUTCDate()===Number(match[6])&&date.getUTCHours()===Number(match[7])&&date.getUTCMinutes()===Number(match[8])?value:NaN}
function validOperaKey(key,reference=Date.now()){const time=operaTimeFromKey(key);return Number.isFinite(time)&&time<=reference+10*60000&&time>=reference-30*60*60000}
function operaListPrefix(value){const date=new Date(value),pad=number=>String(number).padStart(2,'0');return`${date.getUTCFullYear()}/${pad(date.getUTCMonth()+1)}/${pad(date.getUTCDate())}/OPERA/COMP/`}
async function operaListDay(value){const url=new URL(OPERA_S3_ROOT);url.searchParams.set('list-type','2');url.searchParams.set('prefix',operaListPrefix(value));url.searchParams.set('max-keys','1000');const response=await fetch(url.toString(),{headers:{Accept:'application/xml,text/xml,*/*'},cf:{cacheTtl:90,cacheEverything:true}});if(!response.ok)throw new Error(`OPERA-S3-Index HTTP ${response.status}`);const xml=await response.text(),keys=[...xml.matchAll(/<Key>([\s\S]*?)<\/Key>/g)].map(match=>decodeXmlText(match[1]).trim()).filter(key=>validOperaKey(key));if(!keys.length)throw new Error('OPERA-S3-Index enthält keine aktuellen DBZH-Objekte.');return keys}
const OPERA_ORD_API='https://api.meteogate.eu/eu-eumetnet-weather-radar/collections/observations/locations/0-20010-0-OPERA';
function operaOrdWindow(reference=Date.now()){const end=operaNominalTime(reference+5*60000),start=end-95*60000;return`${new Date(start).toISOString().replace(/\.000Z$/,'Z')}/${new Date(end).toISOString().replace(/\.000Z$/,'Z')}`}
async function operaOrdFrames(reference=Date.now()){
 const url=new URL(OPERA_ORD_API);url.searchParams.set('datetime',operaOrdWindow(reference));url.searchParams.set('f','CoverageJSON');url.searchParams.set('standard_name','DBZH');url.searchParams.set('format','ODIM');
 const response=await fetch(url.toString(),{headers:{Accept:'application/prs.coverage+json,application/json,*/*'},cf:{cacheTtl:90,cacheEverything:true}});if(response.status===204)throw new Error('OPERA-ORD-API meldet für das aktuelle Zeitfenster keine Daten.');if(!response.ok)throw new Error(`OPERA-ORD-API HTTP ${response.status}`);
 const body=await response.text(),decoded=body.replace(/\u002F/gi,'/').replace(/\\\//g,'/'),urls=[...decoded.matchAll(/https?:[^\s"'<>]+OPERA@\d{8}T\d{4}@0@DBZH\.h5/gi)].map(match=>match[0].replace(/\\u0026/gi,'&')),keys=[];
 for(const value of urls){try{const parsed=new URL(value),marker='/openradar-24h/',index=parsed.pathname.indexOf(marker);if(index>=0)keys.push(decodeURIComponent(parsed.pathname.slice(index+marker.length)))}catch{}}
 const directKeys=[...decoded.matchAll(/(?:^|["'\s])((?:\d{4}\/\d{2}\/\d{2}\/OPERA\/COMP\/)?OPERA@\d{8}T\d{4}@0@DBZH\.h5)/g)].map(match=>match[1]).map(key=>key.includes('/')?key:`${new Date(reference).toISOString().slice(0,10).replace(/-/g,'/')}\/OPERA/COMP/${key}`.replace('\\/','/'));
 const unique=[...new Set([...keys,...directKeys])].filter(key=>validOperaKey(key,reference));if(!unique.length)throw new Error('OPERA-ORD-API enthielt keine direkt nutzbaren DBZH-HDF5-Links.');return unique.map(key=>({key,time:operaTimeFromKey(key)})).filter(frame=>Number.isFinite(frame.time)).sort((a,b)=>a.time-b.time)
}
async function operaListedFrames(reference=Date.now()){const results=await Promise.allSettled([operaOrdFrames(reference),(async()=>{const days=[operaNominalTime(reference),operaNominalTime(reference-24*60*60000)],listed=await Promise.allSettled(days.map(operaListDay)),errors=listed.filter(result=>result.status==='rejected').map(result=>result.reason instanceof Error?result.reason.message:String(result.reason)),keys=[...new Set(listed.flatMap(result=>result.status==='fulfilled'?result.value:[]))];if(!keys.length)throw new Error(errors.join(' | ')||'OPERA-S3-Index lieferte keine verwertbaren Frames.');return keys.map(key=>({key,time:operaTimeFromKey(key)})).filter(frame=>Number.isFinite(frame.time)).sort((a,b)=>a.time-b.time)})()]),errors=results.filter(result=>result.status==='rejected').map(result=>result.reason instanceof Error?result.reason.message:String(result.reason)),frames=[...new Map(results.flatMap(result=>result.status==='fulfilled'?result.value:[]).map(frame=>[frame.key,frame])).values()].sort((a,b)=>a.time-b.time);if(!frames.length)throw new Error(errors.join(' | ')||'OPERA-Datenermittlung lieferte keine verwertbaren Frames.');return frames}
async function operaFrameExists(value){const upstream=operaS3Url(value);try{const probe=await fetch(upstream,{headers:{Accept:'application/octet-stream,*/*','Range':'bytes=0-7'},cf:{cacheTtl:120,cacheEverything:true}}),ok=probe.ok||probe.status===206;try{await probe.body?.cancel()}catch{}return ok}catch{return false}}
async function operaProbedFrames(reference=Date.now()){const start=operaNominalTime(reference),candidates=Array.from({length:19},(_,index)=>start-index*5*60000),frames=[];for(let offset=0;offset<candidates.length;offset+=6){const batch=candidates.slice(offset,offset+6),results=await Promise.all(batch.map(async time=>({time,exists:await operaFrameExists(time)})));for(const result of results)if(result.exists)frames.push({time:result.time,key:operaObjectKey(result.time)})}return frames.sort((a,b)=>a.time-b.time)}
function operaProxyFileUrl(request,frame){const url=new URL(request.url);url.search='';url.searchParams.set('mode','opera-raster-file');url.searchParams.set('key',frame.key);return url.toString()}
async function operaRasterMetadata(request){let frames=[],discovery='ORD API + S3 ListObjectsV2',diagnostics=[];try{frames=await operaListedFrames()}catch(error){diagnostics.push(error instanceof Error?error.message:String(error))}if(!frames.length){discovery='HDF5 Range-Probe';frames=await operaProbedFrames()}if(!frames.length)throw new Error(`EUMETNET OPERA CIRRUS liefert im aktuellen Zeitfenster keine erreichbare HDF5-Datei.${diagnostics.length?` ${diagnostics.join(' | ')}`:''}`);const selected=frames.slice(-13),latest=selected.at(-1).time;return{frames:selected.map(frame=>({time:new Date(frame.time).toISOString(),fileUrl:operaProxyFileUrl(request,frame),product:'DBZH',nativeResolutionKm:1,temporalResolutionMinutes:5})),provider:'EUMETNET OPERA CIRRUS / ORD',product:'DBZH',observedAt:new Date(latest).toISOString(),nativeResolutionKm:1,temporalResolutionMinutes:5,coverage:`Europa · echtes CIRRUS-Maximalreflektivitätskomposit · 1-km-Raster · ${selected.length} reale Produktstände`,license:'CC BY 4.0',discovery,diagnostics}}
async function operaRasterFileResponse(request){const url=new URL(request.url),key=String(url.searchParams.get('key')||''),legacyTime=Date.parse(String(url.searchParams.get('time')||'')),resolvedKey=key||(Number.isFinite(legacyTime)?operaObjectKey(legacyTime):'');if(!resolvedKey||!validOperaKey(resolvedKey))return json({error:'Ungültiger oder veralteter OPERA-Objektschlüssel.',version:WORKER_VERSION},400,{'cache-control':'no-store'});const time=operaTimeFromKey(resolvedKey),upstream=await fetch(operaS3UrlFromKey(resolvedKey),{headers:{Accept:'application/octet-stream,*/*'},cf:{cacheTtl:300,cacheEverything:true}});if(!upstream.ok)return json({error:`OPERA-HDF5 HTTP ${upstream.status}`,version:WORKER_VERSION,requestedTime:new Date(time).toISOString(),key:resolvedKey},upstream.status,{'cache-control':'no-store'});const headers=new Headers();headers.set('content-type',upstream.headers.get('content-type')||'application/x-hdf5');headers.set('cache-control','public, max-age=300, stale-while-revalidate=120');headers.set('access-control-allow-origin','*');headers.set('access-control-allow-methods','GET,OPTIONS');headers.set('x-mid-radar-provider','EUMETNET OPERA CIRRUS');headers.set('x-mid-radar-product','DBZH');headers.set('x-mid-opera-key',resolvedKey);headers.set('x-mid-worker-version',WORKER_VERSION);const length=upstream.headers.get('content-length');if(length)headers.set('content-length',length);return new Response(upstream.body,{status:200,headers})}

function eeaStationQuery(endpoint,lat,lon,strategy='distance'){
 const url=new URL(endpoint),latRadius=75/111,lonRadius=75/(111*Math.max(.25,Math.cos(lat*Math.PI/180)));
 url.searchParams.set('f','json');url.searchParams.set('where','1=1');url.searchParams.set('inSR','4326');url.searchParams.set('outSR','4326');url.searchParams.set('spatialRel','esriSpatialRelIntersects');
 if(strategy==='envelope'){
  url.searchParams.set('geometry',`${lon-lonRadius},${lat-latRadius},${lon+lonRadius},${lat+latRadius}`);url.searchParams.set('geometryType','esriGeometryEnvelope');
 }else{
  url.searchParams.set('geometry',`${lon},${lat}`);url.searchParams.set('geometryType','esriGeometryPoint');url.searchParams.set('distance','75000');url.searchParams.set('units','esriSRUnit_Meter');
 }
 url.searchParams.set('outFields','AirQualityStation,AQStationName,Country,CountryCode,AirQualityStationEoICode,stationClass,PopupInfo');url.searchParams.set('returnGeometry','true');url.searchParams.set('returnZ','false');url.searchParams.set('returnM','false');url.searchParams.set('resultRecordCount','250');
 return url;
}
function eeaStationClass(value){const key=String(value??'').trim();return key==='0'?'all-mandatory-pollutants':key==='1'?'main-pollutants':key==='2'?'some-main-pollutants':key==='3'?'other-pollutants':key}
function parseEeaStations(data,lat,lon){
 const features=Array.isArray(data?.features)?data.features:[];
 return features.map(feature=>{const attributes=feature?.attributes||{},x=number(feature?.geometry?.x),y=number(feature?.geometry?.y);if(x===undefined||y===undefined)return null;const distanceKm=distance(lat,lon,y,x)/1000;if(!Number.isFinite(distanceKm)||distanceKm>90)return null;return{name:String(attributes.AQStationName||attributes.AirQualityStation||attributes.AirQualityStationEoICode||'EEA-Messstation'),stationCode:String(attributes.AirQualityStation||''),eoiCode:String(attributes.AirQualityStationEoICode||''),country:String(attributes.Country||''),countryCode:String(attributes.CountryCode||''),stationClass:eeaStationClass(attributes.stationClass),latitude:y,longitude:x,distanceKm}}).filter(Boolean).sort((a,b)=>a.distanceKm-b.distanceKm);
}
async function nearestEeaAirQualityStation(lat,lon){
 const errors=[],successful=[];
 for(const endpoint of EEA_AIR_QUALITY_STATION_ENDPOINTS)for(const strategy of['distance','envelope']){
  const url=eeaStationQuery(endpoint,lat,lon,strategy),host=new URL(endpoint).hostname;
  try{
   const response=await fetchWithDeadline(url.toString(),{headers:{Accept:'application/json,application/geo+json;q=0.9,*/*;q=0.2','User-Agent':`MID/${WORKER_VERSION} EEA station lookup`,'Referer':'https://airindex.eea.europa.eu/'},cf:{cacheTtl:86400,cacheEverything:true}},12000);
   if(!response.ok)throw new Error(`HTTP ${response.status}`);
   const data=await response.json();if(data?.error)throw new Error(data.error?.message||'ArcGIS-Dienst meldet einen Fehler.');
   const stations=parseEeaStations(data,lat,lon);successful.push(`${host}/${strategy}`);
   if(stations.length){const station=stations[0];return{available:true,...station,distanceKm:Math.round(station.distanceKm*10)/10,provider:'European Environment Agency (EEA)',sourceHost:host,diagnostics:{successful,errors:errors.slice(-4)}}}
  }catch(error){errors.push(`${host}/${strategy}: ${error instanceof Error?error.message:String(error)}`)}
 }
 if(successful.length)return{available:false,provider:'European Environment Agency (EEA)',reason:'Im Umkreis von 75 km wurde keine aktuelle EEA-Messstation gefunden.',diagnostics:{successful,errors:errors.slice(-4)}};
 throw new Error(`EEA-Messstationsdienst nicht erreichbar: ${errors.slice(-6).join(' | ')}`);
}

function flattenCoordinatePairs(value,out=[]){if(!Array.isArray(value))return out;if(value.length>=2&&Number.isFinite(Number(value[0]))&&Number.isFinite(Number(value[1]))){out.push([Number(value[0]),Number(value[1])]);return out}for(const child of value)flattenCoordinatePairs(child,out);return out}
function geometryCentre(geometry){const pairs=flattenCoordinatePairs(geometry?.coordinates);if(!pairs.length)return null;const valid=pairs.filter(([lon,lat])=>lon>=-180&&lon<=180&&lat>=-90&&lat<=90);if(!valid.length)return null;return{lon:valid.reduce((sum,p)=>sum+p[0],0)/valid.length,lat:valid.reduce((sum,p)=>sum+p[1],0)/valid.length}}
function lightningTimestamp(feature){const props=feature?.properties&&typeof feature.properties==='object'?feature.properties:{},preferred=Object.entries(props).filter(([key])=>/(time|date|valid|reference|start|end|timestamp)/i.test(key));for(const[,value]of preferred){const parsed=safeDate(value);if(parsed)return parsed}for(const value of[feature?.id,...Object.values(props)]){if(typeof value!=='string')continue;const match=value.match(/20\d{2}-?\d{2}-?\d{2}[T_ -]?\d{2}:?\d{2}(?::?\d{2})?/);if(match){const parsed=safeDate(match[0].replace('_','T'));if(parsed)return parsed}}return undefined}
function lightningNumber(properties,pattern){for(const[key,value]of Object.entries(properties||{}))if(pattern.test(key)&&number(value)!==undefined)return number(value);return undefined}
async function dwdLightningPoints(lat,lon){
 const latSpan=2.1,lonSpan=2.1/Math.max(.28,Math.cos(lat*Math.PI/180)),bbox=[lon-lonSpan,lat-latSpan,lon+lonSpan,lat+latSpan].map(value=>value.toFixed(5)).join(','),errors=[],successful=[];
 const layers=['dwd:Accumulated_Flash_Geometry','dwd:Accumulated_Flash_Area'];
 for(const base of[DWD_WFS_PRIMARY,DWD_WFS_BACKUP])for(const version of['2.0.0','1.0.0'])for(const layer of layers){try{const url=new URL(base);url.searchParams.set('service','WFS');url.searchParams.set('version',version);url.searchParams.set('request','GetFeature');url.searchParams.set(version==='2.0.0'?'typeNames':'typeName',layer);url.searchParams.set('outputFormat','application/json');url.searchParams.set('srsName','EPSG:4326');url.searchParams.set(version==='2.0.0'?'count':'maxFeatures','750');url.searchParams.set('bbox',`${bbox},EPSG:4326`);const response=await fetch(url.toString(),{headers:{Accept:'application/geo+json,application/json'},cf:{cacheTtl:120,cacheEverything:true}});if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json(),features=Array.isArray(data?.features)?data.features:[],points=[];successful.push(`${new URL(base).hostname}/${version}/${layer}`);
   for(const feature of features){const centre=geometryCentre(feature.geometry);if(!centre)continue;const properties=feature.properties||{},observedAt=lightningTimestamp(feature),count=lightningNumber(properties,/(count|anzahl|flash|stroke|density|number)/i),intensity=lightningNumber(properties,/(intensity|current|amplitude|strength)/i);points.push({id:String(feature.id||`${centre.lat.toFixed(5)}:${centre.lon.toFixed(5)}:${points.length}`),lat:centre.lat,lon:centre.lon,observedAt,count,intensity})}
   if(points.length)return{available:true,empty:false,points:points.slice(0,750),provider:'DWD NowCastMIX',sourceLayer:layer,observedAt:points.map(point=>point.observedAt).filter(Boolean).sort().at(-1),coverage:'Deutschland · DWD-WFS-Blitzgeometrien',diagnostics:{successful}};
  }catch(error){errors.push(`${new URL(base).hostname}/WFS ${version}/${layer}: ${error instanceof Error?error.message:String(error)}`)}}
 if(successful.length)return{available:true,empty:true,points:[],provider:'DWD NowCastMIX',sourceLayer:'DWD Accumulated Flash Geometry/Area',coverage:'Deutschland · DWD-WFS erreichbar; derzeit keine Objekte im Abfragegebiet',diagnostics:{successful,errors:errors.slice(-4)}};
 throw new Error(`DWD-NowCastMIX-Objekte nicht verfügbar: ${errors.slice(-4).join(' | ')}`);
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
 {provider:'eumetsat',layer:'mtg_fd:rgb_geocolour',label:'MTG FCI GeoColour',resolutionKm:1,priority:100,maxAgeMinutes:75},
 {provider:'dwd',layer:'dwd:Satellite_meteosat_1km_euat_rgb_day_hrv_and_night_ir108_3h',label:'DWD Meteosat Europa RGB/IR · 3 h',resolutionKm:1,priority:105,maxAgeMinutes:210},
 {provider:'dwd',layer:'dwd:Satellite_meteosat_1km_euat_rgb_clouds_day_and_night',label:'DWD Meteosat Europa Wolken Tag/Nacht',resolutionKm:1,priority:95,maxAgeMinutes:210},
 {provider:'eumetsat',layer:'mtg_fd:vis06_hrfi',label:'MTG FCI VIS 0,6 HRFI',resolutionKm:.5,priority:60,maxAgeMinutes:75},
 {provider:'eumetsat',layer:'msg_fes:rgb_eview',label:'MSG European HRV RGB',resolutionKm:1,priority:50},
 {provider:'dwd',layer:'dwd:SAT_EU_RGB',label:'DWD Meteosat Europa RGB',resolutionKm:1,priority:40,maxAgeMinutes:210}
];
// Für das MID-Produkt "Wolken + Niederschlagsart" wird bewusst zuerst die
// DWD-nahe Meteosat-Darstellung gewählt. GeoColour bleibt ein aktueller Fallback,
// verändert aber nicht mehr unnötig die Anmutung gegenüber der DWD-Referenzkarte.
const DWD_REFERENCE_SATELLITE_CANDIDATES=[
 {provider:'dwd',layer:'dwd:Satellite_meteosat_1km_euat_rgb_clouds_day_and_night',label:'DWD Meteosat Europa Wolken Tag/Nacht',resolutionKm:1,priority:150},
 {provider:'dwd',layer:'dwd:Satellite_meteosat_1km_euat_rgb_day_hrv_and_night_ir108_3h',label:'DWD Meteosat Europa RGB/IR · 3 h',resolutionKm:1,priority:135},
 {provider:'dwd',layer:'dwd:SAT_EU_RGB',label:'DWD Meteosat Europa RGB',resolutionKm:1,priority:120},
 {provider:'eumetsat',layer:'mtg_fd:rgb_geocolour',label:'MTG FCI GeoColour',resolutionKm:1,priority:100,maxAgeMinutes:75},
 {provider:'eumetsat',layer:'msg_fes:rgb_eview',label:'MSG European HRV RGB',resolutionKm:1,priority:70}
];
const SATELLITE_IR_CANDIDATES=[
 {provider:'eumetsat',layer:'mtg_fd:ir105_hrfi',label:'MTG FCI IR 10,5 HRFI',resolutionKm:1},
 {provider:'eumetsat',layer:'msg_fes:ir108',label:'MSG SEVIRI IR 10,8',resolutionKm:3},
 {provider:'dwd',layer:'dwd:Satellite_meteosat_1km_euat_rgb_day_hrv_and_night_ir108_3h',label:'DWD Meteosat Europa RGB/IR · 3 h',resolutionKm:1,priority:105,maxAgeMinutes:210},
 {provider:'dwd',layer:'dwd:Satellite_meteosat_1km_euat_rgb_clouds_day_and_night',label:'DWD Meteosat Europa Tag/Nacht',resolutionKm:1,maxAgeMinutes:210},
 {provider:'dwd',layer:'dwd:SAT_EU_RGB',label:'DWD Meteosat Europa RGB',resolutionKm:1}
];
const SATELLITE_MAX_AGE_MINUTES=75;
const DWD_SATELLITE_MAX_AGE_MINUTES=210;
// H40B ist das operative MTG-FCI-Niederschlagsprodukt. Es wird automatisch
// bevorzugt, sobald EUMETView einen entsprechenden WMS-Layer veröffentlicht.
// Bis dahin ist das öffentlich verfügbare MSG/H SAF H60B der belastbare WMS-Fallback.
const SATELLITE_PRECIP_CANDIDATES=[
 {provider:'eumetsat',layer:'mtg_fd:h40b',label:'H SAF MTG H40B Niederschlagsrate',resolutionKm:2},
 {provider:'eumetsat',layer:'mtg_fd:precipitation_rate',label:'MTG FCI Niederschlagsrate',resolutionKm:2},
 {provider:'eumetsat',layer:'msg_fes:h60b',label:'H SAF Satelliten-Niederschlagsrate',resolutionKm:3}
];
async function wmsCapabilitiesText(base,label){const cacheTtl=base===EUMETSAT_WMS?60:180,response=await fetchWithDeadline(dwdCapabilitiesUrl(base),{headers:{Accept:'application/xml,text/xml,*/*','Cache-Control':'no-cache'},cf:{cacheTtl,cacheEverything:true}},6000);if(!response.ok)throw new Error(`${label} Capabilities HTTP ${response.status}`);return response.text()}
async function firstWmsCapabilities(bases,label){const errors=[];for(const base of bases){try{return await wmsCapabilitiesText(base,label)}catch(error){errors.push(error instanceof Error?error.message:String(error))}}throw new Error(errors.join(' | ')||`${label} Capabilities nicht verfügbar`)}
function recentObservedTimes(times,now=Date.now(),historyMinutes=135,maxFrames=28,futureMinutes=10){const unique=[...new Set((times||[]).filter(Number.isFinite).filter(time=>time>=now-historyMinutes*60000&&time<=now+futureMinutes*60000))].sort((a,b)=>a-b);if(unique.length<=maxFrames)return unique;const step=Math.max(1,Math.ceil(unique.length/maxFrames)),selected=unique.filter((_,index)=>index%step===0);if(selected.at(-1)!==unique.at(-1))selected.push(unique.at(-1));return selected.slice(-maxFrames)}
function hasWmsLayer(xml,layer){return tagValues(xml,'Name').some(value=>wmsLayerNameMatches(value,layer))}
function satelliteProduct(capabilities,candidates,now=Date.now()){
 const timed=[],untimedDwd=[];
 for(const candidate of candidates){
  const xml=capabilities[candidate.provider];if(!xml||!hasWmsLayer(xml,candidate.layer))continue;
  const all=dwdTimesFromCapabilities(xml,candidate.layer),latest=all.at(-1),maxAgeMinutes=Math.max(30,Number(candidate.maxAgeMinutes)||(candidate.provider==='dwd'?DWD_SATELLITE_MAX_AGE_MINUTES:SATELLITE_MAX_AGE_MINUTES));
  if(Number.isFinite(latest)&&latest>=now-maxAgeMinutes*60000&&latest<=now+15*60000){
   const times=recentObservedTimes(all,now,maxAgeMinutes+15,30,15);if(times.length)timed.push({...candidate,times:times.map(time=>new Date(time).toISOString()),latest,fresh:true,timeVerified:true});
   continue;
  }
  // Einige offene DWD-Satellitenlayer liefern im GeoServer zeitweise keine auswertbare
  // TIME-Dimension, obwohl der dokumentierte 3-h-Layer selbst verfügbar ist. In diesem
  // Fall darf MID den Layer nicht komplett verwerfen. Er wird als bewusst untimestamped
  // Latest-Snapshot mit eigener Revision freigegeben. EUMETSAT bleibt dagegen TIME-pflichtig.
  if(candidate.provider==='dwd')untimedDwd.push({...candidate,times:[],fresh:true,timeVerified:false,latestOnly:true,snapshotRevision:new Date(Math.floor(now/300000)*300000).toISOString()});
 }
 timed.sort((a,b)=>(b.latest-a.latest)||(b.priority??0)-(a.priority??0)||Number(b.provider==='eumetsat')-Number(a.provider==='eumetsat')||(a.resolutionKm??99)-(b.resolutionKm??99));
 const chosen=timed[0];if(chosen){const{latest,...product}=chosen;return{...product,latestTime:new Date(latest).toISOString(),latestOnly:false,fallback:product.provider!=='eumetsat'||(!product.layer.startsWith('mtg_fd:')&&product.layer!=='msg_fes:h60b')}}
 untimedDwd.sort((a,b)=>(b.priority??0)-(a.priority??0)||(a.resolutionKm??99)-(b.resolutionKm??99));
 const fallback=untimedDwd[0];return fallback?{...fallback,fallback:true}:undefined;
}
async function latestDwdSatelliteProductTime(){
 const indexes=await dwdPrecipitationTypeSourceIndexes(),now=Date.now(),entries=dwdSourceIndexEntries(indexes.satellite,'satellite').filter(row=>row.dataTime<=now+5*60000&&row.dataTime>=now-6*3600000),latest=entries.at(-1);return latest&&Number.isFinite(latest.dataTime)?latest.dataTime:NaN
}
function enrichUntimedDwdSatellite(product,sourceTime){if(!product||product.provider!=='dwd'||!product.latestOnly||!Number.isFinite(sourceTime))return product;const frameTime=sourceTime;return{...product,latestTime:new Date(frameTime).toISOString(),sourceSatelliteTime:new Date(sourceTime).toISOString(),timeVerified:true,snapshotRevision:new Date(frameTime).toISOString()}}
async function compositeTimes(lat,lon){
 const now=Date.now(),serverTime=new Date(now).toISOString(),result={satelliteDay:[],satelliteIr:[],satellitePrecip:[],mtgLightning:[],dwdLightning:[],dwdRadar:[],dwdRadarLayer:'',dwdRadarLatestOnly:false,dwdReferenceSatelliteProduct:undefined,mtgLightningLatestOnly:false,checkedAt:serverTime,serverTime,errors:[]},capabilities={};
 const tasks=[];
 if(mtgLightningApplies(lat,lon))tasks.push(firstWmsCapabilities([EUMETSAT_WMS],'EUMETSAT Satellit').then(xml=>{capabilities.eumetsat=xml}).catch(error=>{result.errors.push(`EUMETSAT: ${error instanceof Error?error.message:String(error)}`)}));
 if(inGermanyBounds(lat,lon)||mtgLightningApplies(lat,lon))tasks.push(firstWmsCapabilities(DWD_RADAR_WMS_BASES,'DWD Geodienst').then(xml=>{capabilities.dwd=xml}).catch(error=>{result.errors.push(`DWD: ${error instanceof Error?error.message:String(error)}`)}));
 if(tasks.length)await Promise.all(tasks);
 if(mtgLightningApplies(lat,lon)){
  result.satelliteDayProduct=satelliteProduct(capabilities,SATELLITE_DAY_CANDIDATES,now);
  result.satelliteIrProduct=satelliteProduct(capabilities,SATELLITE_IR_CANDIDATES,now);
  result.dwdReferenceSatelliteProduct=satelliteProduct(capabilities,DWD_REFERENCE_SATELLITE_CANDIDATES,now)||result.satelliteDayProduct;
  if([result.satelliteDayProduct,result.satelliteIrProduct,result.dwdReferenceSatelliteProduct].some(product=>product?.provider==='dwd'&&product?.latestOnly))try{const sourceTime=await latestDwdSatelliteProductTime();result.satelliteDayProduct=enrichUntimedDwdSatellite(result.satelliteDayProduct,sourceTime);result.satelliteIrProduct=enrichUntimedDwdSatellite(result.satelliteIrProduct,sourceTime);result.dwdReferenceSatelliteProduct=enrichUntimedDwdSatellite(result.dwdReferenceSatelliteProduct,sourceTime)}catch(error){result.errors.push(`DWD Satellitenzeit: ${error instanceof Error?error.message:String(error)}`)}
  result.satelliteDay=result.satelliteDayProduct?.times||[];result.satelliteIr=result.satelliteIrProduct?.times||[];result.mtgLightningLatestOnly=true;
 }
 if(inGermanyBounds(lat,lon)){
  const dwdXml=capabilities.dwd||'',alias='dwd:Niederschlagsradar',timingLayer=hasWmsLayer(dwdXml,'dwd:Radar_rv_product_1x1km_ger')?'dwd:Radar_rv_product_1x1km_ger':hasWmsLayer(dwdXml,alias)?alias:'',all=timingLayer?dwdTimesFromCapabilities(dwdXml,timingLayer):[],observed=recentObservedTimes(all.filter(time=>time<=now+90000),now,75,20,2);
  // Der DWD empfiehlt den stabilen Alias Niederschlagsradar ausdrücklich für Anwendungen.
  // Er rendert immer das aktuell nutzerfreundlichste Radarprodukt (derzeit RV). Die
  // explizite RV-Zeitdimension dient nur zur Zeitangabe; beim Alias wird bewusst kein
  // TIME-Parameter erzwungen, damit der aktuelle Default-Frame sicher sichtbar bleibt.
  result.dwdRadarLayer=hasWmsLayer(dwdXml,alias)?alias:(timingLayer||alias);result.dwdRadar=observed.map(time=>new Date(time).toISOString());result.dwdRadarLatestOnly=result.dwdRadarLayer===alias||!observed.length;
 }
 return result;
}
function diagnosticMapUrl(base,layer,version,bbox){const url=new URL(base),params={service:'WMS',request:'GetMap',version,layers:layer,styles:'',format:'image/png',transparent:'true',bbox,width:'64',height:'64',[version==='1.3.0'?'crs':'srs']:'EPSG:3857'};for(const[key,value]of Object.entries(params))url.searchParams.set(key,value);return url.toString()}
async function compositeProbe(name,url){const started=Date.now();try{const response=await fetchWithDeadline(url,{headers:{Accept:'image/png,image/*,*/*','User-Agent':`MID-weather-dashboard/${WORKER_VERSION}`},cache:'no-store'},7000),type=String(response.headers.get('content-type')||'').toLowerCase();return{name,ok:response.ok&&type.startsWith('image/'),status:response.status,contentType:type,durationMs:Date.now()-started,error:response.ok&&type.startsWith('image/')?'':(await response.text()).slice(0,180).replace(/\s+/g,' ')}}catch(error){return{name,ok:false,status:0,contentType:'',durationMs:Date.now()-started,error:error instanceof Error?error.message:String(error)}}}
async function compositeDiagnostics(){const checks=await Promise.all([
 compositeProbe('DWD Niederschlagsradar',diagnosticMapUrl(DWD_RADAR_WMS_PRIMARY,'dwd:Niederschlagsradar','1.1.1','500000,5700000,1700000,7400000')),
 compositeProbe('EUMETSAT GeoColour',diagnosticMapUrl(EUMETSAT_WMS,'mtg_fd:rgb_geocolour','1.3.0','-2000000,3500000,3000000,8500000')),
 compositeProbe('EUMETSAT LI AFA',diagnosticMapUrl(EUMETSAT_WMS,'mtg_fd:li_afa','1.3.0','-2000000,3500000,3000000,8500000'))
 ]);return{ok:checks.every(item=>item.ok),checks,checkedAt:new Date().toISOString(),version:WORKER_VERSION}}

function interpolatePoint(a,b,level){const av=Number(a.value),bv=Number(b.value),den=bv-av,ratio=Math.abs(den)<1e-9?.5:clamp((level-av)/den,0,1);return[a.lat+(b.lat-a.lat)*ratio,a.lon+(b.lon-a.lon)*ratio]}
function distanceKm(a,b){const rad=Math.PI/180,lat1=a[0]*rad,lat2=b[0]*rad,dLat=(b[0]-a[0])*rad,dLon=(b[1]-a[1])*rad,h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;return 12742*Math.asin(Math.min(1,Math.sqrt(h)))}
function median(values){const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b);if(!sorted.length)return NaN;const middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2}
function pressureCenters(values,lats,lons){const rows=values.length,cols=values[0]?.length||0,candidates=[];for(let row=1;row<rows-1;row++)for(let col=1;col<cols-1;col++){const value=values[row][col];if(!Number.isFinite(value))continue;const neighbours=[];for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){if(!dr&&!dc)continue;const rr=row+dr,cc=col+dc;if(rr>=0&&rr<rows&&cc>=0&&cc<cols&&Number.isFinite(values[rr][cc]))neighbours.push(values[rr][cc])}if(neighbours.length<8)continue;const max=Math.max(...neighbours),min=Math.min(...neighbours),isHigh=value>=max,isLow=value<=min,prominence=isHigh?value-min:isLow?max-value:0;if((isHigh||isLow)&&prominence>=1.2)candidates.push({type:isHigh?'H':'T',lat:lats[row],lon:lons[col],value:Number(value.toFixed(1)),prominence})}candidates.sort((a,b)=>b.prominence-a.prominence);const selected=[];for(const candidate of candidates){if(selected.some(item=>distanceKm([candidate.lat,candidate.lon],[item.lat,item.lon])<550))continue;selected.push(candidate);if(selected.length>=8)break}return selected.map(({prominence,...item})=>({...item,prominence:Number(prominence.toFixed(1))}))}
function pressureContourStep(values,lats,lons){const gradients=[];for(let row=0;row<values.length;row++)for(let col=0;col<values[row].length;col++){const value=values[row][col];if(!Number.isFinite(value))continue;if(col+1<values[row].length&&Number.isFinite(values[row][col+1])){const km=distanceKm([lats[row],lons[col]],[lats[row],lons[col+1]]);if(km>0)gradients.push(Math.abs(values[row][col+1]-value)/km)}if(row+1<values.length&&Number.isFinite(values[row+1][col])){const km=distanceKm([lats[row],lons[col]],[lats[row+1],lons[col]]);if(km>0)gradients.push(Math.abs(values[row+1][col]-value)/km)}}const changePer100Km=median(gradients)*100;if(!Number.isFinite(changePer100Km))return 4;if(changePer100Km<1.5)return 1;if(changePer100Km<3)return 2;return 4}
function upsampleGrid(values,lats,lons,factor=2){if(factor<=1)return{values,lats,lons};const rows=(values.length-1)*factor+1,cols=(values[0].length-1)*factor+1,out=Array.from({length:rows},()=>Array(cols).fill(NaN)),outLats=Array(rows),outLons=Array(cols);for(let row=0;row<rows;row++){const sourceRow=row/factor,r0=Math.floor(sourceRow),r1=Math.min(values.length-1,r0+1),fy=sourceRow-r0;outLats[row]=lats[r0]+(lats[r1]-lats[r0])*fy;for(let col=0;col<cols;col++){const sourceCol=col/factor,c0=Math.floor(sourceCol),c1=Math.min(values[0].length-1,c0+1),fx=sourceCol-c0;if(row===0)outLons[col]=lons[c0]+(lons[c1]-lons[c0])*fx;const q00=values[r0][c0],q10=values[r0][c1],q01=values[r1][c0],q11=values[r1][c1];if([q00,q10,q01,q11].every(Number.isFinite))out[row][col]=q00*(1-fx)*(1-fy)+q10*fx*(1-fy)+q01*(1-fx)*fy+q11*fx*fy}}return{values:out,lats:outLats,lons:outLons}}
function pointKey(point){return`${point[0].toFixed(5)},${point[1].toFixed(5)}`}
function stitchSegments(segments){if(!segments.length)return[];const endpointMap=new Map();segments.forEach((segment,index)=>segment.forEach(point=>{const key=pointKey(point),items=endpointMap.get(key)||[];items.push(index);endpointMap.set(key,items)}));const used=new Set(),paths=[];for(let seed=0;seed<segments.length;seed++){if(used.has(seed))continue;const segment=segments[seed],aKey=pointKey(segment[0]),bKey=pointKey(segment[1]),start=(endpointMap.get(aKey)?.length||0)===1?segment[0]:(endpointMap.get(bKey)?.length||0)===1?segment[1]:segment[0],path=[start];let current=start;while(true){const candidates=(endpointMap.get(pointKey(current))||[]).filter(index=>!used.has(index));if(!candidates.length)break;const index=candidates[0],nextSegment=segments[index];used.add(index);const next=pointKey(nextSegment[0])===pointKey(current)?nextSegment[1]:nextSegment[0];path.push(next);current=next;if(path.length>segments.length+2)break}if(path.length>1)paths.push(path)}return paths}
function smoothPath(path,iterations=2){if(path.length<3)return path;let result=path.map(point=>[point[0],point[1]]),closed=pointKey(result[0])===pointKey(result[result.length-1]);if(closed)result=result.slice(0,-1);for(let iteration=0;iteration<iterations;iteration++){const next=[];if(!closed)next.push(result[0]);const count=closed?result.length:result.length-1;for(let index=0;index<count;index++){const a=result[index],b=result[(index+1)%result.length];next.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}if(!closed)next.push(result[result.length-1]);result=next}if(closed)result.push(result[0]);return result}
function contourSegments(values,lats,lons,step,maxLevels=90){const interpolated=upsampleGrid(values,lats,lons,2),field=interpolated.values,fieldLats=interpolated.lats,fieldLons=interpolated.lons,finite=field.flat().filter(Number.isFinite);if(!finite.length)return[];const min=Math.min(...finite),max=Math.max(...finite),first=Math.ceil(min/step)*step,levels=[];for(let level=first;level<=max&&levels.length<maxLevels;level+=step){const segments=[];for(let row=0;row<field.length-1;row++)for(let col=0;col<field[row].length-1;col++){const corners=[{lat:fieldLats[row],lon:fieldLons[col],value:field[row][col]},{lat:fieldLats[row],lon:fieldLons[col+1],value:field[row][col+1]},{lat:fieldLats[row+1],lon:fieldLons[col+1],value:field[row+1][col+1]},{lat:fieldLats[row+1],lon:fieldLons[col],value:field[row+1][col]}];if(corners.some(point=>!Number.isFinite(point.value)))continue;const edges=[[0,1],[1,2],[2,3],[3,0]],hits=[];for(const[i,j]of edges){const av=corners[i].value-level,bv=corners[j].value-level;if(av===0&&bv===0)continue;if(av===0||bv===0||av*bv<0)hits.push(interpolatePoint(corners[i],corners[j],level))}if(hits.length===2)segments.push([hits[0],hits[1]]);else if(hits.length>=4){const center=(corners[0].value+corners[1].value+corners[2].value+corners[3].value)/4;if(center>=level){segments.push([hits[0],hits[3]],[hits[1],hits[2]])}else{segments.push([hits[0],hits[1]],[hits[2],hits[3]])}}}const paths=stitchSegments(segments).filter(path=>path.length>2).map(path=>smoothPath(path,2));if(paths.length)levels.push({level:Number(level.toFixed(2)),paths})}return levels}
function openMeteoRows(data){return Array.isArray(data)?data:Array.isArray(data?.results)?data.results:[data]}

function equivalentPotentialTemperature850(temperatureC,relativeHumidity){if(!Number.isFinite(temperatureC)||!Number.isFinite(relativeHumidity))return NaN;const rh=clamp(relativeHumidity,1,100),gamma=Math.log(rh/100)+(17.625*temperatureC)/(243.04+temperatureC),dewPoint=243.04*gamma/(17.625-gamma),t=temperatureC+273.15,td=dewPoint+273.15,e=6.112*Math.exp((17.67*dewPoint)/(dewPoint+243.5)),mixingRatio=.622*e/Math.max(1,850-e),tlcl=1/(1/Math.max(180,td-56)+Math.log(t/td)/800)+56,theta=t*Math.pow(1000/850,.2854*(1-.28*mixingRatio)),thetaE=theta*Math.exp((3376/Math.max(180,tlcl)-2.54)*mixingRatio*(1+.81*mixingRatio));return Number.isFinite(thetaE)?thetaE:NaN}
async function weatherMapGridData(lat,lon,modelId){
 if(modelId!=='icon-d2')throw new Error('Raster-Wetterkarten sind derzeit für ICON-D2 freigegeben.');
 const rows=9,cols=11,south=Math.max(46.5,lat-3.0),north=Math.min(55.5,lat+3.0),west=Math.max(4.5,lon-4.5),east=Math.min(16,lon+4.5),lats=Array.from({length:rows},(_,index)=>north-index*(north-south)/(rows-1)),lons=Array.from({length:cols},(_,index)=>west+index*(east-west)/(cols-1)),fields='pressure_msl,temperature_850hPa,relative_humidity_850hPa,temperature_2m,relative_humidity_2m,weather_code,precipitation,snowfall',modelCandidates=['dwd_icon_d2','icon_d2'];
 const fetchRowWithModel=async(rowIndex,model)=>{const url=new URL(OPEN_METEO_FORECAST),latitudes=Array.from({length:cols},()=>lats[rowIndex].toFixed(4)),longitudes=lons.map(value=>value.toFixed(4));url.searchParams.set('latitude',latitudes.join(','));url.searchParams.set('longitude',longitudes.join(','));url.searchParams.set('hourly',fields);url.searchParams.set('past_hours','1');url.searchParams.set('forecast_hours','49');url.searchParams.set('models',model);url.searchParams.set('timezone','GMT');url.searchParams.set('cell_selection','nearest');url.searchParams.set('temperature_unit','celsius');url.searchParams.set('precipitation_unit','mm');const response=await fetchWithDeadline(url.toString(),{headers:{Accept:'application/json','User-Agent':`MID-weather-dashboard/${WORKER_VERSION}`},cf:{cacheTtl:600,cacheEverything:true}},14000),body=await response.text();let payload={};try{payload=JSON.parse(body)}catch{}if(!response.ok||payload?.error)throw new Error(payload?.reason||payload?.error||`Open-Meteo ICON-D2 Raster HTTP ${response.status}`);const points=openMeteoRows(payload);if(points.length!==cols)throw new Error(`ICON-D2 Rasterzeile ${rowIndex+1}: ${points.length} statt ${cols} Punkte.`);if(points.some(point=>point?.error||!point?.hourly?.time?.length))throw new Error(`ICON-D2 Rasterzeile ${rowIndex+1} ist unvollständig.`);return points};
 let selectedModel='',rowSets=[],lastError='';for(const model of modelCandidates){try{const next=[];for(let start=0;start<rows;start+=3){const batch=await Promise.all(Array.from({length:Math.min(3,rows-start)},(_,offset)=>fetchRowWithModel(start+offset,model)));next.push(...batch)}rowSets=next;selectedModel=model;break}catch(error){lastError=error instanceof Error?error.message:String(error)}}if(!selectedModel||!rowSets.length)throw new Error(`ICON-D2-Datenzugriff fehlgeschlagen${lastError?`: ${lastError}`:''}`);
 const points=rowSets.flat(),allTimes=points[0]?.hourly?.time||[],frameIndices=allTimes.map((_,index)=>index).filter(index=>index<=13||index%3===1),frames=[];
 for(const ti of frameIndices){const stamp=safeDate(allTimes[ti]);if(!stamp)continue;const pressure=Array.from({length:rows},()=>Array(cols).fill(NaN)),thetaE=[],temperature2m=[],relativeHumidity2m=[],weatherCode=[],precipitation=[],snowfall=[];for(let pi=0;pi<points.length;pi++){const row=Math.floor(pi/cols),col=pi%cols,p=number(points[pi]?.hourly?.pressure_msl?.[ti])??NaN,t=number(points[pi]?.hourly?.temperature_850hPa?.[ti]),rh=number(points[pi]?.hourly?.relative_humidity_850hPa?.[ti]),surfaceT=number(points[pi]?.hourly?.temperature_2m?.[ti]),surfaceRh=number(points[pi]?.hourly?.relative_humidity_2m?.[ti]),ww=number(points[pi]?.hourly?.weather_code?.[ti])??0,rain=number(points[pi]?.hourly?.precipitation?.[ti])??0,snow=number(points[pi]?.hourly?.snowfall?.[ti])??0;pressure[row][col]=p;thetaE.push(Number.isFinite(t)&&Number.isFinite(rh)?Number(equivalentPotentialTemperature850(t,rh).toFixed(1)):NaN);temperature2m.push(Number.isFinite(surfaceT)?Number(surfaceT.toFixed(1)):NaN);relativeHumidity2m.push(Number.isFinite(surfaceRh)?Number(surfaceRh.toFixed(0)):NaN);weatherCode.push(Math.round(ww));precipitation.push(Number(Math.max(0,rain).toFixed(2)));snowfall.push(Number(Math.max(0,snow).toFixed(2)))}if(pressure.flat().filter(Number.isFinite).length<rows*cols*.85)continue;const step=pressureContourStep(pressure,lats,lons),isobars=contourSegments(pressure,lats,lons,step,28);frames.push({time:stamp,thetaE,temperature2m,relativeHumidity2m,weatherCode,precipitation,snowfall,isobars})}
 if(!frames.length)throw new Error('ICON-D2 lieferte keine auswertbaren Raster-Zeitschritte.');let referenceTime;try{const metaResponse=await fetchWithDeadline(`https://api.open-meteo.com/data/${selectedModel}/static/meta.json`,{headers:{Accept:'application/json','User-Agent':`MID-weather-dashboard/${WORKER_VERSION}`},cf:{cacheTtl:600,cacheEverything:true}},7000);if(metaResponse.ok){const meta=await metaResponse.json(),initial=number(meta?.last_run_initialisation_time);if(Number.isFinite(initial))referenceTime=new Date(initial*(initial>1e12?1:1000)).toISOString()}}catch{}
 return{modelId:'icon-d2',modelLabel:'DWD ICON-D2',times:frames.map(frame=>frame.time),referenceTime,lats,lons,frames,provider:`DWD ICON-D2 · Open-Meteo (${selectedModel})`,checkedAt:new Date().toISOString()}
}


const precipitationPhaseGridCache=new Map();
const precipitationPhaseModelMetaCache=new Map();
const RAPID_PHASE_MODELS=[
 {id:'icon-d2-ruc',label:'DWD ICON-D2-RUC',apiIds:['icon_d2_ruc','dwd_icon_d2_ruc'],metaIds:['dwd_icon_d2_ruc','icon_d2_ruc'],bbox:[-6,43,26,58],resolutionKm:2,rapidUpdate:true,native15:true,maxHours:14,optionalCapability:true},
 {id:'arome-france-hd-ruc',label:'Météo-France AROME HD 15 min',apiIds:['meteofrance_arome_france_hd_15min'],metaIds:['meteofrance_arome_france_hd_15min','meteofrance_arome_france_hd'],endpoint:'https://api.open-meteo.com/v1/meteofrance',bbox:[-8,40,13,53],resolutionKm:1.5,rapidUpdate:true,native15:true,maxHours:6},
 {id:'arome-france-ruc',label:'Météo-France AROME 15 min',apiIds:['meteofrance_arome_france_15min'],metaIds:['meteofrance_arome_france_15min','meteofrance_arome_france'],endpoint:'https://api.open-meteo.com/v1/meteofrance',bbox:[-8,40,13,53],resolutionKm:2.5,rapidUpdate:true,native15:true,maxHours:6},
 {id:'hrrr-ruc',label:'NOAA HRRR Rapid Refresh',apiIds:['ncep_hrrr_conus'],metaIds:['ncep_hrrr_conus'],bbox:[-130,20,-60,55],resolutionKm:3,rapidUpdate:true,native15:true,maxHours:18},
 {id:'knmi-harmonie-europe',label:'KNMI HARMONIE-AROME Europe',apiIds:['knmi_harmonie_arome_europe','knmi_seamless'],metaIds:['knmi_harmonie_arome_europe'],bbox:[-12,40,32,68],resolutionKm:5.5,rapidUpdate:true,native15:false,maxHours:60},
 {id:'knmi-harmonie-nl',label:'KNMI HARMONIE-AROME NL',apiIds:['knmi_harmonie_arome_netherlands','knmi_seamless'],metaIds:['knmi_harmonie_arome_netherlands'],bbox:[-2,48,12,56],resolutionKm:2,rapidUpdate:true,native15:false,maxHours:60},
 {id:'met-nordic-ruc',label:'MET Nordic PP',apiIds:['metno_nordic','metno_nordic_pp'],metaIds:['metno_nordic_pp','metno_nordic'],bbox:[0,53,32,72],resolutionKm:1,rapidUpdate:true,native15:false,maxHours:60},
 {id:'ukv-ruc',label:'UKMO UKV',apiIds:['ukmo_uk_deterministic_2km'],metaIds:['ukmo_uk_deterministic_2km'],bbox:[-12,48,4,62],resolutionKm:2,rapidUpdate:true,native15:false,maxHours:48,latencyHours:4},
 {id:'icon-d2',label:'DWD ICON-D2',apiIds:['dwd_icon_d2','icon_d2'],metaIds:['dwd_icon_d2','icon_d2'],bbox:[-6,43,26,58],resolutionKm:2,rapidUpdate:false,native15:true,maxHours:48},
 {id:'geosphere-arome',label:'GeoSphere AROME Austria',apiIds:['geosphere_arome_austria'],metaIds:['geosphere_arome_austria'],bbox:[8,45,18,50],resolutionKm:2.5,rapidUpdate:false,native15:false,maxHours:60},
 {id:'dmi-harmonie',label:'DMI HARMONIE Europe',apiIds:['dmi_harmonie_arome_europe'],metaIds:['dmi_harmonie_arome_europe'],bbox:[-15,35,32,72],resolutionKm:5.5,rapidUpdate:false,native15:false,maxHours:60}
];
function precipitationPhaseGridCacheKey(lat,lon,roundedMs){return`${lat.toFixed(2)}:${lon.toFixed(2)}:${roundedMs}`}
function precipitationPhaseRateLimited(message){return /(?:request|rate|minute|minutes|429).*limit|limit.*(?:request|rate|minute|minutes)|too many requests/i.test(String(message||''))}
function precipitationPhaseStale(lat,lon,targetMs){
 const prefix=`${lat.toFixed(2)}:${lon.toFixed(2)}:`,now=Date.now(),candidates=[...precipitationPhaseGridCache.entries()].filter(([key,item])=>key.startsWith(prefix)&&item&&now-item.storedAt<=60*60000&&Math.abs(Date.parse(item.data?.frame?.time||'')-targetMs)<=45*60000).map(([,item])=>item).sort((a,b)=>Math.abs(Date.parse(a.data.frame.time)-targetMs)-Math.abs(Date.parse(b.data.frame.time)-targetMs));return candidates[0]?.data;
}
function rememberPrecipitationPhase(key,data){precipitationPhaseGridCache.set(key,{storedAt:Date.now(),data});if(precipitationPhaseGridCache.size>18){const oldest=[...precipitationPhaseGridCache.entries()].sort((a,b)=>a[1].storedAt-b[1].storedAt).slice(0,precipitationPhaseGridCache.size-18);for(const[item]of oldest)precipitationPhaseGridCache.delete(item)}}
function phaseModelApplies(model,lat,lon){const[minLon,minLat,maxLon,maxLat]=model.bbox;return lon>=minLon&&lon<=maxLon&&lat>=minLat&&lat<=maxLat}
async function phaseModelMetadata(model){
 const cached=precipitationPhaseModelMetaCache.get(model.id);if(cached&&Date.now()-cached.storedAt<10*60000)return cached.value;
 let value=null;for(const metaId of model.metaIds||model.apiIds){try{const response=await fetchWithDeadline(`https://api.open-meteo.com/data/${metaId}/static/meta.json?cache_buster=${Math.floor(Date.now()/300000)}`,{headers:{Accept:'application/json','User-Agent':`MID-weather-dashboard/${WORKER_VERSION}`},cf:{cacheTtl:300,cacheEverything:true}},6000);if(!response.ok)continue;const meta=await response.json(),raw=number(meta?.last_run_initialisation_time),available=number(meta?.last_run_availability_time),initMs=Number.isFinite(raw)?raw*(raw>1e12?1:1000):NaN,availableMs=Number.isFinite(available)?available*(available>1e12?1:1000):NaN,updateSeconds=Math.max(3600,number(meta?.update_interval_seconds)||Number(model.rapidUpdate?3600:10800)),maxRunAgeMs=model.rapidUpdate?Math.max(5*3600000,(Math.max(0,Number(model.latencyHours)||0)+5)*3600000):Math.max(8*3600000,updateSeconds*2.5*1000);if(!Number.isFinite(initMs)||Date.now()-initMs>maxRunAgeMs)continue;value={...model,metaId,initialisationTime:new Date(initMs).toISOString(),availabilityTime:Number.isFinite(availableMs)?new Date(availableMs).toISOString():undefined,updateIntervalSeconds:updateSeconds,ageHours:Math.max(0,(Date.now()-(Number.isFinite(availableMs)?availableMs:initMs))/3600000)};break}catch{}}
 precipitationPhaseModelMetaCache.set(model.id,{storedAt:Date.now(),value});return value;
}
function phaseModelScore(model){const age=Math.max(0,Number(model.ageHours)||0)+Math.max(0,Number(model.latencyHours)||0),resolution=Math.max(.8,Number(model.resolutionKm)||8),rapid=Boolean(model.rapidUpdate),native15=Boolean(model.native15);return 100-age*15-Math.log2(resolution)*9+(rapid?12:0)+(native15?5:0)}
async function orderedPhaseModels(lat,lon){
 const candidates=RAPID_PHASE_MODELS.filter(model=>phaseModelApplies(model,lat,lon)),metas=(await Promise.all(candidates.map(phaseModelMetadata))).filter(Boolean).sort((a,b)=>phaseModelScore(b)-phaseModelScore(a));
 // Ein noch nicht von Open-Meteo dokumentiertes ICON-D2-RUC wird nur aufgenommen,
 // wenn die Metadata-API es tatsächlich kennt. Damit bleibt der Layer heute stabil
 // und schaltet RUC automatisch frei, sobald der JSON-Datenpfad verfügbar ist.
 return metas;
}
async function precipitationPhaseGridData(lat,lon,target){
 const requestedMs=Date.parse(String(target||'')),targetMs=Number.isFinite(requestedMs)?requestedMs:Date.now(),quarterMs=15*60000,roundedMs=Math.round(targetMs/quarterMs)*quarterMs,centerLat=Math.round(lat*20)/20,centerLon=Math.round(lon*20)/20,cacheKey=precipitationPhaseGridCacheKey(centerLat,centerLon,roundedMs),cached=precipitationPhaseGridCache.get(cacheKey);
 if(cached&&Date.now()-cached.storedAt<=12*60000)return{...cached.data,cache:'worker-memory'};
 const modelOrder=await orderedPhaseModels(centerLat,centerLon);if(!modelOrder.length)throw new Error('Für diesen Standort ist derzeit kein geeignetes hochauflösendes Rapid-/Regionalmodell für die Radar-Niederschlagsart verfügbar.');
 const startIso=new Date(roundedMs-quarterMs).toISOString().slice(0,16),endIso=new Date(roundedMs+quarterMs).toISOString().slice(0,16);
 // Höchstens 247 Modellpunkte pro Versuch. Die Auswahl eines einzigen, nach Frische
 // und Auflösung bewerteten Modells verhindert den früheren RUC-/Raster-Requeststurm.
 const rows=13,cols=19,bbox=modelOrder[0].bbox,south=Math.max(bbox[1],centerLat-.65),north=Math.min(bbox[3],centerLat+.65),west=Math.max(bbox[0],centerLon-.95),east=Math.min(bbox[2],centerLon+.95),lats=Array.from({length:rows},(_,index)=>north-index*(north-south)/(rows-1)),lons=Array.from({length:cols},(_,index)=>west+index*(east-west)/(cols-1)),coordinates=[];
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)coordinates.push({lat:lats[row],lon:lons[col]});
 const fields='temperature_2m,relative_humidity_2m,wet_bulb_temperature_2m,weather_code,precipitation,rain,snowfall,snowfall_height,freezing_level_height',batchSize=120;
 const fetchBatch=async(batch,apiId,label,endpoint=OPEN_METEO_FORECAST)=>{const url=new URL(endpoint);url.searchParams.set('latitude',batch.map(point=>point.lat.toFixed(4)).join(','));url.searchParams.set('longitude',batch.map(point=>point.lon.toFixed(4)).join(','));url.searchParams.set('minutely_15',fields);url.searchParams.set('start_minutely_15',startIso);url.searchParams.set('end_minutely_15',endIso);url.searchParams.set('models',apiId);url.searchParams.set('timezone','GMT');url.searchParams.set('cell_selection','nearest');url.searchParams.set('temperature_unit','celsius');url.searchParams.set('precipitation_unit','mm');const response=await fetchWithDeadline(url.toString(),{headers:{Accept:'application/json','User-Agent':`MID-weather-dashboard/${WORKER_VERSION}`},cf:{cacheTtl:900,cacheEverything:true}},18000),body=await response.text();let payload={};try{payload=JSON.parse(body)}catch{}if(!response.ok||payload?.error){const message=payload?.reason||payload?.error||`Open-Meteo ${label} Phasenraster HTTP ${response.status}`;const error=new Error(String(message));error.status=response.status;throw error}const points=openMeteoRows(payload);if(points.length!==batch.length)throw new Error(`${label} Phasenraster: ${points.length} statt ${batch.length} Punkte.`);return points};
 let selected=null,selectedApiId='',points=[],lastError='';
 for(const model of modelOrder){for(const apiId of model.apiIds){try{const next=[];for(let start=0;start<coordinates.length;start+=batchSize){const batch=coordinates.slice(start,start+batchSize),set=await fetchBatch(batch,apiId,model.label,model.endpoint||OPEN_METEO_FORECAST);next.push(...set)}points=next;selected=model;selectedApiId=apiId;break}catch(error){lastError=error instanceof Error?error.message:String(error);if(precipitationPhaseRateLimited(lastError))break}}if(selected||precipitationPhaseRateLimited(lastError))break}
 if(!selected||points.length!==coordinates.length){if(precipitationPhaseRateLimited(lastError)){const stale=precipitationPhaseStale(centerLat,centerLon,targetMs);if(stale)return{...stale,targetTime:new Date(targetMs).toISOString(),stale:true,fallbackReason:'Temporäres Modell-API-Limit: letztes belastbares Radar-Phasenfeld wird vorübergehend weiterverwendet.'}}throw new Error(`Rapid-/Regionalmodell-Phasenraster nicht verfügbar${lastError?`: ${lastError}`:''}`)}
 const frame={time:new Date(roundedMs).toISOString(),temperature2m:[],relativeHumidity2m:[],wetBulbTemperature2m:[],weatherCode:[],precipitation:[],rain:[],showers:[],snowfall:[],snowfallHeight:[],freezingLevelHeight:[],elevation:[]};let valid=0,actualTimes=[];
 for(const point of points){const minute=point?.minutely_15||{},times=Array.isArray(minute.time)?minute.time:[],parsed=times.map(value=>Date.parse(String(value))),index=parsed.reduce((best,value,current)=>Number.isFinite(value)&&Math.abs(value-targetMs)<Math.abs((parsed[best]??Infinity)-targetMs)?current:best,0),actual=parsed[index],usable=Number.isFinite(actual)&&Math.abs(actual-targetMs)<=20*60000;if(usable){valid++;actualTimes.push(actual)}const value=name=>usable?(number(minute?.[name]?.[index])??NaN):NaN;frame.temperature2m.push(value('temperature_2m'));frame.relativeHumidity2m.push(value('relative_humidity_2m'));frame.wetBulbTemperature2m.push(value('wet_bulb_temperature_2m'));frame.weatherCode.push(Math.round(value('weather_code')||0));frame.precipitation.push(Math.max(0,value('precipitation')||0));frame.rain.push(Math.max(0,value('rain')||0));frame.showers.push(0);frame.snowfall.push(Math.max(0,value('snowfall')||0));frame.snowfallHeight.push(value('snowfall_height'));frame.freezingLevelHeight.push(value('freezing_level_height'));frame.elevation.push(number(point?.elevation)??NaN)}
 if(valid<coordinates.length*.9)throw new Error(`${selected.label}-Phasenraster zeitlich unvollständig (${valid}/${coordinates.length} Punkte).`);if(actualTimes.length)frame.time=new Date(actualTimes.sort((a,b)=>a-b)[Math.floor(actualTimes.length/2)]).toISOString();
 const referenceTime=selected.initialisationTime,modelTimeMs=Date.parse(frame.time),referenceMs=Date.parse(referenceTime||'');if(Number.isFinite(referenceMs)&&Number.isFinite(modelTimeMs)&&modelTimeMs-referenceMs>Math.max(5*60*60000,(selected.maxHours||48)*3600000+30*60000))throw new Error(`Der verfügbare ${selected.label}-Lauf ist für eine belastbare Radarphase zu alt.`);
 const latStep=Math.abs((north-south)/(rows-1)),lonStep=Math.abs((east-west)/(cols-1)),gridSpacingKm=Math.round(Math.max(latStep*111.2,lonStep*111.2*Math.max(.3,Math.cos(centerLat*Math.PI/180)))*10)/10,data={modelId:selected.id,modelLabel:selected.label,targetTime:new Date(targetMs).toISOString(),referenceTime,lats,lons,frame,provider:`${selected.label} · Open-Meteo (${selectedApiId})`,checkedAt:new Date().toISOString(),gridSpacingKm,coverage:`lokales Radar-Phasenraster ${rows}×${cols} · ca. ${gridSpacingKm} km Modellstichpunkte · OPERA-Echomaske 1 km`,rapidUpdate:Boolean(selected.rapidUpdate),native15:Boolean(selected.native15),updateIntervalSeconds:selected.updateIntervalSeconds,modelAgeHours:Number((selected.ageHours||0).toFixed(2)),selectionScore:Number(phaseModelScore(selected).toFixed(1)),candidateModels:modelOrder.map(model=>({id:model.id,label:model.label,rapidUpdate:Boolean(model.rapidUpdate),resolutionKm:model.resolutionKm,initialisationTime:model.initialisationTime,ageHours:Number((model.ageHours||0).toFixed(2)),score:Number(phaseModelScore(model).toFixed(1))})),requestBudget:{locations:coordinates.length,batches:Math.ceil(coordinates.length/batchSize),variables:fields.split(',').length}};
 rememberPrecipitationPhase(cacheKey,data);return data;
}

const METEOGRAM_LEVELS=[1000,975,950,925,900,850,800,700,600,500,400,300,250,200,150,100];
const METEOGRAM_MODELS=new Map([
 ['best_match',{label:'Best Match',hours:168}],
 ['dwd_icon_d2',{label:'DWD ICON-D2',hours:48}],
 ['knmi_harmonie_arome_europe',{label:'KNMI HARMONIE-AROME Europe · Rapid Update',hours:60}],
 ['ukmo_uk_deterministic_2km',{label:'UKMO UKV · Rapid Update',hours:48}],
 ['dwd_icon_eu',{label:'DWD ICON-EU',hours:120}],
 ['meteofrance_arpege_europe',{label:'Météo-France ARPEGE Europa',hours:96}],
 ['jma_msm',{label:'JMA MSM',hours:96}],
 ['jma_seamless',{label:'JMA Seamless',hours:168}],
 ['jma_gsm',{label:'JMA GSM',hours:168}],
 ['ecmwf_ifs',{label:'ECMWF IFS HRES',hours:168}],
 ['ncep_gfs025',{label:'NOAA GFS 0,25°',hours:168}],
 ['dwd_icon',{label:'DWD ICON Global',hours:180}]
]);
const METEOGRAM_SURFACE=['temperature_2m','relative_humidity_2m','pressure_msl','wind_speed_10m','wind_direction_10m','wind_gusts_10m','precipitation','rain','showers','snowfall','snow_depth','weather_code','cloud_cover','cloud_cover_low','freezing_level_height'];
const JMA_METEOGRAM_BBOX=[118,20,155,52];
function inJmaMeteogramArea(lat,lon){const[minLon,minLat,maxLon,maxLat]=JMA_METEOGRAM_BBOX;return lon>=minLon&&lon<=maxLon&&lat>=minLat&&lat<=maxLat}
function effectiveMeteogramModel(requested,lat,lon){return requested==='best_match'&&inJmaMeteogramArea(lat,lon)?'jma_seamless':requested}
function meteogramSurfaceVariables(model){if(!String(model).startsWith('jma_'))return METEOGRAM_SURFACE;const unsupported=new Set(['wind_gusts_10m','cape','lifted_index','convective_inhibition','sunshine_duration']);return METEOGRAM_SURFACE.filter(variable=>!unsupported.has(variable))}
const METEOGRAM_PROFILE=METEOGRAM_LEVELS.flatMap(level=>[`temperature_${level}hPa`,`relative_humidity_${level}hPa`,`cloud_cover_${level}hPa`,`wind_speed_${level}hPa`,`wind_direction_${level}hPa`,`geopotential_height_${level}hPa`]);
async function meteogramData(lat,lon,model,elevation,refresh=false){const meteogramTtl=refresh?0:900;
 const requested=METEOGRAM_MODELS.has(model)?model:'best_match',effective=effectiveMeteogramModel(requested,lat,lon)==='best_match'?'ecmwf_ifs':effectiveMeteogramModel(requested,lat,lon),modelConfig=METEOGRAM_MODELS.get(effective),forecastHours=requested==='best_match'?168:modelConfig?.hours??168,url=new URL('https://api.open-meteo.com/v1/forecast');url.searchParams.set('latitude',String(lat));url.searchParams.set('longitude',String(lon));if(Number.isFinite(elevation))url.searchParams.set('elevation',String(Math.max(-500,Math.min(9000,elevation))));url.searchParams.set('hourly',[...meteogramSurfaceVariables(effective),...METEOGRAM_PROFILE].join(','));url.searchParams.set('forecast_hours',String(forecastHours));url.searchParams.set('models',effective);url.searchParams.set('timezone','GMT');url.searchParams.set('timeformat','unixtime');url.searchParams.set('wind_speed_unit','kn');url.searchParams.set('precipitation_unit','mm');url.searchParams.set('temperature_unit','celsius');url.searchParams.set('cell_selection','nearest');
 const response=await fetch(url.toString(),{headers:{Accept:'application/json','User-Agent':`MID-weather-dashboard/${WORKER_VERSION}`},cf:{cacheTtl:meteogramTtl,cacheEverything:true}}),text=await response.text();let data={};try{data=JSON.parse(text)}catch{}if(!response.ok||data?.error)throw new Error(data?.reason||data?.error||`Open-Meteo Meteogramm HTTP ${response.status}`);
 let meta=null;try{const metaResponse=await fetch(`https://api.open-meteo.com/data/${effective}/static/meta.json`,{headers:{Accept:'application/json','User-Agent':`MID-weather-dashboard/${WORKER_VERSION}`},cf:{cacheTtl:meteogramTtl,cacheEverything:true}});if(metaResponse.ok)meta=await metaResponse.json()}catch{}
 const initial=number(meta?.last_run_initialisation_time),available=number(meta?.last_run_availability_time),label=requested==='best_match'?`Best Match · ${modelConfig?.label||effective}`:modelConfig?.label;return{data,requestedModel:requested,effectiveModel:effective,modelLabel:label,forecastHours,runInitialisationTime:Number.isFinite(initial)?new Date(initial*1000).toISOString():undefined,runAvailabilityTime:Number.isFinite(available)?new Date(available*1000).toISOString():undefined,checkedAt:new Date().toISOString()};
}
function modelContourDomain(lat,lon){
 if(lat>=30&&lat<=72&&lon>=-30&&lon<=48)return{scope:'Europa',south:33,north:70,west:-23,east:45,rows:17,cols:25,model:'dwd_icon_eu',modelLabel:'DWD ICON-EU',fallbackModel:'dwd_icon',fallbackLabel:'DWD ICON Global'};
 if(lat>=15&&lat<=72&&lon>=-170&&lon<=-45)return{scope:'Nordamerika',south:20,north:68,west:-145,east:-52,rows:17,cols:25,model:'ncep_gfs025',modelLabel:'NOAA GFS 0,25°'};
 const latSpan=34,cos=Math.max(.35,Math.cos(lat*Math.PI/180)),lonSpan=Math.min(90,52/cos),south=Math.max(-80,lat-latSpan/2),north=Math.min(80,lat+latSpan/2),west=Math.max(-180,lon-lonSpan/2),east=Math.min(180,lon+lonSpan/2);return{scope:'Großregion',south,north,west,east,rows:17,cols:25,model:'dwd_icon',modelLabel:'DWD ICON Global'}
}
async function modelContours(lat,lon){
 const domain=modelContourDomain(lat,lon),{rows,cols,south,north,west,east}=domain,lats=Array.from({length:rows},(_,index)=>north-index*(north-south)/(rows-1)),lons=Array.from({length:cols},(_,index)=>west+index*(east-west)/(cols-1));
 const fetchGrid=async(model,modelLabel)=>{
  const fetchRow=async rowIndex=>{const url=new URL('https://api.open-meteo.com/v1/forecast'),latitudes=Array.from({length:cols},()=>lats[rowIndex].toFixed(4)),longitudes=lons.map(value=>value.toFixed(4));url.searchParams.set('latitude',latitudes.join(','));url.searchParams.set('longitude',longitudes.join(','));url.searchParams.set('hourly','pressure_msl,geopotential_height_500hPa');url.searchParams.set('past_hours','2');url.searchParams.set('forecast_hours','5');url.searchParams.set('models',model);url.searchParams.set('timezone','GMT');url.searchParams.set('cell_selection','nearest');const response=await fetch(url.toString(),{headers:{Accept:'application/json','User-Agent':`MID-weather-dashboard/${WORKER_VERSION}`},cf:{cacheTtl:1800,cacheEverything:true}}),text=await response.text();let payload={};try{payload=JSON.parse(text)}catch{}if(!response.ok||payload?.error)throw new Error(payload?.reason||payload?.error||`Open-Meteo Modelllinien HTTP ${response.status}`);const points=openMeteoRows(payload);if(points.length!==cols)throw new Error(`Open-Meteo lieferte ${points.length} statt ${cols} Rasterpunkte in Zeile ${rowIndex+1}.`);if(points.some(point=>point?.error||!point?.hourly))throw new Error(`Open-Meteo lieferte unvollständige Modelllinien in Zeile ${rowIndex+1}.`);return points};
  const rowSets=[];for(let start=0;start<rows;start+=4){const batch=await Promise.all(Array.from({length:Math.min(4,rows-start)},(_,offset)=>fetchRow(start+offset)));rowSets.push(...batch)}return{points:rowSets.flat(),model,modelLabel}
 };
 let selected,primaryError='';try{selected=await fetchGrid(domain.model,domain.modelLabel)}catch(error){primaryError=error instanceof Error?error.message:String(error);if(!domain.fallbackModel)throw error;selected=await fetchGrid(domain.fallbackModel,domain.fallbackLabel)}
 const points=selected.points,times=points[0]?.hourly?.time||[],frames=[];
 for(let ti=0;ti<times.length;ti++){const pressure=Array.from({length:rows},()=>Array(cols).fill(NaN)),height=Array.from({length:rows},()=>Array(cols).fill(NaN));for(let pi=0;pi<points.length;pi++){const row=Math.floor(pi/cols),col=pi%cols;pressure[row][col]=number(points[pi]?.hourly?.pressure_msl?.[ti])??NaN;height[row][col]=number(points[pi]?.hourly?.geopotential_height_500hPa?.[ti])??NaN}const stamp=safeDate(times[ti]);if(!stamp)continue;const isobarStep=pressureContourStep(pressure,lats,lons);frames.push({time:stamp,isobarStep,isoheightStepGpdm:8,isobars:contourSegments(pressure,lats,lons,isobarStep),isoheights:contourSegments(height,lats,lons,80,35),centers:pressureCenters(pressure,lats,lons)})}
 if(!frames.length)throw new Error('Open-Meteo lieferte keine auswertbaren Modelllinien.');return{frames,provider:'Open-Meteo',model:selected.modelLabel,resolutionNote:`${domain.scope} · einheitliches ${selected.modelLabel} · ${rows}×${cols} Stützraster, bilinear verdichtet und geglättet`,grid:{rows,cols,latSpan:north-south,lonSpan:east-west,scope:domain.scope,bounds:{south,north,west,east}},contours:{isobars:'dynamisch 1/2/4 hPa nach Druckgradient; Zielabstand ungefähr 100 km',isoheights:'8 gpdm'},fallback:primaryError?{from:domain.modelLabel,to:selected.modelLabel,reason:primaryError}:undefined,checkedAt:new Date().toISOString()};
}
const WEATHER_MAP_LAYER_CONFIG=new Map([
 ['dwd:Icon-d2_reg002_fd_sl_QFF',{forecast:true}],
 ['dwd:Icon-d2_reg002_fd_gl_T',{forecast:true,elevation:true}],
 ['dwd:Icon-d2_reg002_fd_sl_TOTPREC01H',{forecast:true}],
 ['dwd:Icon-d2_reg002_fd_sl_TOTPREC03H',{forecast:true}],
 ['dwd:Icon-d2_reg002_fd_sl_UV10M',{forecast:true}],
 ['dwd:Icon-d2_reg002_fd_sl_WW',{forecast:true}],
 ['dwd:Icon-eu_reg00625_fd_sl_QFF',{forecast:true}],
 ['dwd:Icon-eu_reg00625_fd_gl_T',{forecast:true,elevation:true}],
 ['dwd:Icon-eu_reg00625_fd_sl_TOTPREC01H',{forecast:true}],
 ['dwd:Icon-eu_reg00625_fd_sl_TOTPREC03H',{forecast:true}],
 ['dwd:Icon-eu_reg00625_fd_sl_WW',{forecast:true}],
 ['dwd:Icon_reg025_fd_sl_PMSL',{forecast:true}],
 ['dwd:Icon_reg025_fd_sl_T2M',{forecast:true}],
 ['dwd:Icon_reg025_fd_sl_TOTPREC',{forecast:true}],
 ['dwd:Icon_reg025_fd_sl_TOTPREC06H',{forecast:true}],
 ['dwd:Icon_reg025_fd_sl_TOTPREC24H',{forecast:true}],
 ['dwd:Icon_reg025_fd_sl_UV10M',{forecast:true}],
 ['dwd:Icon_reg025_fd_sl_WW',{forecast:true}],
 ['dwd:Icon_reg025_fd_pl_GH',{forecast:true,elevation:true}],
 ['dwd:Icon_reg025_fd_pl_T',{forecast:true,elevation:true}],
 ['dwd:Icon_reg025_fd_pl_RELHUM',{forecast:true,elevation:true}],
 ['dwd:Icon_reg025_fd_pl_UV',{forecast:true,elevation:true}],
 ['dwd:Icon_reg025_fd_pl_OMEGA',{forecast:true,elevation:true}],
 ['dwd:Icon-eps_reg025_fd_sl_PMSL',{forecast:true}],
 ['dwd:Icon-eps_reg025_fd_pl_GH',{forecast:true,elevation:true}],
 ['dwd:Icon-eps_reg025_fd_pl_TA',{forecast:true,elevation:true}],
 ['dwd:Icon-eps_reg025_fd_pl_SP',{forecast:true,elevation:true}],
 ['dwd:Icon-eps_reg025_fd_pl_SP10M',{forecast:true}],
 ['dwd:Icon-eps_reg025_fd_sl_TOTPREC24H',{forecast:true}],
 ['dwd:Icon-eps_reg025_fd_sl_VMAX10M12H',{forecast:true}],
 ['dwd:Aicon_reg025_fd_sl_PMSL',{forecast:true}],
 ['dwd:Aicon_reg025_fd_sl_T',{forecast:true}],
 ['dwd:Aicon_reg025_fd_sl_TOTPREC',{forecast:true}],
 ['dwd:Aicon_reg025_fd_sl_TOTPREC06H',{forecast:true}],
 ['dwd:Aicon_reg025_fd_sl_UV10M',{forecast:true}],
 ['dwd:Aicon_reg025_fd_sl_WW',{forecast:true}],
 ['dwd:Autowarn_Analyse',{forecast:false}],
 ['dwd:Autowarn_Vorhersage',{forecast:true,shortRange:true}],
 ['dwd:Gewitterzellen',{forecast:false}],
 ['dwd:Gewittercluster',{forecast:false}],
 ['dwd:NCEW_EU',{forecast:true,shortRange:true}]
]);
const WMS_ALLOWED_LAYERS={
 dwd:new Set([...DWD_RADAR_LAYERS,'dwd:Blitzdichte','dwd:NCEW_EU','dwd:Warnungen_Gemeinden_vereinigt',...WEATHER_MAP_LAYER_CONFIG.keys(),...SATELLITE_DAY_CANDIDATES.filter(item=>item.provider==='dwd').map(item=>item.layer),...SATELLITE_IR_CANDIDATES.filter(item=>item.provider==='dwd').map(item=>item.layer)]),
 eumetsat:new Set(['mtg_fd:li_afa',...SATELLITE_DAY_CANDIDATES.filter(item=>item.provider==='eumetsat').map(item=>item.layer),...SATELLITE_IR_CANDIDATES.filter(item=>item.provider==='eumetsat').map(item=>item.layer),...SATELLITE_PRECIP_CANDIDATES.map(item=>item.layer)])
};

function limitedWeatherMapTimes(times,config,now=Date.now()){const minimum=now-(config?.observed?18:36)*3600000,maximum=now+(config?.shortRange?3:config?.forecast?200:2)*3600000,filtered=[...new Set((times||[]).filter(Number.isFinite).filter(value=>value>=minimum&&value<=maximum))].sort((a,b)=>a-b);if(filtered.length<=260)return filtered;const step=Math.ceil(filtered.length/260),sampled=filtered.filter((_,index)=>index%step===0);if(sampled.at(-1)!==filtered.at(-1))sampled.push(filtered.at(-1));return sampled.slice(-260)}
async function weatherMapMetadata(request){
 const url=new URL(request.url),layer=String(url.searchParams.get('layer')||'').trim(),config=WEATHER_MAP_LAYER_CONFIG.get(layer);if(!config)throw new Error('Nicht freigegebener Wetterkarten-Layer');
 const xml=await firstWmsCapabilities(DWD_RADAR_WMS_BASES,'DWD Wetterkarten');if(!hasWmsLayer(xml,layer))throw new Error(`DWD-WMS-Layer derzeit nicht verfügbar: ${layer}`);
 const times=limitedWeatherMapTimes(dwdTimesFromCapabilities(xml,layer),config),referenceTimes=dwdDimensionTimesFromCapabilities(xml,layer,'reference_time').filter(value=>value>=Date.now()-96*3600000&&value<=Date.now()+12*3600000).slice(-12),elevations=config.elevation?dwdElevationsFromCapabilities(xml,layer):[];
 return{layer,times:times.map(value=>new Date(value).toISOString()),referenceTimes:referenceTimes.map(value=>new Date(value).toISOString()),elevations,provider:'Deutscher Wetterdienst · WMS',checkedAt:new Date().toISOString()}
}
async function weatherMapWmsResponse(request){
 const url=new URL(request.url),provider=String(url.searchParams.get('provider')||'dwd').toLowerCase();if(provider!=='dwd')return json({error:'Ungültiger Wetterkarten-Provider',version:WORKER_VERSION},400,{'cache-control':'no-store'});
 const layers=String(url.searchParams.get('layers')||'').split(',').map(value=>value.trim()).filter(Boolean);if(layers.length!==1||!WEATHER_MAP_LAYER_CONFIG.has(layers[0]))return json({error:'Nicht freigegebener Wetterkarten-Layer',version:WORKER_VERSION},400,{'cache-control':'no-store'});const config=WEATHER_MAP_LAYER_CONFIG.get(layers[0]);
 const requestedTime=url.searchParams.get('time'),requestedMs=requestedTime?Date.parse(requestedTime):NaN;if(requestedTime&&!Number.isFinite(requestedMs))return json({error:'Ungültiger Wetterkarten-Zeitpunkt',version:WORKER_VERSION},400,{'cache-control':'no-store'});if(Number.isFinite(requestedMs)){const now=Date.now(),minimum=now-(config?.observed?24:48)*3600000,maximum=now+(config?.shortRange?4:config?.forecast?204:3)*3600000;if(requestedMs<minimum||requestedMs>maximum)return json({error:'Der Wetterkarten-Zeitpunkt liegt außerhalb des zulässigen Produktfensters.',version:WORKER_VERSION},409,{'cache-control':'no-store'})}
 const elevation=url.searchParams.get('elevation');if(elevation!==null&&(!config?.elevation||!Number.isFinite(Number(elevation))||Number(elevation)<0||Number(elevation)>1200))return json({error:'Ungültige Druckfläche',version:WORKER_VERSION},400,{'cache-control':'no-store'});
 const reference=url.searchParams.get('dim_reference_time');if(reference){const referenceMs=Date.parse(reference);if(!Number.isFinite(referenceMs)||referenceMs<Date.now()-120*3600000||referenceMs>Date.now()+12*3600000)return json({error:'Ungültiger Modelllauf-Zeitpunkt',version:WORKER_VERSION},400,{'cache-control':'no-store'})}
 const allowed=new Set(['service','request','version','layers','styles','format','transparent','crs','srs','bbox','width','height','time','elevation','dim_reference_time','exceptions','bgcolor','tiled']);
 const attempt=async base=>{const upstream=new URL(base);for(const[key,value]of url.searchParams){const normalized=key.toLowerCase();if(!allowed.has(normalized))continue;const outgoing=normalized==='layers'?String(value).split(',').map(layer=>dwdLayerForEndpoint(layer,base)).join(','):value;upstream.searchParams.set(normalized,outgoing)}if(!upstream.searchParams.has('service'))upstream.searchParams.set('service','WMS');if(!upstream.searchParams.has('request'))upstream.searchParams.set('request','GetMap');const response=await fetchWithDeadline(upstream.toString(),{headers:{Accept:'image/png,image/webp,image/jpeg,*/*','User-Agent':`MID-weather-dashboard/${WORKER_VERSION}`,'Cache-Control':'no-cache'},cache:'no-store'},9000),type=String(response.headers.get('content-type')||'').toLowerCase();if(!response.ok)throw new Error(`${new URL(base).hostname}${new URL(base).pathname} HTTP ${response.status}`);if(!type.startsWith('image/')){await response.body?.cancel().catch(()=>undefined);throw new Error(`WMS_UPSTREAM_CONTENT_TYPE_${response.status}`)}return{response,type,base}};
 try{const{response,type,base}=await Promise.any(DWD_RADAR_WMS_BASES.map(attempt));return new Response(response.body,{status:200,headers:{'content-type':type,'access-control-allow-origin':'*','cache-control':'public, max-age=120, stale-while-revalidate=300','x-mid-wms-provider':'dwd','x-mid-wms-layer':layers[0],'x-mid-wms-endpoint':new URL(base).pathname,'x-mid-worker-version':WORKER_VERSION}})}catch{return new Response('Wetterkarte derzeit nicht verfügbar.',{status:502,headers:{'content-type':'text/plain; charset=utf-8','access-control-allow-origin':'*','cache-control':'no-store','x-mid-worker-version':WORKER_VERSION}})}
}
async function compositeWmsResponse(request){
 const url=new URL(request.url),provider=String(url.searchParams.get('provider')||'').toLowerCase(),bases=provider==='dwd'?DWD_RADAR_WMS_BASES:provider==='eumetsat'?[EUMETSAT_WMS]:[];
 if(!bases.length)return json({error:'Ungültiger WMS-Provider',version:WORKER_VERSION},400,{'cache-control':'no-store'});
 const layers=String(url.searchParams.get('layers')||'').split(',').map(value=>value.trim()).filter(Boolean),allowedLayers=WMS_ALLOWED_LAYERS[provider];
 if(!layers.length||layers.some(layer=>!allowedLayers?.has(layer)))return json({error:'Nicht freigegebener WMS-Layer',version:WORKER_VERSION},400,{'cache-control':'no-store'});
 const requestedTime=url.searchParams.get('time'),requestedMs=requestedTime?Date.parse(requestedTime):NaN;if(requestedTime&&!Number.isFinite(requestedMs))return json({error:'Ungültiger WMS-Zeitpunkt',version:WORKER_VERSION},400,{'cache-control':'no-store'});
 if(Number.isFinite(requestedMs)){const now=Date.now(),isRadar=layers.some(layer=>DWD_RADAR_LAYERS.includes(layer)),isLightning=layers.some(layer=>layer==='dwd:Blitzdichte'||layer==='mtg_fd:li_afa'),isSatellitePrecip=layers.some(layer=>SATELLITE_PRECIP_CANDIDATES.some(item=>item.layer===layer)),isDwdSatellite=provider==='dwd'&&layers.some(layer=>SATELLITE_DAY_CANDIDATES.concat(SATELLITE_IR_CANDIDATES).some(item=>item.layer===layer)),minimum=now-(isRadar?70:isLightning?135:isSatellitePrecip?195:isDwdSatellite?240:195)*60000,maximum=now+(isRadar?125:15)*60000;if(requestedMs<minimum||requestedMs>maximum)return json({error:'Der angeforderte WMS-Zeitpunkt liegt außerhalb des zulässigen Live-/Nowcast-Fensters.',version:WORKER_VERSION,serverTime:new Date(now).toISOString()},409,{'cache-control':'no-store'})}
 const allowed=new Set(['service','request','version','layers','styles','format','transparent','crs','srs','bbox','width','height','time','elevation','dim_reference_time','exceptions','bgcolor','tiled']);
 const attempt=async base=>{const upstream=new URL(base);for(const[key,value]of url.searchParams){const normalized=key.toLowerCase();if(!allowed.has(normalized))continue;const outgoing=provider==='dwd'&&normalized==='layers'?String(value).split(',').map(layer=>dwdLayerForEndpoint(layer,base)).join(','):value;upstream.searchParams.set(normalized,outgoing)}if(!upstream.searchParams.has('service'))upstream.searchParams.set('service','WMS');if(!upstream.searchParams.has('request'))upstream.searchParams.set('request','GetMap');const response=await fetchWithDeadline(upstream.toString(),{headers:{Accept:'image/png,image/webp,image/jpeg,*/*','User-Agent':`MID-weather-dashboard/${WORKER_VERSION}`,'Cache-Control':'no-cache'},cache:'no-store'},7000),type=String(response.headers.get('content-type')||'').toLowerCase();if(!response.ok)throw new Error(`${new URL(base).hostname}${new URL(base).pathname} HTTP ${response.status}`);if(!type.startsWith('image/')){await response.body?.cancel().catch(()=>undefined);throw new Error(`WMS_UPSTREAM_CONTENT_TYPE_${response.status}`)}return{response,type,base}};
 try{const{response,type,base}=await Promise.any(bases.map(attempt));return new Response(response.body,{status:200,headers:{'content-type':type,'access-control-allow-origin':'*','cache-control':'no-store, no-cache, must-revalidate','pragma':'no-cache','expires':'0','x-mid-wms-provider':provider,'x-mid-wms-layer':layers.join(','),'x-mid-wms-endpoint':new URL(base).pathname,'x-mid-worker-version':WORKER_VERSION}})}catch{return new Response('WMS-Karte derzeit nicht verfügbar.',{status:502,headers:{'content-type':'text/plain; charset=utf-8','access-control-allow-origin':'*','cache-control':'no-store','x-mid-worker-version':WORKER_VERSION}})};
}


const PUSH_DEFAULT_ORIGINS=['https://meteomartini.github.io','https://midwx.app','https://www.midwx.app'];
const PUSH_DEFAULT_ORIGIN=PUSH_DEFAULT_ORIGINS[0];
const PUSH_ENCODER=new TextEncoder();
const PUSH_SCHEDULER_HEARTBEAT_KEY='meta:push-scheduler:v1';
const PUSH_SCHEDULER_HEALTH_MS=16*60*1000;
