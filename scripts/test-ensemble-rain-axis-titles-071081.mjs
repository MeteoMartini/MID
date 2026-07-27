import {readFile} from 'node:fs/promises';

const [panel,styles]=await Promise.all([
  readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
  'ENSEMBLE_RAIN_EXPORT_CHART_WIDTH=992',
  'className={`ensemble-rain-plot',
  'ensemble-rain-axis-title-left',
  'ensemble-rain-axis-title-right',
  'ensemble-rain-axis-title-bottom',
  '<b>Niederschlag</b><small>mm</small>',
  '<b>Wahrscheinlichkeit</b><small>%</small>',
  'exportWidth={ENSEMBLE_RAIN_EXPORT_CHART_WIDTH}'
])if(!panel.includes(token))failures.push(`Struktur der Niederschlagsachsen fehlt: ${token}`);
const rainStart=panel.indexOf('<div ref={rainExportRef}');
const rainEnd=panel.indexOf('</section>',rainStart);
const rainBlock=rainStart>=0&&rainEnd>rainStart?panel.slice(rainStart,rainEnd):'';
for(const obsolete of [
  "label={{value:'Niederschlag (mm)'",
  "label={showRainProbability?{value:'Wahrscheinlichkeit'",
  "label={{value:'Vorhersagetag'"
])if(rainBlock.includes(obsolete))failures.push(`Recharts-Achsentitel darf im Niederschlagsdiagramm nicht mehr verwendet werden: ${obsolete}`);
for(const token of [
  '.ensemble-rain-plot{',
  'grid-template-columns:44px minmax(0,1fr) 52px',
  '.ensemble-rain-chart-core{',
  'writing-mode:vertical-rl',
  '@media(max-width:620px)',
  'grid-template-rows:22px minmax(0,1fr)',
  '.ensemble-chart-export.ensemble-exporting .ensemble-rain-plot{',
  'grid-template-columns:42px 992px 46px',
  'width:992px!important',
  '.ensemble-chart-export .chart.rain{height:270px!important}'
])if(!styles.includes(token))failures.push(`Responsives Achsentitel-Styling fehlt: ${token}`);
if(failures.length){
  console.error('Ensemble-Niederschlagsachsen fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Ensemble-Niederschlagsachsen geprüft: externe Titel bleiben auf Desktop, Mobil und im Export lesbar.');
