import assert from 'node:assert/strict';
const originalFetch=globalThis.fetch;
const seen=[];
globalThis.fetch=async input=>{
 const url=new URL(typeof input==='string'?input:input.url);
 seen.push(url);
 // GeoMet returns an XML exception (HTTP 200) for millisecond timestamps.
 for(const key of ['time','dim_reference_time']){
  const value=url.searchParams.get(key);
  if(url.hostname==='geo.weather.gc.ca'&&value&&!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value))return new Response('<ServiceException>Date format error</ServiceException>',{headers:{'content-type':'text/xml'}});
 }
 return new Response(new Uint8Array([137,80,78,71]),{headers:{'content-type':'image/png'}});
};
try{
 const worker=(await import('../worker/metar-proxy.js?geomet-time-test')).default;
 const epoch=Math.floor(Date.now()/3600000)*3600000,time=new Date(epoch).toISOString();
 for(const layer of ['GDPS_15km_TotalCloudCover','GDPS_15km_PrecipType-Instant']){
  const url=new URL('https://mid.test/');
  for(const [key,value] of Object.entries({mode:'weather-map-wms',provider:'geomet',layers:layer,time,dim_reference_time:time,request:'GetMap',format:'image/png'}))url.searchParams.set(key,value);
  const response=await worker.fetch(new Request(url),{});
  assert.equal(response.status,200,`${layer} must receive an image, not the provider XML exception`);
  assert.equal(response.headers.get('content-type'),'image/png');
  const upstream=seen.at(-1);
  for(const key of ['time','dim_reference_time']){
   assert.equal(upstream.searchParams.get(key),time.replace('.000Z','Z'));
   assert.equal(Date.parse(upstream.searchParams.get(key)),epoch,'normalization must preserve the exact instant');
  }
  const before=seen.length;
  url.searchParams.set('time',time.replace('.000Z','.123Z'));
  assert.equal((await worker.fetch(new Request(url),{})).status,400,'fractional seconds must not be silently rounded');
  assert.equal(seen.length,before);
  url.searchParams.set('time',time);
  url.searchParams.set('dim_reference_time',time.replace('.000Z','.123Z'));
  assert.equal((await worker.fetch(new Request(url),{})).status,400);
  assert.equal(seen.length,before);
 }
 console.log('GeoMet WMS: both GDPS layers preserve exact whole-second UTC instants; millisecond serialization removed; fractional seconds rejected before upstream fetch.');
}finally{globalThis.fetch=originalFetch}
