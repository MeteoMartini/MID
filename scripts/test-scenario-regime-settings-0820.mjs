import {readFile} from 'node:fs/promises';
const [weather,ensemble,verification,panel,settings,styles,app]=await Promise.all([
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastVerificationPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherTwinSettings.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8')
]);
const failures=[];
const need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
need(weather,"const ENSEMBLE_CACHE_PREFIX='mid:ensemble:v17:'",'Alter Ensemblecache wird nicht invalidiert.');
need(weather,'function filterScenarioRainOutliers(','Robuste Filterung isolierter Niederschlagsausreißer fehlt.');
need(weather,'median+Math.max(60,8*mad,median*3+25)','Szenario-Ausreißergrenze ist nicht robust an Median und MAD gekoppelt.');
need(weather,'gust:mean(row=>row.gust)','Böen werden in den Szenariokennwerten nicht fortgeführt.');
need(ensemble,'className={index===0?\'leading\':\'\'}','Führendes Szenario verwendet noch die globale .primary-Klasse.');
if(ensemble.includes("className={index===0?'primary':''}"))failures.push('Globale .primary-Klasse verursacht weiterhin unlesbaren Text auf blauem Grund.');
need(ensemble,'Sieben-Tage-Verlauf','Der neue tägliche Szenariovergleich fehlt.');
need(ensemble,'Temperatur · Niederschlag · Böen','Die Bedeutung des Szenariovergleichs wird nicht vollständig erklärt.');
if(ensemble.includes('ensemble-scenario-strip'))failures.push('Die alte Niederschlags-Säulendarstellung ist noch aktiv.');
need(ensemble,'Temperaturspanne','Temperaturkennwert fehlt in den Szenarien.');
need(ensemble,'Böenspitze','Wind-/Böenkennwert fehlt in den Szenarien.');
need(styles,'.ensemble-scenarios article.leading','Dezente Hervorhebung des führenden Szenarios fehlt.');
need(verification,'longestWet>=6&&precipitation>=8','Dauerregen wird nicht anhand einer mindestens sechsstündigen Regenphase geprüft.');
need(verification,"precipitation>=25&&[61,63,65].includes(code)",'DWD-nahe Mengenreserve für Dauerregen fehlt.');
if(verification.includes("precipitation>=5||[63,65].includes(code)"))failures.push('Alte Fehlklassifikation ab pauschal 5 mm ist noch aktiv.');
need(verification,'row.regime=inferRegime(row);','Alte gespeicherte Fehlklassifikationen werden nicht neu bewertet.');
need(verification,'recordForecastCapture(locationKey:string,days:Day[],ensemble:EnsembleDay[],location?:Location,hours:Hour[]=','Stundenverlauf wird beim Prognosearchiv nicht berücksichtigt.');
need(app,'recordForecastCapture(favoriteKey(loc),days,ens,loc,hours','App übergibt den Stundenverlauf nicht an die Wetterlagenklassifikation.');
for(const token of ['checked={settings.biasCorrection}','checked={settings.probabilityCalibration}','checked={settings.personalRecommendations}'])need(settings,token,`Globale Wetterzwilling-Option fehlt in den Einstellungen: ${token}`);
if(panel.includes('checked={settings.biasCorrection}')||panel.includes('checked={settings.probabilityCalibration}'))failures.push('Globale Lernoptionen werden im Rückblicksmodul weiterhin doppelt angeboten.');
need(panel,'Einstellungen → Lokaler Wetterzwilling','Hinweis auf die zentrale Konfiguration fehlt.');
if(failures.length){console.error('Szenario-/Regime-/Einstellungsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Szenariodarstellung, Ausreißerfilter, Dauerregenklassifikation und zentrale Wetterzwilling-Einstellungen sind geprüft.');
