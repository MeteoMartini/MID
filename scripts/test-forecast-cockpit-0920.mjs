import {readFileSync,existsSync} from 'node:fs';

const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const cockpitPath=new URL('../src/ForecastCockpit.tsx',import.meta.url);
const cockpit=existsSync(cockpitPath)?readFileSync(cockpitPath,'utf8'):'';
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=readFileSync(new URL('../package.json',import.meta.url),'utf8');
const baseline=readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8');
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: fehlt ${token}`)};
const forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: unerlaubt ${token}`)};

need('Cockpit-Datei',cockpit,"export type ForecastPresentationMode='classic'|'cockpit-tabs'|'cockpit-ribbons'");
need('Klassischer Standard',app,'const DEFAULT_FORECAST_DISPLAY_SETTINGS:ForecastDisplaySettings={showSevenDaySummary:true}');
need('Persistente Auswahl',app,"parsed?.presentationMode==='cockpit-tabs'||parsed?.presentationMode==='cockpit-ribbons'");
need('Persistente Auswahl',app,"presentationMode:'classic'");
for(const token of ['Klassisch','Cockpit · Register','Cockpit · Ribbons','Die klassische Ansicht bleibt Standard'])need('Einstellungen',app,token);
for(const token of [
 "const FORECAST_COCKPIT_MODULES:DashboardModuleId[]=['short-term','forecast','ensemble']",
 "forecastPresentationMode!=='classic'&&FORECAST_COCKPIT_MODULES.includes(id)",
 "if(id!==forecastCockpitAnchor)return null",
 'data-forecast-presentation={mode}'
])need('Keine Doppelmodule',token.includes('data-')?cockpit:app,token);

for(const token of [
 'Adaptive 24-Stunden-Zeitleiste',
 'Blaue Balken: Niederschlag · Höhe = mm · Deckkraft = Wahrscheinlichkeit',
 'adaptiveShortTermPoints',
 'flowDirection(point.direction)',
 'Böen ${wind(point.gust,unit)}'
])need('Kurzfrist-MeteoRibbon',cockpit,token);
for(const token of [
 'cockpit-seven-grid',
 'temperatureRange',
 'cockpit-day-temp-track',
 'cockpit-phase-line',
 '7-Tage-Trend',
 'DWD_WIND_THRESHOLDS_KMH'
])need('7-Tage-Wetterband',cockpit,token);
for(const token of [
 "type EnsembleMetric='temperature'|'precipitation'|'wind'",
 '14-Tage-Horizonts',
 'P10–P90',
 'ab Tag 8 zunehmend unsicher',
 'ScenarioBars',
 'MetricPreview',
 'cockpit-metric-preview',
 'ensembleConsistency'
])need('14-Tage-Unsicherheitshorizont',cockpit,token);
for(const token of [
 'role="tablist"',
 'onTouchStart=',
 'Math.abs(end-start)<55',
 'forecast-ribbon-stack',
 'forecast-ribbon-summary',
 'MiniRibbon',
 'Vollständige Analyse öffnen'
])need('Beide Cockpitvarianten',cockpit,token);
for(const token of [
 'ACTIVE_HORIZON_KEY',
 'ENSEMBLE_METRIC_KEY',
 'onSelectedDate(dateOnlyFromEpoch',
 'onSelectedDate(day.date)',
 'onSelectedDate(item.date)',
 'Best Match · {sourceLabel}'
])need('Gemeinsamer Fokus und Datenstand',cockpit,token);
for(const token of [
 '/* MID v0.9.2.0 · optionale Prognose-Cockpits */',
 '.forecast-cockpit',
 '.forecast-cockpit-tabs',
 '.forecast-ribbon-stack',
 '.cockpit-short-chart',
 '.cockpit-seven-grid',
 '.cockpit-ensemble-chart',
 '@media(max-width:680px)',
 '@media(max-width:420px)',
 '@media(prefers-reduced-motion:reduce)'
])need('Responsive Design',css,token);

forbid('Schwellenlogik',cockpit,'threshold:50');
forbid('Schwellenlogik',cockpit,'threshold:65');
need('Package-Skript',pkg,'test:forecast-cockpit');
need('Baseline-Vertrag',baseline,'scripts/test-forecast-cockpit-0920.mjs');

if(failures.length){
 console.error('Optionale Prognose-Cockpits unvollständig:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Klassische Standardansicht sowie Register- und Ribbon-Cockpit vollständig geprüft.');
