import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [panel,center,fusion,planner,styles,pkgRaw,baselineRaw]=await Promise.all([read('src/TravelPlannerPanel.tsx'),read('src/travelCenter.ts'),read('src/travelForecastFusion.ts'),read('src/travelPlanner.ts'),read('src/styles-src/10-features.css'),read('package.json'),read('MID_BASELINE.json')]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-travel-center-forecast-fusion-098429.mjs';

// Reise-Center: eigener persistenter Vertrag statt Favoriten-/Event-Speicher.
assert.ok(center.includes("TRAVEL_CENTER_STORAGE_KEY='mid:travel-center:v1'")&&center.includes('readDurableStorageValue')&&center.includes('writeDurableStorageValue'),'Reise-Center muss dauerhaft und getrennt gespeichert werden.');
for(const token of ['Festgepinnte Reisen','travel-center-quick-metrics','Tmax / Tmin','Regentage','Sonne/Tag','Windmaximum','Schneehöhe','Wasser','>Details<','Planung bearbeiten','Reise festpinnen'])assert.ok(panel.includes(token),`Reise-Center/Übersicht unvollständig: ${token}`);
assert.ok(panel.includes("workspaceView==='detail'&&analysis&&active")&&panel.includes('travel-metrics')&&panel.includes('travel-daily-climate'),'Vollständige bisherige Reiseauswertung muss hinter Details erhalten bleiben.');
assert.ok(styles.includes('@media(max-width:520px)')&&styles.includes('.travel-center-quick-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}'),'iPhone-Layout der angehefteten Reisen fehlt.');

// Prognosehierarchie: aktuelle Modelle nur in ihrem Horizont; keine Scheingenauigkeit ab Tag 15.
assert.ok(fusion.includes('MEDIUM_LAST_LEAD=13')&&fusion.includes('SUBSEASONAL_LAST_LEAD=45'),'Horizontgrenzen für Tages-/Witterungssignal fehlen.');
assert.ok(fusion.includes("forecast(location.latitude")&&fusion.includes("ensembles(location.latitude"),'Operationelle MID-Prognose/Ensemblefusion bis Tag 14 fehlt.');
assert.ok(fusion.includes("models:'ecmwf_ec46_ensemble_mean'")&&fusion.includes("weekly:['temperature_2m_anomaly'")&&fusion.includes('modelShareForSubseasonal'),'EC46 muss als native Wochenanomalie mit Horizontdämpfung eingehen.');
assert.ok(fusion.includes("models:'ncep_gefs05_ensemble_mean'")&&fusion.includes('gefsCorroboration'),'GEFS muss als unabhängige Bestätigung statt rohe Doppelstimme verwendet werden.');
assert.ok(fusion.includes('loadSeasonalForecast')&&fusion.includes('modelShareForSeasonal')&&fusion.includes('independenceKey'),'Saison-Multi-Modellpfad mit Unabhängigkeitsgruppen fehlt.');
assert.ok(fusion.includes('DWD GCFS2.2 / EPISODES')&&fusion.includes('qualityFactor'),'DWD-Saison-/EPISODES-Gütemaße müssen als Qualitätsanker berücksichtigt werden.');
assert.ok(panel.includes('Quellen')||panel.includes('travel-source-details'),'Quellen-/Gewichtungstransparenz fehlt.');
assert.ok(panel.includes('modelCoveredDays')&&panel.includes('modelSharePct')&&panel.includes('modelFamilyCount'),'Modellanteil und Familienzahl werden im Detail nicht kenntlich gemacht.');
assert.ok(planner.includes("sourceMode='Nur Klimatologie'")&&planner.includes('Aus aktueller Modelllage und Klimareferenz'),'Reisetext muss zwischen Klima-only und modellgestützter Erwartung unterscheiden.');

assert.equal(pkg.scripts?.['test:travel-center-fusion'],`node ${test}`,'package.json: Reise-Center-/Fusionstest fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Baseline: Reise-Center-/Fusionstest fehlt.');
console.log(`MID v${pkg.version}: Reise-Center, angeheftete Reisen und horizontabhängige Prognose-/Klimafusion statisch geschützt.`);
