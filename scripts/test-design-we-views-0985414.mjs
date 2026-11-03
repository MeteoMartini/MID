import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const [cockpit,seven,sevenCss,fourteen,fourteenCss,horizon,todayCss,baselineText]=await Promise.all([
 read('src/ForecastCockpit.tsx'),read('src/SevenDayDesignModes.tsx'),read('src/midDesignWeSeven.css'),
 read('src/FourteenDayDevelopment.tsx'),read('src/midDesignWeFourteen.css'),read('src/HorizonSignalChart.tsx'),
 read('src/midDesignWeToday.css'),read('MID_BASELINE.json')
]);
const baseline=JSON.parse(baselineText),name='scripts/test-design-we-views-0985414.mjs';
for(const key of ['regressionTests','requiredRegressionTests','requiredFiles'])assert.ok(baseline[key].includes(name),name+' missing from '+key);
const sevenBand=cockpit.slice(cockpit.indexOf('function SevenDayBand('),cockpit.indexOf('function fallbackEnsembleDay('));
assert.ok(sevenBand.length>10000,'SevenDayBand must remain the canonical complete renderer');
assert.ok(sevenBand.indexOf('<SevenDayCurveOverview')>=0,'canonical continuous Skybar/meteogram missing');
assert.ok(sevenBand.indexOf('<LazySevenDayDesignModes')>sevenBand.indexOf('<SevenDayCurveOverview'),'A/B/C must stay beneath the unchanged continuous Skybar');
assert.ok(sevenBand.includes("sevenView==='standard'&&<div className=\"cockpit-seven-grid\""),'existing daily cards must remain in default A');
assert.ok(sevenBand.includes("onOpenDay={openDayFromTable}"),'C daily row must link back to the original hourly card');
assert.ok(cockpit.includes("useDisplayPreference<'standard'|'charts'|'table'>('ForecastCockpit.sevenDay.view','standard'"),'seven-day persisted standard default missing');
assert.ok(cockpit.includes("onClick={()=>{if(now90ExpandedId===item.id){setNow90ExpandedId(null)}"),'90min re-tap collapse missing');
assert.ok(cockpit.includes('data-mid-chart-focus={profileFocus}'),'parameter focus must remain wired');
for(const token of [
 "key:'standard'","key:'charts'","key:'table'",
 'Niederschlagsmenge · mm pro Tag','Niederschlagswahrscheinlichkeit · %',
 'Wind und Böen ·','Sonnenscheindauer · h pro Tag',
 'mid-we-seven-table-scroll','aria-pressed={mode===item.key}',
 'precipitationAvailable!==false','probabilityAvailable!==false',
 'sevenDayDetailedSeries','ensembleBounds','modelCount<1',
 "unit={windUnits[unit].label}"
])assert.ok(seven.includes(token),'seven-day view/data contract missing: '+token);
assert.ok(seven.includes('bars formatValue={compactPrecipitationAmount}'),'accumulated precipitation must be shown as discrete columns');
assert.ok(seven.includes('bars formatValue={value=>formatDecimalFixed(value,0)}'),'PoP must be distinct from amount');
assert.ok(!seven.includes('Math.max(0,day.precipitation)'),'missing precipitation must never become dry zero');
assert.ok(!seven.includes('day.probability||0'),'missing probability must never become 0%');
for(const token of ["key:'compact'","key:'charts'","key:'days'","mid-we-fourteen-table-scroll","fourteenPrecipitationSeries","fourteenProbabilitySeries","fourteenWindSeries"]){
 assert.ok(fourteen.includes(token),'fourteen-day A/B/C contract missing: '+token);
}
assert.ok(horizon.includes('bars=false'),'shared chart should default to unmodified legacy mode');
assert.ok(horizon.includes('dailySignalPaths'),'genuine consecutive daily dates should be required for lines');
assert.ok(horizon.includes('daily-accumulation-bar'),'daily amount and PoP should use discrete bars');
assert.ok(todayCss.includes('opacity:.20!important;'),'focus must override inline SVG opacity');
for(const css of [sevenCss,fourteenCss])for(const token of ['min-height:44px',':focus-visible','@media(max-width:','var(--text)']){
 assert.ok(css.includes(token),'responsive/a11y contract missing: '+token);
}
console.log('MID Design-WE .414: complete A/B/C 7d+14d, canonical 7d Skybar, Heute interactions, NoData, source quantiles, shared colors and responsive targets verified.');
