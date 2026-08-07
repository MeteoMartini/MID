import {readFile} from 'node:fs/promises';
const [radar,cockpit,data,worker]=await Promise.all([
  readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/WeatherMapsData.ts',import.meta.url),'utf8'),
  readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of ['DWD_RASTER_LONGITUDE_LINES','DWD_RASTER_LATITUDE_LINES','Wolken + Niederschlagsart','<b>Niederschlagsart</b>','<b>Satbild</b>','viewport.width>=420?.44:.40'])need('Radar',radar,token);
for(const token of ['chartViewportRef','chartViewportWidth','ResizeObserver','chartWidth=Math.max(1040,chartViewportWidth)'])need('24h-Meteogramm',cockpit,token);
for(const token of ['icon-d2-sigwx','icon-eu-sigwx','icon-sigwx','aicon-sigwx'])need('Wetterkarten-Daten',data,token);
for(const token of ["['dwd:Icon-d2_reg002_fd_sl_WW',{forecast:true}]","['dwd:Icon-eu_reg00625_fd_sl_WW',{forecast:true}]","['dwd:Icon_reg025_fd_sl_WW',{forecast:true}]","['dwd:Aicon_reg025_fd_sl_WW',{forecast:true}]","...WEATHER_MAP_LAYER_CONFIG.keys()"] )need('Worker-Layer',worker,token);
if(failures.length){
  console.error('Radar-/Karten-Folgefixes fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Radar-/Karten-Folgefixes (Benennung, Georeferenzierung, Desktop-Meteogramm und SIGWX-Angebot) erfolgreich geprüft.');
