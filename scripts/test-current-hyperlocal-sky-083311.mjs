import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';

const [app,pkg]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 "import {analysedCloudOktas,hyperlocalSkyCondition,skyConditionFromOktas} from './currentConditions';",
 "reconciledCurrentPrecip.type==='none'?hyperlocalSkyCondition({",
 "cloudOktasValue=fieldFresh('cloudCover')&&Number.isFinite(st?.cloudCover)?analysedCloudOktas(cloud):cloudOktas(cloud)",
 "currentCloudObserved=fieldFresh('cloudCover')&&Number.isFinite(st?.cloudCover)",
 "cloudCover:currentSkyCloud",
 "cloudObserved:currentCloudObserved",
 "if(localSky){currentWeatherCode=localSky.code;currentWeatherLabel=localSky.label}",
 "else if(reconciledCurrentPrecip.type==='none'&&currentWeatherCode>=0&&currentWeatherCode<=3&&Number.isFinite(currentSkyCloud)){const fallbackSky=skyConditionFromOktas(cloudOktasValue);currentWeatherCode=fallbackSky.code;currentWeatherLabel=fallbackSky.label}"
])if(!app.includes(token))failures.push('App-Anbindung fehlt: '+token);
if(!pkg.includes('test:current-hyperlocal-sky'))failures.push('Package-Test fehlt.');

const bundled=await build({
 entryPoints:[new URL('../src/currentConditions.ts',import.meta.url).pathname],
 bundle:true,platform:'node',format:'esm',target:'node22',write:false,logLevel:'silent'
});
const moduleUrl='data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64');
const {hyperlocalSkyCondition,skyConditionFromOktas}=await import(moduleUrl);

const sixOktas=skyConditionFromOktas(6);
if(sixOktas?.code!==2||sixOktas?.label!=='Wolkig'||sixOktas?.cloudOktas!==6)failures.push('DWD 6/8 muss app-weit als wolkig klassifiziert werden: '+JSON.stringify(sixOktas));

const strong=hyperlocalSkyCondition({fallbackCode:3,cloudCover:87.5,visibility:7600,humidity:41,temperature:26,dewPoint:10,cloudObserved:true,visibilityObserved:true});
if(strong?.code!==3||strong?.label!=='Stark bewölkt'||strong?.cloudOktas!==7)failures.push('7/8 wird nicht konsistent als stark bewölkt klassifiziert: '+JSON.stringify(strong));

const almostOvercast=hyperlocalSkyCondition({fallbackCode:3,cloudCover:94,visibility:10000,humidity:80,temperature:20,dewPoint:16,cloudObserved:true,visibilityObserved:true});
if(almostOvercast?.label!=='Stark bewölkt'||almostOvercast?.cloudOktas!==7)failures.push('Kontinuierliche Fusionswerte unter 100 % dürfen nicht zu diskretem 8/8 aufgerundet werden: '+JSON.stringify(almostOvercast));

const nearlyClosed=hyperlocalSkyCondition({fallbackCode:3,cloudCover:99,visibility:10000,humidity:80,temperature:20,dewPoint:16,cloudObserved:true,visibilityObserved:true});
if(nearlyClosed?.label!=='Stark bewölkt'||nearlyClosed?.cloudOktas!==7)failures.push('Kontinuierliche Fusionswerte unter vollständiger Bedeckung dürfen nicht als 8/8 erscheinen: '+JSON.stringify(nearlyClosed));

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

if(failures.length){console.error('Hyperlokale aktuelle Himmelszustandsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Aktueller Himmelszustand geprüft: Bewölkung, WMO-Nebelgrenze, feuchter Dunst und kein temperaturbasiert erfundener Reifnebel sind konsistent.');
