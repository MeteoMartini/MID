// Deterministic fetch/storage adapter shared by Mountain browser regressions.
export function browserPrelude(favorite,location,mountain,diagnosticMode){
 return `(()=>{
   const favorite=${JSON.stringify(favorite)},fixtureLocation=${JSON.stringify(location)},mountain=${JSON.stringify(mountain)},diagnosticMode=${JSON.stringify(diagnosticMode)};
  const favs=JSON.stringify([favorite]),hourMs=3600000,now=Date.now(),start=Math.floor(now/hourMs)*hourMs-24*hourMs;
  const berlinParts=epoch=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Vienna',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(epoch)).map(part=>[part.type,part.value]));
  const localIso=epoch=>{const p=berlinParts(epoch);return p.year+'-'+p.month+'-'+p.day+'T'+p.hour+':'+p.minute};
   const currentLocalHour=Number(localIso(now).slice(11,13));
   const times=Array.from({length:193},(_,index)=>localIso(start+index*hourMs));
  const todayKey=localIso(now).slice(0,10),dayKeys=[...new Set(times.map(value=>value.slice(0,10)))].filter(date=>date>=todayKey).slice(0,8);
  const levels=[
   {latitude:mountain.valleyLatitude,longitude:mountain.valleyLongitude,elevation:mountain.valleyElevation,role:0,temp:-2,wind:27,gust:40,name:mountain.valleyName},
   {latitude:mountain.middleLatitude,longitude:mountain.middleLongitude,elevation:mountain.middleElevation,role:1,temp:-7,wind:42,gust:59,name:mountain.middleName},
   {latitude:mountain.summitLatitude,longitude:mountain.summitLongitude,elevation:mountain.summitElevation,role:2,temp:-12,wind:52,gust:90,name:mountain.summitName}
  ];
   window.__mountainFixtureExpectedPrecipitation={times,byRole:levels.map(point=>({role:point.role,values:times.map(time=>{const localHour=Number(time.slice(11,13)),hoursFromNow=(localHour-currentLocalHour+24)%24,wet=hoursFromNow<=3||(localHour>=8&&localHour<=13);return point.role===1?null:wet?(point.role===0?1.2:2.3):0})}))};
  const makePoint=(point,index)=>{
   const hourly={time:times};
   const keys=['temperature_2m','apparent_temperature','relative_humidity_2m','dew_point_2m','precipitation_probability','precipitation','rain','showers','snowfall','snow_depth','weather_code','cloud_cover','cloud_cover_low','visibility','freezing_level_height','wet_bulb_temperature_2m','wind_speed_10m','wind_gusts_10m','wind_direction_10m','uv_index','cape','is_day','sunshine_duration','lifted_index','convective_inhibition','total_column_integrated_water_vapour','temperature_850hPa'];
   for(const pressure of [1000,950,925,900,850,800,700,600])keys.push('cloud_cover_'+pressure+'hPa','geopotential_height_'+pressure+'hPa');
   for(const key of keys)hourly[key]=times.map((time,i)=>{
    const localHour=Number(time.slice(11,13)),isDay=localHour>=7&&localHour<19?1:0,hoursFromNow=(localHour-currentLocalHour+24)%24,wet=hoursFromNow<=3||(localHour>=8&&localHour<=13);
    const snow=wet&&point.role>0?.65:0,precip=wet?(point.role===0?1.2:2.3):0;
    const values={
     temperature_2m:point.temp+Math.sin(i/8)*2,apparent_temperature:point.temp-5,
     relative_humidity_2m:wet?94:70,dew_point_2m:point.temp-3,
     precipitation_probability:wet?91:18,precipitation:precip,rain:point.role===0?precip:0,showers:0,snowfall:snow,
     snow_depth:point.role===0?.12:point.role===1?.34:.58,
     weather_code:wet?(point.role===0?61:71):(isDay?1:3),cloud_cover:wet?92:48,cloud_cover_low:wet?82:32,
     visibility:wet?4200:14000,freezing_level_height:point.role===0?1550:1050,wet_bulb_temperature_2m:point.temp-2,
     wind_speed_10m:point.wind,wind_gusts_10m:point.gust,wind_direction_10m:292,uv_index:isDay?2.4:0,cape:wet?110:20,
     is_day:isDay,sunshine_duration:isDay?1800:0,lifted_index:i%17===0?null:-1.4,
     convective_inhibition:i%19===0?null:14,total_column_integrated_water_vapour:wet?17:10,
     temperature_850hPa:-5+Math.sin(i/24),cloud_cover_1000hPa:wet?92:48,cloud_cover_950hPa:wet?84:42,
     cloud_cover_925hPa:wet?76:38,cloud_cover_900hPa:wet?70:34,cloud_cover_850hPa:wet?64:29,
     cloud_cover_800hPa:wet?58:26,cloud_cover_700hPa:wet?45:20,cloud_cover_600hPa:wet?35:15,
     geopotential_height_1000hPa:110,geopotential_height_950hPa:540,geopotential_height_925hPa:760,
     geopotential_height_900hPa:980,geopotential_height_850hPa:1500,geopotential_height_800hPa:1950,
     geopotential_height_700hPa:3050,geopotential_height_600hPa:4200
    };
     if(point.role===1&&key==='precipitation')return null;
     return values[key];
   });
   const localHour=Number(localIso(now).slice(11,13)),isDay=localHour>=7&&localHour<19?1:0;
   const current={time:new Date(now).toISOString(),temperature_2m:point.temp,apparent_temperature:point.temp-5,relative_humidity_2m:82,dew_point_2m:point.temp-3,precipitation:1.4,rain:point.role===0?1.4:0,showers:0,snowfall:point.role===0?0:.6,snow_depth:point.role===0?.12:point.role===1?.34:.58,weather_code:point.role===0?61:71,cloud_cover:82,cloud_cover_low:72,visibility:5200,freezing_level_height:1200,wet_bulb_temperature_2m:point.temp-2,wind_speed_10m:point.wind,wind_gusts_10m:point.gust,wind_direction_10m:292,uv_index:isDay?2.4:0,cape:90,is_day:isDay,temperature_850hPa:-5,geopotential_height_850hPa:1500};
   const daily={time:dayKeys,temperature_2m_max:dayKeys.map((_,d)=>point.temp+3+d%2),temperature_2m_min:dayKeys.map((_,d)=>point.temp-4-d%2),precipitation_sum:dayKeys.map(()=>point.role===1?null:14),precipitation_probability_max:dayKeys.map(()=>91),rain_sum:dayKeys.map(()=>point.role===0?14:0),showers_sum:dayKeys.map(()=>0),snowfall_sum:dayKeys.map(()=>point.role===0?0:4.2),precipitation_hours:dayKeys.map(()=>6),weather_code:dayKeys.map(()=>point.role===0?61:71),wind_speed_10m_max:dayKeys.map(()=>point.wind),wind_gusts_10m_max:dayKeys.map(()=>point.gust),wind_direction_10m_dominant:dayKeys.map(()=>292),uv_index_max:dayKeys.map(()=>3.2),sunshine_duration:dayKeys.map(()=>point.role===0?18000:10800),sunrise:dayKeys.map(date=>date+'T06:20'),sunset:dayKeys.map(date=>date+'T18:35')};
   return{latitude:point.latitude,longitude:point.longitude,elevation:point.elevation,timezone:'Europe/Vienna',timezone_abbreviation:'CEST',utc_offset_seconds:7200,current,hourly,daily};
  };
  const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
  window.__mountainFixtureRequests=[];
  const originalFetch=window.fetch.bind(window);
  window.fetch=async(input,init)=>{
   const raw=typeof input==='string'?input:input?.url||String(input),url=new URL(raw,window.location.href);
   window.__mountainFixtureRequests.push(url.href);
   if(url.hostname==='api.open-meteo.com'&&url.pathname==='/v1/forecast'){
     const diagnosticVariables=(url.searchParams.get('hourly')||'').split(','),diagnosticRequest=diagnosticVariables.includes('lifted_index')&&diagnosticVariables.includes('cloud_cover_1000hPa');
     if(diagnosticRequest&&diagnosticMode==='delayed')await new Promise(resolve=>setTimeout(resolve,6000));
     if(diagnosticRequest&&diagnosticMode==='failure')return json({reason:'Deterministischer Diagnostikfehler'},503);
    const latitudes=(url.searchParams.get('latitude')||'47.2692').split(','),longitudes=(url.searchParams.get('longitude')||'11.4041').split(','),elevations=(url.searchParams.get('elevation')||'574').split(',');
     const requested=latitudes.map((latitude,index)=>{
      const elevation=Number(elevations[index]||elevations[0]),role=levels.reduce((best,point)=>Math.abs(point.elevation-elevation)<Math.abs(levels[best].elevation-elevation)?point.role:best,0);
      return makePoint({latitude:Number(latitude),longitude:Number(longitudes[index]||longitudes[0]),elevation,role,temp:[-2,-7,-12][role],wind:[27,42,52][role],gust:[40,59,90][role]},index);
     });
    return json(requested.length===1?requested[0]:requested);
   }
   if(url.hostname==='api.open-meteo.com'&&url.pathname==='/v1/elevation')return json({elevation:[1100,2200,3300]});
   if(url.hostname==='ensemble-api.open-meteo.com'){
    const count=Math.max(25,Math.min(361,Number(url.searchParams.get('forecast_days')||7)*24+1));
    const ensembleTimes=Array.from({length:count},(_,i)=>localIso(Math.floor(now/hourMs)*hourMs+i*hourMs)),hourly={time:ensembleTimes};
    for(const key of (url.searchParams.get('hourly')||'').split(','))if(key&&key!=='time')hourly[key]=ensembleTimes.map((_,i)=>key.includes('spread')?180:key.includes('temperature_850hPa')?-5+Math.sin(i/24):key.includes('geopotential_height_850hPa')?1500:key.includes('snowfall_height')?1200:key.includes('freezing_level_height')?1450:null);
    return json({timezone:'Europe/Vienna',utc_offset_seconds:7200,hourly});
   }
   if(url.searchParams.get('mode')==='geosphere-snow')return json({available:true,valueCm:136,stationName:'Hochgebirgs-Schneemessstation Kitzbüheler Alpen · Teststation mit langem Namen',stationId:'MID-VISUAL-01',stationElevation:pointElevation(url.searchParams.get('elevation')),distanceKm:4.2,heightDifferenceM:28,observedAt:new Date().toISOString(),provider:'GeoSphere Austria'});
   if(url.hostname.endsWith('.invalid'))return json({available:false,error:'Deterministischer Testadapter'});
   if(url.hostname.startsWith('overpass.'))return json({elements:[]});
   return originalFetch(input,init);
  };
  function pointElevation(value){const number=Number(value);return Number.isFinite(number)?number:2200}
  localStorage.setItem('theme','light');
  localStorage.setItem('windUnit','kn');
  localStorage.setItem('mid:favorites',favs);
  localStorage.setItem('mid:favorites:shadow:v1',favs);
  localStorage.setItem('mid:favorites:updated-at',new Date().toISOString());
  localStorage.setItem('mid:favorites:order:v1',JSON.stringify({ids:[favorite.id],updatedAt:new Date().toISOString()}));
  localStorage.setItem('mid:mountain:47.26920:11.40410',JSON.stringify(mountain));
  localStorage.setItem('mid:lastLocation',JSON.stringify(fixtureLocation));
  localStorage.setItem('mid:last-dashboard-section:v1','mountain');
  localStorage.setItem('mid:module-open-contract:v6','1');
  localStorage.setItem('mid:module:mountain','1');
  localStorage.setItem('mid:layoutMode','advanced');
  localStorage.setItem('metarProxyUrl','https://mountain-fixture.invalid/worker');
 })();`;
}
