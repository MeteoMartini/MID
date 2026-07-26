import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const ts=createRequire(import.meta.url)('typescript');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>readFile(path.join(root,name),'utf8');
const [app,mountain,worker,push,radar,weather,analytics,persistence,modelChanges,styles,sw]=await Promise.all([
 read('src/App.tsx'),read('src/mountainSports.ts'),read('worker/metar-proxy.js'),read('src/PushSettingsPanel.tsx'),read('src/RadarPanel.tsx'),read('src/weather.ts'),read('src/webAnalytics.ts'),read('src/persistence.ts'),read('src/modelRunChanges.ts'),read('src/styles.css'),read('public/service-worker.js')
]);
const failures=[];
const requireTokens=(label,text,tokens)=>{for(const token of tokens)if(!text.includes(token))failures.push(`${label}: ${token}`)};
requireTokens('Berg-/Wintersport-Schema',mountain,[
 'schemaVersion:2','season:\'auto\'','middleEnabled:false','normalizeMountainConfig','mountainProfile','station','lift','configuredPoints','config.valleyLatitude','config.valleyLongitude',"models:'best_match'",'past_hours:\'24\'','forecast_hours:\'72\'','modelSnowDepthCm','measuredSnowDepthCm','pastSnow24Cm','newSnow24Cm','newSnow48Cm','uv_index','visibility','wind_gusts_10m','cape'
]);
requireTokens('Editierbare Bergstationen',app,['valleyName','middleName','summitName','valleyElevation','middleElevation','summitElevation','Mittelstation verwenden','Automatisch bestimmen']);
requireTokens('GeoSphere-Schneemessung',worker,['mode===\'geosphere-snow\'','geoSphereSnowMeasurement','distanceM<=25000','Math.abs(st.elevation-targetElevation)<=350','ageMs>3*3600000','GeoSphere Austria / TAWES']);
requireTokens('Getrennte Schneewerte',app,['cm Messung','cm Modell','Neuschnee −24 h','+24 h','+48 h','mountainSnowMeasurementTitle']);
requireTokens('Cloudflare Analytics',analytics,['ensureBeacon','static.cloudflareinsights.com/beacon.min.js','script.dataset.cfBeacon=JSON.stringify({token:TOKEN})',"script.setAttribute('data-mid-analytics','cloudflare')",'document.head.appendChild(script)']);
requireTokens('Benachrichtigungsdesign',push,['push-settings-group','settings-option-card','push-rule-grid','push-device-group','push-places-group']);
requireTokens('Benachrichtigungsdesign CSS',styles,['.push-settings-group{','.settings-option-card{','.push-rule-grid{','.push-rule-grid>label.active']);
requireTokens('Favoriten-Deep-Link Worker',worker,['pushFavoriteUrl','mid-favorite','mid-lat','mid-lon','mid-name','url:pushFavoriteUrl(appUrl,favorite)']);
requireTokens('Favoriten-Deep-Link App',app,['function notificationLocation()','url.searchParams.get(\'mid-favorite\')','favorites.find(item=>item.id===favoriteId)','for(const key of[\'mid-favorite\',\'mid-lat\',\'mid-lon\',\'mid-name\',\'mid-country\'])']);
requireTokens('Favoriten-Deep-Link Service Worker',sw,['notificationclick','favoriteId','targetUrl.searchParams.set(\'mid-favorite\',favoriteId)','client.navigate(target)']);
requireTokens('Letzter Ort',app,['const notified=notificationLocation();if(notified)return notified;const last=storedLocation();if(last)return last','localStorage.setItem(LOCATION_STORAGE_KEY,JSON.stringify(normalized))','function locate(openLocation=true)','locate(false)']);
requireTokens('Radar-Zugrichtung Worker',worker,['precipitationCentroid','centroidEastKm','centroidNorthKm','radarMotionFromFrames','motionDirectionDeg','motionSpeedKmh','multi-frame-grid-correlation']);
requireTokens('Radar-Zugrichtung UI',radar,['function PrecipitationMotionArrows','Zugrichtung nach {Math.round(motionDirection)}°','aus Radarbildfolge abgeleitet','motionDirectionDeg','motionSpeedKmh']);
requireTokens('Radar-Zugrichtung Typ',weather,['motionDirectionDeg?:number','motionSpeedKmh?:number','motionConfidence?:\'high\'|\'medium\'|\'low\'']);
requireTokens('Radar-Zugrichtung CSS',styles,['.radarmap .radar-motion-chip{','.radar-motion-arrow,','.radar-motion-arrow-head']);
requireTokens('Versionsfestes Modellarchiv',modelChanges,['HISTORY_KEY=\'mid:model-run-change-history:v2\'','type ModelChangeHistory','appendHistory','slice(-6)','slice(40)','loadModelChangeSnapshot','saveModelChangeSnapshot']);
if(persistence.includes("if(localStorage.getItem('mid:favorites'))return false"))failures.push('Persistenz: früher Abbruch bei vorhandenen Favoriten wurde nicht entfernt.');
requireTokens('Persistenzbrücke',persistence,['const INCLUDED_KEYS=(key:string)=>key.startsWith(\'mid:\')','if(INCLUDED_KEYS(key)&&localStorage.getItem(key)===null)localStorage.setItem(key,value)','readDb()','readCache()']);

// Funktionaler Test: Das neue Sammelarchiv überlebt den Wegfall des alten Einzelkeys.
try{
 const js=ts.transpileModule(modelChanges,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 const store=new Map();
 globalThis.localStorage={getItem:key=>store.has(key)?store.get(key):null,setItem:(key,value)=>store.set(key,String(value)),removeItem:key=>store.delete(key),key:index=>[...store.keys()][index]??null,get length(){return store.size},clear:()=>store.clear()};
 const module=await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
 const snapshot={version:1,createdAt:'2026-07-26T12:00:00.000Z',runKey:'run-a',runTime:'2026-07-26T06:00:00.000Z',signature:'signature-a',days:[]};
 module.saveModelChangeSnapshot('53859-test',snapshot);
 store.delete('mid:model-run-change:53859-test');
 const restored=module.loadModelChangeSnapshot('53859-test');
 if(restored?.signature!=='signature-a')failures.push('Modellarchiv: Snapshot konnte ohne alten Einzelkey nicht aus Sammelarchiv geladen werden.');
}catch(error){failures.push(`Modellarchiv-Funktionstest: ${error instanceof Error?error.message:String(error)}`)}

if(failures.length){console.error('Funktionssuite v0.7.97.0 fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Funktionssuite v0.7.97.0 geprüft: Berg-/Wintersport, GeoSphere-Schnee, Analytics, Benachrichtigungsdesign/Deep-Links, letzter Ort, Radar-Zugrichtung und versionsfestes Modellarchiv.');
