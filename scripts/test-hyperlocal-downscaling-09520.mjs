import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [weather,worker,app,contract,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../MID_HYPERLOCAL_DOWNSCALING_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

// DWD native high-frequency observations, including the urban network.
for(const token of [
 "temperature:{path:'air_temperature/now/',prefix:'10minutenwerte_TU_'",
 "urban_temperature:{base:'https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate_urban/10_minutes/'",
 "wind:{path:'wind/now/',prefix:'10minutenwerte_wind_'",
 "extreme_wind:{path:'extreme_wind/now/',prefix:'10minutenwerte_extrema_wind_'",
 "precipitation:{path:'precipitation/now/',prefix:'10minutenwerte_nieder_'",
 "new DecompressionStream('deflate-raw')",
 "fieldTemporalResolutionMinutes:{temperature:10,humidity:10,dewPoint:10}",
 "if(kind==='extreme_wind')",
 "fieldTemporalResolutionMinutes:{windGust:10}",
 "const kinds=['temperature','urban_temperature','wind','extreme_wind','precipitation']"
])assert.ok(worker.includes(token),`DWD-Hochfrequenzvertrag fehlt: ${token}`);

// Fine-grained terrain/morphology instead of a binary city/country switch.
for(const token of [
 'type TerrainMorphology=',
 'terrainMorphologyFromElevations',
 'slopeDeg',
 'aspectDeg',
 'reliefM',
 'positionIndexM',
 'https://api.open-meteo.com/v1/elevation',
 'morphologyCompatibility(field',
 '*morphologyCompatibility(field,s,morphology)',
 "morphologyCompatibility('windDirection',station,morphology)",
 "'Copernicus DEM GLO-90 · 8-Sektor-Exposition'"
])assert.ok(weather.includes(token),`DEM-/Morphologievertrag fehlt: ${token}`);

// Land surface / roughness: exact GIS adapter or explicitly lower-confidence OSM proxy.
for(const token of [
 "MID_SURFACE_CONTEXT_POINT_ENDPOINT",
 "source:'OpenStreetMap-Morphologieproxy'",
 "quality:'proxy'",
 "quality:'gis'",
 'imperviousnessPercent',
 'roughnessLengthM'
])assert.ok(worker.includes(token)||weather.includes(token),`Oberflächenvertrag fehlt: ${token}`);
assert.ok(weather.includes("context.surface.quality==='gis'"),'Versiegelung darf nicht aus einem OSM-Proxy als exakte GIS-Evidenz behandelt werden.');
assert.ok(weather.includes('context.isDay===false&&weakWind?19'),'UHI-Repräsentativität wird nachts/schwachwindig nicht stärker differenziert.');
assert.ok(weather.includes("field==='windSpeed'||field==='windDirection'||field==='windGust'?Math.exp(-logDiff/.88)"),'Rauigkeitsunterschiede dämpfen Windrestfelder nicht ausreichend.');

// No second blanket lapse-rate correction after elevation-downscaled model background.
assert.ok(!weather.includes('-0.65')&&!weather.includes('-.65'),'Pauschale doppelte −0,65-K/100-m-Korrektur darf nicht im Hyperlokalpfad stehen.');
assert.ok(weather.includes("elevation:selected.map"),'Ziel- und Stationshöhen müssen an den lokalen Modellhintergrund übergeben werden.');
assert.ok(weather.includes("current:['temperature_2m'" )&&weather.includes("'is_day'].join(',')"),'Lokaler Modellhintergrund inklusive Tages-/Nachtregime fehlt.');
assert.ok(app.includes('surfaceContextMissing=!value.surfaceClass'),'Schnellanalyse muss bei fehlendem Oberflächenkontext eine Qualitätsanreicherung auslösen.');

for(const phrase of [
 'Modellhintergrund vor pauschaler Höhenkorrektur',
 'DEM-/Reliefprofil',
 'Landnutzung, Versiegelung, LCZ und Rauigkeit',
 'Stadtwärmeeffekte werden nicht als pauschaler Temperaturzuschlag erfunden',
 'Das logarithmische Windprofil darf **nicht** blind',
 'Statistisches Downscaling statt Doppelkorrektur'
])assert.ok(contract.includes(phrase),`Downscaling-Vertrag unvollständig: ${phrase}`);

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Version und Baseline müssen übereinstimmen.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-hyperlocal-downscaling-09520.mjs'),'Downscaling-Regression muss Required sein.');
console.log(`MID v${pkg.version}: DWD-10-Minuten-Echtzeit, DEM-Morphologie, Oberflächen-/Rauigkeitsgewichtung und Doppelkorrekturschutz geprüft.`);
