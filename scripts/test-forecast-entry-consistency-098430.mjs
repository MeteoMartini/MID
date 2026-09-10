import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const [styles,canonicalModernStyles,app,forecast,shortTerm,longRange,travel,fusion]=await Promise.all([
  read('src/styles.css'),
  read('src/styles-src/30-modern.css'),
  read('src/App.tsx'),
  read('src/ForecastCockpit.tsx'),
  read('src/ShortTermForecast.tsx'),
  read('src/LongRangePanel.tsx'),
  read('src/TravelPlannerPanel.tsx'),
  read('src/travelForecastFusion.ts')
]);

const assertions=[
  [canonicalModernStyles.includes('/* MID v0.9.84.31 · Forecast-entry audit: 90 min / 24 h / 7 d / 14 d / 46 d+ */'),'Die Forecast-Entry-Styles fehlen in der kanonischen Modern-Style-Quelle.'],
  [styles.includes('/* MID v0.9.84.31 · Forecast-entry audit: 90 min / 24 h / 7 d / 14 d / 46 d+ */'),'Die gemeinsamen Forecast-Entry-Styles fehlen.'],
  [styles.includes('.forecast-entry-head{'),'Die gemeinsame Header-Basis fehlt.'],
  [styles.includes('.navigation-bottom-tabs .modern-forecast-horizons'),'Die modern-forecast-horizons-Abstimmung fehlt.'],
  [styles.includes('.seven-day-curve-rainbar{fill:var(--curve-rain-fill'),'Die farbige Niederschlagsbalken-Logik der Kurvenübersicht fehlt.'],
  [styles.includes('.cockpit-day-rain b{color:var(--param-precipitation)!important}'),'Die 7-Tage-Niederschlagswerte nutzen nicht den Parameterfarbvertrag.'],
  [styles.includes('.cockpit-seven-grid,.cockpit-fourteen-overview{scroll-snap-type:x proximity'),'Der mobile Scroll-Vertrag für 7/14 Tage fehlt.'],
  [styles.includes('.cockpit-seg-control{display:grid;width:100%;grid-template-columns:repeat(2,minmax(0,1fr))'),'Der mobile 90-min/24-h-Umschalter ist nicht gleichmäßig aufgeteilt.'],
  [styles.includes('grid-auto-columns:156px!important'),'Die lesbare 14-Tage-Landschaftsdarstellung mit horizontalem Scrollen fehlt.'],
  [styles.includes('.cockpit-fourteen-card>header .cockpit-fourteen-heading-copy>b{font-size:8.7px!important}'),'Die mobile 14-Tage-Typografie wurde nicht auf lesbare Mindestwerte angehoben.'],
  [app.includes('function detailPrecipBarStyle(parts:PrecipitationParts):CSSProperties|undefined'), 'Die Tagesansicht-Niederschlagsbalken verwenden keine gemeinsame Farb-/Intensitätslogik.'],
  [app.includes('warnings-hybrid-head forecast-entry-head forecast-entry-head-warnings'),'Der Warnungs-Einstieg nutzt nicht den gemeinsamen Headerstil.'],
  [app.includes('precipitationPhaseColor(parts.type)'),'Die Tagesansicht nutzt die Niederschlagsphasenfarbe nicht.'],
  [app.includes('className={`detail-precip-bar detail-precip-${type}`}'),'Die Tagesansicht versieht die Niederschlagsbalken nicht mit dem gemeinsamen Detailvertrag.'],
  [forecast.includes('function curveRainBarStyle(hour:Hour,amount:number):CSSProperties'),'Die Niederschlagsbalken-Logik im 7-Tage-Kurvenüberblick fehlt.'],
  [forecast.includes('const type=precipitationParts(hour).type,base=precipitationPhaseColor(type)'), 'Die 7-Tage-Niederschlagsfarbe muss aus precipitationParts(hour).type statt aus dominantPrecipitationForm(hour) abgeleitet werden.'],
  [!forecast.includes('dominantPrecipitationForm(hour)'), 'dominantPrecipitationForm darf nicht mit einer einzelnen Hour aufgerufen werden.'],
  [forecast.includes("return{'--curve-rain-fill':base,'--curve-rain-stroke':base,opacity:.34+Math.max(intensity,probability/100)*.64} as CSSProperties"), 'CSS-Custom-Properties der Niederschlagsbalken müssen als CSSProperties typisiert werden.'],
  [forecast.includes('className="cockpit-header forecast-entry-head forecast-entry-head-seven-day"'),'Das Prognose-Cockpit nutzt nicht den gemeinsamen Headerstil.'],
  [shortTerm.includes('className="short-term-header forecast-entry-head forecast-entry-head-short-term"'),'Die Kurzfristansicht nutzt nicht den gemeinsamen Headerstil.'],
  [longRange.includes('className="long-range-head forecast-entry-head forecast-entry-head-long-range"'),'Die Langfristansicht nutzt nicht den gemeinsamen Headerstil.'],
  [travel.includes('className="travel-head forecast-entry-head forecast-entry-head-travel"'),'Die Reiseplaner-Ansicht nutzt nicht den gemeinsamen Headerstil.'],
  [fusion.includes('function mediumDay(day:TravelClimateDay,ensemble:EnsembleDay|undefined,best:Day|undefined,lead:number)'), 'Der TypeScript-Buildfix für mediumDay fehlt.'],
  [!fusion.includes('function mediumDay(day:TravelClimateDay,date:string,ensemble:EnsembleDay|undefined,best:Day|undefined,lead:number)'), 'Der ungenutzte Parameter date ist noch vorhanden.']
];

const failed=assertions.filter(([ok])=>!ok).map(([,message])=>message);
if(failed.length){
  console.error(failed.join('\n'));
  process.exit(1);
}
console.log('Forecast-Einstiege, Tagesansicht-Niederschlagsfarben und mediumDay-Buildfix sind vorhanden.');
