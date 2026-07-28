import {readFile} from 'node:fs/promises';
const [app,modelChanges,ensemble,weather,deviceSync,deviceSettings,main,verification,verificationPanel,worker,routePanel,routeLogic]=await Promise.all([
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/modelRunChanges.ts',import.meta.url),'utf8'),
  readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
  readFile(new URL('../src/deviceSync.ts',import.meta.url),'utf8'),
  readFile(new URL('../src/DeviceSyncSettings.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
  readFile(new URL('../src/ForecastVerificationPanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
  readFile(new URL('../src/RouteWeatherPanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/routeWeather.ts',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} darf nicht mehr aktiv sein: ${token}`)};

for(const token of ['models:string[]','modelsForMetric(','current.days.slice(0,3)','snapshotDays=data.filter(row=>best.has(row.date)).slice(0,3)'])need('3-Tage-Modelländerungsradar',modelChanges,token);
need('Modellangabe je Änderung',ensemble,"Modell: {item.models.join(' · ')}");
need('3-Tage-Einstellung',app,'Änderungsradar für die nächsten drei Tage anzeigen');
need('Worker-3-Tage-Push',worker,"url.searchParams.set('forecast_days','3')");
need('Worker-3-Tage-Zeilen',worker,'times.slice(0,3)');

for(const token of ["crypto.subtle.encrypt({name:'AES-GCM'","crypto.subtle.decrypt({name:'AES-GCM'",'startDeviceSyncBridge','restoreDeviceSyncState','device-sync-push','device-sync-pull'])need('Gerätesynchronisation',deviceSync,token);
for(const token of ['Geräteübergreifende Synchronisation','Persönlicher Synchronisationscode','Jetzt synchronisieren','Bestehenden Geräteverbund verwenden'])need('Synchronisationseinstellungen',deviceSettings,token);
need('Synchronisationsstart',main,'restoreDeviceSyncState');
need('Synchronisationsbrücke',main,'startDeviceSyncBridge');
need('Worker-Sync-Push',worker,"mode==='device-sync-push'");
need('Worker-Sync-Pull',worker,"mode==='device-sync-pull'");
need('Worker-Sync-Dienst',worker,"'device-sync'");
need('Systemeinstellungen',app,'<DeviceSyncSettings/>');

for(const token of ['recordForecastCapture','refreshForecastReferences','buildForecastVerificationReport','modelSummaries','weightingReady','predictionDayScore','reanalysisReferenceRequest','retrospectiveBestMatchRequest'])need('Prognosegüte-Logik',verification,token);
for(const token of ['Prognosegüte und Rückblick','Was wurde vorhergesagt – was zeigt der Rückblick?','Lokale Modellgüte','Lokale Modellgewichtung'])need('Prognosegüte-Panel',verificationPanel,token);
need('Modellsummaries-Typ',weather,'modelSummaries?:EnsembleModelDay[]');
need('Modellsummaries-Aufbau',weather,'modelSummaries.push');
need('Erweiterter Modus',app,'title="Prognosegüte und Rückblick"');
if(!app.includes('recordForecastCapture(favoriteKey(loc),days,ens)')&&!app.includes('recordForecastCapture(favoriteKey(loc),days,ens,loc)')&&!app.includes('recordForecastCapture(favoriteKey(loc),days,ens,loc,hours)'))failures.push('Prognosearchiv: recordForecastCapture für den aktiven Favoriten fehlt');

for(const token of ['LazyRouteWeather','title="Routenwetter"','ROUTE_WEATHER_SETTINGS_KEY'])reject('Routenwetter',app,token);
need('Dormantes Routenwetter-Panel',routePanel,'RouteWeatherPanel');
need('Dormante Routenwetter-Logik',routeLogic,'export async function loadRouteWeather');

if(failures.length){console.error('Modelländerungsradar/Gerätesynchronisation/Prognosegüte-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}

// Worker-Endpunkte funktional mit einem isolierten KV-Speicher prüfen.
const memory=new Map();
const kv={
 async put(key,value){memory.set(key,value)},
 async get(key,options){const value=memory.get(key);if(value===undefined)return null;return options?.type==='json'?JSON.parse(value):value},
 async delete(key){memory.delete(key)},
 async list(){return{keys:[],list_complete:true}}
};
const workerModule=await import('../worker/metar-proxy.js?device-sync-test='+Date.now()),env={MID_PUSH_SUBSCRIPTIONS:kv,MID_ALLOWED_ORIGIN:'https://mid.test'},headers={'content-type':'application/json',origin:'https://mid.test'},syncKey='abcdefghijklmnopqrstuvwxyzABCDEFGH1234567890',blob={iv:'AQIDBAUGBwgJCgsM',data:'verschluesselter-teststand'};
const pushResponse=await workerModule.default.fetch(new Request('https://worker.test/?mode=device-sync-push',{method:'POST',headers,body:JSON.stringify({syncKey,deviceId:'test-device',updatedAt:'2026-07-27T12:00:00.000Z',blob})}),env),pushData=await pushResponse.json();
if(!pushResponse.ok||!pushData.ok)failures.push(`Worker-Sync-Push fehlgeschlagen: ${JSON.stringify(pushData)}`);
const pullResponse=await workerModule.default.fetch(new Request('https://worker.test/?mode=device-sync-pull',{method:'POST',headers,body:JSON.stringify({syncKey})}),env),pullData=await pullResponse.json();
if(!pullResponse.ok||pullData?.blob?.data!==blob.data||pullData?.blob?.iv!==blob.iv)failures.push(`Worker-Sync-Pull fehlgeschlagen: ${JSON.stringify(pullData)}`);
if(failures.length){console.error('Funktionale Gerätesynchronisationsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('3-Tage-Modelländerungsradar mit Modellangabe, verschlüsselte Gerätesynchronisation, stillgelegtes Routenwetter und Prognosegüte/Rückblick sind geprüft.');
