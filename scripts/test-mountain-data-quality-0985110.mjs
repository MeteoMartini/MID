import {readAppFeatureSources} from './lib/appFeatureSources.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [pkgRaw,mountain,app,contract]=await Promise.all([
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('src/mountainSports.ts',root),'utf8'),
 readAppFeatureSources(),
 readFile(new URL('MID_MOUNTAIN_DATA_QUALITY_0.9.85.110.md',root),'utf8')
]);
const pkg=JSON.parse(pkgRaw);

assert.match(mountain,/MOUNTAIN_REGIONAL_MODELS:MountainRegionalModelPlan\[]=/,'Regionale Höhenquellen fehlen.');
for(const token of [
 "id:'geosphere_arome_austria',label:'GeoSphere AROME Austria'",
 "id:'meteoswiss_icon_ch1',label:'MeteoSwiss ICON-CH1'",
 "id:'icon_d2',label:'DWD ICON-D2'",
 "id:'meteofrance_arome_france_hd',label:'Météo-France AROME HD'"
])assert.ok(mountain.includes(token),`Regionale Kernquelle fehlt: ${token}`);
assert.match(mountain,/fetchMountainRegionalForecast\(points:MountainProfileLevel\[],plan:MountainRegionalModelPlan/,'Regionalmodell wird nicht gemeinsam für alle Höhenpunkte angefordert.');
assert.match(mountain,/latitude:points\.map\(point=>point\.latitude\)\.join\(','\)/,'Regionalmodell nutzt nicht denselben Mehrpunktabruf für alle Höhenstufen.');
assert.match(mountain,/models:plan\.id/,'Regionalmodellplan wird nicht als einheitliches Modell auf den Höhenabruf angewandt.');
assert.match(mountain,/mergeMountainRegionalForecast\(row,regionalRows!\[index\]\)/,'Regionalmodell wird nicht feldweise auf die vollständige Best-Match-Basis gelegt.');
assert.match(mountain,/value===null\|\|value===undefined\|\|value===''\?baseValues\[index\]/,'Fehlende Regionalmodellfelder dürfen nicht zu künstlichen Nullwerten werden.');
assert.match(mountain,/models:'best_match'/,'Best Match muss als vollständige 7-Tage-Basis erhalten bleiben.');
assert.match(mountain,/horizontalSpanKm:mountainProfileHorizontalSpanKm\(points\)/,'Horizontale Profilspannweite wird nicht transparent erfasst.');
assert.doesNotMatch(mountain,/precipitation[^\n]{0,80}\*[^\n]{0,40}elevation|elevation[^\n]{0,80}\*[^\n]{0,40}precipitation/i,'Niederschlag darf nicht künstlich höhenmonoton skaliert werden.');

assert.match(app,/daylightWeatherPeriods=weatherPeriods\.filter\(period=>period\.isDay\)/,'Tagespiktogramm bevorzugt keine Tageslichtperioden.');
assert.match(app,/representativePool=daylightWeatherPeriods\.length\?daylightWeatherPeriods:weatherPeriods/,'Tagesrepräsentant verwendet den Tageslichtpool nicht.');
assert.match(app,/WeatherPictogram code=\{day\.code\}[\s\S]{0,180}day=\{true\}/,'Tageszeilen dürfen kein Nacht-/Mondpiktogramm rendern.');
assert.match(app,/\(season==='winter'\|\|Number\(day\.snow\)>0\).*<small>Neuschnee<\/small>/s,'Sommerzeilen blenden redundantes 0-cm-Neuschnee nicht aus oder verwenden falsches Wording.');
assert.match(app,/rapidMinutes15\?\.length\?' · RUC ergänzend'/,'RUC-Nutzung wird im Höhenquellenstatus nicht sichtbar abgegrenzt.');
assert.match(app,/standortbezogenes 15-Minuten-Kurzfristsignal, nicht als getrennte Höhenreihe/,'RUC darf nicht als höhenaufgelöste Reihe suggeriert werden.');
assert.match(app,/data\.horizontalSpanKm>=3[\s\S]*Luv-\/Lee-Effekte/s,'Räumlich getrennte Höhenpunkte werden nicht als orographisch eigenständige Punkte erklärt.');
assert.match(app,/eye="Höhenbezogene Modellprognose"/,'Bergwetter behauptet weiterhin pauschal einen Best-Match-only-Pfad.');

for(const token of ['Niederschlag darf **nicht** künstlich monoton mit der Höhe skaliert werden','Tageszeilen sind Tageszusammenfassungen','DWD ICON-D2-RUC bleibt ein standortbezogenes 15-Minuten-Kurzfristsignal'])assert.ok(contract.includes(token),`Vertrag unvollständig: ${token}`);

const versionAtLeast=(value,minimum)=>{const left=String(value).split(/[+-]/,1)[0].split('.').map(Number),right=String(minimum).split('.').map(Number);for(let index=0;index<Math.max(left.length,right.length);index++){const a=left[index]??0,b=right[index]??0;if(a!==b)return a>b}return true};
assert.ok(versionAtLeast(pkg.version,'0.9.85.110'),'Mountain-Data-Quality-Vertrag benötigt mindestens MID v0.9.85.110.');
console.log('MID v0.9.85.110: regionale Höhenquellen, orographisch neutrale Niederschlagslogik, Tagespiktogramme, Neuschnee und RUC-Abgrenzung geschützt.');

/** Execute the production snow-value parser, not a source-string approximation. */
const {build}=await import('esbuild');
const snowBundle=await build({stdin:{contents:"export {validatedGeoSphereSnowMeasurement} from './mountainSnowObservation';",loader:'ts',resolveDir:new URL('src/',root).pathname},bundle:true,write:false,platform:'node',format:'esm'});
const {validatedGeoSphereSnowMeasurement:parseSnow}=await import('data:text/javascript;base64,'+Buffer.from(snowBundle.outputFiles[0].text).toString('base64'));
const snowNow=Date.parse('2026-11-01T06:00:00Z');
const snowRow={available:true,valueCm:0,stationId:'AT-1',stationName:'Berg',stationElevation:1500,distanceKm:5,heightDifferenceM:100,observedAt:'2026-11-01T05:00:00Z',provider:'GeoSphere Austria'};
let snowCases=0;
const snowGood=(row,value)=>{assert.equal(parseSnow(row,1400,snowNow)?.valueCm,value);snowCases++};
const snowBad=(row,elevation=1400)=>{assert.equal(parseSnow(row,elevation,snowNow),undefined);snowCases++};
snowGood(snowRow,0);snowGood({...snowRow,valueCm:42.5},42.5);
for(const valueCm of [null,undefined,'',false,'0',NaN,Infinity,-1,1001])snowBad({...snowRow,valueCm});
for(const distanceKm of [null,undefined,'',-1,25.1])snowBad({...snowRow,distanceKm});
for(const heightDifferenceM of [null,undefined,'',400,-400])snowBad({...snowRow,heightDifferenceM});
for(const stationElevation of [null,undefined,''])snowBad({...snowRow,stationElevation});
snowBad({...snowRow,stationElevation:1900});snowBad({...snowRow,stationId:''});snowBad({...snowRow,available:false});
snowBad({...snowRow,observedAt:'2026-11-01T02:59:00Z'});snowBad({...snowRow,observedAt:'2026-11-01T06:16:00Z'});
snowBad({...snowRow,observedAt:'invalid'});snowBad({...snowRow,valueCm:0},NaN);
snowGood({...snowRow,observedAt:'2026-11-01T06:15:00Z'},0);
assert.equal(snowCases,32,'Original Snow-Provider-Edge-Case-Matrix fehlt');
console.log('GeoSphere Original-NoData/Null/0/Height/UTC: '+snowCases+' dynamische Fälle erfolgreich.');
