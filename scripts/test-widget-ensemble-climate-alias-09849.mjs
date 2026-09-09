import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [app,ensemble,climate,cockpit,foundation,pkgText,baselineText]=await Promise.all([
 read('src/App.tsx'),
 read('src/EnsemblePanel.tsx'),
 read('src/ClimatePanel.tsx'),
 read('src/ForecastCockpit.tsx'),
 read('src/styles-src/00-foundation.css'),
 read('package.json'),
 read('MID_BASELINE.json'),
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-widget-ensemble-climate-alias-09849.mjs';
const need=(label,text,token)=>assert.ok(text.includes(token),`${label}: ${token}`);

need('Widget bietet das 14-Tage-Ensemble an',app,'<option value="ensemble">14-Tage-Ensemble</option>');
need('Widget lädt Ensemble erst bei Auswahl',app,"if(view==='ensemble')onEnsembleRequested()");
need('Widget nutzt den vollständigen bestehenden Ensemble-Renderer',app,'presentation="widget"');
need('Widget zeigt einen festen 14-Tage-Zeitraum',app,'className="widget-fixed-days">14 Tage');
need('Ensemble kennt die Widget-Präsentation',ensemble,"type EnsemblePresentation='full'|'cockpit'|'widget'");
for(const metric of ['temperature','precipitation','wind'])need(`Widget rendert ${metric}`,ensemble,`(presentation==='widget'||activeMetric==='${metric}')`);
need('Alle drei Diagramme bleiben im Widget aufgeklappt',ensemble,"const temperatureExpanded=presentation!=='full'||temperatureOpen");
need('Klima erhält optional den Favoritenortnamen',app,'favoriteName={currentFavorite?favoriteLabel(currentFavorite):undefined}');
need('Klima lässt den Favoritennamen schalten',climate,'Favoritenname „{favoriteName}“ verwenden');
need('Klima speichert die Ortsnamenauswahl',climate,"mid:climate:favorite-name:");
need('Kurvenübersicht erhält Hazarddaten pro Datum',app,'hazardsByDate={showHazards?Object.fromEntries');
need('Kurvenübersicht begrenzt Hazardpillen kompakt',cockpit,'.slice(0,3).map((hazard,index)');
need('Heller Kurvenwindpfeil ist kontrastverstärkt',foundation,'border-width:2px;box-shadow:0 1px 3px');
assert.equal(pkg.scripts?.['test:widget-ensemble-climate-alias'],`node ${test}`,'Package-Testeintrag fehlt.');
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','requiredFiles'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
assert.equal(baseline.releaseVersion,pkg.version,'Release- und Baseline-Version müssen übereinstimmen.');
console.log(`MID v${pkg.version}: Ensemble-Widget, Klima-Favoritenname, Kurvenhazards und heller Windpfeil geprüft.`);
