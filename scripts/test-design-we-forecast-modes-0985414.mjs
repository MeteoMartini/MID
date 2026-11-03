import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=relative=>readFile(new URL(relative,root),'utf8');
const [baselineText,cockpit,seven,fourteen,chart,sevenCss,fourteenCss,signer,activeSigner]=await Promise.all([
 read('MID_BASELINE.json'),
 read('src/ForecastCockpit.tsx'),
 read('src/SevenDayDesignModes.tsx'),
 read('src/FourteenDayDevelopment.tsx'),
 read('src/HorizonSignalChart.tsx'),
 read('src/midDesignWeSeven.css'),
 read('src/midDesignWeFourteen.css'),
 read('ci/github/workflows/mid-d2-original-release-approval.yml'),
 read('.github/workflows/mid-d2-original-release-approval.yml')
]);
const baseline=JSON.parse(baselineText);
const self='scripts/test-design-we-forecast-modes-0985414.mjs';
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])
 assert.ok(baseline[key].includes(self),'Mandatory baseline registration missing: '+key);
assert.equal(baseline.releaseVersion,'0.9.85.414');

const requireTokens=(content,tokens,part)=>tokens.forEach(token=>
 assert.ok(content.includes(token),part+' missing required source contract: '+token));
requireTokens(cockpit,[
 'SevenDayCurveOverview','LazySevenDayDesignModes',
 "ForecastCockpit.sevenDay.view",
 'onOpenDay={openDayFromTable}',
 "setSevenView('standard');onSelectedDate(date)",
 'if(now90ExpandedId===item.id){setNow90ExpandedId(null)}'
],'7-day original skybar and 90-minute interaction');
const sevenPart=cockpit.slice(cockpit.indexOf('function SevenDayBand('),cockpit.indexOf('function fallbackEnsembleDay('));
assert.ok(sevenPart.indexOf('<SevenDayCurveOverview')>=0);
assert.ok(sevenPart.indexOf('<LazySevenDayDesignModes')>sevenPart.indexOf('<SevenDayCurveOverview'),
 'The continuous native seven-day Skybar and graph must precede A/B/C modes');

requireTokens(seven,[
 "type SevenDayView='standard'|'charts'|'table'",
 'data-mid-seven-mode={mode}',
 'aria-pressed={mode===item.key}',
 "mode==='standard'",
 "mode==='charts'",
 "mode==='table'",
 'HorizonSignalChart',
 'dayPeriodHoursForDate',
 'probabilityAvailable!==false',
 'precipitationAvailable!==false',
 'Number.isFinite',
 'Number.NaN'
],'7-day A/B/C and no-data semantic contract');
requireTokens(fourteen,[
 'data-mid-fourteen-view={mode}',
 'aria-pressed={mode===item.key}',
 "mode==='charts'",
 'useDisplayPreference',
 'HorizonSignalChart'
],'14-day A/B/C and preference contract');
requireTokens(chart,[
 'dailySignalPaths',
 'point.mean===null',
 'time-previousTime!==86400000',
 'point.low!=null&&point.high!=null',
 'point.q25!=null&&point.q75!=null'
],'daily calendar/missing data and authentic quantile paths');
for(const [name,css] of [['7d',sevenCss],['14d',fourteenCss]]){
 requireTokens(css,['@media','min-height:44px','overflow-x:auto',':focus-visible'],'responsive '+name);
 assert.doesNotMatch(css,/display:\s*none\s*!important/,'Forecast modes must not hide existing source data');
}
assert.equal(signer,activeSigner,'Protected DWD signer canonical and active workflow must be byte-identical');
const before=signer.indexOf('Revalidate protected Stable and source immediately before signing');
const attestation=signer.indexOf('Official cryptographic provenance attestation');
const verify=signer.indexOf('Verify exact SLSA signer and index digest');
const after=signer.indexOf('Revalidate protected Stable and index after attestation before handoff');
const archive=signer.indexOf('Archive signed original D2 evidence, not deployed data');
assert.ok(before>=0&&before<attestation&&attestation<verify&&verify<after&&after<archive,
 'DWD original SHA fencing must straddle cryptographic SLSA attestation and archive');
assert.match(signer,/No Pages\/R2\/Worker activation/);
assert.doesNotMatch(signer,/continue-on-error|permissions:\s*\n\s*contents:\s*write/,
 'Original signer may never write production or bypass failed evidence');
console.log('MID .414 forecast design: 7d/14d A-B-C, 90min toggle, real missing-data/calendar semantics, touch/keyboard/mobile CSS and DWD signed-source fencing confirmed.');
