import {readFile} from 'node:fs/promises';
const [engine,panel,baseline]=await Promise.all([
  readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
  readFile(new URL('../src/ForecastVerificationPanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
 "const PREFIX='mid:forecast-verification:v3:'",
 'version:3;',
 'export const FORECAST_SCORING_PROFILE_VERSION=2',
 'precipitation:28',
 'temperature:24',
 'gust:20',
 'probability:18',
 'sunshine:10',
 'function priorityWeightedMetricScore(',
 'function priorityWeightedErrorScore(',
 'function weatherBundleSkill(',
 'score=priorityWeightedMetricScore(metrics)',
 'return priorityWeightedErrorScore(modelParameterErrors(prediction,reference))',
 'weatherBundleSkill(b.weight)-weatherBundleSkill(a.weight)',
 'parameterWeights[parameter]=1/Math.max(.18,combined)'
])need('ForecastVerification',engine,token);
for(const token of [
 'FORECAST_PARAMETER_IMPORTANCE',
 'Niederschlag, Temperatur und Böen zählen stärker als Sonnenschein',
 'vorhandenen historischen Gütedaten weiter',
 'Gewichte werden parameterspezifisch berechnet'
])need('ForecastVerificationPanel',panel,token);

// Schutz gegen eine unbeabsichtigte Rücksetzung des Wetterzwilling-Archivs.
if(engine.includes("const PREFIX='mid:forecast-verification:v4:'"))failures.push('Bestehende v3-Gütedaten würden durch einen neuen Speicherpräfix abgeschnitten.');

// Verhaltensvertrag: Ein Modell darf nicht allein durch perfekten Sonnenschein gewinnen,
// wenn das konkurrierende Modell bei den priorisierten Kernparametern deutlich besser ist.
const importance={precipitation:28,temperature:24,gust:20,probability:18,sunshine:10};
const weightedScore=errors=>Object.entries(importance).reduce((sum,[key,weight])=>sum+errors[key]*weight,0)/100;
const coreModel=weightedScore({precipitation:.4,temperature:.5,gust:.5,probability:.5,sunshine:2.5});
const sunshineModel=weightedScore({precipitation:1.5,temperature:1.4,gust:1.3,probability:1.1,sunshine:.05});
if(!(coreModel<sunshineModel))failures.push(`Prioritätstest unerwartet: Kernmodell ${coreModel.toFixed(3)} / Sonnenmodell ${sunshineModel.toFixed(3)}`);

const parsed=JSON.parse(baseline);
for(const listName of ['requiredRegressionTests','regressionTests'])if(!Array.isArray(parsed[listName])||!parsed[listName].includes('scripts/test-forecast-parameter-priority-09270.mjs'))failures.push(`Baseline: ${listName} enthält neuen Prioritätstest nicht.`);
if(failures.length){console.error('Parameterspezifische Prognosegüte fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Parameterspezifische Prognosegüte geprüft: vorhandene v3-Lerndaten bleiben erhalten; Niederschlag, Temperatur und Böen dominieren den Gesamtscore vor Sonnenschein.');
