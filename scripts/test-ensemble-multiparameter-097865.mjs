import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript-strada');
const source=fs.readFileSync(new URL('../src/ensembleAssessment.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const awaitedModule=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const {buildEnsembleEvidence,assessEnsembleDay,agreementWindows,firstAgreementChange,ENSEMBLE_PARAMETERS}=awaitedModule;
const now=Date.parse('2026-09-05T06:00:00Z'),date='2026-09-05';
const row={max:20,min:10,precipitation:0,wind:10,gust:20,sunshineDuration:21600,daylightSeconds:43200,complete:Object.fromEntries(ENSEMBLE_PARAMETERS.map(k=>[k,true]))};
const group=(id,override={})=>({group:id,native:true,initialisationTime:'2026-09-05T00:00:00Z',updateHours:6,expectedMembers:10,rows:Array.from({length:10},()=>structuredClone(row)),weights:{temperature:1,precipitation:1,wind:1,sunshine:1},...override});
const evidence=()=>buildEnsembleEvidence([group('a'),group('b')],now);
const assess=e=>assessEnsembleDay({date,consistencyEvidence:e},now);
assert.equal(assess(evidence()).agreement,'high');
for(const [key,field,value] of [['temperature','high',40],['precipitation','high',20],['wind','secondaryHigh',60],['sunshine','high',1.1]]){const e=evidence();e[key][field]=value;assert.equal(assess(e).agreement,'low',key);assert.equal(assess(e).limiting[0].key,key);}
for(const key of ENSEMBLE_PARAMETERS){const e=evidence();delete e[key];assert.equal(assess(e).agreement,'unknown',key+' missing must not be replaced');}
assert.equal(assessEnsembleDay({date},now).agreement,'unknown','Legacy cache without provenance');
const wet=evidence();wet.precipitation.eventProbability=50;assert.equal(assess(wet).parameters[1].agreement,'low','Open wet/dry outcome, not accuracy');
const storm=buildEnsembleEvidence([group('a'),group('b')].map(g=>({...g,rows:g.rows.map(r=>({...r,precipitation:80,wind:65,gust:90}))})),now);assert.equal(assess(storm).agreement,'high','High agreement must not mean fair weather');
const partial=buildEnsembleEvidence([group('a'),group('b')].map(g=>({...g,rows:g.rows.map(r=>({...r,complete:{...r.complete,wind:false}}))})),now);assert.equal(assess(partial).parameters[2].agreement,'unknown');assert.equal(assess(partial).parameters[0].agreement,'high');
assert.equal(assess(buildEnsembleEvidence([group('a',{native:false}),group('b',{native:false})],now)).agreement,'unknown','Synthetic mean/spread are not native members');
const unknownRun=buildEnsembleEvidence([group('a',{initialisationTime:undefined}),group('b')],now);assert.equal(assess(unknownRun).agreement,'medium');
const future=buildEnsembleEvidence([group('a',{initialisationTime:'2026-09-06T00:00:00Z'}),group('b')],now);assert.equal(assess(future).agreement,'medium');
assert.equal(assessEnsembleDay({date,consistencyEvidence:evidence()},now+7*3600000).agreement,'medium','Cached evidence expires at two model cycles');
const mixed=buildEnsembleEvidence([group('a'),group('a',{initialisationTime:'2026-09-04T00:00:00Z'}),group('b')],now);assert.equal(assess(mixed).agreement,'medium','Fresh variant cannot conceal old run in same family');
const deficient=buildEnsembleEvidence([group('a',{expectedMembers:40}),group('b')],now);assert.equal(assess(deficient).agreement,'medium');
const duplicate=buildEnsembleEvidence([group('a'),group('a'),group('b',{rows:Array.from({length:100},()=>({...row,precipitation:5})),expectedMembers:100})],now);assert.ok(Math.abs(duplicate.precipitation.eventProbability-50)<1e-10,'Group/variant normalization independent of member count');
for(const [key,field,limits] of [['temperature','high',[24,28]],['precipitation','high',[3,10]],['wind','high',[18,26]],['wind','secondaryHigh',[32,44]],['sunshine','high',[.75,1]]]){for(const [i,limit] of limits.entries()){const e=evidence();e[key][field]=limit;assert.equal(assess(e).parameters.find(p=>p.key===key).agreement,i?'medium':'high',`${key} boundary ${limit}`);}}
const days=Array.from({length:5},(_,i)=>({...assess(evidence()),date:`2026-09-${String(5+i).padStart(2,'0')}`}));
assert.deepEqual(agreementWindows(days),[{start:'2026-09-05',end:'2026-09-09',days:5}]);
const e=evidence();e.wind.secondaryHigh=70;days[2]=assessEnsembleDay({date:'2026-09-07',consistencyEvidence:e},now);
assert.deepEqual(agreementWindows(days),[{start:'2026-09-05',end:'2026-09-06',days:2},{start:'2026-09-08',end:'2026-09-09',days:2}]);
assert.equal(agreementWindows(days,'temperature')[0].days,5);assert.equal(firstAgreementChange(days).date,'2026-09-07');
assert.equal(agreementWindows([days[0],days[4]]).length,2,'Calendar gap breaks window');
assert.equal(firstAgreementChange([days[0],days[2]]),null,'No inferred transition over missing day');
// Render actual shared UI, checking semantic labels and all parameter details.
const uiSource=fs.readFileSync(new URL('../src/ForecastConfidence.tsx',import.meta.url),'utf8');
const uiCode=ts.transpileModule(uiSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const module={exports:{}};new Function('require','module','exports',uiCode)(id=>id==='./ensembleAssessment'?{...awaitedModule}:require(id),module,module.exports);

const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const html=renderToStaticMarkup(React.createElement(module.exports.EnsembleAssessmentDetails,{assessment:assess(evidence())}));
for(const label of ['Temperatur','Niederschlag','Wind/Böen','Sonne','keine kalibrierte Trefferwahrscheinlichkeit','20/20'])assert.ok(html.includes(label),label);
const overview=renderToStaticMarkup(React.createElement(module.exports.ForecastConfidenceOverview,{assessments:days}));
assert.ok(overview.includes('Weitere gemeinsame Fenster'));assert.ok(overview.includes('keine gemeinsame Eintrittswahrscheinlichkeit'));
console.log('Multi-parameter agreement: missing data, native coverage, freshness, thresholds, group weighting, calendar windows and rendered UI passed.');

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
