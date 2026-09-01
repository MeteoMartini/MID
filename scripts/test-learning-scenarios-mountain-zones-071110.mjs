import {readFile} from 'node:fs/promises';
const [verification,panel,weather,ensemble,app,styles]=await Promise.all([
 readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastVerificationPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of ["const HORIZONS=[12,24,48,72]","export type WeatherRegime=","function regularizedWeights(","id:'mid_local_weighted'","weightedImprovement","currentWeightedForecasts(","weatherRegimeLabel"])need('Prognosegüte/Lerngewichtung',verification,token);
for(const token of ['Güte nach Wetterlage und Horizont','Lokale Modellgewichtung · aktuelle Prognose','MID-Gewichtung gegen Best Match','report.currentForecasts'])need('Prognosegüte-UI',panel,token);
for(const token of ['export type EnsembleScenarioCluster','function buildEnsembleScenarios(','scenarioLabel(','scenarios=buildEnsembleScenarios','scenarios:cache.scenarios??[]'])need('Ensemble-Szenariocluster',weather,token);
for(const token of ['function EnsembleScenarioClusters(','ensemble-scenario-probability-overview','advancedMode&&<EnsembleScenarioClusters scenarios={scenarios} open={scenarioOpen}'])need('Szenariocluster-UI',ensemble,token);
for(const token of ['setEnsembleScenarios(current=>value.scenarios?.length?value.scenarios:current)','scenarios={ensembleScenarios}'])need('Szenariocluster-Appverdrahtung',app,token);
for(const token of ['function mountainZoneAssessments(','function MountainZoneAnalysis(','Analyse nach Höhenzone','<MountainZoneAnalysis data={data} days={days} rapidMinutes15={rapidMinutes15}/>','mountainHourlyThunderRisk(','mountainRapidThunderRisk(','mountainCombinedThunderPercent(','score-=mountainConvectivePenalty(convectiveRisk)','Gewitter-/Konvektionssignal · Höhenmodell + ICON-D2-RUC','mountainSnowQuality(','contiguousMountainWindow('])need('Berg-Höhenzonenanalyse',app,token);
if(app.includes("risks.push('erhöhte konvektive Instabilität')"))failures.push('Berg-Höhenzonenanalyse: CAPE-only-Altpfad darf nicht zurückkehren');
for(const token of ['.ensemble-scenarios{','.forecast-segment-quality{','.forecast-weighted-days{','.mountain-zone-analysis{'])need('Neue UI-Stile',styles,token);
if(failures.length){console.error('Lernsystem-/Szenario-/Höhenzonenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Prognosegüte nach Wetterlage/Horizont, überprüfbare lokale Lerngewichtung, Ensemble-Szenariocluster und Berg-Höhenzonenanalyse sind geprüft.');
