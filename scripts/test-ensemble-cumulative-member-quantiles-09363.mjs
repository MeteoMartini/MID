import {readFile} from 'node:fs/promises';
const [panel,weather,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const helper=await readFile(new URL('../src/ensembleCumulativeDisplay.ts',import.meta.url),'utf8');
const failures=[];
for(const token of [
 'cumulativePrecipitationMean:number;cumulativePrecipitationLow:number;cumulativePrecipitationHigh:number;cumulativePrecipitationQ25:number;cumulativePrecipitationQ75:number;',
 'cumulativeTargetDates=new Set(allDates.slice(0,lead+1))',
 'covered.length!==cumulativeTargetDates.size',
 'cumulativeRainVals.push({value:total,weight:cumulativeWeight})',
 'cumulativePrecipitationLow=weightedQuantile(cumulativeRainVals,.1)',
 'cumulativePrecipitationQ25=weightedQuantile(cumulativeRainVals,.25)',
 'cumulativePrecipitationQ75=weightedQuantile(cumulativeRainVals,.75)',
 'cumulativePrecipitationHigh=weightedQuantile(cumulativeRainVals,.9)',
 'day.cumulativePrecipitationQ75].every(Number.isFinite)'
]) if(!weather.includes(token)) failures.push(`weather.ts fehlt: ${token}`);
for(const token of [
 'ensembleCumulativeRainStep(row,bestTotal,index)',
 'cumulativeLowPlot?:number;',
 'cumulativeBandPlot?:number;',
 'cumulativeQ25Plot?:number;',
 'cumulativeQBandPlot?:number;',
 'const rainChartData=rainCumulative?cumulativeRainData:d;',
 'const cumulativeRainData=useMemo<TrendRow[]>(()'
]) if(!panel.includes(token)) failures.push(`EnsemblePanel.tsx fehlt: ${token}`);
for(const token of [
 'cumulativeQ25Plot:index<7&&hasQuartiles?q25:undefined',
 'cumulativeQBandPlot:index<7&&hasQuartiles?Math.max(0,q75-q25):undefined',
 'const hasQuartiles=hasRange&&finite(row.cumulativePrecipitationQ25)&&finite(row.cumulativePrecipitationQ75)'
])if(!helper.includes(token))failures.push(`Member quantile contract missing: ${token}`);
if(panel.includes('q25Total+=dailyQ25')||panel.includes('q75Total+=dailyQ75')) failures.push('Kumulierte Quartile werden weiterhin fälschlich aus täglichen Quartilen aufsummiert.');
const version=JSON.parse(pkg).version,base=JSON.parse(baseline).releaseVersion;
if(version!==base) failures.push(`Version/Baseline nicht synchron: ${version}/${base}`);
if(failures.length){console.error(`MID kumulierte Member-Quartile fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID: kumulierte Niederschlagsquartile werden aus vollständigen Member-Trajektorien statt aus täglichen Quartilen berechnet.');
