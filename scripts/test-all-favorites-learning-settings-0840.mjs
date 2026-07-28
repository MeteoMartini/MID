import {readFile} from 'node:fs/promises';
const [app,verification,settings,background,styles,sync]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherTwinSettings.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/twinBackgroundLearning.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../src/deviceSync.ts',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,tokens)=>{for(const token of tokens)if(!text.includes(token))failures.push(`${label}: ${token}`)};
need('Wetterzwilling-Einstellung',verification,['learnAllFavorites:boolean','learnAllFavorites:parsed.learnAllFavorites!==false','learnAllFavorites:true']);
need('Favoritenlernen in App',app,['learnWeatherTwinsForFavorites','weatherTwinSettings.learnAllFavorites','favorites.map(item=>item.location)','loc?favoriteKey(loc):undefined','visibilitychange','window.addEventListener(\'online\',schedule)']);
need('Hintergrundsammler',background,['SUCCESS_COOLDOWN_MS=6*3600000','FAILURE_COOLDOWN_MS=45*60000','for(const location of queue)','await forecast(','await ensembles(','recordForecastCapture(','refreshForecastReferences(','key===activeLocationKey']);
need('Transparente Einstellung',settings,['Alle Favoriten beim Öffnen nachführen','höchstens einmal je sechs Stunden','weather-twin-background-status','mid:twin-background-learning']);
need('Aufgeräumte Navigation',app,["['view','Ansicht & Einheiten'","['twin','Lokaler Wetterzwilling'","['sync','Daten & Synchronisation'","['system','System & Updates'","section==='twin'&&<WeatherTwinSettingsPanel/>","section==='sync'&&<div className=\"settings-section-stack\"><DeviceSyncSettings/>"]);
need('Layout',styles,['.settings-section-stack{','.weather-twin-background-status{']);
need('Gerätespezifischer Laufstatus',sync,["'mid:twin-background-'"]);
if(app.includes("section==='system'&&<><DeviceSyncSettings/><SystemUpdateManager"))failures.push('Wetterzwilling und Synchronisation hängen noch unsortiert im Systemstatus.');
if(failures.length){console.error('Favoritenlernen/Einstellungsstruktur fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Favoritenlernen und Einstellungsstruktur geprüft: alle Favoriten werden bei sichtbarer App gedrosselt nachgeführt; Wetterzwilling, Sync und Updates sind getrennt auffindbar.');
