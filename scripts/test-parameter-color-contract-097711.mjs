import fs from 'node:fs';
import path from 'node:path';
const read=file=>fs.readFileSync(path.join(process.cwd(),file),'utf8');
const contract=read('MID_PARAMETER_COLOR_CONTRACT.md');
const modern=read('src/styles-src/30-modern.css');
const foundation=read('src/styles-src/00-foundation.css');
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
 ['Tmin/Tmax retain canonical blue/red families',tempTone.includes("kind==='max'?'var(--param-temperature-max)':'var(--param-temperature-min)'")],
 ['daily temperature climate anomaly modulates only tone strength',tempTone.includes('const intensity=anomaly===null?.18:clamp01(Math.abs(anomaly)/7)')&&tempTone.includes('toneForToken(token,intensity)')],
 ['short-term individual temperatures use climate Tmin/Tmax family',tempTone.includes('export function hourlyTemperatureTone')&&tempTone.includes("kind:DailyTemperatureKind=fraction<.5?'min':'max'")],
 ['7d rain meta uses precipitation token',modern.includes('.forecast-meta-rain,.forecast-meta-rain b{color:var(--param-precipitation)}')],
 ['7d sunshine meta uses sunshine token',modern.includes('.forecast-meta-sun{color:var(--param-sunshine)}')],
 ['7d wind meta uses wind token',modern.includes('.forecast-meta-wind{color:var(--param-wind)}')],
 ['7d detail no longer hardcodes old temperature/wind/gust/pressure/rain palette',!['#ff7a37','#59b8b0','#c48cff','#56d7ff','#4fc985','#b786ff'].some(color=>app.includes(`stroke=\"${color}\"`))],
 ['detail legend pressure uses pressure token',modern.includes('.detaillegend i.pressureline{background:var(--param-pressure)!important}')],
 ['detail legend wind uses wind token',modern.includes('.detaillegend i.windline{background:var(--param-wind)!important}')],
 ['detail legend gust uses gust token',modern.includes('var(--param-gust) 0 7px')],
 ['detail legend probability uses precipitation token',modern.includes('.detaillegend .probability,.detaillegend i.probability')&&modern.includes('var(--param-precipitation)!important')],
 ['svg wind arrows are warning-aware and baseline green',app.includes('SvgWindDirectionArrow({x,y,direction,gust')&&foundation.includes('.svg-wind-direction-arrow{color:var(--param-wind);stroke:currentColor')&&foundation.includes('.svg-wind-direction-arrow.warning-4{color:#9b59c6}')]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){console.error('Parameter colour contract regression failed:');failed.forEach(([label])=>console.error(` - ${label}`));process.exit(1)}
console.log('Parameter colour contract regression passed with',checks.length,'checks.');
