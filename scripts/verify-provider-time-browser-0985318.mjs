import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {transform} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {realpathSync,readFileSync,mkdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim());
const {chromium}=createRequire(import.meta.url)(join(dirname(dirname(cli)),'playwright'));
if(!process.env.MID_CHROMIUM_EXECUTABLE)execFileSync('node',[cli,'install','chromium'],{stdio:'inherit',timeout:240000});
const entry=`import React from 'react';import{createRoot}from'react-dom/client';import{ShortTermRibbon}from'/src/ForecastCockpit.tsx';import{mapHours,mapMinutely15,mapDays}from'/src/weather.ts';
const q=new URLSearchParams(location.search),fall=q.get('season')==='fall',date=fall?'2026-10-25':'2026-03-29',offset=fall?7200:3600,start=Date.parse((fall?'2026-10-24':'2026-03-28')+'T00:00Z'),now=Date.parse(date+'T00:00Z')-offset*1000;Date.now=()=>now;
document.documentElement.dataset.theme=q.get('theme');document.documentElement.dataset.midDesign='next';
const times=Array.from({length:97},(_,i)=>new Date(start+i*3600000).toISOString().slice(0,16)),dates=[...new Set(times.map(t=>t.slice(0,10)))],defaults={temperature_2m:10,apparent_temperature:9,relative_humidity_2m:90,dew_point_2m:8,precipitation:1,rain:1,showers:0,snowfall:0,precipitation_probability:80,weather_code:61,cloud_cover:100,cloud_cover_low:80,cloud_cover_mid:50,cloud_cover_high:20,wind_speed_10m:10,wind_gusts_10m:20,wind_direction_10m:270,pressure_msl:1010,uv_index:0,visibility:20000,cape:0,sunshine_duration:0,is_day:0},hourly={time:times,...Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,times.map(()=>v)]))},daily={time:dates,...Object.fromEntries(Object.entries({temperature_2m_max:20,temperature_2m_min:0,precipitation_sum:24,rain_sum:24,showers_sum:0,snowfall_sum:0,precipitation_hours:24,precipitation_probability_max:80,wind_speed_10m_max:10,wind_gusts_10m_max:20,wind_direction_10m_dominant:270,uv_index_max:0,weather_code:61,sunshine_duration:0}).map(([k,v])=>[k,dates.map(()=>v)])),sunrise:dates.map(d=>d+'T07:00'),sunset:dates.map(d=>d+'T18:00')},w={latitude:50.82,longitude:7.04,elevation:50,timezone:'Europe/Berlin',utc_offset_seconds:offset,current:{time:times[24]},hourly,daily},hours=mapHours(w),days=mapDays(w);
window.__providerTime={hours,day:days.find(d=>d.date===date),date};
createRoot(document.getElementById('root')).render(<div className='app'><section className='forecast-cockpit modern-workspace' data-workspace-mode='true'><div className='cockpit-body'><ShortTermRibbon hours={hours} minutes15={mapMinutely15(w)} climate={[]} timezone='Europe/Berlin' unit='kmh' onSelectedDate={()=>{}} anchor={{active:false}} canonicalNowcast={true} location={{latitude:50.82,longitude:7.04,elevation:50}} showDwdPrecipitationTypeRadar={false}/></div></section></div>);
`;
const css=[...readFileSync('src/main.tsx','utf8').matchAll(/import '\.\/([^']+\.css)'/g)].map(m=>`<link rel="stylesheet" href="/src/${m[1]}">`).join('');
const compiled=await transform(entry,{loader:'tsx',jsx:'automatic',format:'esm'});
const server=await createServer({server:{host:'127.0.0.1',port:0,watch:null,hmr:false},plugins:[{name:'provider-time-browser-fixture',enforce:'pre',transform(code,id){if(id.split('?')[0]===join(process.cwd(),'src/ForecastCockpit.tsx'))return code+'\nexport{ShortTermRibbon};';},configureServer(s){s.middlewares.use((req,res,next)=>{if(req.url?.startsWith('/__provider318')){res.setHeader('Content-Type','text/html');res.end(`<html lang="de"><meta name="viewport" content="width=device-width,initial-scale=1">${css}<body style="margin:0"><div id="root"></div><script type="module" src="/qa-provider318.tsx"></script></body></html>`)}else next()})},resolveId(id){if(id==='/qa-provider318.tsx')return '\0provider318.tsx'},load(id){if(id==='\0provider318.tsx')return compiled.code}}]});
await server.listen();
const browser=await chromium.launch({...(process.env.MID_CHROMIUM_EXECUTABLE?{executablePath:process.env.MID_CHROMIUM_EXECUTABLE}:{}),headless:true,args:['--no-sandbox']}),out='/tmp/mid318-provider-time-browser';mkdirSync(out,{recursive:true});let count=0;
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/same key|duplicate key/i.test(m.text()))errors.push(m.text())});
 for(const [width,height]of [[320,740],[390,844],[844,390],[768,1024],[1440,900]])for(const theme of ['light','dark'])for(const season of ['fall','spring']){
  await page.setViewportSize({width,height});await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__provider318?theme=${theme}&season=${season}`);await page.locator('.profile-axis.wind-axis text').first().waitFor();
  const result=await page.evaluate(()=>{const{hours,day,date}=window.__providerTime;return{count:hours.filter(h=>h.time.startsWith(date)).length,precipitation:day.precipitation,unique:new Set(hours.map(h=>h.time)).size===hours.length,spacing:hours.slice(1).every((h,i)=>h.epoch-hours[i].epoch===3600000),overflow:document.documentElement.scrollWidth>innerWidth+1}});
  assert.equal(result.count,season==='fall'?25:23);assert.equal(result.precipitation,result.count);assert.equal(result.unique,true);assert.equal(result.spacing,true);assert.equal(result.overflow,false);
  if(width===390)await page.locator('.cockpit-weather-profile').screenshot({path:`${out}/${season}-${theme}.png`});count++;
 }
 assert.deepEqual(errors,[]);console.log(`PASS ${count} actual provider-to-24h browser cases: 23/25h days, unique repeated hours, complete accumulations and responsive Light/Dark profile · ${out}`);
}finally{await browser.close();await server.close()}
