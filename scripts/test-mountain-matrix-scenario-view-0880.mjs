import {readFile} from 'node:fs/promises';
const [app,ensemble,styles]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
for(const token of ['function MountainForecastMatrix','Winterprofil nach Höhenzone','Zeitliche Auflösung','>1 h<','>3 h<','Nächste 3 Tage','Wolkenbasis','Schneefallgrenze'])need(app,token,`Höhenwetter-Verlauf unvollständig: ${token}`);
need(app,'Saison automatisch erkannt','Saison-Automatik wird im Profil nicht verständlich gekennzeichnet.');
need(app,'Profil automatisch abgeleitet','Profilquelle/-sicherheit wird nicht verständlich getrennt.');
if(app.includes('SommerAutomatisch')||app.includes('WinterAutomatisch'))failures.push('Saison- und Profiltext können weiterhin zusammengeschrieben erscheinen.');
for(const token of ['ensemble-scenario-days','Temperatur · Niederschlag · Böen','Abweichung zu A','scenarioDayDeltas','scenarioDayTone'])need(ensemble,token,`Neuer Szenario-Tagesvergleich fehlt: ${token}`);
const scenarioStart=ensemble.indexOf('function ScenarioCluster');
const scenarioEnd=ensemble.indexOf('function ModelEvolutionPanel',scenarioStart);
const scenarioSource=scenarioStart>=0?(scenarioEnd>scenarioStart?ensemble.slice(scenarioStart,scenarioEnd):ensemble.slice(scenarioStart)):'';
if(scenarioSource.includes('<i style={{height:'))failures.push('Die alte blaue Säulenvisualisierung ist noch im Szenariocluster aktiv.');
for(const token of ['.mountain-forecast-matrix','.mountain-matrix-row','.ensemble-scenario-days','.ensemble-scenario-day.wetter','.ensemble-scenario-day.waermer'])need(styles,token,`Layoutschutz fehlt: ${token}`);
if(failures.length){console.error('Höhenwetter-/Szenarioansicht fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Höhenwetter-Verlauf, Profilwording und siebentägiger Szenariovergleich geprüft.');
