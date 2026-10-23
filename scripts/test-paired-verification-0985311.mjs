import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url),ts=require('typescript-strada');
const source=readFileSync(new URL('../src/forecastVerification.ts',import.meta.url),'utf8');
const ast=ts.createSourceFile('forecastVerification.ts',source,ts.ScriptTarget.Latest,true);
const names=['clamp','modelParameterErrors','parameterScore','priorityWeightedErrorScore','compositePredictionScore','pairedPredictionScores','localValidationEvidence'];
const functions=ast.statements.filter(node=>ts.isFunctionDeclaration(node)&&names.includes(node.name?.text)).map(node=>node.getText(ast)).join('\n');
const js=ts.transpileModule(functions,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const evidence=new Function('FORECAST_PARAMETER_IMPORTANCE','DWD_PRECIPITATION_PROBABILITY_THRESHOLD_MM',js+'\nreturn localValidationEvidence;')({precipitation:28,temperature:24,gust:20,probability:18,sunshine:10},.2);
const reference={max:20,min:10,precipitation:0,gust:30,sunshineDuration:10000};
const prediction=(id,extra={})=>({id,max:21,min:11,precipitation:0,probability:0,probabilityKind:'daily-wet-native',...extra});
const evaluation=(date,predictions)=>({date,capture:{predictions},reference});
const pair=(date,weighted={},best={})=>evaluation(date,[prediction('mid_local_weighted',weighted),prediction('best_match',best)]);
// A missing optional field on only one side must not lower that model's score.
const asymmetric=evidence([pair('2026-10-01',{gust:30})]);
assert.ok(Math.abs(asymmetric.improvement)<1e-10,'Identical common errors cannot yield an advantage through optional missing fields');
assert.equal(asymmetric.cases,1);
// Unpaired bad Best-Match days cannot improve MID's paired comparison.
const baseline=pair('2026-10-02',{}, {max:22,min:12});
const unpaired=evaluation('2026-10-03',[prediction('best_match',{max:99,min:90})]);
assert.deepEqual(evidence([baseline,unpaired]),evidence([baseline]),'Unpaired days cannot enter scores or evidence counts');
const none=evidence([unpaired]);
assert.equal(none.days,0);
assert.equal(none.cases,0);
assert.equal(none.improvement,undefined);
// Multiple horizons are averaged within a day before comparing daily means.
const balanced=evidence([baseline,baseline,baseline,pair('2026-10-04',{max:22,min:12},{max:21,min:11})]);
assert.ok(Math.abs(balanced.improvement)<1e-10,'Repeated horizons cannot overweight a day');
assert.equal(balanced.days,2);
assert.equal(balanced.cases,4);
const missing=pair('2026-10-05',{max:NaN,min:NaN,precipitation:NaN,probability:NaN},{max:NaN,min:NaN,precipitation:NaN,probability:NaN});
assert.equal(evidence([missing]).days,0,'No common valid parameter is not a comparison');
assert.ok(source.includes('weightedImprovement=validation.improvement')&&source.includes('weightedValidationDays=validation.days'),'Main forecast activation must use paired evidence');
assert.ok(source.includes('weightedScore:validation.weightedMean')&&source.includes('bestMatchScore:validation.bestMean'),'Displayed scores must describe the same paired cases');
console.log('Paired verification: common parameters, identical cases, missing data, daily balancing and activation wiring verified.');
if(process.env.GITHUB_ACTIONS==='true'||process.env.MID_BROWSER_QA==='1')execFileSync(process.execPath,['scripts/verify-paired-verification-browser-0985311.mjs'],{stdio:'inherit',timeout:360000});
