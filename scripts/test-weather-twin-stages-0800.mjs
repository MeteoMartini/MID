import {readFile} from 'node:fs/promises';
const [engine,panel,settings,app,weather,styles]=await Promise.all([
 readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastVerificationPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherTwinSettings.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const requireTokens=(label,text,tokens)=>{for(const token of tokens)if(!text.includes(token))failures.push(`${label}: ${token}`)};
requireTokens('Stufe 1 · Wahrheits-/Standort-/Archivkern',engine,[
 "const DB_NAME='mid-weather-twin-archive'",'type ObservationSource=','recordLiveTwinObservation(','recordCustomSensorObservation(','fetchPrivateSensorObservation(','readTwinSiteProfile(','updateTwinSiteProfile(','restoreForecastVerificationArchive(','kind:\'analysed\'',"'private-sensor'","'reanalysis'",'kind:\'model-fallback\''
]);
requireTokens('Stufe 2 · Lernkern',engine,[
 'parameterMetrics','type ProbabilityCalibrationBin=','type BiasCorrection=','calibrationBins(','modelBiases(','regularizedWeights(','equal_weighted','mid_local_weighted','best_match','confidenceFromSamples('
]);
requireTokens('Stufe 3 · aktiver Wetterzwilling',engine,[
 'applyLocalTwinForecast(','applyLocalTwinHours(','applyOperationalNowcastHours(locallyAdjusted,radar)','settings.nowcastAssimilation','privateSensorUrl','PRIVATE_SENSOR_INTEGRATION_ENABLED=false'
]);
requireTokens('Stufe 4 · Entscheidungszwilling',engine,[
 'buildTwinRecommendations(','recordTwinRecommendationFeedback(','TwinActivity','bestActivityWindow(','Arbeitsweg','Berg-/Wintersport'
]);
requireTokens('Wetterzwilling-Oberfläche',panel,[
 'Unabhängige Wetterwahrheit','Räumliche Umfeldanalyse','Lokales Standortprofil','Parametergetrennte Modellgüte','Kalibrierung der Regenwahrscheinlichkeit','Persönlicher Entscheidungszwilling','MID-Gewichtung gegen Best Match'
]);

if(panel.includes('Eigene Sensoren')||panel.includes('weather-twin-sensors'))failures.push('Eigene Sensoren sind entgegen der vorläufigen Deaktivierung noch in der Oberfläche aktiv.');
requireTokens('Systemeinstellungen',settings,['Lokaler Wetterzwilling','Best Match lokal nachkorrigieren','Radar-/Nowcast-Assimilation']);
requireTokens('App-Integration',app,['WeatherTwinSettingsPanel','finalizedHours=useMemo(()=>finalizeForecastHours(','displayHours=finalizedHours.hours','displayDays=useMemo','recordForecastCapture(','recordLiveTwinObservation(','twinActive={twinForecastActive}']);
requireTokens('Ensembleparameter',weather,['gust?:number','sunshineDuration?:number','wind_gusts_10m','sunshine_duration']);
requireTokens('Wetterzwilling-Styling',styles,['.weather-twin-panel','.weather-twin-health','.weather-twin-spatial','.weather-twin-personal','.weather-twin-active-badge']);
if(failures.length){console.error('Lokaler-Wetterzwilling-Stufenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Lokaler Wetterzwilling Stufen 1–4 geprüft: Wahrheitskern, Lernen, aktive Assimilation und persönliche Entscheidungen sind integriert.');
