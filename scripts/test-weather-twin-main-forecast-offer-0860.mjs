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
for(const token of ['TwinForecastActivationOffer','MID-Prognose ist für diesen Standort freigegeben','Als Hauptprognose verwenden','twinForecastStatus?.eligible&&!weatherTwinSettings.useAsMainForecast','MID Wetterzwilling · lokal gewichteter Modellmix','Schwerpunkt heute:'])need(app,token,`Dashboard-Angebot/Kennzeichnung fehlt: ${token}`);
for(const token of ['Lokale MID-Prognose freigegeben','Hauptprognose {settings.useAsMainForecast?activation.eligible?\'aktiv\':\'vorgemerkt\':\'aus\'}','activation.reason'])need(panel,token,`Rückblickmodul-Freigabe fehlt: ${token}`);
need(settings,'Kann vorab vorgemerkt werden. Angewendet und im Dashboard angeboten wird sie erst nach positiver Qualitätsprüfung gegen Best Match','Einstellungsbeschreibung erklärt Freigabe/Vormerkung nicht.');
for(const token of ['.weather-twin-activation-offer{','.weather-twin-model-badge{'])need(styles,token,`Styling fehlt: ${token}`);
if(failures.length){console.error('Wetterzwilling-Hauptprognose-Angebot fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Wetterzwilling-Hauptprognose geprüft: Qualitätsfreigabe, Aktivierungsangebot, Modellmix-Kennzeichnung und Best-Match-Kontrollschutz sind vorhanden.');
