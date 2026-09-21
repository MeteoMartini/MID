import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [app,midDesign,main,css,rucFetch,rucBuild,fusion,shortTerm,audit]=await Promise.all([
 read('src/App.tsx'),
 read('src/MidDesign.tsx'),
 read('src/main.tsx'),
 read('src/midC18InteractionCurrentPolish.css'),
 read('tools/ruc/fetch_and_build_ruc.py'),
 read('tools/ruc/build_ruc_bundle.py'),
 read('src/forecastFusion.ts'),
 read('src/ShortTermForecast.tsx'),
 read('MID_RUC_SHORTTERM_AUDIT_0.9.85.64.md')
]);

assert.ok(app.includes("return'fixed' as BottomBarBehavior"),'Bottom-Bar muss im neuen Design fixiert starten und bleiben.');
assert.ok(app.includes('useEffect(()=>{setBottomBarHidden(false)},[navigationMode,drawerOpen,bottomBarBehavior])'),'Bottom-Bar muss unabhängig vom Scrollzustand sichtbar bleiben.');
assert.ok(!app.includes('downDistance>=96')&&!app.includes('upDistance>=12'),'Legacy-Scroll-Auto-Hide darf nicht zurückkehren.');
assert.ok(app.includes("onNavigate={id=>navigateToDashboardSection(id,true,navigationMode==='bottom-tabs'?'auto':'smooth')}"),'Bottom-Tab-Taps müssen ohne verzögerten Smooth-Scroll navigieren.');
assert.ok(app.includes("'--mid-current-range-tone':currentRangeMinTone.color")&&app.includes("'--mid-current-range-tone':currentRangeMaxTone.color"),'Tmin/Tmax müssen wertbasierte ECMWF-Farben erhalten.');

for(const token of [
 '#current-weather-metrics>article',
 'grid-template-columns:minmax(0,1fr)!important',
 '#current-weather-metrics>article>header>.mode-info',
 '#current-weather-metrics>article>strong',
 '.mid-weather-thread-temperature-area',
 'stroke-width:2.85!important',
 '--mid-current-range-tone'
])assert.ok(css.includes(token),`Responsive/Graph-Polish fehlt: ${token}`);
assert.ok(main.includes("import './midC18InteractionCurrentPolish.css';"),'Finaler MID-18.2-Polish-Layer wird nicht geladen.');
assert.ok(main.indexOf("midC18InteractionCurrentPolish.css")>main.indexOf("midC18UnifiedThreadTimeline.css"),'Polish-Layer muss nach der bisherigen Timeline-Schicht laden.');
assert.ok(midDesign.includes('mid-weather-thread-temperature-area')&&midDesign.includes('<linearGradient')&&midDesign.includes('areaStops'),'ECMWF-Temperaturtrend benötigt die neue dezente Flächenbehandlung.');

for(const token of ["'CLCT'","'CLCL'","SPECIALIST_HOURLY_OPTIONAL=('VIS','CEILING'"])assert.ok(rucFetch.includes(token),`RUC-Preprocessor fehlt: ${token}`);
for(const token of ["'CLCT':'cloud_cover'","'CLCL':'cloud_cover_low'","'VIS':'visibility'","'CEILING':'ceiling'","'CLCM':'cloud_cover_mid'","'CLCH':'cloud_cover_high'"])assert.ok(rucBuild.includes(token),`RUC-Mapping fehlt: ${token}`);
for(const token of ['cloud:Number.isFinite(weather.cloud)','lowCloud:Number.isFinite(weather.lowCloud)','midCloud:Number.isFinite(weather.midCloud)','highCloud:Number.isFinite(weather.highCloud)','visibility:Number.isFinite(weather.visibility)','rucCeilingM'])assert.ok(fusion.includes(token),`Kanonische Forecast-Fusion verliert RUC-Feld: ${token}`);
for(const token of ['cloud:linear(before.cloud,after.cloud,t)','lowCloud:linear(before.lowCloud,after.lowCloud,t)','midCloud:linear(Number(before.midCloud),Number(after.midCloud),t)','highCloud:linear(Number(before.highCloud),Number(after.highCloud),t)','visibility:linear(before.visibility,after.visibility,t)'])assert.ok(shortTerm.includes(token),`Kurzfristdarstellung verliert kanonisches Feld: ${token}`);
assert.ok(audit.includes('Keine Doppelgewichtung von RUC-Bewölkung')&&audit.includes('CEILING 15 min +0…6 h'),'RUC-Kurzfristaudit ist unvollständig.');

console.log('MID 18.2: Bottom-Bar-Reaktion, Current-Kollisionen, ECMWF-Temperaturtrend und kanonische RUC-Wolken-/Sichtkette geprüft.');
