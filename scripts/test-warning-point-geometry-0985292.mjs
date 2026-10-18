import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const source=await readFile('worker-src/00-core-observations.js','utf8'),fixture=JSON.parse(gunzipSync(Buffer.from(await readFile('scripts/fixtures/meteoalarm-barcelona-20261018.json.gz.base64','utf8'),'base64')));
const context=vm.createContext({TextDecoder,Uint8Array,URL,Set,Map,Number,Math,Date});
vm.runInContext(source.slice(source.indexOf('function decodeXml('),source.indexOf('async function dwdWfsFrom('))+source.slice(source.indexOf('function entryScore('),source.indexOf('async function dwdAlerts(')),context);
const tile=Buffer.from(fixture.tile.base64,'base64');assert.equal(createHash('sha256').update(tile).digest('hex'),fixture.tile.sha256);
const areas=context.meteoalarmMvtAreas(tile),point=context.meteoalarmTilePoint(41.3874,2.1699);
assert.deepEqual(Array.from(areas.filter(a=>context.meteoalarmTileContains(a,point)),a=>a.featureId),['179df5b9-c7ca-4b59-8018-91fd007edc02']);
// Compare the bounded worker decoder with the existing independent Mapbox decoder.
const {VectorTile}=await import('@mapbox/vector-tile'),{PbfReader}=await import('pbf'),reference=new VectorTile(new PbfReader(tile)).layers.areas;
assert.equal(areas.length,reference.length);for(let i=0;i<reference.length;i++){const f=reference.feature(i),a=areas.find(a=>a.featureId===f.properties.uuid);assert(a);assert.deepEqual(JSON.parse(JSON.stringify(a.rings)),f.loadGeometry().map(r=>r.slice(0,-1).map(p=>[p.x,p.y])))}
for(const bytes of [new Uint8Array(),tile.subarray(0,tile.length-1),new Uint8Array([26,255]),new Uint8Array(2097153)])assert.throws(()=>context.meteoalarmMvtAreas(bytes));
assert.throws(()=>context.meteoalarmMvtPacked(new Uint8Array([128])));assert.throws(()=>context.meteoalarmMvtRings([15]));
const ring=[[0,0],[100,0],[100,100],[0,100]],hole=[[20,20],[80,20],[80,80],[20,80]],shape={extent:100,rings:[ring,hole]};
assert.equal(context.meteoalarmTileContains(shape,{px:.1,py:.1}),true);assert.equal(context.meteoalarmTileContains(shape,{px:.5,py:.5}),false);assert.equal(context.meteoalarmTileContains(shape,{px:0,py:.5}),true);assert.equal(context.meteoalarmTileContains(shape,{px:1.1,py:.5}),false);
for(const [left,right,want]of[['Litoral de Barcelona','Litoral sur de Valencia',false],['Litoral de Barcelona','Prelitoral de Barcelona',false],['Litoral de Barcelona','Litoral de Barcelona',true],['North Coast; South Coast','South Coast',true],['Sardegna','Sardinia',true]])assert.equal(context.officialWarningAreaNamesEquivalent(left,right),want);
const xml='<area><areaDesc>Litoral sur de Valencia</areaDesc></area>';assert.equal(context.localMatch(xml,41.3874,2.1699,'Barcelona','Catalunya','Barcelona',['Litoral de Barcelona']),false);
// CAP polygons/circles override even an official label; successful negative detail may not revive its Atom index.
assert.equal(context.localMatch('<area><areaDesc>Litoral de Barcelona</areaDesc><polygon>0,0 0,1 1,1 1,0 0,0</polygon></area>',41.3874,2.1699,'Barcelona','','',['Litoral de Barcelona']),false);
context.fetchText=async url=>url==='feed'?'<feed><entry><areaDesc>Litoral de Barcelona</areaDesc><title>Rain</title><expires>2099-01-01T00:00:00Z</expires><link type="application/cap+xml" href="https://example.test/cap"/></entry></feed>':'<alert><status>Actual</status><info><headline>Rain</headline><expires>2099-01-01T00:00:00Z</expires><area><areaDesc>Litoral de Barcelona</areaDesc><polygon>0,0 0,1 1,1 1,0 0,0</polygon></area></info></alert>';
assert.equal(context.dedupeAlerts(await context.capFeedAlerts('feed','test',41.3874,2.1699,'Barcelona','','','en',24,['Litoral de Barcelona'])).length,0);
assert.notEqual(context.alertSemanticKey({event:'Rain',area:'Area',onset:'2099-01-01',expires:'2099-01-02',level:'yellow'}),context.alertSemanticKey({event:'Rain',area:'Area',onset:'2099-01-01',expires:'2099-01-02',level:'orange'}));
const translated=(code='XX001',polygon='')=>`<alert><status>Actual</status><identifier>multilingual</identifier><info><language>en</language><headline>Rain</headline><expires>2099-01-01T00:00:00Z</expires><area><areaDesc>North Coast</areaDesc><geocode><valueName>EMMA_ID</valueName><value>XX001</value></geocode></area></info><info><language>de</language><headline>Regen</headline><expires>2099-01-01T00:00:00Z</expires><area><areaDesc>Nordküste</areaDesc>${polygon}<geocode><valueName>EMMA_ID</valueName><value>${code}</value></geocode></area></info></alert>`;
assert.equal(context.parseCap(translated(),'test','',50,7,'Ort','','','de',['North Coast']).headline,'Regen');
assert.equal(context.parseCap(translated('XX002'),'test','',50,7,'Ort','','','de',['North Coast']),null,'Different area code may not borrow another translation');
const outside=context.parseCap(translated('XX001','<polygon>0,0 0,1 1,1 1,0 0,0</polygon>'),'test','https://feeds.meteoalarm.org/api/v1/warnings/test/stale-vis',50,7,'Ort','','','de',['North Coast']);assert.equal(context.dedupeAlerts([outside,{id:'stale-vis',headline:'Stale VIS',event:'Rain',area:'North Coast'}]).length,0,'Translated codes or stale VIS cannot override an authoritative outside polygon');assert.equal(context.dedupeAlerts([{id:'stale-vis',headline:'Stale VIS',event:'Rain',area:'North Coast'},outside]).length,0,'Outside geometry wins an undated tie independent of order');
const canonical=raw=>{const u=new URL(raw);u.searchParams.delete('referenceDate');u.searchParams.sort();return u.toString()},documents=new Map(fixture.documents.map(d=>[canonical(d.url),d]));
const realFetch=globalThis.fetch,RealDate=Date;let geometryUnavailable=false;
try{
 globalThis.Date=class extends RealDate{constructor(...args){super(...args.length?args:[fixture.capturedAt])}static now(){return RealDate.parse(fixture.capturedAt)}};
 globalThis.fetch=async input=>{const url=String(input instanceof Request?input.url:input);if(url.startsWith(fixture.tile.url)){if(geometryUnavailable)throw Error('fixture geometry outage');return new Response(tile)}const d=documents.get(canonical(url));assert(d,'Unrecorded fixture request: '+url);return new Response(d.body,{status:d.status})};
 const worker=await import('../worker/metar-proxy.js?warning-geometry-292');
 for(const language of ['de','en','es']){
 const r=await worker.default.fetch(new Request('https://mid.test/?mode=alerts&lat=41.3874&lon=2.1699&country=ES&name=Barcelona&region=Catalunya&district=Barcelona&language='+language),{}),d=await r.json();assert.equal(r.status,200);assert.equal(d.alerts.length,4,JSON.stringify(d));assert(d.alerts.every(a=>a.area==='Litoral de Barcelona'));assert.equal(new Set(d.alerts.map(a=>a.onset)).size,2);assert(d.alerts.every(a=>a.description.length>30));assert.match(d.sourceStatus.coordinateAssignment,/Kartenpolygon/);assert(!('aemetMunicipalityWarningZone'in d.sourceStatus));
 }
 geometryUnavailable=true;const r=await worker.default.fetch(new Request('https://mid.test/?mode=alerts&lat=41.3874&lon=2.1699&country=ES&name=Barcelona&region=Catalunya&district=Barcelona'),{}),d=await r.json();assert.match(d.sourceStatus.areaResolutionError,/outage/);assert.match(d.sourceStatus.coordinateAssignment,/Fallback/);assert(d.alerts.every(a=>!/(Valencia|Alicante|Tarragona)/.test(a.area)),'No generic coastal-word contamination on geometry outage');
}finally{globalThis.fetch=realFetch;globalThis.Date=RealDate}
console.log('Official point geometry: recorded Barcelona 22→4, independent decoder parity, holes/borders, strict whole areas, CAP-negative authority, multilingual windows, levels and explicit outage fallback.');
