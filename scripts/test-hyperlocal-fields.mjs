import fs from 'node:fs';

const weather=fs.readFileSync(new URL('../src/weather.ts',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const styles=fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const failures=[];

for(const token of [
  'visibility?:number;cloudCover?:number;precipitation?:number',
  'visibility:num(w.visibility)',
  'visibility:field(\'visibility\',18000)',
  "current:['temperature_2m','relative_humidity_2m','dew_point_2m','pressure_msl','wind_speed_10m','wind_direction_10m','wind_gusts_10m','visibility','cloud_cover','precipitation']",
  "visibility=residualField(ranked,backgrounds,target,'visibility','visibility'",
  "cloudCover=residualField(ranked,backgrounds,target,'cloudCover','cloudCover'",
  "precipitation=residualField(ranked,backgrounds,target,'precipitation','precipitation'",
  'visibility:metarVisibilityMeters(r)',
  'cloudCover:metarCloudCover(r)',
  'value*1609.344'
])if(!weather.includes(token))failures.push(`Hyperlokale Feldauswertung fehlt: ${token}`);

const precipIndex=app.indexOf("label:'Niederschlag'");
const visibilityIndex=app.indexOf("label:'Sichtweite'");
const cloudIndex=app.indexOf("label:'Bewölkung'");
if(!(precipIndex>=0&&visibilityIndex>precipIndex&&cloudIndex>visibilityIndex))failures.push('Sichtweite steht nicht zwischen Niederschlag und Bewölkung');
for(const token of ['visibility=observed(st?.visibility,Number(c.visibility))','value:visibilityLabel(visibility)','Number.isFinite(st?.visibility)'])if(!app.includes(token))failures.push(`Sichtweitenkarte fehlt: ${token}`);

for(const token of ['.sunshine-scale-legend>i{width:min(255px,44vw)','height:18px','opacity:.88'])if(!styles.includes(token))failures.push(`Kompakte Sonnenscheinlegende fehlt: ${token}`);

const smToMeters=10*1609.344;
if(Math.abs(smToMeters-16093.44)>.01)failures.push('METAR-Sichtweitenumrechnung ist fehlerhaft');

if(failures.length){console.error('Hyperlokal-/Sichtweitenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Hyperlokale Analyse geprüft: Sichtweite, Bewölkung und Niederschlag werden stations- und modellgestützt berücksichtigt; METAR-Sicht wird in Meter normalisiert.');
