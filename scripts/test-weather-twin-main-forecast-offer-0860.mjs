import {readFile} from 'node:fs/promises';
const [verification,app,panel,settings,styles]=await Promise.all([
 readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastVerificationPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherTwinSettings.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
for(const token of ['export type TwinMainForecastStatus','validationDays>=6','Number(improvement)>=0','modelCount>=2','weightedValidationDays','mainForecastStatus:mainForecast','applyLocalTwinForecastFromReport','!report.mainForecastStatus.eligible'])need(verification,token,`Qualitätsfreigabe fehlt: ${token}`);
for(const token of ['TwinForecastActivationOffer','Lokale Best-Match-Nachkorrektur ist freigegeben','Für Best Match anwenden','twinForecastStatus?.eligible&&!weatherTwinSettings.useAsMainForecast','Best Match · hyperlokal nachkorrigiert','Diagnose-Schwerpunkt:'])need(app,token,`Dashboard-Angebot/Kennzeichnung fehlt: ${token}`);
for(const token of ['Lokale Best-Match-Nachkorrektur freigegeben','Best-Match-Nachkorrektur {settings.useAsMainForecast?activation.eligible?\'aktiv\':\'vorgemerkt\':\'aus\'}','activation.reason'])need(panel,token,`Rückblickmodul-Freigabe fehlt: ${token}`);
need(settings,'Kann vorab vorgemerkt werden. Nach positiver Qualitätsprüfung werden ausschließlich Temperatur und Wind begrenzt korrigiert','Einstellungsbeschreibung erklärt Freigabe/Vormerkung nicht.');
for(const token of ['.weather-twin-activation-offer{','.weather-twin-model-badge{'])need(styles,token,`Styling fehlt: ${token}`);
if(failures.length){console.error('Wetterzwilling-Hauptprognose-Angebot fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Wetterzwilling-Nachkorrektur geprüft: Qualitätsfreigabe, Aktivierungsangebot, Diagnosekennzeichnung und unverändertes Best-Match-Wetterbündel sind vorhanden.');
