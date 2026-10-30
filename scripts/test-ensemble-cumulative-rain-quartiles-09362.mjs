import {readFile} from 'node:fs/promises';
const [panel,weather,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const helper=await readFile(new URL('../src/ensembleCumulativeDisplay.ts',import.meta.url),'utf8');
const failures=[];
for(const token of [
 'precipitationQ25:number;precipitationQ75:number;cumulativePrecipitationMean:number;cumulativePrecipitationLow:number;cumulativePrecipitationHigh:number;cumulativePrecipitationQ25:number;cumulativePrecipitationQ75:number;',
 'cumulativePrecipitationQ25=weightedQuantile(cumulativeRainVals,.25)',
 'cumulativePrecipitationQ75=weightedQuantile(cumulativeRainVals,.75)',
 'cumulativePrecipitationQ25:Number.isFinite(cumulativePrecipitationQ25)?cumulativePrecipitationQ25:Number.NaN',
 'cumulativePrecipitationQ75:Number.isFinite(cumulativePrecipitationQ75)?cumulativePrecipitationQ75:Number.NaN'
]) if(!weather.includes(token)) failures.push(`weather.ts fehlt: ${token}`);
for(const token of [
 'cumulativeQ25Plot?:number;',
 'cumulativeQBandPlot?:number;',
 'ensembleCumulativeRainStep(row,bestTotal,index)',
 'const rainChartData=rainCumulative?cumulativeRainData:d;',
 'cumulativeLowPlot?:number;',
 'cumulativeBandPlot?:number;',
 'dataKey="cumulativeQ25Plot"',
 'dataKey="cumulativeQBandPlot"',
 'fill="var(--param-precipitation)" fillOpacity={.38}',
 'P10–P90 · P25–P75',
 'className="area cumulative quartile"'
]) if(!panel.includes(token)) failures.push(`EnsemblePanel.tsx fehlt: ${token}`);
for(const token of [
 'cumulativeQ25Plot:index<7&&hasQuartiles?q25:undefined',
 'cumulativeQBandPlot:index<7&&hasQuartiles?Math.max(0,q75-q25):undefined',
 'const hasQuartiles=hasRange&&finite(row.cumulativePrecipitationQ25)&&finite(row.cumulativePrecipitationQ75)'
])if(!helper.includes(token))failures.push(`Quantile helper missing: ${token}`);
if(panel.includes('q25Total+=dailyQ25')) failures.push('Kumuliertes P25 wird weiterhin aus Tagesquartilen addiert.');
if(!styles.includes('.rain-legend i.area.cumulative.quartile{')) failures.push('Styles für dunkleres kumuliertes P25–P75-Band fehlen.');
const version=JSON.parse(pkg).version,base=JSON.parse(baseline).releaseVersion;
if(version!==base) failures.push(`Version/Baseline nicht synchron: ${version}/${base}`);
if(failures.length){console.error(`MID kumuliertes Niederschlags-P25–P75 fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID: kumuliertes Niederschlagsdiagramm enthält P10–P90 plus echtes memberbasiertes P25–P75-Band.');
