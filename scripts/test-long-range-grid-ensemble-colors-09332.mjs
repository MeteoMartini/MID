import {readFile} from 'node:fs/promises';
const [seasonal,panel,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/seasonalForecast.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/LongRangePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(scope,text,token)=>{if(!text.includes(token))failures.push(`${scope}: fehlt ${token}`)};
for(const token of ["cell_selection:'nearest'",'temperatureAnomalyLow','temperatureAnomalyHigh','precipitationAnomalyPercentLow','precipitationAnomalyPercentHigh','ensembleMembers','nearestC3sGridPoint','gridLabel:\'C3S 1° × 1° · nächster Gitterpunkt\'','ensembleCapable:true'])need('seasonalForecast',seasonal,token);
for(const token of ['temperatureAnomalyColor','precipitationAnomalyColor','ensemble-spread','10–90 % Ensemble','long-range-model-selector','Nächster Punkt','blau = kälter · rot = wärmer','braun = trockener · blau/türkis = feuchter'])need('LongRangePanel',panel,token);
for(const token of ['.long-range-chart .ensemble-spread line{','.long-range-scale.temperature i:first-of-type{','.long-range-scale.precipitation i:first-of-type{','.long-range-model-selector{'])need('styles',styles,token);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);if(pv!=='0.9.33.2')failures.push(`unerwartete Version ${pv}`);
if(failures.length){console.error('MID v0.9.33.2 Langfrist-Gitter/Ensemble/Farbprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID v0.9.33.2: nächster Gitterpunkt, Ensemble-Spannen, Multi-Modell-Struktur und divergierende Langfristfarben geprüft.');
