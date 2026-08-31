import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const root=new URL('../',import.meta.url),require=createRequire(import.meta.url),ts=require('typescript-strada');
const [workerSource,workerBuilt,thunder,app,sourceStyles,builtStyles,weatherTypes,pkgText,baselineText,implementation]=await Promise.all([
 readFile(new URL('worker-src/00-core-observations.js',root),'utf8'),
 readFile(new URL('worker/metar-proxy.js',root),'utf8'),
 readFile(new URL('src/thunderstorm.ts',root),'utf8'),
 readFile(new URL('src/App.tsx',root),'utf8'),
 readFile(new URL('src/styles-src/30-modern.css',root),'utf8'),
 readFile(new URL('src/styles.css',root),'utf8'),
 readFile(new URL('src/weather-src/00-types-models-search.tsfrag',root),'utf8'),
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8'),
 readFile(new URL('MID_IMPLEMENTATION_0.9.64.3.md',root),'utf8')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-europe-alerts-shower-model-pill-09643.mjs';

const feedLiteral=workerSource.match(/const FEED_SLUGS=(\{[\s\S]*?\n\});/)?.[1];
assert.ok(feedLiteral,'MeteoAlarm-Länderliste fehlt.');
const feeds=Function(`"use strict";return (${feedLiteral})`)();
const aliases=new Set(['EL','UK']),canonicalCodes=Object.keys(feeds).filter(code=>!aliases.has(code)).sort();
const officialCodes=['AD','AT','BA','BE','BG','CH','CY','CZ','DE','DK','EE','ES','FI','FR','GB','GR','HR','HU','IE','IL','IS','IT','LT','LU','LV','MD','ME','MK','MT','NL','NO','PL','PT','RO','RS','SE','SI','SK','UA'].sort();
assert.deepEqual(canonicalCodes,officialCodes,'MID-Länderliste weicht von den aktuell veröffentlichten MeteoAlarm-Atomfeeds ab.');
assert.equal(feeds.EL,feeds.GR,'Griechischer ISO-/Altcode muss denselben amtlichen Feed verwenden.');
assert.equal(feeds.UK,feeds.GB,'Britische ISO-/Altcodeauflösung ist inkonsistent.');
assert.ok(!('AM'in feeds),'Nicht in der aktuellen amtlichen Feedliste veröffentlichte Quelle darf nicht als MeteoAlarm-Abdeckung erscheinen.');
for(const token of [
 "['dodekanisa','dodecanese','dodekanes','dodekanisos','rhodes','rodos','rhodos']",
 'function fuzzyAreaTokenMatch(',
 'function localAreaMatch(',
 'function alertSemanticKey(',
 'CAP-Kennung/Referenzen sowie Ereignis, Gebiet und Gültigkeit',
 "strategy:'single-canonical-provider'"
])assert.ok(workerSource.includes(token),`Amtlicher Warnvertrag fehlt: ${token}`);
assert.ok(weatherTypes.includes('areaCodes?:string[]'),'CAP-Gebietscodes fehlen im Frontendvertrag.');

const cap=({id,onset,expires,sent,description})=>`<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2"><identifier>${id}</identifier><sender>hnms@example.gr</sender><sent>${sent}</sent><status>Actual</status><msgType>Alert</msgType><scope>Public</scope><info><language>en</language><category>Met</category><event>High temperature</event><severity>Moderate</severity><headline>Moderate high-temperature warning</headline><description>${description}</description><onset>${onset}</onset><expires>${expires}</expires><senderName>HNMS Forecaster</senderName><parameter><valueName>awareness_level</valueName><value>2; yellow; Moderate</value></parameter><area><areaDesc>Dodekanisa Islands</areaDesc><geocode><valueName>EMMA_ID</valueName><value>GR123</value></geocode></area></info></alert>`;
const first={onset:'2099-08-21T10:00:00Z',expires:'2099-08-21T15:00:00Z'},second={onset:'2099-08-22T10:00:00Z',expires:'2099-08-22T15:00:00Z'};
const atom=`<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry>${cap({id:'gr-warning-a',...first,sent:'2099-08-21T08:00:00Z',description:'Kurzfassung'})}</entry><entry>${cap({id:'gr-warning-a-copy',...first,sent:'2099-08-21T08:10:00Z',description:'Ausführlichere Fassung derselben amtlichen Warnung.'})}</entry><entry>${cap({id:'gr-warning-b',...second,sent:'2099-08-22T08:00:00Z',description:'Eigenständige Warnung für den Folgetag.'})}</entry></feed>`;
const originalFetch=globalThis.fetch,calls=[];
try{
 globalThis.fetch=async input=>{const url=String(input instanceof Request?input.url:input);calls.push(url);if(url==='https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-greece')return new Response(atom,{status:200,headers:{'content-type':'application/atom+xml'}});throw new Error(`Unerwartete Fremdquelle: ${url}`)};
 const worker=await import(`../worker/metar-proxy.js?official-alerts-09643=${Date.now()}`),response=await worker.default.fetch(new Request('https://mid.test/?mode=alerts&lat=36.4349&lon=28.2176&country=GR&name=Rhodes&region=South%20Aegean&district=Rhodes&language=en'),{}),payload=await response.json();
 assert.equal(response.status,200,JSON.stringify(payload));
 assert.equal(payload.alerts?.length,2,'Rhodos-Warnung fehlt oder zwei getrennte Gültigkeitstage wurden fälschlich zusammengeführt.');
 const firstDay=payload.alerts.filter(item=>String(item.onset).startsWith('2099-08-21T10:00'));
 assert.equal(firstDay.length,1,'Provider-/Feed-Dublette derselben Gültigkeit wurde nicht entfernt.');
 assert.match(firstDay[0]?.description||'',/Ausführlichere Fassung/,'Bei Dubletten wurde nicht die vollständigere/aktuellere Meldung behalten.');
 assert.deepEqual(payload.alerts[0]?.areaCodes,['emma_id:gr123'],'MeteoAlarm-Gebietskennung wird nicht erhalten.');
 assert.equal(payload.sourceStatus?.strategy,'single-canonical-provider','Mehrprovider-Mischung ist nicht ausdrücklich ausgeschlossen.');
 assert.ok(calls.includes('https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-greece'),'Kanonischer MeteoAlarm-Atomfeed wurde nicht abgefragt.');
 assert.ok(calls.every(url=>/^https:\/\/(?:feeds|visservice)\.meteoalarm\.org\//.test(url)),'Zusätzlicher Provider wurde trotz kanonischer amtlicher Quelle abgefragt.');
}finally{globalThis.fetch=originalFetch}

const compileModule=(source,fileName)=>{const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true,fileName});if(output.diagnostics?.length)throw new Error(output.diagnostics.map(item=>ts.flattenDiagnosticMessageText(item.messageText,'\n')).join(' | '));const module={exports:{}};new Function('module','exports','require',output.outputText)(module,module.exports,()=>({}));return module.exports};
const thunderModule=compileModule(thunder,'thunderstorm.ts'),cell={id:'K3D-SHOWER',latitude:51.1,longitude:6.7,currentDistanceKm:12,siteBearingDeg:315,relevanceDistanceKm:12,forecastDistanceKm:10,forecastEffectiveDistanceKm:9,forecastUncertaintyKm:2,forecastTime:'2099-08-21T17:00:00Z',forecastLatitude:50.9,forecastLongitude:7,motionDirectionDeg:120,arrivalMinutes:25,isApproaching:true,severity:2,trend:0,hailFlag:0,heavyRainFlag:2,gustFlag:0,lightningRate:0,areaHail:0,areaLargeHail:0,speedKmh:28};
const nowcast={available:true,coverage:true,provider:'DWD KONRAD3D',observedAt:'2099-08-21T16:00:00Z',ageMinutes:5,cellsFound:1,nearbyCells:[cell],nearest:cell,summary:'Radarzelle'};
const shower=thunderModule.combineThunderstormInformation(nowcast,[],null,null,'Niederkassel');
assert.equal(shower?.phenomenon,'strong-shower');
assert.equal(shower?.sectionLabel,'Schauerinformation');
assert.match(shower?.headline||'',/^Starker Schauer\b/);
assert.doesNotMatch(JSON.stringify(shower),/Gewitter/i,'Blitzlose aktuelle Zelle darf nirgends als Gewitter bezeichnet werden.');
const storm=thunderModule.combineThunderstormInformation({...nowcast,nearest:{...cell,lightningRate:1},nearbyCells:[{...cell,lightningRate:1}]},[],null,null,'Niederkassel');
assert.equal(storm?.phenomenon,'thunderstorm');
assert.equal(storm?.sectionLabel,'Gewitterinformation');
assert.match(storm?.headline||'',/Gewitter/,'Mindestens ein detektierter Blitz muss die Gewitterbezeichnung aktivieren.');
const modelOnly=thunderModule.combineThunderstormInformation(null,[{epoch:Date.now(),time:new Date().toISOString(),code:95,cape:1000}],null,null,'Niederkassel');
assert.equal(modelOnly?.phenomenon,'thunderstorm','Numerische Gewitterprognose darf ohne aktuellen Blitz bestehen bleiben.');
assert.equal(modelOnly?.sectionLabel,'Gewitterinformation');
assert.match(`${modelOnly?.headline||''} ${modelOnly?.summary||''}`,/Gewitter/,'Numerisches WMO-Gewittersignal muss als Prognose benannt werden.');
assert.ok(app.includes('<small>{thunderInfo.sectionLabel}</small>'),'Kachel verwendet noch eine fest verdrahtete Gewitterüberschrift.');

const marker='/* MID v0.9.64.3 · Modellstand-Pille kollisionsfrei neben der 14-Tage-Überschrift. */';
for(const [name,styles]of[['Quell-CSS',sourceStyles],['Aggregat-CSS',builtStyles]]){
 const section=styles.slice(styles.lastIndexOf(marker));
 assert.ok(section.startsWith(marker),`${name}: Modellstand-Korrektur ist nicht die letztgültige Regel.`);
 for(const token of ['display:grid!important','grid-template-columns:minmax(0,1fr) max-content!important','grid-column:2','justify-self:end','width:auto!important','margin:0!important','min-height:36px!important'])assert.ok(section.includes(token),`${name}: kollisionsfreier Modellstand-Vertrag fehlt: ${token}`);
 assert.ok(section.indexOf('grid-template-columns:minmax(0,1fr) max-content!important')<section.indexOf('.cockpit-model-run-button'),`${name}: Überschrift reserviert den Pillenplatz nicht vor der Schaltflächenregel.`);
}

assert.ok(pkg.version.localeCompare('0.9.64.3',undefined,{numeric:true,sensitivity:'base'})>=0,'Korrektur benötigt mindestens Wartungsrelease v0.9.64.3.');
assert.equal(pkg.scripts?.['test:europe-alerts-shower-model-pill'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion sind nicht synchron.');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Verbindliche Baseline-Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regressionskatalog enthält den neuen Vertrag nicht.');
assert.ok(baseline.requiredFiles?.includes('MID_IMPLEMENTATION_0.9.64.3.md'),'Implementierungsvertrag ist nicht als Pflichtdatei geschützt.');
for(const token of ['Rhodos','MeteoAlarm','kanonische','Dubletten','Starker Schauer','mindestens ein Blitz','Modellstand','Worker'])assert.ok(implementation.includes(token),`Implementierungsnotiz unvollständig: ${token}`);
assert.equal(workerSource,workerBuilt.slice(0,workerSource.length),'Worker-Aggregat beginnt nicht mit der kanonischen Warnungsquelle.');

console.log(`${pkg.version}: amtliche Europa-Warnungen, blitzgebundene Gewitterbezeichnung und kollisionsfreie Modellstand-Pille geschützt.`);
