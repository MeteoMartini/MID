import {readFile} from 'node:fs/promises';
const [panel,weather,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 'precipitationQ25:number;precipitationQ75:number;cumulativePrecipitationMean:number;cumulativePrecipitationLow:number;cumulativePrecipitationHigh:number;cumulativePrecipitationQ25:number;cumulativePrecipitationQ75:number;',
 'cumulativePrecipitationQ25=weightedQuantile(cumulativeRainVals,.25)',
 'cumulativePrecipitationQ75=weightedQuantile(cumulativeRainVals,.75)',
 'cumulativePrecipitationQ25:Number.isFinite(cumulativePrecipitationQ25)?cumulativePrecipitationQ25:0',
 'cumulativePrecipitationQ75:Number.isFinite(cumulativePrecipitationQ75)?cumulativePrecipitationQ75:0'
]) if(!weather.includes(token)) failures.push(`weather.ts fehlt: ${token}`);
for(const token of [
 'cumulativeQ25Plot?:number;',
 'cumulativeQBandPlot?:number;',
 'row.cumulativePrecipitationQ25',
 'row.cumulativePrecipitationQ75',
 'cumulativeQ25Plot:q25',
 'cumulativeQBandPlot:Math.max(0,q75-q25)',
 'dataKey="cumulativeQ25Plot"',
 'dataKey="cumulativeQBandPlot"',
 'fill="#1687d5" fillOpacity={.38}',
 'P10–P90 · P25–P75',
 'className="area cumulative quartile"'
]) if(!panel.includes(token)) failures.push(`EnsemblePanel.tsx fehlt: ${token}`);
if(panel.includes('q25Total+=dailyQ25')) failures.push('Kumuliertes P25 wird weiterhin aus Tagesquartilen addiert.');
if(!styles.includes('.rain-legend i.area.cumulative.quartile{')) failures.push('Styles für dunkleres kumuliertes P25–P75-Band fehlen.');
const version=JSON.parse(pkg).version,base=JSON.parse(baseline).releaseVersion;
if(version!==base) failures.push(`Version/Baseline nicht synchron: ${version}/${base}`);
if(failures.length){console.error(`MID kumuliertes Niederschlags-P25–P75 fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID: kumuliertes Niederschlagsdiagramm enthält P10–P90 plus echtes memberbasiertes P25–P75-Band.');
