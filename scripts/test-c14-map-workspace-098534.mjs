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
 vm.runInContext(stripTypeScriptTypes(mapStateSource.replace(/\\bexport\\s+/g,'')),ctx);
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

console.log(`MID-C14: Karten als map-first Arbeitsraum, eine Zeitachse, eingeklappte Sekundärsteuerung und Smartphone-/Tablet-/Desktop-Dichte für v${releaseVersion} geprüft.`);
