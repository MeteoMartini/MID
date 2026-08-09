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
 'precipitationQ25:number;precipitationQ75:number;',
 'precipitationQ25=weightedQuantile(rainVals,.25)',
 'precipitationQ75=weightedQuantile(rainVals,.75)',
 'precipitationQ25:Number.isFinite(precipitationQ25)?precipitationQ25:0',
 'precipitationQ75:Number.isFinite(precipitationQ75)?precipitationQ75:0'
]) if(!weather.includes(token)) failures.push(`weather.ts fehlt: ${token}`);
for(const token of [
 'cumulativeQ25Plot?:number;',
 'cumulativeQBandPlot?:number;',
 'q25Total+=dailyQ25;q75Total+=dailyQ75',
 'cumulativeQ25Plot:q25Total',
 'cumulativeQBandPlot:Math.max(0,q75Total-q25Total)',
 'dataKey="cumulativeQ25Plot"',
 'dataKey="cumulativeQBandPlot"',
 'fill="#1687d5" fillOpacity={.38}',
 'P10–P90 · P25–P75',
 'className="area cumulative quartile"'
]) if(!panel.includes(token)) failures.push(`EnsemblePanel.tsx fehlt: ${token}`);
if(!styles.includes('.rain-legend i.area.cumulative.quartile{')) failures.push('Styles für dunkleres kumuliertes P25–P75-Band fehlen.');
const version=JSON.parse(pkg).version,base=JSON.parse(baseline).releaseVersion;
if(version!==base) failures.push(`Version/Baseline nicht synchron: ${version}/${base}`);
if(failures.length){console.error(`MID kumuliertes Niederschlags-P25–P75 fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID: kumuliertes Niederschlagsdiagramm enthält P10–P90 plus dunkleres P25–P75-Band.');
