import {readFile} from 'node:fs/promises';
const [client,settings,engine,app,workerText,styles,policy]=await Promise.all([
 readFile(new URL('../src/connectedStation.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/ConnectedStationSettings.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../src/portableUserData.ts',import.meta.url),'utf8')
]);
const failures=[],need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
need(settings,'Mit Netatmo verbinden','Netatmo-OAuth-Einstieg fehlt.');
need(settings,'kein Zugriffstoken','Tokenfreie Nutzerführung fehlt.');
need(client,'validateConnectedStation','Plausibilitätsprüfung der eigenen Station fehlt.');
need(client,'Stationsmessung ist älter als 45 Minuten.','Messalter wird nicht geprüft.');
need(client,'Böe punktweise an Windniveau angeglichen','Wind-/Böen-Plausibilisierung fehlt.');
need(client,'CONNECTED_STATION_INTEGRATION_ENABLED=true','Vernetzte Stationen sind nicht aktiviert.');
need(app,'const effectiveStation=useMemo(()=>connectedObservation?.station?','Plausible private Außenstation wird nicht in Aktuelles Wetter übernommen.');
need(app,"window.addEventListener('mid:connected-station-settings'",'Stationsänderungen aktualisieren den aktiven Dashboardpfad nicht.');
need(engine,'PRIVATE_SENSOR_INTEGRATION_ENABLED=true','Private Sensorbeobachtungen sind nicht für die reaktivierte Stationsanbindung freigegeben.');
need(workerText,"scope','read_station'",'Netatmo OAuth fordert nicht das Leserecht read_station an.');
need(workerText,"mode==='netatmo-observation'",'Netatmo-Abrufroute fehlt.');
need(workerText,'stationEncrypt(env,token)','Netatmo-Tokens werden nicht verschlüsselt gespeichert.');
need(styles,'.connected-station-settings','Styling für Stationsanbindung fehlt.');
need(policy,"'mid:connected-station:'",'Lokale Stationszugänge werden nicht von der Gerätesynchronisation ausgeschlossen.');
if(failures.length){console.error('Vernetzte-Wetterstation-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}

class MemoryKv{constructor(){this.map=new Map()}async put(key,value){this.map.set(key,value)}async get(key,options){const value=this.map.get(key);if(value===undefined)return null;return options?.type==='json'?JSON.parse(value):value}async delete(key){this.map.delete(key)}async list(){return{keys:[],list_complete:true}}}
const originalFetch=globalThis.fetch,kv=new MemoryKv(),env={MID_PUSH_SUBSCRIPTIONS:kv,NETATMO_CLIENT_ID:'client-id',NETATMO_CLIENT_SECRET:'client-secret',MID_STATION_TOKEN_KEY:'a-very-long-random-worker-secret',MID_ALLOWED_ORIGIN:'https://app.test'},connectionId='abcdefghijklmnopqrstuvwx12345678';
try{
 const worker=(await import('../worker/metar-proxy.js?netatmo-test='+Date.now())).default;
 let response=await worker.fetch(new Request('https://worker.test/?mode=netatmo-auth-start',{method:'POST',headers:{Origin:'https://app.test','Content-Type':'application/json'},body:JSON.stringify({connectionId,returnUrl:'https://app.test/MID/'})}),env),start=await response.json();
 if(!response.ok||!start.authorizeUrl)throw new Error('OAuth-Start fehlgeschlagen.');
 const authUrl=new URL(start.authorizeUrl),state=authUrl.searchParams.get('state');if(authUrl.searchParams.get('scope')!=='read_station'||authUrl.searchParams.get('response_type')!=='code'||!state)throw new Error('OAuth-URL ist unvollständig.');
 globalThis.fetch=async(input,init={})=>{const url=String(input);if(url.includes('/oauth2/token'))return new Response(JSON.stringify({access_token:'secret-access-token',refresh_token:'secret-refresh-token',expires_in:10800}),{status:200,headers:{'content-type':'application/json'}});if(url.includes('/api/getstationsdata'))return new Response(JSON.stringify({body:{devices:[{_id:'device-1',station_name:'Gartenstation',place:{location:[7.04,50.81],altitude:58},dashboard_data:{Pressure:1017.2,time_utc:Math.floor(Date.now()/1000)},modules:[{_id:'outdoor-1',type:'NAModule1',module_name:'Außen',dashboard_data:{Temperature:23.4,Humidity:61,time_utc:Math.floor(Date.now()/1000)}},{_id:'wind-1',type:'NAModule2',module_name:'Wind',dashboard_data:{WindStrength:18,GustStrength:32,WindAngle:245,time_utc:Math.floor(Date.now()/1000)}},{_id:'rain-1',type:'NAModule3',module_name:'Regen',dashboard_data:{Rain:.6,time_utc:Math.floor(Date.now()/1000)}}]}]}}),{status:200,headers:{'content-type':'application/json'}});throw new Error('Unerwarteter Abruf '+url)};
 response=await worker.fetch(new Request(`https://worker.test/?mode=netatmo-callback&state=${encodeURIComponent(state)}&code=code-1`),env);if(response.status!==302)throw new Error('OAuth-Callback leitete nicht zurück.');
 const stored=[...kv.map.values()].find(value=>String(value).includes('mid-netatmo-token'));if(!stored||String(stored).includes('secret-access-token'))throw new Error('Token wurde nicht verschlüsselt gespeichert.');
 response=await worker.fetch(new Request('https://worker.test/?mode=netatmo-observation',{method:'POST',headers:{Origin:'https://app.test','Content-Type':'application/json'},body:JSON.stringify({connectionId,deviceId:'device-1',moduleId:'outdoor-1'})}),env);const observation=await response.json();const normalizedWind=Number(observation.observation?.windSpeed);if(!response.ok||observation.observation?.temperature!==23.4||!Number.isFinite(normalizedWind)||Math.abs(normalizedWind-9.719)>.02)throw new Error('Netatmo-Messwertnormalisierung fehlgeschlagen.');
 console.log('Netatmo-OAuth, verschlüsselte Tokenablage und reaktivierte Außenstationsübernahme sind geprüft.');
}catch(error){console.error('Funktionale Netatmo-Prüfung fehlgeschlagen:',error);process.exit(1)}finally{globalThis.fetch=originalFetch}
