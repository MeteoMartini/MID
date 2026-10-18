import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const context={Intl};vm.createContext(context);
vm.runInContext(stripTypeScriptTypes(readFileSync('src/precipitation.ts','utf8').replace(/export /g,'')),context);
const base={precipitation:.4,rain:.4,showers:0,snowfall:0,probability:90,code:66,temperature:2.2,dewPoint:1.6,wetBulbTemperature:1.5,humidity:94,cloud:100,lowCloud:90};
// Never equate frozen rain with mixed rain/snow. Explicitly warm surface is an
// independent contradictory predictor, and only model forecasts may be adjusted.
assert.equal(context.precipitationParts({...base,surfaceTemperature:2}).type,'rain');
assert.equal(context.reconcileForecastPrecipitation({...base,surfaceTemperature:2}).code,61);
const uncertain=context.precipitationParts(base);
assert.equal(uncertain.type,'freezingRain','Unknown surface must preserve the forecast hazard');
assert.match(uncertain.weatherLabel,/gefrierender Regen möglich/);
assert.equal(uncertain.displayCode,66);
assert.equal(uncertain.phenomenon,'FZRA');
for(const variant of [{temperature:-1,wetBulbTemperature:-1,surfaceTemperature:-2},{surfaceTemperature:0},{precipitationPhenomenonObserved:true,surfaceTemperature:2}]){
 const part=context.precipitationParts({...base,...variant});
 assert.equal(part.type,'freezingRain');
 assert.doesNotMatch(part.weatherLabel,/möglich/);
}
const mixed=context.precipitationParts({...base,code:68,snowfall:.15,rain:.2});
assert.equal(mixed.type,'sleet');
assert.equal(mixed.phenomenon,'RASN');
const drizzle=context.precipitationParts({...base,code:56,temperature:2.2,wetBulbTemperature:1.5});
assert.ok(['freezingDrizzle','freezingRain'].includes(drizzle.type));

const icon=readFileSync('src/WeatherPictogram.tsx','utf8');
assert.match(icon,/kind==='freezing-rain'\?<><Rain intensity=\{precipIntensity\}\/><GlazeSurface\/>/);
assert.match(icon,/kind==='sleet'\?<><Rain intensity=\{precipIntensity\}\/><Snow intensity=\{precipIntensity\}\/>/);
assert.match(icon,/function GlazeSurface\(/);

const cockpit=readFileSync('src/ForecastCockpit.tsx','utf8');
// Test the actual production TypeScript helper rather than extracting a standalone
// JSX fragment without its imported dependencies. The 24h chart is authoritative.
const built=await build({entryPoints:['src/shortTermSignificantBrief.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {shortTermSignificantBrief:brief}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const now=Date.UTC(2026,9,8,21,30),hour=3600000,quarter=900000;
const dry={epoch:now,precipitationIntervalStartEpoch:now,precipitationIntervalEndEpoch:now+hour,precipitation:0,probability:99,gust:6,weatherLabel:'Bedeckt',source:'hourly'};
const wet={...dry,epoch:now+hour,precipitationIntervalStartEpoch:now+hour,precipitationIntervalEndEpoch:now+2*hour,precipitation:.3,probability:8,gust:5,weatherLabel:'Leichter Regen'};
const native={...wet,source:'15-min',epoch:now+hour+quarter,precipitationIntervalStartEpoch:now+hour+quarter,precipitationIntervalEndEpoch:now+hour+2*quarter,precipitation:.1};
const format={from:epoch=>'ab '+epoch,at:epoch=>'um '+epoch,gust:knots=>knots+' kt'};
const text=brief([dry,wet],now,format);
assert.ok(text.includes(String(wet.precipitationIntervalStartEpoch)),'Text onset must use the actual visible forward-facing 24h chart interval start');
assert.ok(!text.includes(String(native.precipitationIntervalStartEpoch)),'Hidden native 15-minute onset must not shift the visible hourly chart briefing');
assert.doesNotMatch(text,/Böen/,'Non-significant gusts must not become weather brief events');
assert.match(brief([dry],now,format),/Keine markanten Wetterereignisse/,'Probability without precipitation amount is not a confirmed precipitation onset');
assert.equal(brief([{...dry,precipitation:NaN,gust:NaN}],now,format),'Kurzfristdaten unvollständig.','Missing must not be converted to dry');
assert.match(cockpit,/shortTermPointSummary\(profileDisplayPoints,unit,timezone,profileNow\)/,'Text must use same displayed hourly profile as graph');
assert.match(cockpit,/shortTermPointSummary\(visible,unit,timezone,now\)/,'Navigation preview must reuse visible hourly intervals');
assert.match(cockpit,/shortTermHours\(precipitationPresentationHours\(hours\)\)/,'Hour-only fallback must use forward-facing provider intervals');
assert.doesNotMatch(cockpit,/const nativeOnset=quarters.find\(/,'Do not reintroduce independent hidden native onset');
assert.doesNotMatch(cockpit,/<small className="cockpit-now90-cloud">Wolken/,'90m visible cards must not duplicate skybar cloud percentages');
assert.match(cockpit,/keyPrefix="now90-quarter"/,'Skybar cloud science remains present');
console.log('MID WMO/ICAO freezing rain vs sleet, warm/unknown/cold/observed safety, production TS 15m-to-visible-hour onset, missing data and 90m cloud cleanup passed.');
