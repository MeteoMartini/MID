function aviationVisibilityMetersText(value){if(!Number.isFinite(value))return'nicht verfügbar';if(value<1000)return`${Math.max(50,Math.round(value/50)*50)} m`;if(value<10000)return`${new Intl.NumberFormat('de-DE',{minimumFractionDigits:value<3000?1:0,maximumFractionDigits:1}).format(value/1000)} km`;return'≥ 10 km'}
function aviationCeilingFt(clouds){if(!Array.isArray(clouds))return undefined;const bases=clouds.filter(cloud=>/^(?:BKN|OVC|VV)$/i.test(String(cloud?.cover||''))).map(cloud=>number(cloud?.base)).filter(value=>value!==undefined&&value>=100&&value<=60000);return bases.length?Math.min(...bases):undefined}
function aviationTerminalPeriodSignals(period,{source,label,issuer,distanceKm,startEpoch,endEpoch}){
 const from=aviationEpoch(period?.timeFrom??period?.validTimeFrom??period?.obsTime??period?.reportTime),to=aviationEpoch(period?.timeTo??period?.validTimeTo),now=Date.now();
 const periodFrom=Number.isFinite(from)?from:source==='metar'?now-3*3600000:NaN,periodTo=Number.isFinite(to)?to:Number.isFinite(from)?from+(source==='metar'?90:6*60)*60000:NaN;
 if(Number.isFinite(periodFrom)&&Number.isFinite(periodTo)&&(periodTo<startEpoch-30*60000||periodFrom>endEpoch+30*60000))return[];
 const raw=[period?.wxString,period?.notDecoded,Array.isArray(period?.icgTurb)?period.icgTurb.join(' '):period?.icgTurb].filter(Boolean).join(' '),signals=[],probability=number(period?.probability),probabilistic=source==='taf'&&probability!==undefined&&probability<=40;
 const add=(kind,level,detail,measurement={})=>signals.push({kind,label:AVIATION_HAZARD_LABELS[kind]||kind,level:probabilistic&&level==='caution'?'watch':level,detail:`${source==='taf'?'TAF':'METAR/SPECI'}${issuer?` ${issuer}`:''} · ${detail}${probability!==undefined?` · ${Math.round(probability)} %`:''}`,source:label,issuer:issuer||undefined,validFrom:Number.isFinite(periodFrom)?new Date(periodFrom).toISOString():undefined,validTo:Number.isFinite(periodTo)?new Date(periodTo).toISOString():undefined,distanceKm:Number.isFinite(distanceKm)?Number(distanceKm.toFixed(1)):undefined,...measurement});
 for(const kind of aviationHazardKinds(raw))add(kind,aviationLevel(raw,source),AVIATION_HAZARD_LABELS[kind]||kind);
 const gust=number(period?.wgst);if(gust!==undefined&&gust>=25)add('wind',gust>=35?'caution':'watch',`Böen ${Math.round(gust)} kt`,{value:gust,unit:'kt'});
 const visibility=aviationVisibilitySm(period?.visib),visibilityM=visibility===undefined?undefined:visibility*1609.344;if(visibility!==undefined&&visibility<3)add('visibility',visibility<1?'caution':'watch',`Sicht ${aviationVisibilityMetersText(visibilityM)}`,{value:Number(visibilityM.toFixed(0)),unit:'m'});
 const ceiling=aviationCeilingFt(period?.clouds);if(ceiling!==undefined&&ceiling<3000)add('ceiling',ceiling<1000?'caution':'watch',`Wolkenuntergrenze ${Math.round(ceiling/100)*100} ft`,{value:ceiling,unit:'ft'});
 if(number(period?.wshearHgt)!==undefined||number(period?.wshearSpd)!==undefined)add('llws','caution','Low-Level Windshear');
 return signals;
}
function aviationTerminalSignals(properties,{source,label,distanceKm,startEpoch,endEpoch}){
 const issuer=aviationIssuer(properties),periods=source==='taf'&&Array.isArray(properties?.fcsts)?properties.fcsts:[properties],signals=[];
 for(const period of periods)signals.push(...aviationTerminalPeriodSignals(period,{source,label,issuer,distanceKm,startEpoch,endEpoch}));
 return signals;
}
function aviationSignalsFromPayload(payload,{lat,lon,startEpoch,endEpoch,source,label}){
 const signals=[];
 for(const feature of aviationFeatures(payload)){const properties=feature?.properties||feature||{},geometry=feature?.geometry||properties?.geometry||null;if(!aviationGeometryRelevant(lat,lon,geometry,source))continue;const distanceKm=aviationGeometryDistanceKm(lat,lon,geometry);
  if(source==='taf'||source==='metar'){signals.push(...aviationTerminalSignals(properties,{source,label,distanceKm,startEpoch,endEpoch}));continue}
  if(!aviationTimeRelevant(properties,startEpoch,endEpoch,source))continue;const text=aviationPropertyText(properties),kinds=aviationHazardKinds(text);if(!kinds.length)continue;const level=aviationLevel(text,source),times=aviationFeatureTimes(properties),issuer=aviationIssuer(properties);for(const kind of kinds)signals.push({kind,label:AVIATION_HAZARD_LABELS[kind]||kind,level,detail:aviationSignalDetail(kind,source,properties,text,distanceKm),source:label,issuer:issuer||undefined,validFrom:Number.isFinite(times.start)?new Date(times.start).toISOString():undefined,validTo:Number.isFinite(times.end)?new Date(times.end).toISOString():undefined,distanceKm:Number.isFinite(distanceKm)?Number(distanceKm.toFixed(1)):undefined})}
 return signals;
}
async function aviationAwcGeoJson(path,params={}){
 const url=new URL(path,AWC_DATA_API);url.searchParams.set('format','geojson');for(const[key,value]of Object.entries(params))if(value!==undefined&&value!=='')url.searchParams.set(key,String(value));const response=await fetchWithDeadline(url.toString(),{headers:{Accept:'application/geo+json,application/json','User-Agent':`MID-weather-dashboard/${WORKER_VERSION} (+https://github.com/MeteoMartini/MID)`}},12000);if(response.status===204)return{type:'FeatureCollection',features:[]};if(!response.ok)throw new Error(`AWC ${path} HTTP ${response.status}`);return response.json()
}
function aviationBbox(lat,lon,radiusKm=240){const dLat=radiusKm/111,dLon=radiusKm/(111*Math.max(.25,Math.cos(lat*Math.PI/180)));return`${Math.max(-89.9,lat-dLat).toFixed(3)},${Math.max(-179.9,lon-dLon).toFixed(3)},${Math.min(89.9,lat+dLat).toFixed(3)},${Math.min(179.9,lon+dLon).toFixed(3)}`}
function aviationConus(lat,lon){return lat>=24&&lat<=50&&lon>=-126&&lon<=-65}
function aviationAlaska(lat,lon){return lat>=50&&lat<=72&&lon>=-170&&lon<=-129}
async function aviationAwcSource(source,label,lat,lon,startEpoch,endEpoch){
 const params=source==='pirep'?{age:3,bbox:aviationBbox(lat,lon,260)}:source==='metar'?{hours:3,bbox:aviationBbox(lat,lon,140)}:source==='taf'?{bbox:aviationBbox(lat,lon,140)}:source==='tcf'?{}:{};const payload=await aviationAwcGeoJson(source,params);return aviationSignalsFromPayload(payload,{lat,lon,startEpoch,endEpoch,source,label})
}
function knmiAviationKey(env){return String(env?.MID_KNMI_API_KEY||env?.KNMI_OPEN_DATA_API_KEY||'').trim()}
function knmiAirmetCoverage(lat,lon){return lat>=50.70&&lat<=55.85&&lon>=1.90&&lon<=7.35}
async function knmiOpenDataJson(url,key){const response=await fetchWithDeadline(url,{headers:{Accept:'application/json',Authorization:key,'User-Agent':`MID-weather-dashboard/${WORKER_VERSION} (+https://github.com/MeteoMartini/MID)`}},12000);if(!response.ok)throw new Error(`KNMI Open Data HTTP ${response.status}`);return response.json()}
async function knmiProductSignals(dataset,product,lat,lon,startEpoch,endEpoch,env){
 const key=knmiAviationKey(env);if(!key)throw new Error('MID_KNMI_API_KEY nicht gesetzt');if(!knmiAirmetCoverage(lat,lon))return[];if(startEpoch>Date.now()+12*3600000||endEpoch<Date.now()-6*3600000)return[];
 const listUrl=new URL(`datasets/${dataset}/versions/1.0/files`,KNMI_OPEN_DATA_API);listUrl.searchParams.set('maxKeys','8');listUrl.searchParams.set('orderBy','created');listUrl.searchParams.set('sorting','desc');const listing=await knmiOpenDataJson(listUrl.toString(),key),files=Array.isArray(listing?.files)?listing.files:[],signals=[];
 for(const file of files.slice(0,6)){const filename=String(file?.filename||''),created=Date.parse(String(file?.created||file?.lastModified||''));if(!filename||!Number.isFinite(created)||Date.now()-created>8*3600000)continue;const urlMeta=await knmiOpenDataJson(new URL(`datasets/${dataset}/versions/1.0/files/${encodeURIComponent(filename)}/url`,KNMI_OPEN_DATA_API).toString(),key),temporary=String(urlMeta?.temporaryDownloadUrl||'');if(!temporary)continue;const response=await fetchWithDeadline(temporary,{headers:{Accept:'text/plain,*/*'}},10000);if(!response.ok)continue;const text=await response.text();if(/\bNIL\b/i.test(text))continue;const kinds=aviationHazardKinds(text);for(const kind of kinds)signals.push({kind,label:AVIATION_HAZARD_LABELS[kind]||kind,level:aviationLevel(text,product.toLowerCase()),detail:`${product} · Amsterdam FIR`,source:`KNMI · ${product}`,issuer:'KNMI'})
 }
 return signals;
}
async function knmiAirmetSignals(lat,lon,startEpoch,endEpoch,env){return knmiProductSignals('airmet','AIRMET',lat,lon,startEpoch,endEpoch,env)}
async function knmiSigmetSignals(lat,lon,startEpoch,endEpoch,env){return knmiProductSignals('sigmet','SIGMET',lat,lon,startEpoch,endEpoch,env)}
function wifsKey(env){return String(env?.MID_WIFS_API_KEY||env?.WIFS_API_KEY||'').trim()}
async function wifsFetch(url,key,accept='application/json'){const response=await fetchWithDeadline(url,{headers:{Accept:accept,'X-API-Key':key,'User-Agent':`MID-weather-dashboard/${WORKER_VERSION} (+https://github.com/MeteoMartini/MID)`}},16000);if(!response.ok)throw new Error(`WIFS HTTP ${response.status}`);return response}
function wifsTimes(meta){const temporal=meta?.extent?.temporal,values=Array.isArray(temporal?.values)?temporal.values.map(value=>Date.parse(value)).filter(Number.isFinite):[];if(values.length)return values;const interval=Array.isArray(temporal?.interval)?temporal.interval.flat().map(value=>Date.parse(value)).filter(Number.isFinite):[];if(interval.length>=2){const result=[];for(let t=interval[0];t<=interval.at(-1);t+=3*3600000)result.push(t);return result}return[]}
function closestWifsTime(times,target){return times.length?times.reduce((best,value)=>Math.abs(value-target)<Math.abs(best-target)?value:best,times[0]):NaN}
function iwxxmPolygon(text){const match=text.match(/<gml:posList[^>]*>([\s\S]*?)<\/gml:posList>/i);if(!match)return[];const nums=match[1].trim().split(/\s+/).map(Number).filter(Number.isFinite),a=[],b=[];for(let i=0;i+1<nums.length;i+=2){a.push([nums[i+1],nums[i]]);b.push([nums[i],nums[i+1]])}return[a,b]}
function iwxxmPoints(text){const points=[],re=/<gml:pos(?!List)[^>]*>([\s\S]*?)<\/gml:pos>/gi;let match;while((match=re.exec(text))){const nums=match[1].trim().split(/\s+/).map(Number).filter(Number.isFinite);if(nums.length<2)continue;points.push([nums[0],nums[1]],[nums[1],nums[0]])}return points}
function iwxxmGeometryRelevant(lat,lon,window){for(const polygon of iwxxmPolygon(window)){if(polygon.length>=3&&pointInRing(lat,lon,polygon))return true}for(const point of iwxxmPoints(window)){if(distance(lat,lon,point[0],point[1])/1000<=350)return true}return false}
function wifsSignalsFromIwxxm(xml,lat,lon,sourceLabel){
 const signals=[],seen=new Set(),geometry=/<gml:(?:posList|pos)(?:\s|>)[^>]*>[\s\S]*?<\/gml:(?:posList|pos)>/gi;let match;while((match=geometry.exec(xml))){const window=xml.slice(Math.max(0,match.index-5000),Math.min(xml.length,geometry.lastIndex+5000));if(!iwxxmGeometryRelevant(lat,lon,window))continue;
  // Keep XML attributes in the classifier: WAFS/IWXXM frequently carries the hazard and
  // intensity as URI/xlink values rather than visible element text.
  const kinds=aviationHazardKinds(window),level=aviationLevel(window,'wafs');for(const kind of kinds){const key=`${kind}:${level}`;if(seen.has(key))continue;seen.add(key);signals.push({kind,label:AVIATION_HAZARD_LABELS[kind]||kind,level,detail:`WAFS SIGWX · ${level==='caution'?'markantes':'relevantes'} Signal`,source:sourceLabel})}}
 return signals
}
async function aviationWifsCollection(collection,label,lat,lon,startEpoch,endEpoch,key){
 const metaResponse=await wifsFetch(new URL(`collections/${collection}?f=json`,WIFS_API).toString(),key),meta=await metaResponse.json(),times=wifsTimes(meta),target=(startEpoch+endEpoch)/2,valid=closestWifsTime(times,target);if(!Number.isFinite(valid)||Math.abs(valid-target)>4*3600000)return[];const url=new URL(`collections/${collection}/locations/GLOBAL`,WIFS_API);url.searchParams.set('f','iwxxm');url.searchParams.set('datetime',new Date(valid).toISOString().replace('.000Z','Z'));const response=await wifsFetch(url.toString(),key,'application/xml,text/xml,application/iwxxm+xml,*/*'),xml=await response.text();return wifsSignalsFromIwxxm(xml,lat,lon,label)
}
function dedupeAviationSignals(signals){const map=new Map();for(const signal of signals){const key=[signal.kind,signal.source,signal.issuer||'',signal.detail].join('|'),previous=map.get(key);if(!previous||signal.level==='caution')map.set(key,signal)}return[...map.values()]}
async function aviationHazardsResponse(lat,lon,startEpoch,endEpoch,env){
 const tasks=[{id:'icao-sigmet',label:'ICAO SIGMET (nationale MWO) · AWC',fn:()=>aviationAwcSource('isigmet','ICAO SIGMET (nationale MWO) · AWC',lat,lon,startEpoch,endEpoch)}];
 const nearNow=startEpoch<=Date.now()+6*3600000&&endEpoch>=Date.now()-3*3600000;
 if(nearNow){tasks.push({id:'metar',label:'METAR/SPECI · AWC',fn:()=>aviationAwcSource('metar','METAR/SPECI · AWC',lat,lon,startEpoch,endEpoch)},{id:'pirep',label:'PIREP/AIREP · AWC',fn:()=>aviationAwcSource('pirep','PIREP/AIREP · AWC',lat,lon,startEpoch,endEpoch)})}
 if(startEpoch<=Date.now()+36*3600000)tasks.push({id:'taf',label:'TAF (nationale Provider) · AWC',fn:()=>aviationAwcSource('taf','TAF (nationale Provider) · AWC',lat,lon,startEpoch,endEpoch)});
 if(aviationConus(lat,lon)){tasks.push({id:'us-sigmet',label:'US SIGMET · NOAA AWC',fn:()=>aviationAwcSource('airsigmet','US SIGMET · NOAA AWC',lat,lon,startEpoch,endEpoch)},{id:'gairmet',label:'G-AIRMET · NOAA AWC',fn:()=>aviationAwcSource('gairmet','G-AIRMET · NOAA AWC',lat,lon,startEpoch,endEpoch)},{id:'cwa',label:'CWA · NOAA AWC',fn:()=>aviationAwcSource('cwa','CWA · NOAA AWC',lat,lon,startEpoch,endEpoch)},{id:'tcf',label:'Traffic Flow Convective Forecast · NOAA AWC',fn:()=>aviationAwcSource('tcf','TCF · NOAA AWC',lat,lon,startEpoch,endEpoch)});}else if(aviationAlaska(lat,lon))tasks.push({id:'airmet',label:'AIRMET · NOAA AWC',fn:()=>aviationAwcSource('airmet','AIRMET · NOAA AWC',lat,lon,startEpoch,endEpoch)});
 const settled=await Promise.allSettled(tasks.map(task=>task.fn())),sources=[],signals=[];settled.forEach((result,index)=>{const task=tasks[index];if(result.status==='fulfilled'){signals.push(...result.value);sources.push({id:task.id,label:task.label,status:result.value.length?'used':'available'})}else sources.push({id:task.id,label:task.label,status:'unavailable',detail:result.reason instanceof Error?result.reason.message:String(result.reason)})});
 if(knmiAirmetCoverage(lat,lon)){if(knmiAviationKey(env)){const knmiTasks=[['knmi-airmet','KNMI · AIRMET Amsterdam FIR',()=>knmiAirmetSignals(lat,lon,startEpoch,endEpoch,env)],['knmi-sigmet','KNMI · SIGMET Amsterdam FIR',()=>knmiSigmetSignals(lat,lon,startEpoch,endEpoch,env)]],knmiSettled=await Promise.allSettled(knmiTasks.map(task=>task[2]()));knmiSettled.forEach((result,index)=>{const[id,label]=knmiTasks[index];if(result.status==='fulfilled'){signals.push(...result.value);sources.push({id,label,status:result.value.length?'used':'available'})}else sources.push({id,label,status:'unavailable',detail:result.reason instanceof Error?result.reason.message:String(result.reason)})})}else sources.push({id:'knmi-aviation',label:'KNMI · AIRMET/SIGMET Amsterdam FIR',status:'not-configured',detail:'MID_KNMI_API_KEY nicht gesetzt'})}
 const key=wifsKey(env);if(key&&startEpoch<=Date.now()+54*3600000&&endEpoch>=Date.now()+3*3600000){const wifsTasks=[['kkci_iwxxm_forecasts','WAFC Washington · WAFS SIGWX (IWXXM)'],['egrr_iwxxm_forecasts','WAFC London · WAFS SIGWX (IWXXM)']],wifsSettled=await Promise.allSettled(wifsTasks.map(([collection,label])=>aviationWifsCollection(collection,label,lat,lon,startEpoch,endEpoch,key)));wifsSettled.forEach((result,index)=>{const label=wifsTasks[index][1];if(result.status==='fulfilled'){signals.push(...result.value);sources.push({id:index?'wafs-london':'wafs-washington',label,status:result.value.length?'used':'available'})}else sources.push({id:index?'wafs-london':'wafs-washington',label,status:'unavailable',detail:result.reason instanceof Error?result.reason.message:String(result.reason)})})}else sources.push({id:'wafs-sigwx',label:'WAFS SIGWX · WAFC London/Washington (IWXXM)',status:key?'available':'not-configured',detail:key?'außerhalb F06–F48 bzw. kein passender Gültigkeitstermin':'MID_WIFS_API_KEY nicht gesetzt'});
 return{signals:dedupeAviationSignals(signals),sources,checkedAt:new Date().toISOString(),note:'Priorität: amtliche standort- und zeitbezogene ICAO-Produkte sowie WAFS SIGWX; MID-Druckniveaudiagnostik ergänzt, wenn kein amtliches Signal vorliegt.'}
}

const NOAA_OISST_LTM_ASCII='https://psl.noaa.gov/thredds/dodsC/Datasets/noaa.oisst.v2.highres/sst.day.mean.ltm.1991-2020.nc.ascii';
const NOAA_OISST_SCHEMA='mid.travel-water-climate.v1';
const NOAA_OISST_MAX_DISTANCE_KM=80;
const NOAA_OISST_LAT_ORIGIN=-89.875;
const NOAA_OISST_LON_ORIGIN=.125;
const NOAA_OISST_STEP=.25;
const NOAA_OISST_LAT_COUNT=720;
const NOAA_OISST_LON_COUNT=1440;

function travelWaterError(message,status=400){const error=new Error(message);error.midStatus=status;return error}
function travelWaterIsoDate(value){const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!match)return null;const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]),date=new Date(Date.UTC(year,month-1,day));return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day?date:null}
function oisstDateIndices(date){const month=date.getUTCMonth()+1,day=date.getUTCDate();if(month===2&&day===29)return[58,59];return[Math.round((Date.UTC(2001,month-1,day)-Date.UTC(2001,0,1))/86400000)]}
function travelWaterPeriodDays(start,end){const first=travelWaterIsoDate(start),last=travelWaterIsoDate(end);if(!first||!last)throw travelWaterError('Gültiges start/end im Format JJJJ-MM-TT erforderlich.');const span=Math.round((last-first)/86400000);if(span<0||span>119)throw travelWaterError('Der Wassertemperatur-Zeitraum muss 1 bis 120 Tage umfassen.');return Array.from({length:span+1},(_,index)=>{const date=new Date(first);date.setUTCDate(date.getUTCDate()+index);return oisstDateIndices(date)})}
function contiguousIndexRanges(indices){const sorted=[...new Set(indices)].sort((a,b)=>a-b),ranges=[];for(const value of sorted){const current=ranges[ranges.length-1];if(current&&value===current.end+1)current.end=value;else ranges.push({start:value,end:value})}return ranges}
function normalizedOisstLongitude(value){return((value%360)+360)%360}
function oisstSpatialWindow(lat,lon){const latitude=Math.max(NOAA_OISST_LAT_ORIGIN,Math.min(-NOAA_OISST_LAT_ORIGIN,lat)),latCenter=Math.max(0,Math.min(NOAA_OISST_LAT_COUNT-1,Math.round((latitude-NOAA_OISST_LAT_ORIGIN)/NOAA_OISST_STEP))),lonCenter=Math.max(0,Math.min(NOAA_OISST_LON_COUNT-1,Math.round((normalizedOisstLongitude(lon)-NOAA_OISST_LON_ORIGIN)/NOAA_OISST_STEP))),latRadius=4,cosine=Math.max(.05,Math.cos(latitude*Math.PI/180)),lonRadius=Math.min(72,Math.ceil(NOAA_OISST_MAX_DISTANCE_KM/(111.2*NOAA_OISST_STEP*cosine))+1),latStart=Math.max(0,latCenter-latRadius),latEnd=Math.min(NOAA_OISST_LAT_COUNT-1,latCenter+latRadius),rawStart=lonCenter-lonRadius,rawEnd=lonCenter+lonRadius,lonRanges=[];if(rawStart<0){lonRanges.push({start:0,end:rawEnd});lonRanges.push({start:NOAA_OISST_LON_COUNT+rawStart,end:NOAA_OISST_LON_COUNT-1})}else if(rawEnd>=NOAA_OISST_LON_COUNT){lonRanges.push({start:rawStart,end:NOAA_OISST_LON_COUNT-1});lonRanges.push({start:0,end:rawEnd-NOAA_OISST_LON_COUNT})}else lonRanges.push({start:rawStart,end:rawEnd});return{latStart,latEnd,lonRanges}}
function oisstGridLatitude(index){return NOAA_OISST_LAT_ORIGIN+index*NOAA_OISST_STEP}
function oisstGridLongitude(index){const value=NOAA_OISST_LON_ORIGIN+index*NOAA_OISST_STEP;return value>180?value-360:value}
async function oisstSubset(timeRange,latStart,latEnd,lonRange){const expression=`sst[${timeRange.start}:1:${timeRange.end}][${latStart}:1:${latEnd}][${lonRange.start}:1:${lonRange.end}]`,url=`${NOAA_OISST_LTM_ASCII}?${encodeURIComponent(expression)}`,response=await fetchWithDeadline(url,{headers:{Accept:'text/plain','User-Agent':`MID-weather-dashboard/${WORKER_VERSION} (+https://midwx.app/)`},cf:{cacheTtl:2678400,cacheEverything:true}},30000);if(!response.ok)throw travelWaterError(`NOAA OISST OPeNDAP HTTP ${response.status}`,502);const text=await response.text();if(!text.includes('sst.sst['))throw travelWaterError('NOAA OISST lieferte kein SST-Raster.',502);const rows=[];let inValues=false;for(const line of text.split(/\r?\n/)){if(line.startsWith('sst.sst[')){inValues=true;continue}if(inValues&&line.startsWith('sst.time['))break;if(!inValues)continue;const match=line.match(/^\[(\d+)\]\[(\d+)\],\s*(.+)$/);if(!match)continue;const timeIndex=timeRange.start+Number(match[1]),latIndex=latStart+Number(match[2]),values=match[3].split(',').map(value=>Number(value.trim()));for(let offset=0;offset<values.length;offset++){const value=values[offset];if(Number.isFinite(value)&&value>=-3&&value<=45)rows.push({timeIndex,latIndex,lonIndex:lonRange.start+offset,value})}}return rows}
async function travelWaterClimate(url){const lat=Number(url.searchParams.get('lat')),lon=Number(url.searchParams.get('lon')),start=String(url.searchParams.get('start')||''),end=String(url.searchParams.get('end')||'');if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw travelWaterError('Gültige lat/lon erforderlich.');const days=travelWaterPeriodDays(start,end),timeRanges=contiguousIndexRanges(days.flat()),spatial=oisstSpatialWindow(lat,lon),subsets=await Promise.all(timeRanges.flatMap(timeRange=>spatial.lonRanges.map(lonRange=>oisstSubset(timeRange,spatial.latStart,spatial.latEnd,lonRange)))),cells=new Map();for(const rows of subsets)for(const row of rows){const key=`${row.latIndex}:${row.lonIndex}`,cell=cells.get(key)??{latIndex:row.latIndex,lonIndex:row.lonIndex,values:new Map()};cell.values.set(row.timeIndex,row.value);cells.set(key,cell)}let nearest=null;for(const cell of cells.values()){const daily=days.map(indices=>{const values=indices.map(index=>cell.values.get(index)).filter(Number.isFinite);return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null});if(daily.some(value=>!Number.isFinite(value)))continue;const gridLatitude=oisstGridLatitude(cell.latIndex),gridLongitude=oisstGridLongitude(cell.lonIndex),gridDistanceKm=distance(lat,lon,gridLatitude,gridLongitude)/1000;if(gridDistanceKm>NOAA_OISST_MAX_DISTANCE_KM)continue;const temperature=daily.reduce((sum,value)=>sum+value,0)/daily.length;if(!nearest||gridDistanceKm<nearest.gridDistanceKm)nearest={temperature,gridDistanceKm,latitude:gridLatitude,longitude:gridLongitude}}const common={schema:NOAA_OISST_SCHEMA,referencePeriod:'1991–2020',source:'NOAA OISST v2.1 · tägliches Langzeitmittel',days:days.length,units:{temperature:'°C'},checkedAt:new Date().toISOString()};if(!nearest)return{...common,available:false,temperature:null,gridDistanceKm:null,grid:null,reason:'Kein vollständiges NOAA-Meeresgitter innerhalb von 80 km.'};return{...common,available:true,temperature:Number(nearest.temperature.toFixed(2)),gridDistanceKm:Number(nearest.gridDistanceKm.toFixed(1)),grid:{latitude:Number(nearest.latitude.toFixed(3)),longitude:Number(nearest.longitude.toFixed(3))}}
}

export default{async fetch(request,env){
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:CORS});
 const u=new URL(request.url),mode=u.searchParams.get('mode')||'';
 if(mode==='px250-file')return px250FileResponse(request);
 if(mode==='dwd-hymecng-file')return dwdHymecNgFileResponse(request);
 if(mode==='dwd-surface-analysis-image')return dwdSurfaceAnalysisImageResponse();
 if(mode==='dwd-precipitation-type-image')return dwdPrecipitationTypeImageResponse();
 if(mode==='dwd-hymecng-meta'){try{return json({...await dwdHymecNgMetadata(request),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=120, stale-while-revalidate=120'})}catch(error){return json({available:false,error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}}
 if(mode==='dwd-precipitation-type-meta'){try{return json({...await dwdPrecipitationTypeMeta(),version:WORKER_VERSION},200,{'cache-control':'public, max-age=240, stale-while-revalidate=180'})}catch(error){return json({error:error instanceof Error?error.message:String(error),version:WORKER_VERSION},502,{'cache-control':'no-store'})}}
 if(mode==='dwd-precipitation-type-info'){try{return json({...await dwdPrecipitationTypeInfo(request),version:WORKER_VERSION},200,{'cache-control':'public, max-age=120'})}catch(error){return json({error:error instanceof Error?error.message:String(error),version:WORKER_VERSION},502,{'cache-control':'no-store'})}}
 if(mode==='opera-raster-file')return operaRasterFileResponse(request);
 if(mode==='radolan-yw-file')return radolanYwFileResponse(request);
 if(mode==='rs-file')return dwdRsFileResponse(request);
 if(mode==='radolan-history-file')return radolanHistoryFileResponse(request);
 if(mode==='kostra-file')return kostraFileResponse(request);
 if(mode==='cfsv2-seasonal-point')return cfsv2SeasonalPoint(request);
 if(mode==='c3s-seasonal-point')return c3sSeasonalPoint(request,env);
 if(mode==='dwd-gcfs-episodes-point')return dwdGcfsEpisodesPoint(request,env);
 if(mode==='travel-water-climate'){try{return json({...await travelWaterClimate(u),version:WORKER_VERSION},200,{'cache-control':'public, max-age=2592000, stale-while-revalidate=2592000'})}catch(error){return json({schema:NOAA_OISST_SCHEMA,available:false,error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},Number(error?.midStatus)||502,{'cache-control':'no-store'})}}
 if(mode==='dach-extreme-outlook'){try{return json({...await dachExtremeOutlookData(),delivery:'worker',version:WORKER_VERSION},200,{'cache-control':'public, max-age=1800, stale-while-revalidate=21600'})}catch(error){return json({scope:'DACH',periods:[],cells:[],error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}}
 if(mode==='precipitation-phase-grid'){try{const u=new URL(request.url),lat=Number(u.searchParams.get('lat')),lon=Number(u.searchParams.get('lon')),target=String(u.searchParams.get('target')||'');if(!Number.isFinite(lat)||!Number.isFinite(lon))throw new Error('Ungültiger Standort für die Niederschlagsart.');return json({...await precipitationPhaseGridData(lat,lon,target),version:WORKER_VERSION},200,{'cache-control':'public, max-age=600, stale-while-revalidate=1800'})}catch(error){return json({error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}}
 if(mode==='weather-map-grid'){try{const u=new URL(request.url),lat=Number(u.searchParams.get('lat')),lon=Number(u.searchParams.get('lon')),model=String(u.searchParams.get('model')||'');if(!Number.isFinite(lat)||!Number.isFinite(lon))throw new Error('Ungültiger Rasterkarten-Standort.');return json({...await weatherMapGridData(lat,lon,model),version:WORKER_VERSION},200,{'cache-control':'public, max-age=600, stale-while-revalidate=900'})}catch(error){return json({frames:[],times:[],error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}}
 if(mode==='weather-map-wms')return weatherMapWmsResponse(request);
 if(mode==='composite-wms')return compositeWmsResponse(request);
 if(mode==='weather-map-metadata'){try{return json({...await weatherMapMetadata(request),version:WORKER_VERSION},200,{'cache-control':'public, max-age=300, stale-while-revalidate=900'})}catch(error){return json({times:[],referenceTimes:[],elevations:[],error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}}
 if(mode==='composite-diagnostics')return json(await compositeDiagnostics(),200,{'cache-control':'no-store'});
 if(mode==='site-context'){try{return json({...await localSurfaceContext(lat,lon,env),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=21600, stale-while-revalidate=86400'})}catch(error){return json({available:false,error:error instanceof Error?error.message:String(error),version:WORKER_VERSION},502,{'cache-control':'public, max-age=600'})}}
 if(mode==='ruc-health')return json({...await dwdRucR2Health(env),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'no-store'});
 if(mode==='health')return json({ok:true,version:WORKER_VERSION,services:['stations','country-aware-official-observations','dwd-cdc-10min','dwd-synop-poi','road-weather-adapter','regional-ensemble-adapters','ruc-storage-health','alerts','hyperlocal-networks','model-assisted-local-analysis','terrain-surface-context','copernicus-clms-lcm10','radar-nowcast','px250-proxy','opera-cirrus-raster','dwd-konrad3d-nowcast','radolan-yw-accumulations','dwd-rs-nowcast-anchors','radolan-rw-sf-history','dwd-rv-accumulations','kostra-dwd-2020','dwd-rain-station','rainviewer-metadata','best-location-lightning','dwd-nowcastmix-lightning','composite-product-times','model-contours','official-dwd-surface-analysis','dwd-precipitation-type-image','dwd-precipitation-type-meta','dwd-precipitation-type-info','objective-front-candidates','upstream-observation-corridor','front-timing-assimilation','pressure-level-meteogram','flight-route-hazard-briefing','official-aviation-hazards','wafs-sigwx','icao-location','geosphere-snow-depth','eea-air-quality-stations','open-meteo-core-forecast-proxy','met-norway-locationforecast-adapter','open-meteo-ensemble-proxy','open-meteo-model-meta','dwd-rapid-model-meta','adaptive-priority-forecast-fusion','dwd-mosmix-postprocessing','web-push-rules','push-kv-operations-audit','device-sync','device-sync-archive','connected-weather-stations','netatmo-oauth','ventilation-assistant','native-widget-feed','model-run-change-alerts','cors-safe-composite-wms','dwd-weather-map-wms','dach-extreme-outlook','travel-water-climate','weather-map-grid','precipitation-phase-grid','weather-map-metadata','composite-diagnostics','noaa-cfsv2-seasonal-point','c3s-cds-seasonal-point','dwd-gcfs2.2-episodes-point'],providers:{'C3S CDS seasonal adapter':seasonalAdapterConfigured(env,'MID_C3S_SEASONAL_POINT_ENDPOINT'),'DWD GCFS2.2 / EPISODES adapter':seasonalAdapterConfigured(env,'MID_DWD_GCFS_EPISODES_POINT_ENDPOINT'),'NOAA AviationWeather':true,'WAFS SIGWX / WIFS':Boolean(wifsKey(env)),'KNMI Aviation Open Data':Boolean(knmiAviationKey(env)),'DWD CDC 10-Minuten':true,'GIS surface-context adapter':Boolean(adapterEndpoint(env,'MID_SURFACE_CONTEXT_POINT_ENDPOINT')),'Copernicus CLMS / CDSE':clmsConfigured(env),'DWD ICON-D2-RUC point adapter':dwdRucR2Configured(env)||Boolean(adapterEndpoint(env,'MID_DWD_RUC_POINT_ENDPOINT')),'DWD ICON-D2-RUC-EPS point adapter':dwdRucR2Configured(env)||Boolean(adapterEndpoint(env,'MID_DWD_RUC_EPS_POINT_ENDPOINT')),'DWD SYNOP / OpenData POI':true,'DWD Open Data / Bright Sky fallback':true,'DWD Straßenwetter / GMA adapter':Boolean(adapterEndpoint(env,'MID_DWD_ROAD_WEATHER_POINT_ENDPOINT')),'GeoSphere Austria':true,'MeteoSwiss SwissMetNet adapter':Boolean(adapterEndpoint(env,'MID_METEOSWISS_OBSERVATION_POINT_ENDPOINT')),'KNMI 10-min observation adapter':Boolean(adapterEndpoint(env,'MID_KNMI_OBSERVATION_POINT_ENDPOINT')),'SMHI MetObs':true,'FMI Open Data':true,'US NWS / MADIS':true,'ECCC SWOB / GeoMet':true,'AEMET OpenData':Boolean(env?.MID_AEMET_API_KEY||env?.AEMET_API_KEY),'Météo-France observation adapter':Boolean(adapterEndpoint(env,'MID_METEOFRANCE_OBSERVATION_POINT_ENDPOINT')),'KNMI HARMONIE EPS point adapter':Boolean(adapterEndpoint(env,'MID_KNMI_HARMONIE_EPS_POINT_ENDPOINT')),'ECCC REPS point adapter':Boolean(adapterEndpoint(env,'MID_ECCC_REPS_POINT_ENDPOINT')),'MET Norway Locationforecast':true,'openSenseMap / senseBox':env?.ENABLE_OPENSENSEMAP!=='false','Weather Underground':Boolean(env?.WEATHER_COM_API_KEY||env?.WU_API_KEY),Netatmo:Boolean(env?.NETATMO_ACCESS_TOKEN),NetatmoPersonal:netatmoConfigured(env),'Synoptic Data':Boolean(env?.SYNOPTIC_TOKEN),Xweather:Boolean(env?.XWEATHER_CLIENT_ID&&env?.XWEATHER_CLIENT_SECRET),WebPush:pushConfigured(env),DeviceSync:deviceSyncConfigured(env)},timestamp:new Date().toISOString()});
 if(mode==='push-config')return json({enabled:pushConfigured(env),publicKey:pushConfigured(env)?String(env.VAPID_PUBLIC_KEY):'',requires:['MID_PUSH_SUBSCRIPTIONS','VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT','Cron */5 * * * *'],version:WORKER_VERSION},200,{'cache-control':'no-store'});
 if(mode==='push-subscribe'){if(request.method!=='POST')return json({error:'POST erforderlich',version:WORKER_VERSION},405,{'cache-control':'no-store'});return pushSubscribe(request,env)}
 if(mode==='push-status'){if(request.method!=='POST')return json({error:'POST erforderlich',version:WORKER_VERSION},405,{'cache-control':'no-store'});return pushStatus(request,env)}
 if(mode==='push-kv-operations-audit'){if(request.method!=='POST')return json({error:'POST erforderlich',version:WORKER_VERSION},405,{'cache-control':'no-store'});return pushKvOperationsAudit(request,env)}
 if(mode==='push-test'){if(request.method!=='POST')return json({error:'POST erforderlich',version:WORKER_VERSION},405,{'cache-control':'no-store'});return pushTest(request,env)}
 if(mode==='push-unsubscribe'){if(request.method!=='POST')return json({error:'POST erforderlich',version:WORKER_VERSION},405,{'cache-control':'no-store'});return pushUnsubscribe(request,env)}
 if(mode==='device-sync-push'){if(request.method!=='POST')return json({error:'POST erforderlich',version:WORKER_VERSION},405,{'cache-control':'no-store'});return deviceSyncPush(request,env)}
 if(mode==='device-sync-pull'){if(request.method!=='POST')return json({error:'POST erforderlich',version:WORKER_VERSION},405,{'cache-control':'no-store'});return deviceSyncPull(request,env)}
 if(mode==='device-sync-archive-chunk-push'){if(request.method!=='POST')return json({error:'POST erforderlich',version:WORKER_VERSION},405,{'cache-control':'no-store'});return deviceSyncArchiveChunkPush(request,env)}
 if(mode==='device-sync-archive-commit'){if(request.method!=='POST')return json({error:'POST erforderlich',version:WORKER_VERSION},405,{'cache-control':'no-store'});return deviceSyncArchiveCommit(request,env)}
 if(mode==='device-sync-archive-manifest'){if(request.method!=='POST')return json({error:'POST erforderlich',version:WORKER_VERSION},405,{'cache-control':'no-store'});return deviceSyncArchiveManifest(request,env)}
 if(mode==='device-sync-archive-chunk-pull'){if(request.method!=='POST')return json({error:'POST erforderlich',version:WORKER_VERSION},405,{'cache-control':'no-store'});return deviceSyncArchiveChunkPull(request,env)}
 if(mode==='netatmo-auth-start'){if(request.method!=='POST')return json({error:'POST erforderlich',version:WORKER_VERSION},405,{'cache-control':'no-store'});return netatmoAuthStart(request,env)}
 if(mode==='netatmo-auth-redirect'){if(request.method!=='GET')return json({error:'GET erforderlich',version:WORKER_VERSION},405,{'cache-control':'no-store'});return netatmoAuthRedirect(request,env)}
 if(mode==='netatmo-callback')return netatmoCallback(request,env)
 if(mode==='netatmo-status'){if(request.method!=='POST')return json({error:'POST erforderlich',version:WORKER_VERSION},405,{'cache-control':'no-store'});return netatmoStatus(request,env)}
 if(mode==='netatmo-observation'){if(request.method!=='POST')return json({error:'POST erforderlich',version:WORKER_VERSION},405,{'cache-control':'no-store'});return netatmoObservationResponse(request,env)}
 if(mode==='ventilation-advice'){if(request.method!=='POST')return json({error:'POST erforderlich',version:WORKER_VERSION},405,{'cache-control':'no-store'});return ventilationAdviceResponse(request,env)}
 if(mode==='netatmo-disconnect'){if(request.method!=='POST')return json({error:'POST erforderlich',version:WORKER_VERSION},405,{'cache-control':'no-store'});return netatmoDisconnect(request,env)}
 if(mode==='forecast-core')return openMeteoCoreForecast(u);
 if(mode==='forecast-fusion')return forecastFusionResponse(u,env);
 if(mode==='ensemble-capabilities')return json({ok:true,version:WORKER_VERSION,models:regionalEnsembleCapabilities(env)},200,{'cache-control':'no-store'});
 if(mode==='ensemble-proxy')return openMeteoEnsembleProxy(u,env);
 if(mode==='model-meta')return openMeteoModelMeta(u);
 if(mode==='rapid-model-meta')return dwdRapidModelMeta(u);
 if(mode==='native-widget-feed')return nativeWidgetFeed(u);
 if(mode==='icao-location'){try{return json({...await icaoLocation(u),version:WORKER_VERSION},200,{'cache-control':'public, max-age=2592000'})}catch(error){return json({error:error instanceof Error?error.message:String(error),version:WORKER_VERSION},404,{'cache-control':'public, max-age=3600'})}}
 if(mode==='aviation-hazards'){
  const lat=Number(u.searchParams.get('lat')),lon=Number(u.searchParams.get('lon')),startEpoch=Date.parse(String(u.searchParams.get('start')||'')),endEpoch=Date.parse(String(u.searchParams.get('end')||''));
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||!Number.isFinite(startEpoch)||!Number.isFinite(endEpoch)||endEpoch<startEpoch)return json({error:'lat/lon sowie gültiges start/end erforderlich',version:WORKER_VERSION},400,{'cache-control':'no-store'});
  try{return json({...await aviationHazardsResponse(lat,lon,startEpoch,endEpoch,env),version:WORKER_VERSION},200,{'cache-control':'public, max-age=300, stale-while-revalidate=600'})}
  catch(error){return json({signals:[],sources:[],error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='flight-cross-section'){if(!FLIGHT_CROSS_SECTION_ENABLED)return json({error:'Streckenbriefing ist deaktiviert.',status:'disabled',version:WORKER_VERSION,checkedAt:new Date().toISOString()},410,{'cache-control':'no-store'});try{return json({...await flightCrossSection(u,env),version:WORKER_VERSION},200,{'cache-control':'public, max-age=600, stale-while-revalidate=600'})}catch(error){return json({error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}}
 const lat=Number(u.searchParams.get('lat')),lon=Number(u.searchParams.get('lon'));if(!Number.isFinite(lat)||!Number.isFinite(lon))return json({error:'lat/lon required',version:WORKER_VERSION},400);
 if(mode==='synoptic-analysis'){
  try{return json({...await synopticAnalysis(request,lat,lon),version:WORKER_VERSION},200,{'cache-control':'public, max-age=900'})}
  catch(error){return json({error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,generatedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='radolan-history-meta'){
  try{return json({...await radolanHistoryMetadata(request,lat,lon),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=300'})}
  catch(error){return json({coverage:inGermanyBounds(lat,lon),provider:'DWD RADOLAN',hour:null,day:null,error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='radolan-yw-meta'){
  try{return json({...await radolanYwMetadata(request,lat,lon),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=120'})}
  catch(error){return json({coverage:inGermanyBounds(lat,lon),provider:'DWD RADOLAN',product:'YW',frames:[],error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='rs-meta'){
  try{return json({...await dwdRsMetadata(request,lat,lon),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=120, stale-while-revalidate=120'})}
  catch(error){return json({coverage:inGermanyBounds(lat,lon),provider:'DWD',product:'RS',frames:[],error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='rv-accumulation'){
  try{return json({...await dwdRvAccumulation(lat,lon),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=120'})}
  catch(error){return json({coverage:inGermanyBounds(lat,lon),provider:'DWD RV',forecast30:0,forecast60:0,forecast120:0,frames:[],error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='dwd-rain-station'){
  try{return json({...await dwdRainStation(lat,lon),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=300'})}
  catch(error){return json({available:false,provider:'DWD Open Data / Bright Sky',error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }

 if(mode==='geosphere-snow'){
  try{return json({...await geoSphereSnowMeasurement(lat,lon,number(u.searchParams.get('elevation'))),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=300'})}
  catch(error){return json({available:false,provider:'GeoSphere Austria / TAWES',error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }

 if(mode==='rainviewer-meta'){
  try{return json({...await rainViewerMetadata(),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=120'})}
  catch(error){return json({host:'',radar:{past:[],nowcast:[]},error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='model-contours'){
  try{return json({...await modelContours(lat,lon),version:WORKER_VERSION},200,{'cache-control':'public, max-age=1800'})}
  catch(error){return json({frames:[],error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='meteogram'){
  const refresh=u.searchParams.get('refresh')==='1';
  try{return json({...await meteogramData(lat,lon,String(u.searchParams.get('model')||'best_match'),Number(u.searchParams.get('elevation')),refresh),version:WORKER_VERSION},200,{'cache-control':refresh?'no-store':'public, max-age=900, stale-while-revalidate=2700'})}
  catch(error){return json({error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='px250-meta'){
  try{return json({...await px250Metadata(request,lat,lon),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=120'})}
  catch(error){return json({available:false,error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='opera-raster-meta'){
  try{return json({...await operaRasterMetadata(request),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=120'})}
  catch(error){return json({frames:[],error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='composite-times'){
  try{return json({...await compositeTimes(lat,lon),version:WORKER_VERSION},200,{'cache-control':'public, max-age=60'})}
  catch(error){return json({satelliteDay:[],satelliteIr:[],satellitePrecip:[],mtgLightning:[],dwdLightning:[],dwdRadar:[],dwdRadarLayer:'',serverTime:new Date().toISOString(),error:error instanceof Error?error.message:String(error),version:WORKER_VERSION},502,{'cache-control':'no-store'})}
 }
 if(mode==='lightning-points'){
  try{return json({...await bestLightningPoints(lat,lon,env),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=60'})}
  catch(error){return json({points:[],error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='air-quality-station'){
  try{return json({...await nearestEeaAirQualityStation(lat,lon),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=86400'})}
  catch(error){return json({available:false,error:error instanceof Error?error.message:String(error),provider:'European Environment Agency (EEA)',version:WORKER_VERSION},502,{'cache-control':'no-store'})}
 }
 if(mode==='nowcastmix-points'){
  try{return json({...await dwdLightningPoints(lat,lon),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=60'})}
  catch(error){return json({points:[],provider:'DWD NowCastMIX Accumulated Flash Geometry',error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='radar-nowcast'){
  try{const requestedStage=u.searchParams.get('stage')||'all',stage=['dwd','rainviewer'].includes(requestedStage)?requestedStage:'all',fast=u.searchParams.get('fast')==='1',result=await radarNowcastForPoint(lat,lon,u.searchParams.get('country')||'',stage,fast);return json({...result,version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=120'})}
  catch(error){return json({error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='thunderstorm-nowcast'){
  try{return json({...await dwdKonrad3dNowcast(lat,lon,u.searchParams.get('country')||''),version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=120'})}
  catch(error){return json({available:false,coverage:true,provider:'DWD KONRAD3D',nearbyCells:[],cellsFound:0,error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 if(mode==='alerts'){
  try{const result=await officialAlerts(lat,lon,u.searchParams.get('country')||'',u.searchParams.get('name')||'',u.searchParams.get('region')||'',u.searchParams.get('district')||'',u.searchParams.get('language')||'de');return json({...result,version:WORKER_VERSION,checkedAt:new Date().toISOString()},200,{'cache-control':'public, max-age=120, stale-while-revalidate=300'})}
  catch(error){return json({alerts:[],error:error instanceof Error?error.message:String(error),version:WORKER_VERSION,checkedAt:new Date().toISOString()},502,{'cache-control':'no-store'})}
 }
 const radiusKm=Math.min(250,Math.max(25,Number(u.searchParams.get('radius_km'))||140)),fastStations=u.searchParams.get('fast')==='1',openSenseEnabled=!fastStations&&env?.ENABLE_OPENSENSEMAP!=='false',requestedCountry=directCountryCode(u.searchParams.get('country')),country=requestedCountry||coordinateCountryFallback(lat,lon),dwdEnabled=country==='DE'||inGermanyBounds(lat,lon),dwdCdcPromise=dwdEnabled?dwdCdc10MinRows(lat,lon,radiusKm):Promise.resolve([]),dwdSynopPromise=dwdEnabled?dwdSynopRows(lat,lon,radiusKm):Promise.resolve([]),brightSkyFallbackPromise=dwdEnabled?(async()=>{const direct=await dwdSynopPromise.catch(()=>[]);return direct.length?[]:brightSkyRows(lat,lon,radiusKm)})():Promise.resolve([]),sources=[
  {name:'DWD CDC 10-Minuten',enabled:dwdEnabled,promise:dwdCdcPromise},
  {name:'DWD SYNOP / OpenData POI',enabled:dwdEnabled,promise:dwdSynopPromise},
  {name:'DWD Bright Sky Fallback',enabled:dwdEnabled,promise:brightSkyFallbackPromise},
  {name:'GeoSphere Austria',enabled:country==='AT'||geoSphereApplies(lat,lon),promise:country==='AT'||geoSphereApplies(lat,lon)?geoSphereRows(lat,lon,radiusKm):Promise.resolve([])},
  {name:'MeteoSwiss SwissMetNet',enabled:country==='CH'&&Boolean(adapterEndpoint(env,'MID_METEOSWISS_OBSERVATION_POINT_ENDPOINT')),promise:country==='CH'?officialPointAdapterRows(env,'MID_METEOSWISS_OBSERVATION_POINT_ENDPOINT','MeteoSwiss SwissMetNet',lat,lon,radiusKm,country):Promise.resolve([])},
  {name:'KNMI 10-min In-situ',enabled:country==='NL'&&Boolean(adapterEndpoint(env,'MID_KNMI_OBSERVATION_POINT_ENDPOINT')),promise:country==='NL'?officialPointAdapterRows(env,'MID_KNMI_OBSERVATION_POINT_ENDPOINT','KNMI 10-min In-situ',lat,lon,radiusKm,country):Promise.resolve([])},
  {name:'SMHI MetObs',enabled:country==='SE',promise:country==='SE'?smhiRows(lat,lon,radiusKm):Promise.resolve([])},
  {name:'FMI Open Data',enabled:country==='FI',promise:country==='FI'?fmiRows(lat,lon,radiusKm):Promise.resolve([])},
  {name:'US National Weather Service / MADIS',enabled:country==='US',promise:country==='US'?nwsRows(lat,lon,radiusKm):Promise.resolve([])},
  {name:'ECCC SWOB / GeoMet',enabled:country==='CA',promise:country==='CA'?ecccRows(lat,lon,radiusKm):Promise.resolve([])},
  {name:'AEMET OpenData',enabled:country==='ES'&&Boolean(env?.MID_AEMET_API_KEY||env?.AEMET_API_KEY),promise:country==='ES'?aemetRows(lat,lon,radiusKm,env):Promise.resolve([])},
  {name:'Météo-France observation adapter',enabled:country==='FR'&&Boolean(adapterEndpoint(env,'MID_METEOFRANCE_OBSERVATION_POINT_ENDPOINT')),promise:country==='FR'?officialPointAdapterRows(env,'MID_METEOFRANCE_OBSERVATION_POINT_ENDPOINT','Météo-France Open Data',lat,lon,radiusKm,country):Promise.resolve([])},
  {name:'DWD Straßenwetter / GMA',enabled:dwdEnabled&&Boolean(adapterEndpoint(env,'MID_DWD_ROAD_WEATHER_POINT_ENDPOINT')),promise:dwdEnabled?officialPointAdapterRows(env,'MID_DWD_ROAD_WEATHER_POINT_ENDPOINT','DWD Straßenwetter / GMA',lat,lon,Math.min(radiusKm,55),'DE','road-weather'):Promise.resolve([])},
  {name:'NOAA AviationWeather / METAR',enabled:true,promise:metarRows(lat,lon,radiusKm)},
  {name:'openSenseMap / senseBox',enabled:openSenseEnabled,promise:openSenseEnabled?openSenseMapRows(lat,lon,radiusKm):Promise.resolve([])},
  {name:'Weather Underground',enabled:!fastStations&&Boolean(env?.WEATHER_COM_API_KEY||env?.WU_API_KEY),promise:!fastStations?weatherUndergroundRows(lat,lon,radiusKm,env?.WEATHER_COM_API_KEY||env?.WU_API_KEY):Promise.resolve([])},
  {name:'Netatmo',enabled:!fastStations&&Boolean(env?.NETATMO_ACCESS_TOKEN),promise:!fastStations?netatmoRows(lat,lon,radiusKm,env?.NETATMO_ACCESS_TOKEN):Promise.resolve([])},
  {name:'Synoptic Data',enabled:!fastStations&&Boolean(env?.SYNOPTIC_TOKEN),promise:!fastStations?synopticRows(lat,lon,radiusKm,env?.SYNOPTIC_TOKEN):Promise.resolve([])},
  {name:'Xweather',enabled:!fastStations&&Boolean(env?.XWEATHER_CLIENT_ID&&env?.XWEATHER_CLIENT_SECRET),promise:!fastStations?xweatherRows(lat,lon,radiusKm,env?.XWEATHER_CLIENT_ID,env?.XWEATHER_CLIENT_SECRET):Promise.resolve([])}
 ],settled=await Promise.allSettled(sources.map(x=>x.promise)),rows=settled.flatMap(x=>x.status==='fulfilled'?x.value:[]).sort((a,b)=>(a.distance??999999)-(b.distance??999999)).slice(0,180),errors=settled.map((x,i)=>x.status==='rejected'?`${sources[i].name}: ${x.reason instanceof Error?x.reason.message:String(x.reason)}`:'').filter(Boolean),providers=Object.fromEntries(sources.map(x=>[x.name,x.enabled]));
 return json({data:rows,providers,diagnostics:{country:country||undefined,radiusKm,fast:fastStations,rows:rows.length,errors,sourceRows:Object.fromEntries(sources.map((x,i)=>[x.name,settled[i].status==='fulfilled'?settled[i].value.length:0]))},version:WORKER_VERSION},200,{'cache-control':'public, max-age=120, stale-while-revalidate=300'});
 },
 async scheduled(_controller,env,ctx){ctx.waitUntil(runPushSchedule(env))}
};
export {pushThunderState,thunderPushBody};
export {synopticUpstreamBearing};
