import {readFile} from 'node:fs/promises';
const [projection,panel,worker,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/radarProjection.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(where,text,token)=>{if(!text.includes(token))failures.push(`${where}: fehlt ${token}`)};
for(const token of ["+ellps=([^\\s]+)","ellipsoid==='WGS84'","298.257223563","ellipsoid==='GRS80'","298.257222101"])need('Radarprojektion',projection,token);
for(const token of ['satelliteUntimed=Boolean(satelliteProduct?.latestOnly)','timeVerified:false','snapshotRevision','requestedSatelliteKey=satelliteUntimed?`latest:','...(satelliteUntimed?{}:{time:iso})'])need('Satelliten-Recovery',panel+worker,token);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);

// Funktional: DWD-Layer vorhanden, aber ohne TIME-Dimension. Er muss als latestOnly zurückkommen.
const originalFetch=globalThis.fetch;
const dwdLayer='dwd:Satellite_meteosat_1km_euat_rgb_day_hrv_and_night_ir108_3h';
const xml=`<?xml version="1.0"?><WMS_Capabilities><Capability><Layer><Name>root</Name><Layer><Name>${dwdLayer}</Name><Title>DWD RGB/IR</Title></Layer></Layer></Capability></WMS_Capabilities>`;
globalThis.fetch=async input=>{const url=new URL(typeof input==='string'?input:input.url);if(url.hostname==='view.eumetsat.int')return new Response('<?xml version="1.0"?><WMS_Capabilities><Capability><Layer><Name>root</Name></Layer></Capability></WMS_Capabilities>',{status:200,headers:{'content-type':'text/xml'}});if(url.hostname.endsWith('dwd.de'))return new Response(xml,{status:200,headers:{'content-type':'text/xml'}});throw new Error(`Unerwarteter Abruf ${url}`)};
try{
 const module=await import('../worker/metar-proxy.js?untimed-sat='+Date.now());
 const response=await module.default.fetch(new Request('https://mid.test/?mode=composite-times&lat=53.87&lon=10.69'),{}),data=await response.json(),product=data.satelliteDayProduct;
 if(!response.ok)failures.push(`composite-times HTTP ${response.status}`);
 if(product?.provider!=='dwd'||product?.layer!==dwdLayer||product?.latestOnly!==true||product?.timeVerified!==false||!product?.snapshotRevision)failures.push(`DWD-Layer ohne TIME wird nicht als kontrollierter Live-Snapshot geliefert: ${JSON.stringify(product)}`);
}finally{globalThis.fetch=originalFetch}

if(failures.length){console.error('HymecNG-WGS84-/Satelliten-Recovery fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('HymecNG-WGS84-Ellipsoid und DWD-Satellitenlayer ohne TIME-Dimension als cache-busted Live-Snapshot geschützt.');
