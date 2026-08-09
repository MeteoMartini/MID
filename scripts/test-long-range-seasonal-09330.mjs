import {readFile} from 'node:fs/promises';
const [modules,app,seasonal,panel,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/dashboardModules.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/seasonalForecast.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/LongRangePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(scope,text,token)=>{if(!text.includes(token))failures.push(`${scope}: fehlt ${token}`)};
for(const token of ["|'long-range'","{id:'long-range',label:'Langfrist'","Monatliche Temperatur- und Niederschlagsanomalien"])need('dashboardModules',modules,token);
for(const token of ["lazy(()=>import('./LongRangePanel'))","case'long-range'","title=\"Langfrist\"","<MemoLazyLongRange location={loc!}"])need('App',app,token);
for(const token of ['https://seasonal-api.open-meteo.com/v1/seasonal','temperature_2m_anomaly','precipitation_anomaly','SEAS5','ECMWF','Met Office','Météo-France','DWD','CMCC','NCEP','JMA','ECCC','BOM',"forecast_days:'217'"])need('seasonalForecast',seasonal,token);
for(const token of ['Monatstrend','Temperatur','Niederschlag','0 K = Modellklima','0 % = Modellklima','C3S MULTI-MODELL','Offiziellen C3S-Vergleich öffnen'])need('LongRangePanel',panel,token);
for(const token of ['.long-range-panel{','.long-range-grid{','.long-range-chart{','.long-range-model-strip{'])need('styles',styles,token);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);if(pv!=='0.9.33.1')failures.push(`unerwartete Version ${pv}`);
if(failures.length){console.error('MID v0.9.33.1 Langfristprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID v0.9.33.1: Langfrist-Sektion, lokale ECMWF-SEAS5-Anomalien und C3S-Großmodellvergleich geprüft.');
