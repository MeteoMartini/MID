import assert from 'node:assert/strict';
import worker from '../worker/metar-proxy.js';

const start=Math.floor(Date.now()/900_000)*900_000;
const stamp=lead=>new Date(start+lead*900_000).toISOString();
const source={
 type:'FeatureCollection',reference_time:stamp(0),timestamps:[stamp(1),stamp(2),stamp(3)],
 features:[{type:'Feature',geometry:{type:'Point',coordinates:[11.0055933,46.9716911]},
  properties:{parameters:{rr:{name:'precipitation sum',unit:'kg m-2',data:[0.05,0,null]}}}}],
};
let upstream=source,calls=0;
const originalFetch=globalThis.fetch;
globalThis.fetch=async input=>{
 const url=new URL(input);
 assert.equal(url.origin,'https://dataset.api.hub.geosphere.at');
 assert.equal(url.pathname,'/v1/timeseries/forecast/nowcast-v1-15min-1km');
 assert.equal(url.searchParams.get('lat_lon'),'46.969,11.010');
 calls++;
 return Response.json(upstream);
};
const read=async (lat=46.969,lon=11.01)=>{
 const response=await worker.fetch(new Request(`https://mid.test/?mode=geosphere-inca-point&lat=${lat}&lon=${lon}`),{});
 assert.equal(response.status,200);
 return response.json();
};
try{
 assert.equal((await read(53,11)).available,false);
 assert.equal(calls,0);
 const result=await read();
 assert.equal(result.kind,'forecast');
 assert.equal(result.license,'CC BY 4.0');
 assert.deepEqual(result.forecast.map(row=>row.amountMm),[0.05,0,null]);
 for(const mutate of [
  data=>{data.features[0].properties.parameters.rr.unit='mm/h'},
  data=>{data.features[0].geometry.coordinates=[12,47]},
  data=>{data.timestamps[1]=data.timestamps[0]},
  data=>{data.reference_time=stamp(-5)},
  data=>{data.features[0].properties.parameters.rr.data[0]=-1},
 ]){
  upstream=structuredClone(source);
  mutate(upstream);
  assert.equal((await read()).available,false);
 }
}finally{globalThis.fetch=originalFetch}
console.log('GeoSphere INCA: source point, UTC axis, units, NoData, zero and scope verified.');
