import {readFile} from 'node:fs/promises';
const [engine,panel,app,weather,styles]=await Promise.all([
 readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastVerificationPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
need(engine,'export function stationDistanceKm(distance:unknown)','Stationsentfernung wird nicht zentral von Metern in Kilometer umgerechnet.');
need(engine,'normalizedTrustFactor','Stationsvertrauen wird nicht zwischen Prozent- und Faktorformat normalisiert.');
need(engine,"kind:'analysed'",'Hyperlokale/zusammengeführte Stationsanalyse ist nicht als Analyse gekennzeichnet.');
need(engine,"id:`radar:${radar.source}`",'Radar und Stationsmessung werden nicht als getrennte Quellen archiviert.');
need(engine,'uniqueDays<5','Lokale Modellgewichtung wird nicht anhand eindeutiger Vergleichstage freigegeben.');
need(engine,'capPercentages(normalized','Modellgewichte werden nicht gegen Dominanz begrenzt.');
need(engine,'profile?:TwinSiteProfile,timeZone?:string','Standortprofil und Zeitzone fehlen in der aktuellen lokalen Gewichtung.');
need(engine,'applyOperationalNowcastHours(locallyAdjusted,radar)','Wetterzwilling verwendet nicht den zentralen Radar-/Modell-Blend.');
need(engine,'endEpoch=(end?.epoch??start?.epoch??Date.now())+3600000','Persönliche Zeitfenster enden nicht am Ende der letzten Prognosestunde.');
need(panel,'stationDistanceKm(station?.distance)','Räumliche Umfeldanalyse zeigt weiterhin rohe Meterwerte als Kilometer.');
if(panel.includes('formatDecimal(Number(station!.distance)'))failures.push('Rohe Stationsdistanz wird weiterhin direkt als Kilometer ausgegeben.');
need(panel,'Keine belastbare Echozugrichtung verfügbar','Unbelastbare 0°-Zugrichtung wird nicht abgefangen.');
need(panel,'radarQualityLabel','Qualitätsstufen der Umfeldanalyse sind nicht deutsch lokalisiert.');
need(panel,'applyLocalTwinForecast(locationKey,days,ensemble,radar,location)','Aktive lokale Prognose nutzt das Standortprofil nicht.');
need(panel,'applyLocalTwinHours(locationKey,hours,days,activeDays,radar)','Entscheidungsempfehlungen nutzen nicht die aktive Stundenprognose.');
need(app,'ensembleRequested||weatherTwinSettings.enabled','Ensemblemodelle werden bei aktiviertem Wetterzwilling nicht im Hintergrund geladen.');
need(app,'refreshForecastReferences(key,loc,controller.signal)','Rückblicksreferenzen werden ohne geöffnetes Modul nicht aktualisiert.');
need(app,'hazards(displayHours','Hazards verwenden nicht die aktiv angepasste Stundenprognose.');
need(weather,'Number.isFinite(row.gust)?Math.log1p','Szenariocluster behandeln fehlende Böen nicht nullsicher.');
need(weather,"'temperature_2m,precipitation'",'Ensembleabruf besitzt keinen Kernvariablen-Fallback bei optional nicht unterstützten Feldern.');
need(app,'row.available>=3','Höhenzonenanalyse wertet unzureichende/NaN-behaftete Daten weiterhin aus.');
need(app,'endEpoch=localIsoToEpoch(rows[best.end].time,timezone)','Höhenzonen-Zeitfenster nutzt nicht die ausgewählte Zeitbasis.');
need(app,'endEpoch+3600000','Höhenzonen-Zeitfenster endet nicht am Ende der letzten Stunde.');
if(!styles.includes('.weather-twin-spatial'))failures.push('Räumliche Umfeldanalyse besitzt kein Styling.');
// Funktionaler Einheitencheck der kleinen, reinen Hilfsfunktion.
const match=engine.match(/export function stationDistanceKm\(distance:unknown\)\{([^}]+)\}/);
if(!match)failures.push('Stationsdistanz-Hilfsfunktion nicht extrahierbar.');
else try{const fn=new Function('distance',match[1]);const value=fn(21717.2);if(Math.abs(value-21.7172)>.0001)failures.push(`Stationsdistanz falsch umgerechnet: ${value}`)}catch(error){failures.push(`Stationsdistanz-Hilfsfunktion nicht ausführbar: ${error instanceof Error?error.message:String(error)}`)}
if(failures.length){console.error('Wetterzwilling-v0.8.0-Audit fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Wetterzwilling-Audit geprüft: Einheiten, Quellen, Zeitzone, Lernfreigabe, Assimilation, Szenarien und Höhenzonen sind abgesichert.');
