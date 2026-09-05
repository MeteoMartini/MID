import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript-strada')
const source=fs.readFileSync(new URL('../src/ensembleAssessment.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const awaitedModule=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const {buildEnsembleEvidence,assessEnsembleDay,agreementWindows,firstAgreementChange,ensembleLeadFactor,ENSEMBLE_PARAMETERS}=awaitedModule;
const now=Date.parse('2026-09-05T06:00:00Z'),date='2026-09-05';
const row={max:20,min:10,precipitation:0,wind:10,gust:20,sunshineDuration:21600,daylightSeconds:43200,complete:Object.fromEntries(ENSEMBLE_PARAMETERS.map(k=>[k,true]))};
const group=(id,override={})=>({group:id,native:true,initialisationTime:'2026-09-05T00:00:00Z',updateHours:6,expectedMembers:10,rows:Array.from({length:10},()=>structuredClone(row)),weights:{temperature:1,precipitation:1,wind:1,sunshine:1},...override});
const evidence=()=>buildEnsembleEvidence([group('a'),group('b')],now);
const assess=(e,dayDate=date,calibration)=>assessEnsembleDay({date:dayDate,consistencyEvidence:e},now,calibration);
const base=assess(evidence());
assert.equal(base.agreement,'high');assert.equal(base.dataQuality,'good');assert.equal(base.complete,true);assert.ok(base.confidenceScore>=90);
// One weak parameter no longer automatically dictates the whole day.
for(const [key,field,value,dayExpected] of [['temperature','high',40,'high'],['precipitation','high',20,'medium'],['wind','secondaryHigh',60,'high'],['sunshine','high',1.1,'high']]){const e=evidence();e[key][field]=value;const result=assess(e),parameter=result.parameters.find(p=>p.key===key);assert.equal(parameter.agreement,key==='precipitation'||key==='sunshine'?'low':'medium',key);assert.equal(result.agreement,dayExpected,`${key} must be robustly aggregated instead of worst-parameter wins`);}
// A 50:50 wet/dry outcome is an event uncertainty, not a confidence penalty.
const wet=evidence();wet.precipitation.eventProbability=50;const wetAssessment=assess(wet);assert.equal(wetAssessment.parameters[1].agreement,'high');assert.equal(wetAssessment.parameters[1].decisionUncertainty,'open');assert.match(wetAssessment.parameters[1].detail,/ohne Konfidenzstrafe/);
// Missing sunshine is a data-quality issue, not an automatic meteorological downgrade.
const noSun=evidence();delete noSun.sunshine;const noSunAssessment=assess(noSun);assert.equal(noSunAssessment.agreement,'high');assert.equal(noSunAssessment.dataQuality,'limited');
// Missing one core parameter limits the overall statement but does not erase the usable core evidence.
const noRain=evidence();delete noRain.precipitation;const noRainAssessment=assess(noRain);assert.equal(noRainAssessment.agreement,'medium');assert.equal(noRainAssessment.dataQuality,'poor');assert.equal(noRainAssessment.parameters[0].agreement,'high');
const noRainWind=evidence();delete noRainWind.precipitation;delete noRainWind.wind;assert.equal(assess(noRainWind).agreement,'unknown','Fewer than two core parameters cannot support a day confidence.');
assert.equal(assessEnsembleDay({date},now).agreement,'unknown','Legacy cache without provenance');
// High confidence can describe hazardous weather if models agree.
const storm=buildEnsembleEvidence([group('a'),group('b')].map(g=>({...g,rows:g.rows.map(r=>({...r,precipitation:80,wind:65,gust:90}))})),now);assert.equal(assess(storm).agreement,'high','High confidence must not mean fair weather');
const partial=buildEnsembleEvidence([group('a'),group('b')].map(g=>({...g,rows:g.rows.map(r=>({...r,complete:{...r.complete,wind:false}}))})),now);assert.equal(assess(partial).parameters[2].agreement,'unknown');assert.equal(assess(partial).parameters[0].agreement,'high');
assert.equal(assess(buildEnsembleEvidence([group('a',{native:false}),group('b',{native:false})],now)).agreement,'unknown','Synthetic mean/spread are not native members');
// Freshness and coverage now affect data quality first; meteorological spread remains separate.
const unknownRun=assess(buildEnsembleEvidence([group('a',{initialisationTime:undefined}),group('b')],now));assert.equal(unknownRun.dataQuality,'poor');assert.equal(unknownRun.agreement,'medium');
const deficient=assess(buildEnsembleEvidence([group('a',{expectedMembers:40}),group('b')],now));assert.equal(deficient.dataQuality,'poor');assert.equal(deficient.agreement,'medium');
const duplicate=buildEnsembleEvidence([group('a'),group('a'),group('b',{rows:Array.from({length:100},()=>({...row,precipitation:5})),expectedMembers:100})],now);assert.ok(Math.abs(duplicate.precipitation.eventProbability-50)<1e-10,'Group/variant normalization independent of member count');
// Expected families are parameter-specific: a model that structurally has no sunshine field is not a sunshine outage.
const withoutSunDeclaration=group('c',{rows:Array.from({length:10},()=>({...row,complete:{temperature:true,precipitation:true,wind:true}}))});const parameterExpected=buildEnsembleEvidence([group('a'),group('b'),withoutSunDeclaration],now);assert.equal(parameterExpected.sunshine.coverage.expectedFamilies,2);assert.equal(parameterExpected.temperature.coverage.expectedFamilies,3);
// Lead normalization widens spread tolerances while a lead cap prevents implausible certainty far out.
assert.equal(ensembleLeadFactor(24),1);assert.ok(ensembleLeadFactor(168)>1.2);assert.ok(ensembleLeadFactor(336)>1.6);
const broad=evidence();broad.temperature.high=28;broad.temperature.low=20;const near=assess(broad,'2026-09-05'),far=assess(broad,'2026-09-17');assert.ok(far.parameters[0].score>near.parameters[0].score,'Same spread should be normalized against longer lead time');assert.ok(far.confidenceScore<=77,'Long lead confidence is capped despite normalized spread');
// Existing local verification only applies as a shrinkage-limited correction within about 96 h.
const calibration={sampleDays:20,global:{parameters:{temperature:{samples:20,error:1.2},precipitation:{samples:20,error:1.5},wind:{samples:20,error:3},sunshine:{samples:20,error:1}},rainProbability:{samples:20,error:.12}}};const calibrated=assess(broad,date,calibration);assert.equal(calibrated.calibrationApplied,true);assert.ok(calibrated.parameters.some(p=>p.calibrationAdjustment>0));const tooFar=assess(broad,'2026-09-12',calibration);assert.equal(tooFar.calibrationApplied,false,'Short-range local skill must not be extrapolated into long range');
const days=Array.from({length:5},(_,i)=>({...assess(evidence()),date:`2026-09-${String(5+i).padStart(2,'0')}`}));assert.deepEqual(agreementWindows(days),[{start:'2026-09-05',end:'2026-09-09',days:5}]);const changed=evidence();changed.precipitation.high=20;days[2]=assessEnsembleDay({date:'2026-09-07',consistencyEvidence:changed},now);assert.equal(firstAgreementChange(days)?.date,'2026-09-07');assert.equal(agreementWindows(days,'temperature')[0].days,5);assert.equal(agreementWindows([days[0],days[4]]).length,2,'Calendar gap breaks window');assert.equal(firstAgreementChange([days[0],days[2]]),null,'No inferred transition over missing day');
// Render actual shared UI when project dependencies are installed; GitHub CI always exercises this branch.
let React=null,renderToStaticMarkup=null;try{React=require('react');({renderToStaticMarkup}=require('react-dom/server'))}catch{}
if(React&&renderToStaticMarkup){
 const uiSource=fs.readFileSync(new URL('../src/ForecastConfidence.tsx',import.meta.url),'utf8');
 const uiCode=ts.transpileModule(uiSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const module={exports:{}};new Function('require','module','exports',uiCode)(id=>id==='./ensembleAssessment'?{...awaitedModule}:require(id),module,module.exports);
 const html=renderToStaticMarkup(React.createElement(module.exports.EnsembleAssessmentDetails,{assessment:base}));
 for(const label of ['Temperatur','Niederschlag','Wind/Böen','Sonne','keine Trefferwahrscheinlichkeit','Datenbasis gut','20/20','robuste'])assert.ok(html.includes(label),label);
 const overview=renderToStaticMarkup(React.createElement(module.exports.ForecastConfidenceOverview,{assessments:days}));assert.ok(overview.includes('Gut vorhersagbare Zeiträume'));assert.ok(overview.includes('keine gemeinsame Eintrittswahrscheinlichkeit'));
}
console.log('Robust multi-parameter ensemble confidence, data quality separation, lead normalization and local skill shrinkage passed.');

// Provider parser: only full local-day parameter series may qualify.
const parserSource=fs.readFileSync(new URL('../src/weather-src/30-ensemble-climate-hazards.tsfrag',import.meta.url),'utf8');
const ast=ts.createSourceFile('weather.ts',parserSource,ts.ScriptTarget.Latest,true);
const parserText=ast.statements.find(s=>s.name?.text==='parseModelMembers').getText(ast);
const parserCode=ts.transpileModule(parserText,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const parse=new Function('n','clampNumber','weatherDaylightSeconds','localIsoEpoch',parserCode+';return parseModelMembers')(v=>typeof v==='number'?v:NaN,(v,a,b)=>Math.min(b,Math.max(a,v)),()=>43200,v=>Date.parse(v+'Z'));
const hourly={time:Array.from({length:48},(_,i)=>new Date(Date.parse(date+'T00:00Z')+i*3600000).toISOString().slice(0,16))};
for(const [key,value] of [['temperature_2m',20],['precipitation',0],['wind_speed_10m',10],['wind_gusts_10m',20],['sunshine_duration',900]])hourly[key]=Array(48).fill(value);
hourly.precipitation[0]=70;hourly.precipitation[24]=9;
const bounded=parse({hourly},{id:'test'}).members.get('_control');
assert.equal(bounded[0].precipitation,9,'Midnight sum belongs to the preceding day, excluding the starting midnight');
assert.equal(bounded[1].complete.precipitation,false,'Last missing midnight prevents full-day rain evidence');
assert.equal(bounded[0].complete.wind,true);
hourly.wind_gusts_10m[8]=null;
const incomplete=parse({hourly},{id:'test'}).members.get('_control')[0];assert.equal(incomplete.complete.wind,false);assert.equal(incomplete.complete.temperature,true);
for(const key of Object.keys(hourly))hourly[key].splice(5,1);
assert.equal(parse({hourly},{id:'test'}).members.get('_control')[0].complete.temperature,false,'Missing whole hour cannot qualify as complete 24h day');
console.log('Native daily coverage excludes missing gusts and missing whole timestamps.');
