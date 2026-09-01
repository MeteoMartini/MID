import fs from 'node:fs';
import path from 'node:path';
const read=file=>fs.readFileSync(path.join(process.cwd(),file),'utf8');
const contract=read('MID_PARAMETER_COLOR_CONTRACT.md');
const modern=read('src/styles-src/30-modern.css');
const tempTone=read('src/temperatureTone.ts');
const cockpit=read('src/ForecastCockpit.tsx');
const app=read('src/App.tsx');
const checks=[
 ['contract is app-wide and binding',contract.includes('appweit verbindlich')],
 ['24h dewpoint aliases central token',modern.includes('--profile-dew:var(--param-dewpoint)')],
 ['24h wind aliases central token',modern.includes('--profile-wind:var(--param-wind)')],
 ['24h gust aliases central token',modern.includes('--profile-gust:var(--param-gust)')],
 ['24h cloud aliases central token',modern.includes('--profile-cloud:var(--param-cloud)')],
 ['24h precipitation probability aliases central token',modern.includes('--profile-prob:var(--param-precipitation)')],
 ['24h pressure aliases central token',modern.includes('--profile-pressure:var(--param-pressure)')],
 ['24h wind arrow uses central token',modern.includes('.profile-wind-direction-arrow{color:var(--param-wind)')],
 ['24h temperature line resolves to central token',cockpit.includes("return'var(--param-temperature)'")],
 ['7d Tmin uses fixed canonical token',tempTone.includes("kind==='max'?'var(--param-temperature-max)':'var(--param-temperature-min)'")],
 ['7d temperature tone no longer defines RGB gradient stops',!tempTone.includes('mixColor(')],
 ['7d rain meta uses precipitation token',modern.includes('.forecast-meta-rain,.forecast-meta-rain b{color:var(--param-precipitation)}')],
 ['7d sunshine meta uses sunshine token',modern.includes('.forecast-meta-sun{color:var(--param-sunshine)}')],
 ['7d wind meta uses wind token',modern.includes('.forecast-meta-wind{color:var(--param-wind)}')],
 ['7d detail temperature uses canonical general temperature token',app.includes("color:'var(--param-temperature)'")],
 ['detail legend temperature uses parameter token',modern.includes('.detaillegend .temp,.detaillegend i.temp')&&modern.includes('var(--param-temperature)!important')],
 ['detail legend pressure uses pressure token',modern.includes('.detaillegend i.pressureline{background:var(--param-pressure)!important}')],
 ['detail legend wind uses wind token',modern.includes('.detaillegend i.windline{background:var(--param-wind)!important}')],
 ['detail legend gust uses gust token',modern.includes('var(--param-gust) 0 7px')],
 ['detail legend probability uses precipitation token',modern.includes('.detaillegend .probability,.detaillegend i.probability')&&modern.includes('var(--param-precipitation)!important')]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){console.error('Parameter colour contract regression failed:');failed.forEach(([label])=>console.error(` - ${label}`));process.exit(1)}
console.log('Parameter colour contract regression passed with',checks.length,'checks.');
