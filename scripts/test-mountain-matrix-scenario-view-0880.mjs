import {readAppFeatureSources} from './lib/appFeatureSources.mjs';
import {readFile} from 'node:fs/promises';
const [app,ensemble,styles]=await Promise.all([
 readAppFeatureSources(),
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
for(const token of ['function MountainHourlyForecast','Stundenprognose · nächste 12 Stunden','className="mountain-level-picker"','className="mountain-hourly-grid"','7-Tage-Überblick','Schneefallgrenze'])need(app,token,`Neue höhenbezogene Bergprognose unvollständig: ${token}`);
if(app.includes('function MountainForecastMatrix')||app.includes('Höhenvergleich · Winterprofil nach Höhenzone')||app.includes('Höhenvergleich · Bergwetter nach Höhenzone'))failures.push('Der abgelöste sichtbare Höhenvergleich ist noch im Produktpfad vorhanden.');
need(app,'Saison automatisch erkannt','Saison-Automatik wird im Profil nicht verständlich gekennzeichnet.');
need(app,'Profil automatisch abgeleitet','Profilquelle/-sicherheit wird nicht verständlich getrennt.');
if(app.includes('SommerAutomatisch')||app.includes('WinterAutomatisch'))failures.push('Saison- und Profiltext können weiterhin zusammengeschrieben erscheinen.');
for(const token of ['ensemble-scenario-days','Temperatur · Niederschlag · Böen','Abweichung zu A','scenarioDayDeltas','scenarioDayTone'])need(ensemble,token,`Szenario-Tagesvergleich fehlt: ${token}`);
const scenarioStart=ensemble.indexOf('function ScenarioCluster');
const scenarioEnd=ensemble.indexOf('function ModelEvolutionPanel',scenarioStart);
const scenarioSource=scenarioStart>=0?(scenarioEnd>scenarioStart?ensemble.slice(scenarioStart,scenarioEnd):ensemble.slice(scenarioStart)):'';
if(scenarioSource.includes('<i style={{height:'))failures.push('Die alte blaue Säulenvisualisierung ist noch im Szenariocluster aktiv.');
for(const token of ['.mountain-hourly-panel','.mountain-hourly-grid','.mountain-secondary-grid','.ensemble-scenario-days','.ensemble-scenario-day.wetter','.ensemble-scenario-day.waermer'])need(styles,token,`Layoutschutz fehlt: ${token}`);
if(failures.length){console.error('Höhenwetter-/Szenarioansicht fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ausgewählte Höhenstufe mit Stunden-/7-Tage-Prognose, Profilwording und siebentägiger Szenariovergleich geprüft.');
