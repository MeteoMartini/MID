import {readFile} from 'node:fs/promises';
const [panel,app,nativeClient,widgetSettings,worker,styles,swift,readme]=await Promise.all([
 readFile(new URL('../src/ForecastVerificationPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/nativeWidget.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/AppleWidgetSettings.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../native/apple/MIDWidgets/MIDWidget.swift',import.meta.url),'utf8'),
 readFile(new URL('../native/apple/README.md',import.meta.url),'utf8')
]);
const failures=[];
const need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
need(panel,'<details className="weather-twin-site"','Standortprofil ist nicht einklappbar umgesetzt.');
need(panel,'<strong>Lokales Standortprofil</strong>','Neue Bezeichnung „Lokales Standortprofil“ fehlt.');
need(panel,'weather-twin-site-summary-values','Ausgewählte Profilwerte fehlen in der eingeklappten Zusammenfassung.');
need(panel,"localStorage.setItem('mid:twin-site-profile-open'",'Öffnungszustand des Standortprofils wird nicht gespeichert.');
if(panel.includes('Lokaler Standortfingerabdruck'))failures.push('Alte Bezeichnung „Lokaler Standortfingerabdruck“ ist noch vorhanden.');
need(app,"import {AppleWidgetSettings} from './AppleWidgetSettings';",'Apple-Widget-Einstellungen sind nicht in App.tsx eingebunden.');
need(app,'<AppleWidgetSettings location={currentLocation} unit={unit}/>','Apple-Widget-Vorbereitung fehlt im Bereich Daten & Synchronisation.');
need(nativeClient,"NATIVE_WIDGET_SCHEMA='mid.native.widget.v1'",'Versionierter nativer Widget-Datenvertrag fehlt.');
need(nativeClient,"'accessoryInline','accessoryCircular','accessoryRectangular','accessoryCorner'",'watchOS-Komplikationsfamilien fehlen im Frontendvertrag.');
need(widgetSettings,'Widgets & Komplikationen','Widget-/Komplikationsstatus fehlt in den Einstellungen.');
need(worker,'async function nativeWidgetFeed(url)','Worker-Datenfeed für native Widgets fehlt.');
need(worker,"if(mode==='native-widget-feed')return nativeWidgetFeed(u);",'Workerroute native-widget-feed fehlt.');
need(worker,"schema:'mid.native.widget.v1'",'Worker liefert nicht den erwarteten Widgetvertrag.');
need(styles,'.weather-twin-site-summary-values','CSS für die Profilzusammenfassung fehlt.');
need(styles,'.apple-widget-readiness-grid','CSS für die Apple-Widget-Vorbereitung fehlt.');
for(const family of ['.systemSmall','.systemMedium','.systemLarge','.accessoryInline','.accessoryCircular','.accessoryRectangular','.accessoryCorner'])need(swift,family,`Swift-Widgetfamilie ${family} fehlt.`);
need(readme,'App Group','Native App-Group-Vorbereitung fehlt in der Dokumentation.');

const originalFetch=globalThis.fetch;
globalThis.fetch=async input=>{
 const url=new URL(typeof input==='string'?input:input.url);
 if(url.hostname==='api.open-meteo.com')return new Response(JSON.stringify({
  latitude:50.8,longitude:7.0,elevation:60,timezone:'Europe/Berlin',
  current:{time:'2026-07-28T10:00',temperature_2m:23.4,apparent_temperature:23.0,precipitation:0,weather_code:1,wind_speed_10m:8,wind_gusts_10m:12,wind_direction_10m:245,is_day:1},
  hourly:{time:['2026-07-28T10:00','2026-07-28T11:00'],temperature_2m:[23.4,24.1],precipitation_probability:[10,15],weather_code:[1,2],wind_speed_10m:[8,9],wind_gusts_10m:[12,14],wind_direction_10m:[245,250],is_day:[1,1]},
  daily:{time:['2026-07-28'],weather_code:[2],temperature_2m_max:[27],temperature_2m_min:[16],precipitation_sum:[0.2],precipitation_probability_max:[20],wind_gusts_10m_max:[18],sunrise:['2026-07-28T05:50'],sunset:['2026-07-28T21:20']}
 }),{status:200,headers:{'content-type':'application/json'}});
 throw new Error(`Unerwarteter Testabruf: ${url}`);
};
try{
 const module=await import('../worker/metar-proxy.js?native-widget-test='+Date.now());
 const response=await module.default.fetch(new Request('https://mid.test/?mode=native-widget-feed&lat=50.8&lon=7.0&name=Niederkassel&unit=kn'),{}),data=await response.json();
 if(!response.ok||data.schema!=='mid.native.widget.v1'||data.location?.name!=='Niederkassel'||data.hourly?.length!==2||data.daily?.length!==1||data.current?.symbolName!=='cloud.sun.fill')failures.push(`Funktionaler Widgetfeed ungültig: ${JSON.stringify(data)}`);
}finally{globalThis.fetch=originalFetch}

if(failures.length){console.error('Standortprofil-/Apple-Widget-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Lokales Standortprofil sowie iOS-/watchOS-Widget- und Komplikationsvorbereitung sind geprüft.');
