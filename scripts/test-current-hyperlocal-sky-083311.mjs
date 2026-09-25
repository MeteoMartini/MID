import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';

const [app,pkg]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 "import {hyperlocalSkyCondition,modelCloudSkyCondition,synopPresentWeatherNumber,synopPresentWeatherPhenomenon} from './currentConditions';",
 "reconciledCurrentPrecip.type==='none'?hyperlocalSkyCondition({",
 "cloudObserved:currentCloudObservationFresh",
 "if(localSky){currentWeatherCode=localSky.code;currentWeatherLabel=localSky.label}",
 "else if(modelDryCloudSky){currentWeatherCode=modelDryCloudSky.code;currentWeatherLabel=modelDryCloudSky.label}",
 "currentSynopWeatherNumber=synopPresentWeatherNumber(currentObservedRaw)",
 "currentSynopWeatherNumber!==undefined?synopPresentWeatherPhenomenon(currentObservedRaw):currentObservedRaw",
 "cloud={currentCloudObservationFresh?currentCloudObservation:Number(c.cloud_cover)}",
 "lowCloud={currentCloudObservationFresh?undefined:Number(c.cloud_cover_low)}",
 "midCloud={currentCloudObservationFresh?undefined:Number(c.cloud_cover_mid)}",
 "highCloud={currentCloudObservationFresh?undefined:Number(c.cloud_cover_high)}",
 "Verwendete Bewölkungsquelle",
 "cloudSourceStatus"
])if(!app.includes(token))failures.push('App-Anbindung fehlt: '+token);
if(!pkg.includes('test:current-hyperlocal-sky'))failures.push('Package-Test fehlt.');

const bundled=await build({
 entryPoints:[new URL('../src/currentConditions.ts',import.meta.url).pathname],
 bundle:true,platform:'node',format:'esm',target:'node22',write:false,logLevel:'silent'
});
const moduleUrl='data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64');
const {hyperlocalSkyCondition,cloudCoverSkyCondition,modelCloudSkyCondition,synopPresentWeatherNumber,synopPresentWeatherPhenomenon}=await import(moduleUrl);

const strong=hyperlocalSkyCondition({fallbackCode:3,cloudCover:87.5,visibility:7600,humidity:41,temperature:26,dewPoint:10,cloudObserved:true,visibilityObserved:true});
if(strong?.code!==3||strong?.label!=='Stark bewölkt'||strong?.cloudOktas!==7)failures.push('7/8 wird nicht konsistent als stark bewölkt klassifiziert: '+JSON.stringify(strong));

const overcast=hyperlocalSkyCondition({fallbackCode:2,cloudCover:100,visibility:10000,humidity:80,temperature:20,dewPoint:16,cloudObserved:true,visibilityObserved:true});
if(overcast?.label!=='Bedeckt'||overcast?.cloudOktas!==8)failures.push('8/8 wird nicht als bedeckt klassifiziert: '+JSON.stringify(overcast));

const fog=hyperlocalSkyCondition({fallbackCode:3,cloudCover:87.5,visibility:700,humidity:96,temperature:4,dewPoint:3.5,cloudObserved:true,visibilityObserved:true});
if(fog?.code!==45||fog?.label!=='Nebel')failures.push('Lokaler Nebel übersteuert Bewölkung nicht korrekt: '+JSON.stringify(fog));

const mist=hyperlocalSkyCondition({fallbackCode:45,cloudCover:87.5,visibility:2500,humidity:96,temperature:6,dewPoint:5.5,cloudObserved:true,visibilityObserved:true});
if(mist?.code!==10||mist?.label!=='Feuchter Dunst')failures.push('Sicht >1 km darf nicht als Nebel stehen bleiben: '+JSON.stringify(mist));

const coldFog=hyperlocalSkyCondition({fallbackCode:45,cloudCover:87.5,visibility:700,humidity:98,temperature:-2,dewPoint:-2.2,cloudObserved:true,visibilityObserved:true});
if(coldFog?.code!==45||coldFog?.label!=='Nebel')failures.push('Frost allein darf keinen Reifnebel erzeugen: '+JSON.stringify(coldFog));

const fallback=hyperlocalSkyCondition({fallbackCode:3,cloudCover:87.5,visibility:7600,humidity:41,temperature:26,dewPoint:10,cloudObserved:false,visibilityObserved:false});
if(fallback!==undefined)failures.push('Ohne frische lokale Beobachtung wird Best Match unerwartet überschrieben.');

const lightlyClouded=hyperlocalSkyCondition({fallbackCode:3,cloudCover:12.5,visibility:10000,humidity:50,temperature:12,dewPoint:2,cloudObserved:true,visibilityObserved:false});
if(lightlyClouded?.code!==1||lightlyClouded?.label!=='Gering bewölkt'||lightlyClouded?.cloudOktas!==1)failures.push('Frische geringe Gesamtbewölkung übernimmt nicht gemeinsam Code und Text: '+JSON.stringify(lightlyClouded));

const modelOvercast=modelCloudSkyCondition(3,100),modelRainCloud=modelCloudSkyCondition(61,100);
if(modelOvercast?.code!==3||modelOvercast?.label!=='Bedeckt')failures.push('Modellfallback leitet Code und Text nicht aus derselben trockenen Gesamtbewölkung ab: '+JSON.stringify(modelOvercast));
if(modelRainCloud!==undefined)failures.push('Bewölkungsfallback darf einen echten Niederschlagszustand nicht überschreiben.');
if(cloudCoverSkyCondition(-1)!==undefined||cloudCoverSkyCondition(101)!==undefined)failures.push('Ungültige Gesamtbewölkung darf nicht als Beobachtung gelten.');

for(const ww of [0,1,2,3,'WW=3']){
 if(synopPresentWeatherNumber(ww)!==Number(String(ww).replace(/^WW=/i,''))||synopPresentWeatherPhenomenon(ww)!==undefined)failures.push(`Trockener SYNOP-ww=${ww} wurde als Open-Meteo-Wettercode interpretiert.`);
}
for(const [ww,phenomenon] of [[4,'FU'],[50,'DZ'],[56,'FZDZ'],[61,'RA'],[68,'RASN'],[71,'SN'],[80,'SHRA'],[95,'TSRA']]){
 if(synopPresentWeatherPhenomenon(ww)!==phenomenon)failures.push(`SYNOP-ww=${ww} wurde nicht in die SYNOP-Phänomenfamilie ${phenomenon} überführt.`);
}
if(app.includes('currentObservedWeatherCode')||app.includes('label(currentObservedRaw)'))failures.push('Numerischer SYNOP-present_weather darf nie direkt als Open-Meteo-Code gelabelt werden.');
if(!app.includes('<WeatherPictogram code={currentWeatherCode}')||!app.includes('title={currentWeatherLabel}'))failures.push('Hauptpiktogramm und sichtbares Zustandslabel teilen nicht dieselbe fachliche Quelle.');
if(!app.includes('· frisch')||!app.includes('· nicht mehr frisch; ')||!app.includes('Modellfallback ·'))failures.push('Bewölkungsquelle und Aktualitäts-/Fallbackstatus werden nicht transparent gezeigt.');

if(failures.length){console.error('Hyperlokale aktuelle Himmelszustandsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Aktueller Himmelszustand geprüft: frische/stale Bewölkung, Modellfallback, SYNOP-ww-Familien, Nebel und gemeinsame Label-/Piktogrammquelle.');
