import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const modern=await read('src/styles-src/30-modern.css');
const app=await read('src/App.tsx');
const components={
 'src/ClimatePanel.tsx':'.climate-panel',
 'src/MeteogramPanel.tsx':'.meteogram-card',
 'src/EnsemblePanel.tsx':'.ensemble',
 'src/LongRangePanel.tsx':'.long-range-panel',
 'src/SubseasonalTrendPanel.tsx':'.subseasonal-comparison',
 'src/SynopticPanel.tsx':'.synoptic-panel',
 'src/FlightMeteorologyPanel.tsx':'.flight-meteorology',
 'src/WaterSportsPanel.tsx':'.water-sports',
 'src/EventPlannerPanel.tsx':'.event-planner',
 'src/TravelPlannerPanel.tsx':'.travel-planner',
 'src/WeatherMapsPanel.tsx':'.weather-maps-panel',
 'src/VentilationAssistantPanel.tsx':'.ventilation-assistant-panel',
 'src/ExtremeWeatherOutlookPanel.tsx':'.extreme-outlook-panel',
 'src/DwdPrecipitationTypeRadar.tsx':'.dwd-precip-type-radar',
 'src/ShortTermForecast.tsx':'.short-term-forecast'
};
assert.match(modern,/MID v0\.9\.84\.70 · App-weiter Designvertrag/,'appweiter Designvertrag fehlt');
for(const [file,selector] of Object.entries(components)){
 const source=await read(file),className=selector.slice(1);
 assert.ok(source.includes(className),`${file} enthält die erwartete Hauptansicht ${selector} nicht`);
 assert.ok(modern.includes(selector),`${selector} fehlt im appweiten Designvertrag`);
}
for(const selector of ['.warnings-responsive-shell','.radar'])assert.ok(modern.includes(selector),`${selector} fehlt im appweiten Designvertrag`);
assert.match(app,/CurrentWeather|current-compact|current-weather/,'Istwetter-Vertrag ist im App-Shell nicht mehr auffindbar');
assert.match(modern,/--mid-control-touch:44px/,'44px Touch-Token ging verloren');
assert.match(modern,/font-size:16px!important/,'iOS-Fokuszoom-Schutz für Eingaben fehlt');
assert.match(modern,/@media \(hover:none\),\(pointer:coarse\),\(any-pointer:coarse\)/,'Hybrid-Touchvertrag fehlt');
console.log('OK appwide design coverage 098470');
