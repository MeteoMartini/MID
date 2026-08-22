import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [source,pkgText,baselineText]=await Promise.all(['worker-src/00-core-observations.js','package.json','MID_BASELINE.json'].map(read));
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText);
const localFeature='at-linz-land',regionalFeature='at-oberoesterreich',countryFeature='at-country',neighborFeature='at-steyr-land';
const areas=[
 {featureId:countryFeature,name:'Österreich',bb:[[9.4,46.3],[17.2,49.1]]},
 {featureId:regionalFeature,name:'Oberösterreich',bb:[[12.7,47.4],[15.1,48.8]]},
 {featureId:localFeature,name:'Linz-Land',bb:[[13.8,47.8],[14.6,48.5]]},
 // Absichtlich kleinere überlappende Box: der Orts-/Bezirksabgleich muss vor der bloßen Boxgröße gewinnen.
 {featureId:neighborFeature,name:'Steyr-Land',bb:[[14.15,48.0],[14.35,48.3]]}
];
const hazardDefs=[
 {typeId:1,levelId:2,label:'Windwarnung',description:'Starker Wind mit Spitzen bis 100 km/h ist zu erwarten.'},
 {typeId:10,levelId:3,label:'Regenwarnung',description:'Zeitweise kräftiger Regen ist zu erwarten.'},
 {typeId:3,levelId:3,label:'Gewitterwarnung',description:'Örtliche Gewitter sind möglich.'}
];
const hazards=[];for(const def of hazardDefs)for(const featureId of[countryFeature,regionalFeature,localFeature,neighborFeature])hazards.push({count:1,featureId,levelId:def.levelId,typeId:def.typeId});
const idFor=def=>`2.49.0.0.40.0.AT.local-${def.typeId}`;
const capUrlFor=def=>`https://feeds.meteoalarm.org/api/v1/warnings/austria/${idFor(def)}`;
const cap=(def,area='Linz-Land')=>`<?xml version="1.0"?><alert xmlns="urn:oasis:names:tc:emergency:cap:1.2"><identifier>${idFor(def)}</identifier><sent>2099-08-21T17:00:00Z</sent><status>Actual</status><msgType>Alert</msgType><info><language>de-AT</language><event>${def.label}</event><severity>${def.levelId===2?'Severe':'Moderate'}</severity><headline>${def.label}</headline><description>${def.description}</description><instruction>Amtliche Hinweise beachten.</instruction><onset>2099-08-21T17:00:00Z</onset><expires>2099-08-22T00:00:00Z</expires><senderName>GeoSphere Austria</senderName><area><areaDesc>${area}</areaDesc></area></info></alert>`;
const wrongEntries=[
 ['Österreich','country'],['Oberösterreich','region'],['Steyr-Land','neighbor']
].map(([area,suffix])=>`<entry><cap:areaDesc>${area}</cap:areaDesc><cap:event>Windwarnung</cap:event><cap:onset>2099-08-21T17:00:00Z</cap:onset><cap:expires>2099-08-22T00:00:00Z</cap:expires><link type="application/cap+xml" href="https://feeds.meteoalarm.org/api/v1/warnings/austria/wrong-${suffix}"/><id>wrong-${suffix}</id><title>Windwarnung</title></entry>`).join('');
const localEntries=hazardDefs.map(def=>`<entry><cap:areaDesc>Linz-Land</cap:areaDesc><cap:event>${def.label}</cap:event><cap:onset>2099-08-21T17:00:00Z</cap:onset><cap:expires>2099-08-22T00:00:00Z</cap:expires><cap:identifier>${idFor(def)}</cap:identifier><link type="application/cap+xml" href="${capUrlFor(def)}"/><id>${idFor(def)}</id><title>${def.label}</title></entry>`).join('');
const atom=`<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2">${wrongEntries}${localEntries}</feed>`;
const liveWarnings=Object.fromEntries(hazardDefs.map(def=>[def.typeId,{warnings:[{id:idFor(def),name:'Linz-Land',description:{'de-AT':def.description},headline:{'de-AT':def.label},instruction:{'de-AT':'Amtliche Hinweise beachten.'},sent:'2099-08-21T17:00:00Z',endDate:'2099-08-22T00:00:00Z',featureId:localFeature,levelId:def.levelId,originator:{name:'GeoSphere Austria',url:'https://www.geosphere.at'},startDate:'2099-08-21T17:00:00Z',typeId:def.typeId}]}]));
const atomUrl='https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-austria',originalFetch=globalThis.fetch,calls=[];
try{
 globalThis.fetch=async input=>{const url=String(input instanceof Request?input.url:input);calls.push(url);if(url===atomUrl)return new Response(atom,{status:200});for(const def of hazardDefs)if(url===capUrlFor(def))return new Response(cap(def),{status:200});if(url.includes('/stream-buffers/live/hazards/AT'))return Response.json({areas,hazards});for(const def of hazardDefs)if(url.includes(`/stream-buffers/live/features/${localFeature}/warnings`)&&url.includes(`typeId=${def.typeId}`))return Response.json(liveWarnings[def.typeId]);if(url.includes('/wrong-')||url.includes(`/features/${countryFeature}/`)||url.includes(`/features/${regionalFeature}/`)||url.includes(`/features/${neighborFeature}/`))throw new Error(`Fremdes Warngebiet darf nicht geladen werden: ${url}`);throw new Error(`Unerwartete Quelle: ${url}`)};
 const worker=await import(`../worker/metar-proxy.js?austria-local-scope-09648=${Date.now()}`),response=await worker.default.fetch(new Request('https://mid.test/?mode=alerts&lat=48.12&lon=14.25&country=AT&name=Sankt%20Florian&region=Ober%C3%B6sterreich&district=Linz-Land&language=de'),{}),payload=await response.json();
 assert.equal(response.status,200,JSON.stringify(payload));
 assert.equal(payload.alerts?.length,3,`Es dürfen nur die drei lokalen Linz-Land-Warnarten erscheinen: ${JSON.stringify(payload.alerts)}`);
 assert.deepEqual(new Set(payload.alerts.map(item=>item.area)),new Set(['Linz-Land']));
 assert.deepEqual(new Set(payload.alerts.map(item=>item.headline)),new Set(hazardDefs.map(item=>item.label)));
 assert.match(payload.sourceStatus?.coordinateAssignment||'',/Orts-\/Regionsabgleich \+ Warngebietsbox/);
 assert.match(payload.sourceStatus?.coordinateAssignment||'',/4 Box-Kandidaten/);
 assert.equal(calls.some(url=>url.includes('/wrong-')),false,'Landes-/Nachbarwarnungen wurden als CAP-Details geladen.');
 assert.equal(calls.some(url=>url.includes(`/features/${countryFeature}/`)||url.includes(`/features/${regionalFeature}/`)||url.includes(`/features/${neighborFeature}/`)),false,'Landes-/Nachbarwarnungen wurden über den Live-Dienst geladen.');
}finally{globalThis.fetch=originalFetch}

for(const token of ['meteoalarmAreaNameScore','meteoalarmBestAreaForHazard','candidateAreas','smallest-bbox-per-hazard-fallback'])assert.ok(source.includes(token),`Lokaler Warngebietsvertrag fehlt: ${token}`);
const test='scripts/test-austria-local-warning-scope-09648.mjs';
assert.ok(pkg.version.localeCompare('0.9.64.8',undefined,{numeric:true,sensitivity:'base'})>=0,'Lokale Warngebietseingrenzung benötigt mindestens v0.9.64.8.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Österreich-Warngebietsregression ist nicht verbindlich registriert.');
console.log(`MID v${pkg.version}: MeteoAlarm-Boxen werden je Warnart auf das lokal passende Warngebiet begrenzt; Landes-/Nachbarwarnungen bleiben draußen.`);
