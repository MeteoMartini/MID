import {readFile} from 'node:fs/promises';

const [panel,styles]=await Promise.all([
  readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
  'ENSEMBLE_TEMP_EXPORT_CHART_WIDTH=1000',
  'className="ensemble-temp-plot"',
  'ensemble-temp-axis-title-left',
  'ensemble-temp-axis-title-bottom',
  '<b>Temperatur</b><small>°C</small>',
  'exportWidth={ENSEMBLE_TEMP_EXPORT_CHART_WIDTH}'
])if(!panel.includes(token))failures.push(`Struktur der Temperaturachsen fehlt: ${token}`);
const trendStart=panel.indexOf('function CombinedTrendChart(');
const trendEnd=panel.indexOf('\nfunction RainLegend(',trendStart);
const trendBlock=trendStart>=0&&trendEnd>trendStart?panel.slice(trendStart,trendEnd):'';
for(const obsolete of [
  "label={{value:'Temperatur (°C)'",
  "label={{value:'Vorhersagetag'"
])if(trendBlock.includes(obsolete))failures.push(`Recharts-Achsentitel darf im Temperaturdiagramm nicht mehr verwendet werden: ${obsolete}`);
for(const token of [
  '.ensemble-temp-plot{',
  'grid-template-columns:44px minmax(0,1fr) 38px',
  '.ensemble-temp-chart-core{',
  'writing-mode:vertical-rl',
  '@media(max-width:620px)',
  'grid-template-rows:22px minmax(0,1fr)',
  '.ensemble-chart-export.ensemble-exporting .ensemble-temp-plot{',
  'grid-template-columns:42px 1000px 38px',
  'width:1000px!important'
])if(!styles.includes(token))failures.push(`Responsives Temperatur-Achsentitel-Styling fehlt: ${token}`);
if(failures.length){
  console.error('Ensemble-Temperaturachsen fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Ensemble-Temperaturachsen geprüft: externe Titel bleiben auf Desktop, Mobil und im Export lesbar.');
