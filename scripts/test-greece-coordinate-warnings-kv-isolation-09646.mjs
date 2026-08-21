import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [workerSource,workerBuilt,router,pkgText,baselineText,implementation]=await Promise.all([
 readFile(new URL('worker-src/00-core-observations.js',root),'utf8'),
 readFile(new URL('worker/metar-proxy.js',root),'utf8'),
 readFile(new URL('worker-src/40-aviation-router.js',root),'utf8'),
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8'),
 readFile(new URL('MID_IMPLEMENTATION_0.9.64.6.md',root),'utf8')
]);

const dodeId='58fb751f-f5ea-4534-b77b-40a922db759e',northId='north-east-aegean-warning',dodeFeature='37003eb6-c8eb-4fa5-b55f-92f7e453adae',northFeature='north-east-aegean-feature';
const dodeCapUrl=`https://feeds.meteoalarm.org/api/v1/warnings/feeds-greece/${dodeId}`,northCapUrl=`https://feeds.meteoalarm.org/api/v1/warnings/feeds-greece/${northId}`;
const cap=({id,area,code,description})=>`<?xml version="1.0"?><alert xmlns="urn:oasis:names:tc:emergency:cap:1.2"><identifier>2.49.0.0.300.0.GR.${id}</identifier><sent>2099-08-21T11:30:00Z</sent><status>Actual</status><msgType>Alert</msgType><info><language>en</language><event>Moderate high-temperature warning</event><severity>Moderate</severity><headline>Moderate high-temperature warning</headline><description>${description}</description><onset>2099-08-22T10:00:00Z</onset><expires>2099-08-22T15:00:00Z</expires><senderName>Hnms Forecaster</senderName><parameter><valueName>awareness_level</valueName><value>2; yellow; Moderate</value></parameter><area><areaDesc>${area}</areaDesc><geocode><valueName>EMMA_ID</valueName><value>${code}</value></geocode></area></info></alert>`;
const dodeDescription='High air temperature values (during the day), expected to reach 36 and locally 37 degrees Celsius. BE AWARE. Some health risks amongst vulnerable people e.g. the elderly and very young are possible.';
const dodeCap=cap({id:'260821113000.000010013',area:'Dodekanisa Islands',code:'GR013',description:dodeDescription}),northCap=cap({id:'260821113000.000010014',area:'North East Aegean Islands',code:'GR014',description:'This warning must not be assigned to Rhodes.'});
const entry=({id,area,url})=>`<entry><cap:areaDesc>${area}</cap:areaDesc><cap:event>Moderate high-temperature warning</cap:event><cap:onset>2099-08-22T10:00:00Z</cap:onset><cap:expires>2099-08-22T15:00:00Z</cap:expires><cap:severity>Moderate</cap:severity><cap:status>Actual</cap:status><cap:identifier>${id}</cap:identifier><link type="application/cap+xml" href="${url}"/><id>${url}?index=1</id><title>Moderate high-temperature warning</title></entry>`;
const atom=`<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2">${entry({id:'dode-index',area:'Dodekanisa Islands',url:dodeCapUrl})}${entry({id:'north-index',area:'North East Aegean Islands',url:northCapUrl})}</feed>`;
const visHazards={areas:[{featureId:dodeFeature,name:'Dodekanisa Islands',bb:[[26.2687,35.3368],[28.2443,37.3667]]},{featureId:northFeature,name:'North East Aegean Islands',bb:[[24.9723,37.5129],[26.9758,40.031]]}],hazards:[{count:1,featureId:dodeFeature,frame:3,levelId:3,typeId:5},{count:1,featureId:northFeature,frame:3,levelId:3,typeId:5}]};
const visWarning={warnings:[{id:dodeId,name:'Dodekanisa Islands',description:{en:dodeDescription},headline:{en:'Yellow warning for Dodekanisa Islands'},instruction:{en:''},sent:'2099-08-21T11:30:00Z',endDate:'2099-08-22T15:00:00Z',featureId:dodeFeature,levelId:3,originator:{name:'Hnms Forecaster',url:'https://www.emy.gr'},startDate:'2099-08-22T10:00:00Z',typeId:5}]};

const atomUrl='https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-greece',originalFetch=globalThis.fetch,calls=[];
try{
 globalThis.fetch=async input=>{const url=String(input instanceof Request?input.url:input);calls.push(url);if(url===atomUrl)return new Response(atom,{status:200});if(url===dodeCapUrl)return new Response(dodeCap,{status:200});if(url===northCapUrl)return new Response(northCap,{status:200});if(url.includes('/stream-buffers/live/hazards/GR'))return Response.json(visHazards);if(url.includes(`/stream-buffers/live/features/${dodeFeature}/warnings`))return Response.json(visWarning);if(url.includes(`/stream-buffers/live/features/${northFeature}/warnings`))throw new Error('Nordägäis darf für Rhodos nicht abgefragt werden.');throw new Error(`Unerwartete Quelle: ${url}`)};
 const worker=await import(`../worker/metar-proxy.js?greece-coordinate-09646=${Date.now()}`),response=await worker.default.fetch(new Request('https://mid.test/?mode=alerts&lat=36.20537&lon=28.138&country=GR&name=Stegna&region=S%C3%BCdliche%20%C3%84g%C3%A4is&language=de'),{}),payload=await response.json();
 assert.equal(response.status,200,JSON.stringify(payload));
 assert.equal(payload.alerts?.length,1,'Stegna ohne admin2 erhält nicht exakt seine amtliche Dodekanes-Warnung.');
 assert.equal(payload.alerts[0]?.headline,'Moderate high-temperature warning','Die fachliche Warnungsart wird von der generischen gelben Gebietsüberschrift verdeckt.');
 assert.equal(payload.alerts[0]?.area,'Dodekanisa Islands');
 assert.equal(payload.alerts[0]?.description,dodeDescription,'Der vollständige englische HNMS-Meldungstext fehlt.');
 assert.equal(payload.alerts[0]?.source,'Hnms Forecaster');
 assert.equal(payload.alerts[0]?.language,'en');
 assert.equal(payload.sourceStatus?.strategy,'single-canonical-provider');
 assert.match(payload.sourceStatus?.coordinateAssignment||'',/amtliches Warngebiet/);
 assert.ok(calls.some(url=>url.includes('/stream-buffers/live/hazards/GR')),'Amtliche Koordinatenzuordnung wurde nicht abgefragt.');
 assert.equal(calls.filter(url=>url===dodeCapUrl).length,1,'Passendes CAP-Detail wurde nicht genau einmal geladen.');
 assert.equal(calls.includes(northCapUrl),false,'Nicht zutreffendes Nachbargebiet wurde unnötig als CAP-Kandidat geladen.');
 assert.equal(calls.some(url=>url.includes(`/features/${northFeature}/warnings`)),false,'Nicht zutreffendes Nachbargebiet wurde per Visualisierungsdienst geladen.');
}finally{globalThis.fetch=originalFetch}

const alertRoute=router.slice(router.indexOf("mode==='alerts'"),router.indexOf("mode==='alerts'")+900);
assert.ok(alertRoute.includes('officialAlerts('),'Warnroute ruft die amtliche Warnlogik nicht direkt auf.');
assert.equal(alertRoute.includes('MID_PUSH_SUBSCRIPTIONS'),false,'Interaktive Warnabfrage hängt fälschlich vom Workers-KV ab.');
for(const token of ['METEOALARM_VIS','meteoalarmPointContext','meteoalarmPointAlerts','officialAreaDescriptionMatches','aegean','linkedWarningIdentifier','MeteoAlarm Live-Warngebiete + Atom/CAP'])assert.ok(workerSource.includes(token),`Koordinaten-/Deduplizierungsvertrag fehlt: ${token}`);

const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-greece-coordinate-warnings-kv-isolation-09646.mjs';
assert.equal(pkg.version,'0.9.64.6');
assert.equal(pkg.scripts?.['test:greece-coordinate-warnings-kv-isolation'],`node ${test}`);
assert.equal(baseline.releaseVersion,pkg.version);
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Neue Griechenland-Regression ist nicht verbindlich registriert.');
assert.ok(baseline.requiredFiles?.includes('MID_IMPLEMENTATION_0.9.64.6.md'),'Implementierungsvertrag fehlt in requiredFiles.');
for(const token of ['Stegna','Dodekanisa Islands','Koordinaten','Atom/CAP','englische','KV','Push','0.9.64.6'])assert.ok(implementation.includes(token),`Implementierungsnotiz unvollständig: ${token}`);
assert.equal(workerSource,workerBuilt.slice(0,workerSource.length),'Worker-Aggregat beginnt nicht mit der kanonischen Warnungsquelle.');

console.log(`${pkg.version}: griechische Warngebietszuordnung, Volltext, Dublettenfreiheit und KV-Isolation geschützt.`);
