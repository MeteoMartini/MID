import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const styles=await readFile(new URL('../src/styles.css',import.meta.url),'utf8');
const failures=[];
for(const token of [
 "[rainCumulative,setRainCumulative]=useState(false)",
 "const cumulativeRainData=useMemo<TrendRow[]>(()",
 "bestTotal+=Math.max(0,Number(row.bestPrecipitation)||0)",
 "lowTotal+=dailyLow",
 "highTotal+=dailyHigh",
 "cumulativeLowPlot:lowTotal",
 "cumulativeBandPlot:Math.max(0,highTotal-lowTotal)",
 "className={`rain-cumulative-toggle${rainCumulative?' active':''}`}",
 ">kumuliert</b>",
 "stackId=\"rain-cumulative-band\"",
 "dataKey=\"cumulativeLowPlot\"",
 "dataKey=\"cumulativeBandPlot\"",
 "dataKey=\"bestPrecipitation\"",
 "<RainTooltip cumulative advancedMode={advancedMode}"
]) if(!source.includes(token))failures.push(`EnsemblePanel fehlt: ${token}`);
for(const token of ['.rain-cumulative-toggle{','.rain-chart-toolbar{','.rain-legend i.area.cumulative{'])if(!styles.includes(token))failures.push(`Styles fehlen: ${token}`);
if(failures.length){console.error(`MID v0.9.36.0 kumuliertes Ensemble-Niederschlagsdiagramm unvollständig:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID: 14-Tage-Ensemble-Niederschlag behält Tagesansicht und bietet kumulierte P10–P90-Darstellung.');
