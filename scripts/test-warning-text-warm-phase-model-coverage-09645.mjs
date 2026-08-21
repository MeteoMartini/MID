import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const root=new URL('../',import.meta.url),require=createRequire(import.meta.url),ts=require('typescript');
const [workerSource,workerBuilt,precipitation,weatherFragment,weatherBuilt,app,cockpit,ensemble,pkgText,baselineText,implementation]=await Promise.all([
 readFile(new URL('worker-src/00-core-observations.js',root),'utf8'),
 readFile(new URL('worker/metar-proxy.js',root),'utf8'),
 readFile(new URL('src/precipitation.ts',root),'utf8'),
 readFile(new URL('src/weather-src/20-mapping-day-character.tsfrag',root),'utf8'),
 readFile(new URL('src/weather.ts',root),'utf8'),
 readFile(new URL('src/App.tsx',root),'utf8'),
 readFile(new URL('src/ForecastCockpit.tsx',root),'utf8'),
 readFile(new URL('src/EnsemblePanel.tsx',root),'utf8'),
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8'),
 readFile(new URL('MID_IMPLEMENTATION_0.9.64.5.md',root),'utf8')
]);

const capUrl='https://feeds.meteoalarm.org/api/v1/warnings/feeds-austria/imst-rain';
const atom=`<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2"><entry><cap:geocode><valueName>EMMA_ID</valueName><value>AT702</value></cap:geocode><cap:areaDesc>Imst</cap:areaDesc><cap:event>Rainwarning</cap:event><cap:expires>2099-08-21T22:00:00Z</cap:expires><cap:onset>2099-08-21T11:00:00Z</cap:onset><cap:severity>Moderate</cap:severity><cap:status>Actual</cap:status><cap:identifier>at-imst-rain</cap:identifier><link type="application/cap+xml" href="${capUrl}"/><id>${capUrl}?index=1</id><title>Rainwarning</title></entry></feed>`;
const cap=`<?xml version="1.0"?><alert xmlns="urn:oasis:names:tc:emergency:cap:1.2"><identifier>at-imst-rain</identifier><sent>2099-08-21T09:00:00Z</sent><status>Actual</status><msgType>Alert</msgType><info><language>en-GB</language><event>Rainwarning</event><severity>Moderate</severity><headline>Rainwarning</headline><description>Heavy rain may cause local flooding.</description><instruction>Stay away from fast-flowing water.</instruction><onset>2099-08-21T11:00:00Z</onset><expires>2099-08-21T22:00:00Z</expires><senderName>GeoSphere Austria</senderName><area><areaDesc>Imst</areaDesc><geocode><valueName>EMMA_ID</valueName><value>AT702</value></geocode></area></info></alert>`;
const originalFetch=globalThis.fetch,calls=[];
try{
 globalThis.fetch=async(input,init={})=>{const url=String(input instanceof Request?input.url:input),accept=new Headers(init.headers).get('accept');calls.push({url,accept});if(url.endsWith('meteoalarm-legacy-atom-austria'))return new Response(atom,{status:200});if(url===capUrl)return new Response(cap,{status:200});throw new Error(`Unerwartete Quelle: ${url}`)};
 const worker=await import(`../worker/metar-proxy.js?warning-text-09645=${Date.now()}`),response=await worker.default.fetch(new Request('https://mid.test/?mode=alerts&lat=47.245&lon=10.739&country=AT&name=Imst&region=Tirol&district=Imst&language=de'),{}),payload=await response.json();
 assert.equal(response.status,200,JSON.stringify(payload));
 assert.equal(payload.alerts?.length,1,'Verlinktes CAP-Dokument wurde nicht eindeutig zugeordnet.');
 assert.equal(payload.alerts[0]?.description,'Heavy rain may cause local flooding.','Amtlicher englischer Meldungstext fehlt.');
 assert.equal(payload.alerts[0]?.instruction,'Stay away from fast-flowing water.','Amtlicher Handlungshinweis fehlt.');
 assert.equal(payload.alerts[0]?.language,'en-GB','Originalsprache wird nicht erhalten.');
 assert.equal(calls.filter(item=>item.url===capUrl).length,1,'Der knappe Atom-Indexeintrag verhindert noch den CAP-Detailabruf.');
 assert.ok(calls.find(item=>item.url===capUrl)?.accept===null||calls.find(item=>item.url===capUrl)?.accept==='*/*','MeteoAlarm-CAP-Abruf verwendet einen vom Server abgelehnten Accept-Header.');
}finally{globalThis.fetch=originalFetch}

const compile=(source,fileName)=>{const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true,fileName});if(output.diagnostics?.length)throw new Error(output.diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,'\n')).join(' | '));const module={exports:{}};new Function('module','exports',output.outputText)(module,module.exports);return module.exports};
const precipitationModule=compile(precipitation,'precipitation.ts'),base={precipitation:2,rain:0,showers:0,snowfall:1,probability:93,code:85};
const warm=precipitationModule.reconcileForecastPrecipitation({...base,temperature:19,dewPoint:13,humidity:70});
assert.equal(warm.code,80,'Schneeschauercode bleibt trotz eindeutig warmer bodennaher Luft bestehen.');
assert.equal(warm.snowfall,0,'Unplausibler warmer Schneefallwert wird nicht entfernt.');
assert.equal(precipitationModule.precipitationParts({...base,...warm,temperature:19}).type,'showers','Warmer Phasenwiderspruch wird nicht als Regenschauer dargestellt.');
assert.equal(precipitationModule.precipitationParts({...base,temperature:19,dewPoint:13,humidity:70}).type,'showers','Direkte Darstellungen umgehen noch die zentrale Warmphasenprüfung.');
const cold=precipitationModule.reconcileForecastPrecipitation({...base,temperature:-1,dewPoint:-2,humidity:90});
assert.equal(cold.code,85,'Plausibler Schneeschauer im Frostbereich wurde fälschlich umklassifiziert.');
assert.equal(cold.snowfall,1,'Plausibler Schneefallwert ging verloren.');

for(const token of ['temperature:n(w.hourly.temperature_2m[i],NaN)','temperature:n(w.daily.temperature_2m_min[i],NaN)','phaseAdjusted=true'])assert.ok(weatherFragment.includes(token)||precipitation.includes(token),`Zentraler Phasenvertrag fehlt: ${token}`);
assert.ok(weatherBuilt.includes('temperature:n(w.daily.temperature_2m_min[i],NaN)'),'Wetteraggregat enthält die Tages-Phasenprüfung nicht.');
for(const token of ['language?:string','Originaltext: ${language}'])assert.ok(weatherBuilt.includes(token)||app.includes(token),`Warntext-/Sprachvertrag fehlt: ${token}`);
for(const token of ['availableModelCount:maxModelCount','{modelCount}/{reference} M','von ${reference} Modellfamilien','Beim bereits laufenden ersten Tag'])assert.ok(cockpit.includes(token),`Transparenter Modellbeitragsvertrag fehlt: ${token}`);
for(const token of ['referenceModelCount:number','Math.max(1,...data.map(item=>Math.max(1,item.modelCount||1)))','von {referenceModelCount} Modellfamilien'])assert.ok(ensemble.includes(token),`Ensemble-Beitragsvertrag fehlt: ${token}`);

const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-warning-text-warm-phase-model-coverage-09645.mjs';
assert.ok(pkg.version.localeCompare('0.9.64.5',undefined,{numeric:true,sensitivity:'base'})>=0,'Korrektur benötigt mindestens Wartungsrelease v0.9.64.5.');
assert.equal(pkg.scripts?.['test:warning-text-warm-phase-model-coverage'],`node ${test}`);
assert.equal(baseline.releaseVersion,pkg.version);
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Neue Regression ist nicht verbindlich registriert.');
assert.ok(baseline.requiredFiles?.includes('MID_IMPLEMENTATION_0.9.64.5.md'),'Implementierungsvertrag fehlt in requiredFiles.');
for(const token of ['CAP-Detaildokument','Englisch','Schneeschauer','19 °C','Modellfamilien','5/6','Worker'])assert.ok(implementation.includes(token),`Implementierungsnotiz unvollständig: ${token}`);
assert.equal(workerSource,workerBuilt.slice(0,workerSource.length),'Worker-Aggregat beginnt nicht mit der kanonischen Warnungsquelle.');

console.log(`${pkg.version}: vollständige amtliche Warntexte, warme Niederschlagsphase und transparente Modellbeiträge geschützt.`);
