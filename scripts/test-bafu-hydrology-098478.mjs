import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [composite,router,weather,water,app,quality]=await Promise.all([
 read('worker-src/20-composite-models.js'),read('worker-src/40-aviation-router.js'),read('src/weather-src/10-observations-specialized.tsfrag'),read('src/WaterSportsPanel.tsx'),read('src/App.tsx'),read('src/sourceQuality.ts')
]);
const failures=[];const need=(text,token,msg)=>{if(!text.includes(token))failures.push(msg)};
for(const token of [
 "const BAFU_GRAPHQL_ENDPOINT='https://data.bafu.admin.ch/api'",
 'stations(where:{status:{_eq:"Aufgebaut"}},limit:1000)',
 'data_live(where:{stationNo:{_eq:$station},timestamp:{_gte:$from}},limit:300)',
 'data_10min_mean(where:{station:{no:{_eq:$station}},timestamp:{_gte:$from}},limit:300)',
 "latestBafuRow(live,'W')","latestBafuRow(live,'Q')","latestBafuRow(live,'WT')",
 'freshBafuRow','age>=-20&&age<=maxAgeMinutes',
 "levelUnit:units.W||'m ü. M.'","dischargeUnit:units.Q||'m³/s'","waterTemperatureUnit:units.WT||'°C'",
 'officialWaterStation(lat,lon,country=\'\')'
])need(composite,token,`BAFU-Vertrag fehlt: ${token}`);
need(router,"'bafu-hydrology-graphql'",'Worker-Health weist BAFU nicht aus.');
need(router,"await officialWaterStation(lat,lon,u.searchParams.get('country')||'')",'official-water routet Land nicht an BAFU/PEGELONLINE.');
need(weather,'levelM?:number','Wasser-Typ kennt BAFU-Pegel in m ü. M. nicht.');
need(weather,'dischargeM3s?:number','Wasser-Typ kennt BAFU-Abfluss nicht.');
need(weather,'waterTemperatureC?:number','Wasser-Typ kennt BAFU-Wassertemperatur nicht.');
need(weather,"'official-water',{lat,lon,country:country||''}",'Client übergibt das Land nicht an den amtlichen Hydrologiepfad.');
need(water,'officialWaterObservation(loc.latitude,loc.longitude,loc.country,controller.signal)','Wasseransicht übergibt das Land nicht.');
need(water,"officialWater.provider.includes('BAFU')?'Hydrologie: BAFU",'Wasseransicht kennzeichnet BAFU nicht getrennt.');
need(water,"officialWater.current.levelUnit||'m ü. M.'",'Schweizer Pegel wird nicht im nativen Höhenbezug angezeigt.');
need(app,'öffentliche BAFU-Datenplattform aktuelle Wasserstände, Abflüsse und Wassertemperaturen','Quellenübersicht dokumentiert BAFU nicht.');
if(!/bafu\|foen/.test(quality))failures.push('Quellenqualität erkennt BAFU/FOEN nicht als amtlich.');
if(failures.length){console.error('BAFU Hydrologie v0.9.84.78 fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}

const originalFetch=globalThis.fetch;
const now=new Date(Date.now()-15*60*1000).toISOString();
try{
 globalThis.fetch=async(input,init={})=>{
  const url=new URL(input instanceof Request?input.url:String(input));
  if(url.href!=='https://data.bafu.admin.ch/api')throw new Error(`Unerwarteter Abruf ${url}`);
  const body=JSON.parse(String(init.body||'{}'));
  if(String(body.query).includes('MidBafuStations'))return Response.json({data:{water:{observations:{stations:[{no:'2099',name:'Limmat – Zürich',siteName:'Zürich',riverName:'Limmat',latitude:47.377,longitude:8.54,elevation:404,status:'Aufgebaut'}]}}}});
  if(String(body.query).includes('MidBafuLive')){
   assert.equal(body.variables.station,'2099');
   return Response.json({data:{water:{observations:{data_live:[
    {stationNo:'2099',parameterName:'W',timestamp:now,value:405.42,releaseStatus:0},
    {stationNo:'2099',parameterName:'Q',timestamp:now,value:92.6,releaseStatus:0},
    {stationNo:'2099',parameterName:'WT',timestamp:now,value:18.4,releaseStatus:0}
   ],data_10min_mean:[
    {parameterName:'W',timestamp:now,unitSymbol:'m ü. M.'},
    {parameterName:'Q',timestamp:now,unitSymbol:'m³/s'},
    {parameterName:'WT',timestamp:now,unitSymbol:'°C'}
   ]}}}});
  }
  throw new Error('Unbekannte BAFU-Testabfrage');
 };
 const module=await import(`../worker/metar-proxy.js?bafu-test=${Date.now()}`);
 const response=await module.default.fetch(new Request('https://mid.test/?mode=official-water&lat=47.376&lon=8.541&country=CH'),{});
 const data=await response.json();
 assert.equal(response.status,200);
 assert.equal(data.available,true);
 assert.match(data.provider,/BAFU/);
 assert.equal(data.station.stationNo,'2099');
 assert.equal(data.current.levelM,405.42);
 assert.equal(data.current.levelUnit,'m ü. M.');
 assert.equal(data.current.dischargeM3s,92.6);
 assert.equal(data.current.waterTemperatureC,18.4);
 assert.ok(!('valueCm' in data.current),'BAFU-Pegel darf nicht in den deutschen cm-Vertrag umetikettiert werden.');
 assert.equal(data.unverifiedRaw,true);
}finally{globalThis.fetch=originalFetch}
console.log('OK BAFU hydrology 098478');
