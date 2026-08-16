class MemoryKv{constructor(){this.map=new Map()}async put(key,value){this.map.set(key,value)}async get(key,options){const value=this.map.get(key);if(value===undefined)return null;return options?.type==='json'?JSON.parse(value):value}async delete(key){this.map.delete(key)}async list(){return{keys:[],list_complete:true}}}
const kv=new MemoryKv(),env={MID_PUSH_SUBSCRIPTIONS:kv,NETATMO_CLIENT_ID:'client-id',NETATMO_CLIENT_SECRET:'client-secret',MID_STATION_TOKEN_KEY:'station-secret-1234567890',MID_ALLOWED_ORIGIN:'https://app.test'},connectionId='abcdefghijklmnopqrstuvwx12345678';
const worker=(await import('../worker/metar-proxy.js?netatmo-direct='+Date.now())).default;
let response=await worker.fetch(new Request(`https://worker.test/?mode=netatmo-auth-redirect&connectionId=${connectionId}&returnUrl=${encodeURIComponent('https://app.test/MID/')}`),env);
if(response.status!==302)throw new Error(`Direkter OAuth-Redirect liefert ${response.status} statt 302.`);
if(!/no-store/i.test(response.headers.get('cache-control')||''))throw new Error('Direkter OAuth-Redirect ist nicht gegen Browser-/Edge-Caching geschützt.');
const location=response.headers.get('location')||'',authorize=new URL(location);
if(authorize.origin!=='https://api.netatmo.com'||authorize.pathname!=='/oauth2/authorize')throw new Error('Direkter OAuth-Redirect zeigt nicht auf Netatmo.');
if(authorize.searchParams.get('client_id')!=='client-id'||authorize.searchParams.get('response_type')!=='code'||authorize.searchParams.get('scope')!=='read_station')throw new Error('Direkte Netatmo-Autorisierungsadresse ist unvollständig.');
if(authorize.searchParams.get('redirect_uri')!=='https://worker.test/?mode=netatmo-callback')throw new Error('Callback-URI des direkten OAuth-Redirects ist falsch.');
const state=authorize.searchParams.get('state');if(!state)throw new Error('OAuth-State fehlt.');
response=await worker.fetch(new Request(`https://worker.test/?mode=netatmo-callback&state=${encodeURIComponent(state)}&error=invalid_request&error_description=${encodeURIComponent('redirect uri mismatch')}`),env);
if(response.status!==200)throw new Error('Fehler-Callback zeigt keine stabile Rücksprungseite.');
if(!/no-store/i.test(response.headers.get('cache-control')||''))throw new Error('OAuth-Callback-Seite ist nicht gegen Caching geschützt.');
const callbackHtml=await response.text();if(!callbackHtml.includes('Netatmo-Verbindung nicht abgeschlossen')||!callbackHtml.includes('redirect uri mismatch')||!callbackHtml.includes('mid_station=netatmo-error'))throw new Error('OAuth-Fehlerdetails gehen auf der Rücksprungseite verloren.');
response=await worker.fetch(new Request('https://worker.test/?mode=netatmo-status',{method:'POST',headers:{Origin:'https://app.test','Content-Type':'application/json'},body:JSON.stringify({connectionId})}),env);const status=await response.json();if(status.oauthResult?.result!=='error'||status.oauthResult?.stage!=='authorize'||status.oauthResult?.detail!=='redirect uri mismatch')throw new Error('Serverseitiger OAuth-Fehlerstatus fehlt.');
console.log('Netatmo Direkt-Redirect und sichtbare OAuth-Fehlerdiagnose geprüft.');
