import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [index,weatherMaps,styles,radar,app,pkg,publicChangelog]=await Promise.all([
 readFile(new URL('../index.html',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherMapsPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC14MapWorkspace.css',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../public/CHANGELOG.md',import.meta.url),'utf8')
]);
const releaseVersion=String(JSON.parse(pkg).version||'');

const presentationOrder=JSON.parse(await readFile(new URL('../src/styles-src/presentation-order.json',import.meta.url),'utf8'));
assert.ok(presentationOrder.sources.includes('src/midC14MapWorkspace.css'),'C14 muss sein Karten-Layout global über die konsolidierte Kaskade laden.');
assert.ok(!index.includes('<link rel="stylesheet" href="/src/midC14MapWorkspace.css">'),'C14 darf nicht zusätzlich vor der gemeinsamen Kaskade geladen werden.');
for(const token of [
 'className="weather-maps-panel c14-map-workspace"',
 'className="weather-maps-primary-controls"',
 'className="weather-maps-map-stage"',
 'className="weather-maps-map-status"',
 'className="weather-maps-controls"',
 'className="weather-maps-live"',
 'className="weather-maps-advanced"',
 'className="weather-maps-meta-details"'
])assert.ok(weatherMaps.includes(token),`C14-Wetterkartenstruktur fehlt: ${token}`);
assert.ok(!weatherMaps.includes('<label><span>Zeitschritt</span>'),'Der Zeitschritt darf nicht zusätzlich zur gemeinsamen Zeitachse als dauerhaft sichtbares Auswahlfeld dupliziert werden.');
assert.ok(weatherMaps.includes("const goNearNow=()=>{setPlaying(false);if(times.length)setTimeIndex(preferredWeatherMapTimeIndex(times))}"),'Die Kartenzeitachse braucht einen belastbaren Jetzt-/Nächster-Termin-Sprung.');

for(const token of [
 '.modern-map-focus-shell',
 '.composite-focus-mode .composite-maplibre',
 '.weather-maps-panel.c14-map-workspace',
 '.weather-maps-primary-controls',
 '.weather-maps-map-stage',
 '.weather-maps-map-status',
 '.weather-maps-advanced',
 '.weather-maps-meta-details',
 'height:56svh!important',
 'height:52svh!important',
 '@media(max-width:850px) and (orientation:landscape)',
 'height:72svh!important',
 '@media(min-width:1025px)',
 '@media(prefers-reduced-motion:reduce)'
])assert.ok(styles.includes(token),`C14-Karten-/Responsive-Vertrag fehlt: ${token}`);
assert.ok(styles.includes('Karten als Arbeitsraum statt Karten-/Control-Stapel'),'C14 muss die Map-first-Hierarchie als Designvertrag dokumentieren.');
assert.ok(!/(^|[;{\s])filter\s*:\s*blur\(/m.test(styles),'Fachliche Kartenflächen dürfen nicht mit CSS filter:blur verfremdet werden; backdrop-filter für Controls bleibt zulässig.');
assert.ok(radar.includes('className={`card composite-card${focusMode?\' composite-focus-mode\':\'\'}`}'),'Das bestehende Komposit muss weiterhin den dedizierten Fokusmodus verwenden.');
assert.ok(radar.includes('className="composite-timeline-card"'),'Radar, Satellit, Nowcast und Modelltermine müssen die bestehende gemeinsame Kartenzeitachse behalten.');
assert.ok(radar.includes('<details className="composite-advanced">'),'Erweiterte Kartenlayer müssen im Fokusmodus einklappbar bleiben.');
assert.ok(app.includes("const MODERN_MAP_MODULES:DashboardModuleId[]=['composite','weather-maps'];"),'Komposit und Wetterkarten müssen weiterhin derselben Karten-Navigation zugeordnet sein.');
assert.match(releaseVersion,/^0\.9\.85\.\d+$/,'C14 muss innerhalb der 0.9.85-Releasefolge gebaut werden.');
assert.ok(publicChangelog.startsWith(`# MID v${releaseVersion}`),`Der ausgelieferte Changelog muss mit der aktuellen Releaseversion v${releaseVersion} beginnen.`);


/** Execute the actual TypeScript map-workspace migration with adversarial Storage fixtures. */
const mapStateSource=await readFile(new URL('../src/mapWorkspaceState.ts',import.meta.url),'utf8');
function exerciseMapState(initial){
 const data=new Map(Object.entries(initial));
 const ctx={localStorage:{getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value))}};
 vm.createContext(ctx);
 vm.runInContext(stripTypeScriptTypes(mapStateSource.replace(/\bexport\s+/g,'')),ctx);
 return{data,read:()=>ctx.readMapWorkspaceView(),save:value=>ctx.saveMapWorkspaceView(value)};
}
const mapKey='mid:map-workspace-view:v1',settingsKey='mid:weather-maps:v2';
for(const raw of ['not-json','null','"text"','[{"zoom":9}]']){
 const state=exerciseMapState({[mapKey]:'totals',[settingsKey]:raw});
 assert.equal(state.read(),'models','Legacy totals view must still migrate to models.');
 assert.equal(state.data.get(settingsKey),raw,'Malformed or non-object preferences must remain byte-identical, not overwritten.');
 assert.equal(state.data.get(mapKey),'models','Legacy view key must be normalized.');
}
const valid=exerciseMapState({[mapKey]:'totals',[settingsKey]:JSON.stringify({zoom:9,opacity:38,modelId:'gdps',productId:'gdps-cloud'})});
assert.equal(valid.read(),'models');
assert.deepEqual(JSON.parse(valid.data.get(settingsKey)),{zoom:9,opacity:38,modelId:'icon-d2',productId:'icon-d2-precipitation-totals'},'Valid preferences must retain unrelated user fields.');
const first=exerciseMapState({[mapKey]:'totals'});assert.equal(first.read(),'models');
assert.equal(JSON.parse(first.data.get(settingsKey)).productId,'icon-d2-precipitation-totals','New storage must still select valid totals by default.');


// Execute the actual idle-preload policy, including slow/metered/offline/hidden negatives.
const idleSource=await readFile(new URL('../src/mapIdlePreload.ts',import.meta.url),'utf8');
const idleContext={};vm.createContext(idleContext);
vm.runInContext(stripTypeScriptTypes(idleSource.replace(/\bexport\s+/g,'')),idleContext);
const baseline={weatherReady:true,mapAvailable:true,mapActive:false,searchOpen:false,drawerOpen:false,documentVisible:true,online:true,saveData:false,effectiveType:'4g'};
assert.equal(idleContext.mayWarmMapDuringIdle(baseline),true,'Idle, fast, weather-ready map chunk warmup should be eligible.');
for(const [field,value]of [['weatherReady',false],['mapAvailable',false],['mapActive',true],['searchOpen',true],['drawerOpen',true],['documentVisible',false],['online',false],['saveData',true],['effectiveType','2g'],['effectiveType','slow-2g']]){
 assert.equal(idleContext.mayWarmMapDuringIdle({...baseline,[field]:value}),false,'Preload must fail closed: '+field+'='+String(value));
}
assert.equal(idleContext.mayWarmMapDuringIdle({...baseline,effectiveType:'3g'}),true,'3g without Data Saver may warm modules after idle only.');
assert.equal(idleContext.mayWarmMapDuringIdle({...baseline,effectiveType:' SLOW-2G '}),false,'Network classification is case/whitespace tolerant.');
assert.ok(app.includes('weatherReady={Boolean(w)}'),'Idle preload must never run before core weather renders.');
assert.ok(app.includes('window.requestIdleCallback(warm)')&&app.includes('window.cancelIdleCallback(idleHandle)'),'Browser-idle warmup must be cancellable.');
assert.ok(app.includes('if(cancelled||!allowed())return'),'Cancelled or reclassified navigation must never start a warmup.');
assert.ok(app.includes('Promise.allSettled([importMapWorkspacePanel(),importRadarPanel(),import(\'./UnifiedWeatherMap\')])'),'Chunk warmup must never create an unhandled import rejection.');

// MID 18.2.65: temporal truth and compact controls (source-bound regression).
const unified=await readFile(new URL('../src/UnifiedWeatherMap.tsx',import.meta.url),'utf8');
const compactStyles=await readFile(new URL('../src/UnifiedWeatherMap.css',import.meta.url),'utf8');
assert.ok(radar.includes("absoluteTime={selectedFrame?formatInZone(targetMs,timezone"),'Die absolute Kartenzeit muss vom ausgewählten, bestätigten Kartenframe stammen.');
assert.ok(radar.includes("validityKind={selectedFrame?.phase==='forecast'"),'Modell und Beobachtung benötigen klar unterscheidbare Zeit-Phasen.');
assert.ok(radar.includes('relative=relativeLabel(targetSeconds,referenceSeconds)'),'Der tatsächliche Abstand des bestätigten Modelltermins muss relativ zu Jetzt gezeigt werden, auch bei live-follow.');
assert.ok(!radar.includes("liveFollow&&selectedFrame?.live?'Jetzt':relativeLabel"),'Ein zukünftiger nächstverfügbarer Modelltermin darf niemals fälschlich Jetzt anzeigen.');
assert.ok(radar.includes("absoluteTime||(showRadar?provider:'Komposit')"),'Genau die vorhandene Legende muss den absoluten Termin anzeigen.');
assert.ok(!radar.includes('className="composite-map-absolute-clock"'),'Zweites Zeit-Overlay unten rechts ist nicht zulässig.');
assert.equal((radar.match(/className="composite-observation-master"/g)||[]).length,1,'Beobachtungen dürfen nur einen Master-Schalter besitzen.');
assert.ok(radar.includes('composite-compact-observation-heading'),'Der Master-Schalter bleibt innerhalb der Ebeneauswahl bedienbar.');
assert.ok(unified.includes('<summary>Weitere Einstellungen</summary>'),'Profioptionen bleiben über eine einzige sekundäre Steuerung zugänglich.');
assert.ok(unified.includes('aria-label="Modell / Messraster" className={`unified-model-toggle'),'Der kompakte Modell-Schalter muss unter dem stabilen Screenreader-/Browsernamen bedienbar bleiben.');
assert.ok(!unified.includes('<summary>Darstellung & Auswahlrichtung</summary>'),'Redundantes zweites Profigruppen-Disclosure wird entfernt.');
assert.ok(compactStyles.includes('radarlegend-toggle small'),'Die vereinte Zeit-/Legendenfläche bleibt responsiv.');
assert.ok(radar.indexOf('className="radarmap"')<radar.indexOf('className="composite-direct-time"'),'Vor der Karte dürfen keine redundanten Termin- und Advanced-Menüs Platz beanspruchen.');

console.log(`MID-C14: Karten als map-first Arbeitsraum, eine Zeitachse, eingeklappte Sekundärsteuerung und Smartphone-/Tablet-/Desktop-Dichte für v${releaseVersion} geprüft.`);
