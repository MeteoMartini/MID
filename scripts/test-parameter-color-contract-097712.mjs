import fs from 'node:fs';
const app=fs.readFileSync('src/App.tsx','utf8');
const cockpit=fs.readFileSync('src/ForecastCockpit.tsx','utf8');
const tone=fs.readFileSync('src/temperatureTone.ts','utf8');
const contract=fs.readFileSync('MID_PARAMETER_COLOR_CONTRACT.md','utf8');
const foundation=fs.readFileSync('src/styles-src/00-foundation.css','utf8');
const modern=fs.readFileSync('src/styles-src/30-modern.css','utf8');
const line=fs.readFileSync('src/parameterLineStyle.ts','utf8');
const checks=[
 ['contract binds wind arrow warning colors',contract.includes('Windpfeile verwenden ohne Warnschwelle `--param-wind`')&&contract.includes('I1–I4')],
 ['contract binds climatology-aware Tmin/Tmax shade families',contract.includes('Tmin verwendet ausschließlich Blautöne')&&contract.includes('Tmax ausschließlich Rottöne')],
 ['hourly temperatures stay neutral while reusing central helper',tone.includes('hourlyTemperatureTone')&&tone.includes("color:'var(--text)'")&&cockpit.includes('hourlyTemperatureTone(item.temperature')&&app.includes('hourlyTemperatureTone(hour.temperature')],
 ['daily Tmin/Tmax signed anomaly changes saturation not family',tone.includes('dailyIntensity(anomaly,kind)')&&tone.includes("const token=kind==='max'?'var(--param-temperature-max)':'var(--param-temperature-min)'")],
 ['detail chart general temperature uses parameter token',app.includes('data-parameter-line="temperature" style={parameterLineStyle(\'temperature\')}')&&line.includes("temperature:{color:'var(--param-temperature)',width:2.75}")],
 ['detail chart dewpoint uses parameter token',app.includes('data-parameter-line="dewpoint" style={parameterLineStyle(\'dewpoint\')}')&&line.includes("dewpoint:{color:'var(--param-dewpoint)',width:2")],
 ['detail chart pressure uses parameter token',app.includes('data-parameter-line="pressure" style={parameterLineStyle(\'pressure\')}')&&line.includes("pressure:{color:'var(--param-pressure)',width:1.55")],
 ['detail chart precipitation probability uses parameter token',app.includes('data-parameter-line="probability" style={parameterLineStyle(\'probability\')}')&&line.includes("probability:{color:'var(--param-precipitation)',width:2,dash:'4 3'")],
 ['detail chart wind and gust use canonical tokens',app.includes('data-parameter-line="wind" style={parameterLineStyle(\'wind\')}')&&app.includes('data-parameter-line="gust" style={parameterLineStyle(\'gust\')}')&&line.includes("wind:{color:'var(--param-wind)',width:2.5}")&&line.includes("gust:{color:'var(--param-gust)',width:2,dash:'9 4'")],
 ['detail direction arrows receive gust threshold input',app.includes('direction={p[i].direction} gust={p[i].gust}')],
 ['svg wind arrow base and warning classes are standardized',foundation.includes('.svg-wind-direction-arrow{color:var(--param-wind);stroke:currentColor')&&foundation.includes('.svg-wind-direction-arrow.warning-1{color:#e6c229}')],
 ['24h selected values use readable theme-adaptive pills',cockpit.includes('ProfileSelectedValuePill')&&modern.includes('.selected-time-value-pill rect{fill:var(--mg-tooltip)')&&modern.includes('var(--mg-tooltip-border)')],
 ['24h temperature point density reduced to selection',cockpit.includes('className="temperature-point active"')&&!cockpit.includes('{chartPoints.map(item=><circle key={`temp-point-')]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){console.error('Parameter colour contract v0.9.77.15 failed:');failed.forEach(([label])=>console.error(' - '+label));process.exit(1)}
console.log('Parameter colour contract v0.9.77.15 passed with',checks.length,'checks.');
