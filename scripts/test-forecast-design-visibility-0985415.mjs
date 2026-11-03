import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(path,'utf8');
const [cockpit,seven,fourteen,sevenCss,fourteenCss,baselineText]=await Promise.all([
 read('src/ForecastCockpit.tsx'),read('src/SevenDayDesignModes.tsx'),
 read('src/FourteenDayDevelopment.tsx'),read('src/midDesignWeSeven.css'),
 read('src/midDesignWeFourteen.css'),read('MID_BASELINE.json')
]);
const baseline=JSON.parse(baselineText);
const guard='scripts/test-forecast-design-visibility-0985415.mjs';
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])
 assert.ok(baseline[key].includes(guard),guard+' missing in '+key);
const sevenBand=cockpit.slice(cockpit.indexOf('function SevenDayBand('),cockpit.indexOf('function fallbackEnsembleDay('));
const fourteenBand=cockpit.slice(cockpit.indexOf('function FourteenDayHorizon('),cockpit.indexOf('function ',cockpit.indexOf('function FourteenDayHorizon(')+24));
assert.ok(sevenBand.length>10000&&fourteenBand.length>3000,'Both canonical forecast renderers must exist');
const beforeGraph=sevenBand.indexOf('mid-we-seven-switch-primary');
const graph=sevenBand.indexOf('<SevenDayCurveOverview');
const belowGraph=sevenBand.indexOf('<LazySevenDayDesignModes');
assert.ok(0<beforeGraph&&beforeGraph<graph&&graph<belowGraph,'Seven-day mode control must be immediately discoverable while the unmodified continuous Skybar remains above A/B/C content');
assert.ok(sevenBand.includes("label:'A · Standard'")&&sevenBand.includes("label:'B · Grafik'")&&sevenBand.includes("label:'C · Tabelle'"),'All three modes must have visible A/B/C affordances');
assert.ok(sevenBand.includes('showModeSwitch={false}')&&seven.includes('showModeSwitch=true'),'Only one selector is rendered: early in the canonical 7d band');
assert.ok(sevenBand.includes("useDisplayPreference<'standard'|'charts'|'table'>('ForecastCockpit.sevenDay.view','standard'"),'A must remain the persisted default');
assert.ok(sevenBand.includes("const [expandedSevenDate,setExpandedSevenDate]=useState<string|null>(null)"),'No implicit 911px-long hourly accordion at first visit');
assert.ok(sevenBand.includes('isExpanded=expandedSevenDate===day.date;'),'Hour details must use independent opt-in state, not automatically open selectedDate');
assert.ok(sevenBand.includes('setExpandedSevenDate(current=>current===date?null:date)'),'Repeated tap must collapse the selected daily detail');
assert.ok(sevenBand.includes("setSevenView('standard');setExpandedSevenDate(date);onSelectedDate(date)"),'C must open complete hourly detail via A');
assert.ok(sevenBand.includes('aria-expanded={isExpanded}')&&sevenBand.includes('aria-controls={`mid-seven-detail-${day.date}`}'),'Accessible expanded state and stable ID mandatory');
const compact=sevenBand.slice(sevenBand.indexOf('const compact=<button'),sevenBand.indexOf('const detail=<section'));
const detail=sevenBand.slice(sevenBand.indexOf('const detail=<section'));
assert.ok(!compact.includes('<ForecastRangeGuide'),'Full per-day uncertainty tile must not inflate every compact A card');
assert.ok(detail.includes('<ForecastRangeGuide')&&detail.includes('{hourlyDetail??<p role="status">'),'Original source uncertainties remain available with explicit missing hourly values');
assert.ok(sevenBand.includes('<SkyBarSegmentsSvg')&&sevenBand.includes('<CockpitSkybarNightBandsSvg'),'Per-day original Skybar and night bands remain intact');
assert.ok(sevenBand.includes('selectedDate={selected.date}')&&sevenBand.includes('onSelectedDate={chooseDay}'),'Canonical continuous Skybar must still control hourly day detail');
const detailed= fourteenthBand.indexOf('<LazyFourteenDayDevelopment');
const compass=fourteenBand.indexOf('<CockpitForecastGuide');
assert.ok(detailed>0&&compass>detailed,'14d A/B/C must render BEFORE the large provenance compass, not hidden below first viewport');
assert.ok(fourteenBand.includes('<LazyFourteenDayDevelopment series={series} unit={unit} onOpenDay='),'The selected 14d wind unit and interactive full-detail handoff must be retained');
assert.ok(fourteenBand.includes('<ForecastRangeLegend')&&fourteenBand.includes('data-fourteen-daily-details'),'Legacy uncertainty legend and complete day cards must remain');
assert.ok(fourteen.includes("mode==='compact'")&&fourteen.includes("mode==='charts'")&&fourteen.includes("mode==='days'"),'14-day A/B/C remain fully functional');
for(const [name,css] of [['7d',sevenCss],['14d',fourteenCss]]){
 assert.ok(css.includes(':focus-visible')&&css.includes('min-height:44px')&&css.includes('@media(max-width:'),'Responsive touch and keyboard contract: '+name);
}
assert.ok(sevenCss.includes('.mid-we-seven-switch-primary'),'Top A/B/C selector must have styling');
assert.ok(seven.includes('mid-we-seven-daycard')&&seven.includes('aria-controls={open?')&&seven.includes('mode===\'standard\''),'A has seven accessible visual daycards, not only a legacy hint');
assert.ok(sevenBand.includes('visible.filter(day=>day.date===expandedSevenDate)')&&sevenBand.includes('expandedSevenDate!==null'),'Only an explicitly selected complete original day detail is mounted');
assert.ok(fourteen.includes('mid-we-fourteen-weeks')&&fourteen.includes('mid-we-fourteen-daytile')&&fourteen.includes('mid-we-fourteen-chart-feature'),'A has two real week tracks and original uncertainty graph');
assert.ok(fourteenBand.includes('id="mid-fourteen-full-details"')&&fourteenBand.includes('setShowFourteenDayDetails(true)'),'Original fourteen daily detail cards remain reachable by A');
assert.ok(sevenCss.includes('.mid-we-seven-daycard')&&fourteenCss.includes('.mid-we-fourteen-weekscroll'),'New visual cards and responsive week scroll must be styled');
console.log('MID Design-WE 1.2: 7d A visually compact with original details opt-in, 7d B/C chart/table, 14d A two real weeks, B/C separate, canonical graph/quantiles/Skybar all retained.');
