import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [app,cockpit,portable,deviceSync,push,scheduler,pkgText,baselineText]=await Promise.all(['src/App.tsx','src/ForecastCockpit.tsx','src/portableUserData.ts','src/deviceSync.ts','worker-src/30-push-events.js','worker-src/20-composite-models.js','package.json','MID_BASELINE.json'].map(read));
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText);

// Standort war bereits dauerhaft gespeichert; der Vertrag bleibt explizit geschützt.
for(const token of ["const LOCATION_STORAGE_KEY='mid:lastLocation'","function storedLocation()","function initialLocation()","localStorage.setItem(LOCATION_STORAGE_KEY,JSON.stringify(normalized))"])assert.ok(app.includes(token),`Standortpersistenz fehlt: ${token}`);

// Nur die vier Haupt-Prognoseansichten werden als leichtgewichtiger UI-Zustand restauriert.
for(const token of ["LAST_DASHBOARD_SECTION_KEY='mid:last-dashboard-section:v1'","RESTORABLE_DASHBOARD_SECTIONS:DashboardModuleId[]=['current','short-term','forecast','ensemble']","readLastDashboardSection()","persistLastDashboardSection(id)","navigateToDashboardSection(id,false,'auto')"])assert.ok(app.includes(token),`Ansichtspersistenz fehlt: ${token}`);
assert.match(app,/activeNavSection,setActiveNavSection\]=useState<DashboardModuleId\|'place'\|''>\(\(\)=>readLastDashboardSection\(\)\)/,'Aktive Ansicht wird beim Appstart nicht aus dem lokalen Zustand initialisiert.');
assert.ok(cockpit.includes("ACTIVE_HORIZON_KEY='mid:forecastCockpit:activeHorizon'"),'Cockpit-Horizont wird nicht separat erhalten.');
for(const key of ["'mid:last-dashboard-section:v1'","'mid:forecastCockpit:activeHorizon'"])assert.ok(portable.includes(key),`${key} muss als rein gerätelokaler UI-Zustand vom Geräte-KV-Sync ausgeschlossen sein.`);
assert.ok(portable.includes('DEVICE_LOCAL_KEYS'),'UI-Zustände müssen explizit gerätelokal klassifiziert sein.');

// Geräte-Sync schreibt beim pagehide nur noch, wenn wirklich ungesicherte lokale Änderungen existieren.
assert.ok(deviceSync.includes("pagehide=()=>{const current=readDeviceSyncConfig();if(current.pendingChangedAt)void pushDeviceSync(current).catch(()=>undefined)}"),'Unveränderter Geräte-Sync würde beim Verlassen weiterhin unnötige KV-Writes erzeugen.');

// Bestehende Scheduler-Einsparungen bleiben und die neuen Write-Sparmaßnahmen kommen hinzu.
for(const token of ['mid-push-schedule-v1','pushEntryCadenceMinutes','pushScheduleItemDue','metadataMissing||changed&&after!==before','pushRegistrationSignature','PUSH_HEARTBEAT_WRITE_MS=30*60*1000',"schema:'mid.kv-operations-audit.v2'",'heartbeatWritesPerDayCeiling:48',"deviceSyncPagehideWrites:'nur bei ausstehender lokaler Änderung (pendingChangedAt)'"])assert.ok(push.includes(token),`KV-Sparvertrag fehlt: ${token}`);
assert.ok(scheduler.includes('PUSH_SCHEDULER_HEALTH_MS=41*60*1000'),'Scheduler-Health-Fenster ist nicht auf den sparsamen 30-Minuten-Heartbeat abgestimmt.');
assert.ok(push.includes('if(!unchanged){entry.updatedAt=now;await putPushEntry(env,key,entry)}'),'Unveränderte Push-Registrierungen werden nicht write-frei behandelt.');
for(const essential of ['pushWeatherState','pushRadarPrecipitationState','dwdKonrad3dNowcast','pushForecastState','ventilationAdvice','sendWebPush'])assert.ok(push.includes(essential),`Grundfunktionalität entfernt: ${essential}`);

// Dynamischer Nachweis: identische Push-Registrierung darf beim zweiten Appstart keinen zweiten put erzeugen.
const store=new Map(),puts=[];
const kv={
 async get(key,options){const value=store.get(key);if(value===undefined)return null;return options?.type==='json'?JSON.parse(value):value},
 async put(key,value,options){puts.push({key,value,options});store.set(key,value)},
 async delete(key){store.delete(key)},
 async list(){return{keys:[],list_complete:true}}
};
const env={MID_PUSH_SUBSCRIPTIONS:kv,VAPID_PUBLIC_KEY:'public',VAPID_PRIVATE_KEY:'private',VAPID_SUBJECT:'mailto:test@example.invalid'};
const worker=await import(`../worker/metar-proxy.js?location-view-kv-09649=${Date.now()}`);
const body={subscription:{endpoint:'https://push.example.invalid/subscription-1',expirationTime:null,keys:{p256dh:'abc',auth:'def'}},favorites:[],notificationIntervalMinutes:60,appUrl:'https://meteomartini.github.io/MID/',userAgent:'MID-Test'};
const request=()=>new Request('https://mid.test/?mode=push-subscribe',{method:'POST',headers:{origin:'http://localhost:5173','content-type':'application/json'},body:JSON.stringify(body)});
const first=await worker.default.fetch(request(),env),firstJson=await first.json();assert.equal(first.status,200,JSON.stringify(firstJson));assert.equal(puts.length,1,'Erste Registrierung muss genau einen KV-Write erzeugen.');
const second=await worker.default.fetch(request(),env),secondJson=await second.json();assert.equal(second.status,200,JSON.stringify(secondJson));assert.equal(secondJson.unchanged,true,'Zweite identische Registrierung wird nicht als unverändert erkannt.');assert.equal(puts.length,1,'Identische Wiederregistrierung erzeugt weiterhin einen unnötigen KV-Write.');

const auditResponse=await worker.default.fetch(new Request('https://mid.test/?mode=push-kv-operations-audit',{method:'POST',headers:{origin:'http://localhost:5173'}}),env),audit=await auditResponse.json();
assert.equal(auditResponse.status,200,JSON.stringify(audit));assert.equal(audit.schema,'mid.kv-operations-audit.v2');assert.equal(audit.after?.heartbeatWritesPerDayCeiling,48);assert.match(audit.after?.subscriptionRegistrationWrites||'',/0 Writes/);

const test='scripts/test-location-view-kv-write-savings-09649.mjs';
assert.ok(pkg.version.localeCompare('0.9.64.8',undefined,{numeric:true,sensitivity:'base'})>=0,'Persistenz/KV-Optimierung benötigt mindestens v0.9.64.8.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Persistenz-/KV-Regression ist nicht verbindlich registriert.');
console.log(`MID v${pkg.version}: letzter Ort + Hauptansicht persistieren lokal; unveränderte Push- und pagehide-Syncs erzeugen keine unnötigen KV-Writes.`);
