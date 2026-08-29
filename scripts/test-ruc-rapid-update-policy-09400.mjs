import {readFile} from 'node:fs/promises';
const [worker,weather,phaseData,overlay,fusion,cockpit,app,meteogram,baseline]=await Promise.all([
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherMapsData.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarModelPrecipTypeOverlay.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastFusion.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/MeteogramPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8').then(JSON.parse)
]);
const testName='scripts/test-ruc-rapid-update-policy-09400.mjs';
if(!baseline.requiredRegressionTests?.includes(testName))throw new Error('RUC/Rapid-Update-Test fehlt im Baseline-Vertrag.');
const need=(label,text,token)=>{if(!text.includes(token))throw new Error(`${label}: ${token} fehlt.`)};
need('RUC Forecast Fusion',worker,"id:'icon_d2_ruc'");
need('RUC optional capability',worker,'optionalCapability:true');
need('RUC Gewichtung',worker,'rapidFactor');
need('RUC Reparaturpriorität',worker,"'icon_d2_ruc','knmi_harmonie_europe','icon_d2'");
need('KNMI Europe Rapid',worker,"id:'knmi_harmonie_europe'");
need('HRRR Rapid',worker,"id:'hrrr'");
need('NBM Rapid',worker,"id:'nbm'");
need('MET Nordic Rapid',worker,"id:'metno_nordic'");
need('UKV Rapid',worker,"id:'ukmo_ukv'");
need('Radar AROME HD 15min',worker,"id:'arome-france-hd-ruc'");
need('Radar AROME 15min',worker,"id:'arome-france-ruc'");
need('Radar HRRR Rapid',worker,"apiIds:['ncep_hrrr_conus']");
if(worker.includes('ncep_hrrr_conus_15min'))throw new Error('Nicht dokumentierter HRRR-_15min-Modellalias darf nicht verwendet werden.');
need('Radar AROME eigener Endpunkt',worker,"endpoint:'https://api.open-meteo.com/v1/meteofrance'");
need('RUC DWD Metadata',worker,"mode==='rapid-model-meta'");
need('RUC DWD Open Data',worker,'opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc');
need('RUC Lauflaenge dynamisch',worker,'PT(\\d{3})H(\\d{2})M\\.grib2');
need('App Modellmetadaten',weather,"metaSource:'dwd-ruc'");
need('App RUC Label',weather,"label:'DWD ICON-D2-RUC'");
need('App KNMI Europe',weather,"id:'knmi_harmonie_arome_europe'");
need('Phasenmodell dynamischer Typ',phaseData,'export type WeatherPhaseGridData={modelId:string;');
need('Dynamischer Phasenmodellname',overlay,"data.modelLabel||'Regionalmodell'");
need('Radar Rapid Status',overlay,"data.rapidUpdate?' · Rapid Update':''");
need('Fusion Source-Provenienz',worker,'rapidUpdate:Boolean(result.rapidUpdate)');
need('Fusion Label',fusion,'Rapid Update einbezogen');
need('Cockpit RUC Badge',cockpit,'cockpit-model-rapid-badge');
need('Classic RUC Badge',app,'model-rapid-badge');
need('Meteogramm KNMI Rapid',meteogram,"id:'knmi_harmonie_arome_europe'");
need('Meteogramm UKV Rapid',meteogram,"id:'ukmo_uk_deterministic_2km'");
need('Worker Meteogramm KNMI Rapid',worker,"['knmi_harmonie_arome_europe',{label:'KNMI HARMONIE-AROME Europe · Rapid Update'");
need('UK/RUC-EPS Rapid Ensemble Prioritaet',weather,"const ensemblePriority=['ukmo_uk_ensemble_2km','icon_d2_ruc_eps','icon_d2_eps'");

const realFetch=globalThis.fetch;
const testNowMs=Date.now(),hourMs=60*60*1000,latestRunMs=Math.floor((testNowMs-30*60*1000)/hourMs)*hourMs;
const runKey=ms=>new Date(ms).toISOString().slice(0,13)+':00';
const apacheStamp=ms=>{const d=new Date(ms),months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],pad=n=>String(n).padStart(2,'0');return `${pad(d.getUTCDate())}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`};
const recentRuns=[latestRunMs-2*hourMs,latestRunMs-hourMs,latestRunMs];
globalThis.fetch=async input=>{
 const url=new URL(typeof input==='string'?input:input.url);
 if(url.hostname==='opendata.dwd.de'&&url.pathname.endsWith('/icon-d2-ruc/p/TOT_PREC/r/'))return new Response(recentRuns.map((ms,index)=>`<a href="${runKey(ms)}/">${runKey(ms)}/</a> ${apacheStamp(ms+30*60*1000+index*1000)}`).join('\n'),{status:200,headers:{'content-type':'text/html'}});
 if(url.hostname==='opendata.dwd.de'&&url.pathname.endsWith(`/icon-d2-ruc/p/TOT_PREC/r/${runKey(latestRunMs)}/s/`))return new Response(`
  <a href="PT000H00M.grib2">PT000H00M.grib2</a>
  <a href="PT000H05M.grib2">PT000H05M.grib2</a>
  <a href="PT000H10M.grib2">PT000H10M.grib2</a>
  <a href="PT027H00M.grib2">PT027H00M.grib2</a>
 `,{status:200,headers:{'content-type':'text/html'}});
 throw new Error(`Unerwarteter RUC-Testabruf: ${url}`);
};
try{
 const module=await import(`../worker/metar-proxy.js?ruc-policy=${Date.now()}`),response=await module.default.fetch(new Request('https://mid.test/?mode=rapid-model-meta&model=icon-d2-ruc'),{}),data=await response.json();
 if(!response.ok)throw new Error(`DWD-RUC-Metadaten abgelehnt: ${JSON.stringify(data)}`);
 if(data._mid_rapid_update!==true||data._mid_resolution_km!==2)throw new Error(`RUC-Kennung/Resolution falsch: ${JSON.stringify(data)}`);
 if(Number(data.update_interval_seconds)!==3600||Number(data.temporal_resolution_seconds)!==300)throw new Error(`RUC-Zyklus falsch: ${JSON.stringify(data)}`);
 if(Number(data._mid_forecast_horizon_hours)!==27)throw new Error(`Aktuelle Lauflaenge wurde nicht aus dem s/-Index erkannt: ${data._mid_forecast_horizon_hours}`);
}finally{globalThis.fetch=realFetch}
console.log('App-weite Rapid-Update-Policy geprüft: DWD ICON-D2-RUC-Verfügbarkeit, dynamische Lauflaenge, regionale stündliche Modelle, Radar-Phasenwahl und UI-Provenienz.');
