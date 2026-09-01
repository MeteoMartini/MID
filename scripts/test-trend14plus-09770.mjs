import {readFile} from 'node:fs/promises';
const [panel,subseasonal,comparison,app,modules,seasonal,pkg,baseline,status,roadmap]=await Promise.all([
 readFile(new URL('../src/LongRangePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/SubseasonalTrendPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/LongRangeModelComparison.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/dashboardModules.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/seasonalForecast.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_IOS_STATUS.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_IOS_ROADMAP.md',import.meta.url),'utf8')
]);
const failures=[],need=(scope,text,token)=>{if(!text.includes(token))failures.push(`${scope}: fehlt ${token}`)};
for(const token of ["import SubseasonalTrendPanel from './SubseasonalTrendPanel'","import LongRangeModelComparison from './LongRangeModelComparison'",'<span>TREND 14D+</span>','<SubseasonalTrendPanel location={location} advancedMode={advancedMode} windUnit={windUnit}/>','<LongRangeModelComparison models={models}/>'])need('LongRangePanel',panel,token);
for(const token of ["ECMWF_ENDPOINT='https://seasonal-api.open-meteo.com/v1/seasonal'","ENSEMBLE_ENDPOINT='https://ensemble-api.open-meteo.com/v1/ensemble'","models:'ecmwf_ec46'","models:'ncep_gefs05'","forecast_days:'46'","forecast_days:'35'","for(let start=14;start<time.length;start+=7)","contributors.flatMap(samples=>resample(samples))",'Modellfamilien gleich gewichtet','Ab Tag 36 steht derzeit nur EC46'])need('SubseasonalTrendPanel',subseasonal,token);
if(/models:'gfs05'/.test(subseasonal))failures.push('SubseasonalTrendPanel: veraltete/ungültige GEFS-Kennung gfs05 vorhanden');
for(const token of ["temperature_2m_mean","precipitation_sum","pressure_msl_mean","cloud_cover_mean","wind_speed_10m_mean"])need('Subseasonal Parameter',subseasonal,token);
for(const token of ['MODELLE DIREKT VERGLEICHEN','Nur numerisch geladene Modellfamilien','keine Member-Quantile geliefert','Vergleichsvertrag',"metric==='temperature'?'K':'mm/Tag'"])need('LongRangeModelComparison',comparison,token);
if(comparison.includes('precipitationAnomalyPercent)?'))failures.push('LongRangeModelComparison: gemischte %- und mm/Tag-Einheiten im direkten Niederschlagsvergleich');
for(const token of ['C3S MULTI-MODELL','DWD DEUTSCHLAND-PERSPEKTIVE','GCFS2.2 / EPISODES'])need('bestehende Langfristlogik',panel,token);
for(const token of ['c3sSeasonalModels','fetchCfsv2','fetchC3sNumerical','fetchDwdEpisodes'])need('Seasonal Quellen bleiben erhalten',seasonal,token);
need('App',app,'Trend 14d+');need('Dashboardmodule',modules,"label:'Trend 14d+'");
const packageVersion=JSON.parse(pkg).version,base=JSON.parse(baseline),ios=JSON.parse(status);
if(!/^0\.9\.77\.\d+$/.test(packageVersion))failures.push(`Package: erwartet 0.9.77.x, gefunden ${packageVersion}`);
if(base.releaseVersion!==packageVersion)failures.push(`Baseline-Version nicht synchron: ${base.releaseVersion}/${packageVersion}`);
if(ios.releaseVersion!==packageVersion)failures.push(`iOS-Status-Version nicht synchron: ${ios.releaseVersion}/${packageVersion}`);
for(const list of ['requiredRegressionTests','regressionTests','activeRegressionSuite','requiredTests'])if(!base[list]?.includes('scripts/test-trend14plus-09770.mjs'))failures.push(`Baseline ${list}: Trend-14d+-Regression fehlt`);
if(!base.requiredFiles?.includes('src/SubseasonalTrendPanel.tsx')||!base.requiredFiles?.includes('src/LongRangeModelComparison.tsx'))failures.push('Baseline requiredFiles: neue Komponenten fehlen');
if(!base.implementationProof?.includes('MID_IMPLEMENTATION_0.9.77.0.md'))failures.push('Baseline implementationProof: v0.9.77.0 fehlt');
need('Roadmap',roadmap,'v0.9.77.0 gemeinsamer Trend 14d+');
if(failures.length){console.error('MID v0.9.77.x Trend-14d+-Vertrag fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`MID v${packageVersion}: Trend 14d+ mit EC46/GEFS, Wochenblöcken, Equal-Family-Multi-Modell und saisonalem Direktvergleich geschützt.`);
