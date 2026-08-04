import {readFile} from 'node:fs/promises';
const [app,weather,styles]=await Promise.all([
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
need(app,"window.addEventListener('touchstart',start,{passive:true})",'Mobile Rand-Wischgeste wird nicht registriert.');
need(app,"edge==='left'?-1:1",'Linker und rechter Bildrand wählen nicht den jeweils benachbarten Favoriten.');
need(app,"window.innerWidth*.22",'Wischgeste besitzt keine ausreichend deutliche horizontale Mindeststrecke.');
need(app,"if(typeof window==='undefined'||settingsOpen",'Wischgesten werden im Einstellungsdialog nicht zuverlässig deaktiviert.');
need(app,'pendingViewRestore','Ansichtskontext wird beim Favoritenwechsel nicht gespeichert.');
need(app,'data-mid-view="forecast-detail"','Tagesdetaildiagramm besitzt keinen stabilen Ansichtsanker.');
need(app,'data-mid-view={hourlyDetailOnly?"forecast-hourly-detail":"forecast"}','7-Tage-Vorhersage besitzt keinen stabilen Ansichtsanker.');
need(app,'selectedDayIndex','Ausgewählter Prognosetag wird beim Favoritenwechsel nicht beibehalten.');
need(weather,"'weather_code','sunshine_duration'",'15-Minuten-Abruf enthält keine Sonnenscheindauer.');
need(weather,'export function recentSunshineDuration','Aktuelle 60-Minuten-Sonnenscheinaggregation fehlt.');
need(weather,'rows.length>=3','Sonnenscheindauer wird nicht aus mehreren 15-Minuten-Intervallen gebildet.');
need(weather,'localCloud>=87.5&&modelCloud>=80','Hyperlokaler Bewölkungs-Plausibilitätscheck für das aktuelle Viertel fehlt.');
need(app,'sunshineMinutesPerHourLabel(sunshineRecent.seconds,sunshineRecent.coverageMinutes)','Aktuelle Wetterkachel nutzt nicht die aggregierte Sonnenscheindauer in Minuten je Stundenfenster.');
need(app,"'in den letzten 60 Minuten'",'Zeitraumbezug der Sonnenscheindauer ist nicht eindeutig.');
need(styles,'overscroll-behavior-x:none','Mobile Randnavigation ist nicht gegen horizontales Browser-Overscrollen abgesichert.');
if(app.includes("value:sunshineDurationLabel(Number(c.sunshine_duration))"))failures.push('Alte 15-Minuten-Direktanzeige der Sonnenscheindauer ist noch aktiv.');
if(failures.length){console.error('Favoriten-/Sonnenscheinprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Favoritenwechsel geprüft: mobile Rand-Wischgesten und Desktop-Klick behalten Ansicht/Tag; Sonnenschein wird über bis zu 60 Minuten aggregiert und lokal plausibilisiert.');
