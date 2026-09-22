import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [ensemble,climate,widgetSettings,widgetImage,widgetUrls,styles,main]=await Promise.all([
  read('src/EnsemblePanel.tsx'),
  read('src/ClimatePanel.tsx'),
  read('src/AppleWidgetSettings.tsx'),
  read('src/widgetImageExport.ts'),
  read('src/widgetUrlExports.ts'),
  read('src/midC18WorkPackageG.css'),
  read('src/main.tsx'),
]);

// Ensemble: bestehende 14-Tage-Fachlogik bleibt erhalten; jeder Mini-Datenpunkt besitzt
// bereits eine individuelle, aus den echten Tageswerten gebildete Beschreibung.
assert.ok(ensemble.includes('data.slice(0,14)'), 'Ensemble-Metrikdeck muss weiter 14 Tage verwenden.');
for(const token of [
  'function ResponsiveEnsembleTooltip',
  'className={`ensemble-pro-tooltip',
  'title={`${row.label}: ${Number.isFinite(anomaly)',
  'title={`${row.label}: ${formatDecimalFixed(row.bestPrecipitation,1)} mm',
  'title={`${row.label}: Wind ${formatWind(row.bestWind',
  'aria-label="Ensembleparameter auswählen"',
  'Temperatur-Ensemble mit Unsicherheitsband und Best Match'
]) assert.ok(ensemble.includes(token),`Ensemble-/Tooltip-Vertrag fehlt: ${token}`);

// Klima: echte Klimadaten und drei vorhandene Messflächen bleiben erhalten.
for(const token of [
  'climate-panel',
  'climate-metrics',
  'climate-metric',
  'climate-metric-line',
  'climate-score-card'
]) assert.ok(climate.includes(token),`Klima-Vertrag fehlt: ${token}`);

// Widgets: bestehende native Einstellungen und Exportpfade bleiben unverändert verfügbar.
for(const token of ['apple-widget-settings','apple-widget-readiness-grid','apple-widget-feed-card'])
  assert.ok(widgetSettings.includes(token),`Widget-Einstellungsvertrag fehlt: ${token}`);
assert.ok(widgetImage.includes('freezeWidgetSvgPaintsForExport'), 'Rasterexport muss erhalten bleiben.');
assert.ok(widgetUrls.includes("export type WidgetUrlTheme='light'|'dark'"), 'Light/Dark-Widgetexport muss erhalten bleiben.');
assert.ok(widgetUrls.includes("export const WIDGET_URL_VIEWS")&&widgetUrls.includes("widgetUrlExportVariants"), 'Widget-Varianten-/Exportlogik muss erhalten bleiben.');

// G ist die letzte UI-Schicht und schützt Responsive/Light-Dark ohne Fachlogik zu verändern.
assert.ok(main.includes("import './midC18WorkPackageG.css';"), 'Arbeitspaket-G-CSS muss geladen werden.');
const responsiveImport=main.indexOf("import './midC18ResponsiveCorrections.css';");
const gImport=main.indexOf("import './midC18WorkPackageG.css';");
assert.ok(gImport>responsiveImport, 'G muss nach den bisherigen Responsive-Korrekturen geladen werden.');

for(const token of [
  '.ensemble-pro-tooltip',
  'max-width: min(390px, calc(100vw - 32px))',
  '.ensemble-metric-deck',
  'grid-template-columns: repeat(3, minmax(0, 1fr))',
  '.climate-metrics',
  '.apple-widget-readiness-grid',
  'min-height: 44px',
  'overflow-wrap: anywhere',
  '@media (max-width: 720px)',
  '@media (max-width: 430px)',
  '@media (max-width: 850px) and (orientation: landscape)',
  'overflow-x: clip'
]) assert.ok(styles.includes(token),`G-Responsivevertrag fehlt: ${token}`);

assert.ok(!styles.includes('min-width: 640px'), 'G darf keine starre Smartphone-Mindestbreite einführen.');
assert.ok(!styles.includes('overflow-x: auto'), 'G darf keinen neuen horizontalen Scrollvertrag einführen.');

console.log('MID v0.9.85.88+: Arbeitspaket G Ensemble/Klima/Widgets – Tooltip-, Responsive- und Exportverträge geschützt.');
