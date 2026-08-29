import {readFile} from 'node:fs/promises';
const [client,stationSettings,ventilation,ventSettings,panel,app,modules,push,worker,styles]=await Promise.all([
 readFile(new URL('../src/connectedStation.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/ConnectedStationSettings.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ventilationAssistant.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/VentilationAssistantSettings.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/VentilationAssistantPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/dashboardModules.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/pushNotifications.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[],need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
need(client,'CONNECTED_STATION_INTEGRATION_ENABLED=true','Stationsanbindung ist nicht reaktiviert.');
need(stationSettings,'Mit Netatmo verbinden','Netatmo OAuth ohne manuelle Token-Eingabe fehlt.');
need(stationSettings,'kein Zugriffstoken','Tokenfreie Nutzerführung ist nicht erklärt.');
need(worker,"authorize.searchParams.set('scope','read_station')",'Netatmo read_station OAuth-Scope fehlt.');
need(worker,'stationEncrypt(env,token)','Netatmo-Zugangsdaten werden nicht Worker-seitig verschlüsselt.');
need(worker,'function netatmoEnvironment','Interne Netatmo-Raumsensoren werden nicht aufbereitet.');
need(worker,'function ventilationAbsoluteHumidity','Absolute Feuchte fehlt in der Lüftungslogik.');
need(worker,'precipitation_probability','Niederschlagsrisiko fehlt in der Lüftungsprognose.');
need(worker,'weather_code','Gewitter-/Wettercode fehlt in der Lüftungsprognose.');
need(worker,'gustKn*1.852','Böen aus der kanonischen MID-Prognose werden nicht korrekt von kt nach km/h umgerechnet.');
need(worker,'forecastFusionResponse(url,env)','Lüftungsprognose umgeht den kanonischen MID-Fusionspfad.');
if(/async function ventilationForecast\([^)]*\)\{const url=new URL\(OPEN_METEO_FORECAST\)/.test(worker))failures.push('Lüftungsassistent enthält weiterhin einen rohen Open-Meteo-Schattenpfad.');
need(worker,"mode==='ventilation-advice'",'Ventilation-Advice Workerroute fehlt.');
need(ventSettings,'type="time"','Raumspezifische erlaubte Lüftungszeiten fehlen.');
need(ventSettings,'frühestens','Früheste Lüftungszeit fehlt.');
need(ventSettings,'spätestens','Späteste Lüftungszeit fehlt.');
need(ventSettings,'Keine automatische Fenster-, Lüfter- oder Anlagensteuerung.','Stufe-1-Grenze ohne Aktorsteuerung fehlt.');
need(push,'ventilationPushConfig','Lüftungsregeln werden nicht in den bestehenden Pushdienst synchronisiert.');
need(worker,'mid-ventilation-','Worker-Push für neue Lüftungsfenster fehlt.');
need(modules,"'ventilation'",'Dashboardmodul Lüftungsassistent fehlt.');
need(app,'<VentilationAssistantPanel/>','Lüftungsassistent wird im Dashboard nicht gerendert.');
need(panel,'Empfehlung, keine automatische Fenstersteuerung','Dashboard kennzeichnet die rein beratende Stufe 1 nicht.');
need(styles,'.ventilation-assistant-panel','Styling für Lüftungsassistent fehlt.');
if(/call_service|fan\.turn_on|cover\.open_cover/.test(ventilation+panel+ventSettings))failures.push('Stufe 1 enthält unerwartete Aktor-/Service-Steuerung.');
if(failures.length){console.error('Lüftungsassistent-Regressionsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Netatmo-OAuth, interne Raumsensoren, wetterprognosegestützter Lüftungsassistent und reine Stufe-1-Pushberatung sind geprüft.');

class MemoryKv{constructor(){this.map=new Map()}async put(key,value){this.map.set(key,value)}async get(key,options){const value=this.map.get(key);if(value===undefined)return null;return options?.type==='json'?JSON.parse(value):value}async delete(key){this.map.delete(key)}async list(){return{keys:[],list_complete:true}}}
const originalFetch=globalThis.fetch,kv=new MemoryKv(),env={MID_PUSH_SUBSCRIPTIONS:kv,NETATMO_CLIENT_ID:'client-id',NETATMO_CLIENT_SECRET:'client-secret',MID_STATION_TOKEN_KEY:'worker-secret-for-test',MID_ALLOWED_ORIGIN:'https://app.test',VAPID_PUBLIC_KEY:'test-public',VAPID_PRIVATE_KEY:'test-private',VAPID_SUBJECT:'mailto:test@example.invalid'},connectionId='ventilationabcdefghijklmnopqrstuvwx';
try{
 const workerModule=await import('../worker/metar-proxy.js?ventilation-test='+Date.now()),workerRuntime=workerModule.default;
 let response=await workerRuntime.fetch(new Request('https://worker.test/?mode=netatmo-auth-start',{method:'POST',headers:{Origin:'https://app.test','Content-Type':'application/json'},body:JSON.stringify({connectionId,returnUrl:'https://app.test/MID/'})}),env),start=await response.json(),state=new URL(start.authorizeUrl).searchParams.get('state');
 const nowSec=Math.floor(Date.now()/1000),hour0=new Date();hour0.setUTCMinutes(0,0,0);const times=Array.from({length:30},(_,i)=>new Date(hour0.getTime()+i*3600000).toISOString().slice(0,16));
 globalThis.fetch=async(input)=>{const url=new URL(input instanceof Request?input.url:String(input));if(url.origin==='https://api.netatmo.com'&&url.pathname==='/oauth2/token')return new Response(JSON.stringify({access_token:'access',refresh_token:'refresh',expires_in:10800}),{status:200,headers:{'content-type':'application/json'}});if(url.origin==='https://api.netatmo.com'&&url.pathname==='/api/getstationsdata')return new Response(JSON.stringify({body:{devices:[{_id:'device-room',station_name:'Haus',place:{location:[7.05,50.81],altitude:55},dashboard_data:{Temperature:25.0,Humidity:65,CO2:1250,Pressure:1015,time_utc:nowSec},modules:[{_id:'outdoor-1',type:'NAModule1',module_name:'Garten',dashboard_data:{Temperature:18.0,Humidity:70,time_utc:nowSec}}]}]}}),{status:200,headers:{'content-type':'application/json'}});if(url.protocol==='https:'&&url.hostname==='api.open-meteo.com'){const modelIds=String(url.searchParams.get('models')||'best_match').split(',').filter(Boolean),dates=[times[0].slice(0,10),new Date(hour0.getTime()+86400000).toISOString().slice(0,10)];const payload=()=>({timezone:'GMT',utc_offset_seconds:0,hourly:{time:times,temperature_2m:times.map(()=>18),dew_point_2m:times.map(()=>12),pressure_msl:times.map(()=>1016),wind_speed_10m:times.map(()=>6),wind_gusts_10m:times.map(()=>12),wind_direction_10m:times.map(()=>240),relative_humidity_2m:times.map(()=>70),precipitation_probability:times.map(()=>5),precipitation:times.map(()=>0),rain:times.map(()=>0),showers:times.map(()=>0),snowfall:times.map(()=>0),weather_code:times.map(()=>1),cloud_cover:times.map(()=>35),cloud_cover_low:times.map(()=>10),cape:times.map(()=>0),lifted_index:times.map(()=>2),convective_inhibition:times.map(()=>50),sunshine_duration:times.map(()=>1800),is_day:times.map(()=>1)},daily:{time:dates,temperature_2m_max:dates.map(()=>22),temperature_2m_min:dates.map(()=>12),precipitation_sum:dates.map(()=>0),rain_sum:dates.map(()=>0),showers_sum:dates.map(()=>0),snowfall_sum:dates.map(()=>0),precipitation_hours:dates.map(()=>0),precipitation_probability_max:dates.map(()=>5),weather_code:dates.map(()=>1),wind_speed_10m_max:dates.map(()=>8),wind_gusts_10m_max:dates.map(()=>14),wind_direction_10m_dominant:dates.map(()=>240),sunshine_duration:dates.map(()=>28800)}});return new Response(JSON.stringify(modelIds.length>1?modelIds.map(()=>payload()):payload()),{status:200,headers:{'content-type':'application/json'}})}if(url.hostname==='api.brightsky.dev'||url.hostname==='midwx.app')return new Response('{}',{status:404,headers:{'content-type':'application/json'}});throw new Error('Unerwarteter Abruf '+url.origin+url.pathname)};
 response=await workerRuntime.fetch(new Request(`https://worker.test/?mode=netatmo-callback&state=${encodeURIComponent(state)}&code=ok`),env);if(response.status!==200)throw new Error('Netatmo Test-OAuth fehlgeschlagen.');await response.text();
 response=await workerRuntime.fetch(new Request('https://worker.test/?mode=ventilation-advice',{method:'POST',headers:{Origin:'https://app.test','Content-Type':'application/json'},body:JSON.stringify({connectionId,deviceId:'device-room',roomRules:[{roomId:'device-room',enabled:true,earliest:'00:00',latest:'23:59',minMinutes:15,maxMinutes:30}]})}),env);const advice=await response.json(),room=advice.rooms?.[0];if(!response.ok||!room||!['open','later'].includes(room.status)||!room.reasons?.some(item=>String(item).includes('CO₂'))||!(room.indoorAbsoluteHumidity>0))throw new Error('Funktionale Lüftungsempfehlung mit CO₂/absoluter Feuchte fehlgeschlagen.');
 response=await workerRuntime.fetch(new Request('https://worker.test/?mode=push-subscribe',{method:'POST',headers:{Origin:'https://app.test','Content-Type':'application/json'},body:JSON.stringify({subscription:{endpoint:'https://push.test/sub',keys:{p256dh:'abc',auth:'def'}},favorites:[],notificationIntervalMinutes:30,ventilation:{enabled:true,connectionId,deviceId:'device-room',roomRules:[{roomId:'device-room',enabled:true,earliest:'22:00',latest:'06:00',minMinutes:15,maxMinutes:30}]},appUrl:'https://app.test/MID/'})}),env);const pushReply=await response.json(),saved=[...kv.map.values()].map(value=>{try{return JSON.parse(value)}catch{return null}}).find(value=>value?.subscription?.endpoint==='https://push.test/sub');if(!response.ok||pushReply.ventilationRooms!==1||saved?.ventilation?.roomRules?.[0]?.earliest!=='22:00')throw new Error('Lüftungsregeln werden nicht funktional im Push-Abonnement gespeichert.');
 console.log('Funktionaler Worker-Test: Netatmo-Innenraum + sichere 24-h-Lüftungsprognose und Lüftungs-Pushkonfiguration sind wirksam.');
}catch(error){console.error('Funktionale Lüftungsprüfung fehlgeschlagen:',error);process.exit(1)}finally{globalThis.fetch=originalFetch}
