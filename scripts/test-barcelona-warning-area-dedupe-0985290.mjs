import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
const originalFetch=globalThis.fetch;
const target={lat:41.3874,lon:2.1699},mainFeature='179df5b9-c7ca-4b59-8018-91fd007edc02',adjacentFeature='55b72172-0907-4503-8d1e-6a59fe90df6e';
const visAreas=[
 {featureId:mainFeature,name:'Litoral de Barcelona',bb:[[1.8,41.0],[2.5,41.7]]},
 {featureId:adjacentFeature,name:'Prelitoral de Barcelona',bb:[[2.0,41.2],[2.4,41.5]]}
];
const visHazards={areas:visAreas,hazards:visAreas.map(area=>({featureId:area.featureId,typeId:10,levelId:3,count:1}))};
const onset='2099-10-18T16:00:00Z',expires='2099-10-18T23:00:00Z';
const cap=({id,area,level='Moderate',start=onset,end=expires,polygon='',sent='2099-10-18T12:00:00Z',description='Información de prueba sintética.',references='',msgType='Alert'})=>`<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2"><identifier>${id}</identifier><sent>${sent}</sent><status>Actual</status><msgType>${msgType}</msgType>${references?`<references>${references}</references>`:''}<info><language>es</language><event>Lluvia</event><severity>${level}</severity><headline>Aviso por precipitaciones</headline><description>${description}</description><onset>${start}</onset><expires>${end}</expires><senderName>AEMET</senderName><area><areaDesc>${area}</areaDesc>${polygon?`<polygon>${polygon}</polygon>`:''}</area></info></alert>`;
const nearbyPoly='41.7,2.5 41.7,2.8 41.9,2.8 41.9,2.5 41.7,2.5';
const atPointPoly='41.2,2.0 41.2,2.4 41.6,2.4 41.6,2.0 41.2,2.0';
const defs=[
 ...Array.from({length:20},(_,i)=>({id:`wrong-zone-${i}`,area:i%2?'Prelitoral de Barcelona':'Depresión central de Barcelona',start:`2099-10-${String(18+i%2).padStart(2,'0')}T16:00:00Z`})),
 {id:'coastal-day-1',area:'Litoral de Barcelona'},
 {id:'coastal-day-2',area:'Litoral de Barcelona',start:'2099-10-19T16:00:00Z',end:'2099-10-19T23:00:00Z'},
 {id:'true-polygon',area:'Prelitoral de Barcelona',polygon:atPointPoly},
 {id:'outside-polygon',area:'Litoral de Barcelona',polygon:nearbyPoly},
 {id:'same-time-yellow',area:'Litoral de Barcelona',level:'Minor',start:'2099-10-20T16:00:00Z',end:'2099-10-20T23:00:00Z'},
 {id:'same-time-red',area:'Litoral de Barcelona',level:'Severe',start:'2099-10-20T16:00:00Z',end:'2099-10-20T23:00:00Z'}
];
assert.equal(defs.length,26,'Synthetic case intentionally represents the user-reported raw count of 26; it is not a saved live Barcelona dataset.');
const root='https://feeds.meteoalarm.org',atomUrl=`${root}/feeds/meteoalarm-legacy-atom-spain`;
const urlFor=id=>`${root}/api/v1/warnings/spain/${id}`;
const entry=def=>`<entry><cap:areaDesc>${def.area}</cap:areaDesc><cap:event>Lluvia</cap:event><link type="application/cap+xml" href="${urlFor(def.id)}"/><id>${def.id}</id></entry>`;
let atom=`<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2">${defs.map(entry).join('')}</feed>`;
const byUrl=new Map(defs.map(def=>[urlFor(def.id),cap(def)]));
let calls=[],visUnavailable=false;
try{
 globalThis.fetch=async input=>{
  const url=String(input instanceof Request?input.url:input);calls.push(url);
  if(url.includes('/tiles/10/518/382.mvt')){const f=JSON.parse(gunzipSync(Buffer.from(readFileSync('scripts/fixtures/meteoalarm-barcelona-20261018.json.gz.base64','utf8'),'base64')));return new Response(Buffer.from(f.tile.base64,'base64'))}if(url===atomUrl)return new Response(atom,{status:200});
  if(byUrl.has(url))return new Response(byUrl.get(url),{status:200});
  if(url.includes('/stream-buffers/live/hazards/ES')){if(visUnavailable)throw new Error('Synthetic VIS provider outage');return Response.json(visHazards);}
  if(url.includes(`/stream-buffers/live/features/${mainFeature}/warnings`))return Response.json({warnings:[]});
  if(url.includes(`/stream-buffers/live/features/${adjacentFeature}/warnings`))throw new Error('Neighbour area must not be fetched from VIS');
  throw new Error('Unexpected source '+url);
 };
 const worker=await import(`../worker/metar-proxy.js?barcelona-warning-c39=${Date.now()}`);
 const request=new Request(`https://mid.test/?mode=alerts&lat=${target.lat}&lon=${target.lon}&country=ES&name=Barcelona&region=Catalunya&district=Barcelona&language=de`);
 const response=await worker.default.fetch(request,{});
 const payload=await response.json();
 assert.equal(response.status,200,JSON.stringify(payload));
 const ids=new Set((payload.alerts||[]).map(x=>x.id));
 assert.deepEqual(ids,new Set(['coastal-day-1','coastal-day-2','true-polygon','same-time-yellow','same-time-red']),JSON.stringify(payload.alerts?.map(x=>({id:x.id,area:x.area,level:x.level}))));
 assert.equal(payload.alerts.length,5,'Twenty vague name-only neighbouring warnings and one geospatially distant polygon must not inflate city count.');
 assert.ok(payload.alerts.some(a=>a.id==='true-polygon'),'Verified true CAP point polygon must prevail over an area-name mismatch.');
 assert.ok(!payload.alerts.some(a=>a.id==='outside-polygon'),'Actual polygon outside the selected point must take priority over area-name coincidence.');
 assert.notEqual(payload.alerts.find(a=>a.id==='same-time-yellow')?.level,payload.alerts.find(a=>a.id==='same-time-red')?.level,'Legitimate different warning severity must not be collapsed by a semantic deduplication key.');
 assert.equal(calls.some(url=>url.includes(`/features/${adjacentFeature}/warnings`)),false);
 assert.match(payload.sourceStatus?.coordinateAssignment||'',/Warngebiet/);
 assert.match(payload.sourceStatus?.coordinateAssignment||'',/Kartenpolygon/);assert.equal(payload.sourceStatus?.aemetMunicipalityWarningZone,undefined);
 visUnavailable=true;
 const fallbackResponse=await worker.default.fetch(new Request('https://mid.test/?mode=alerts&lat=41.3874&lon=2.1699&country=ES&name=Barcelona&region=Catalunya&district=Barcelona&language=de'),{}),fallback=await fallbackResponse.json();
 assert.equal(fallbackResponse.status,200,JSON.stringify(fallback));
 assert.ok(fallback.alerts.some(a=>a.id==='true-polygon'));assert.ok(!fallback.alerts.some(a=>a.id==='outside-polygon'));assert.match(fallback.sourceStatus?.areaResolutionError||'',/outage/);visUnavailable=false;
 // Separate synthetic CAP Update family (not part of the 26 user-observed live alerts).
 const previousLink={id:'old-cap-link',area:'Litoral de Barcelona'};
 const latestLink={id:'new-cap-link',area:'Litoral de Barcelona'};
 byUrl.set(urlFor(previousLink.id),cap({id:'original-aemet-id',area:previousLink.area,sent:'2099-10-18T12:00:00Z',description:'Längere ältere Warnung '.repeat(70)}));
 byUrl.set(urlFor(latestLink.id),cap({id:'updated-aemet-id',area:latestLink.area,sent:'2099-10-18T13:00:00Z',description:'Kürzeres amtliches Update.',references:'aemet,original-aemet-id,2099-10-18T12:00:00Z',msgType:'Update'}));
 atom=`<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2">${entry(previousLink)}${entry(latestLink)}</feed>`;
 const revisionResponse=await worker.default.fetch(request,{}),revisionPayload=await revisionResponse.json();
 assert.equal(revisionResponse.status,200,JSON.stringify(revisionPayload));
 assert.equal(revisionPayload.alerts?.length,1,'Same CAP reference family must not produce two Barcelona warnings.');
 assert.equal(revisionPayload.alerts?.[0]?.id,'updated-aemet-id','Newer official CAP Update must outrank older, longer notice.');
 assert.match(revisionPayload.alerts[0].description,/Kürzeres amtliches Update/);

}finally{globalThis.fetch=originalFetch}
const src=readFileSync('worker-src/00-core-observations.js','utf8'),built=readFileSync('worker/metar-proxy.js','utf8');
assert.equal(built.slice(0,src.length),src,'Built Worker and canonical source must match exactly.');
assert.ok(src.includes('officialWarningAreaNamesEquivalent')&&src.includes('String(alert?.level||')&&src.includes('meteoalarmPointGeometry')&&!src.includes('aemetVerifiedMunicipalityZone')&&src.includes('alertShouldReplace'), 'Official AEMET spatial and severity-aware source guards must exist.');
const baseline=JSON.parse(readFileSync('MID_BASELINE.json','utf8')),pkg=JSON.parse(readFileSync('package.json','utf8')),test='scripts/test-barcelona-warning-area-dedupe-0985290.mjs';
assert.equal(pkg.version,baseline.releaseVersion);
assert.ok(baseline.requiredRegressionTests.includes(test)&&baseline.regressionTests.includes(test));
console.log(`MID ${pkg.version}: synthetic Barcelona 26-case filtered to five spatially distinct and severity-valid CAP warnings; no claim about the live 26 warnings.`);
