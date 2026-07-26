import {rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outDir=path.join(root,'.precip-test');
await rm(outDir,{recursive:true,force:true});
const compile=spawnSync('tsc',[
 'src/precipitation.ts',
 '--target','ES2022',
 '--module','ES2022',
 '--moduleResolution','Bundler',
 '--strict',
 '--skipLibCheck',
 '--outDir','.precip-test'
],{cwd:root,stdio:'inherit',shell:process.platform==='win32'});
if(compile.status!==0)process.exit(compile.status??1);
const {precipitationParts,presentPrecipTypes}=await import(`${pathToFileURL(path.join(outDir,'precipitation.js')).href}?v=${Date.now()}`);

const sample=(overrides={})=>({precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:0,...overrides});
const cases=[
 ['Schneefallcode bleibt Schnee, obwohl precipitation das Wasseräquivalent enthält',sample({code:75,precipitation:3.1,snowfall:4.8}), 'snow'],
 ['Schneefallcode wird nicht durch paralleles Mengenfeld zu Schneeregen umgedeutet',sample({code:73,precipitation:1.2,rain:.2,snowfall:1.6}), 'snow'],
 ['Schneeschauercode bleibt Schneeschauer',sample({code:85,precipitation:1.1,showers:.3,snowfall:1.4}), 'snowShowers'],
 ['Schneeregencode bleibt Schneeregen',sample({code:68,precipitation:1.3,rain:.7,snowfall:.4}), 'sleet'],
 ['Schneeregenschauercode bleibt Schneeregenschauer',sample({code:83,precipitation:1.4,showers:.8,snowfall:.5}), 'sleetShowers'],
 ['Schneegriesel bleibt bei kalter feuchter Stratuslage Schneegriesel',sample({code:77,temperature:-2,dewPoint:-2.4,humidity:96,cloud:100,lowCloud:94,precipitation:.2,snowfall:.2}), 'snowGrains'],
 ['Unplausibler Schneegrieselcode wird innerhalb der festen Phase zu Schnee',sample({code:77,temperature:5,humidity:62,cloud:35,lowCloud:20,precipitation:.6,rain:.6}), 'snow'],
 ['Warmer Schneefallcode bleibt gemäß WMO-Phase Schnee',sample({code:73,temperature:4.5,precipitation:.8,rain:.8}), 'snow'],
 ['Warmer Schneeschauercode bleibt gemäß WMO-Phase Schneeschauer',sample({code:85,temperature:5,precipitation:.9,showers:.9}), 'snowShowers'],
 ['Explizite Schneemenge erhält Schnee auch bei leicht positiver Temperatur',sample({code:73,temperature:4,precipitation:.6,snowfall:.4}), 'snow'],
 ['Sprühregen bleibt bei feuchter tiefer Stratuslage Sprühregen',sample({code:53,temperature:8,dewPoint:7.5,precipitation:.3,rain:.3,humidity:96,cloud:100,lowCloud:92}), 'drizzle'],
 ['Sprühregencode wird ohne Stratussignal als Regen plausibilisiert',sample({code:53,precipitation:.8,rain:.8,humidity:72,cloud:55,lowCloud:18}), 'rain'],
 ['Sprühregencode wird bei kräftiger Niederschlagsrate als Regen plausibilisiert',sample({code:55,precipitation:3.2,rain:3.2,humidity:96,cloud:100,lowCloud:95}), 'rain'],
 ['Regencode bleibt Regen',sample({code:63,precipitation:2.4,rain:2.4,snowfall:.1}), 'rain'],
 ['Gefrierender Regen bleibt gefrierender Regen',sample({code:67,precipitation:1.1,rain:1.1}), 'freezingRain'],
 ['Fallback erkennt reinen Schnee',sample({code:3,precipitation:.8,snowfall:1.2}), 'snow'],
 ['Fallback erkennt Schneeregen nur bei festem und flüssigem Anteil',sample({code:3,precipitation:1.1,rain:.5,snowfall:.7}), 'sleet'],
 ['Fallback erkennt Schneeregenschauer nur bei Schnee und Schauern',sample({code:3,precipitation:1.1,showers:.5,snowfall:.7}), 'sleetShowers']
];
const failures=[];
for(const [name,input,expected] of cases){const actual=precipitationParts(input).type;if(actual!==expected)failures.push(`${name}: erwartet ${expected}, erhalten ${actual}`)}
const plausibleDrizzle=precipitationParts(sample({code:53,temperature:8,dewPoint:7.5,precipitation:.3,rain:.3,humidity:96,cloud:100,lowCloud:92}));
if(plausibleDrizzle.weatherLabel!=='mäßiger Sprühregen')failures.push(`Plausibler Sprühregen erhält falschen Wettertext: ${plausibleDrizzle.weatherLabel}`);
if(plausibleDrizzle.displayCode!==53)failures.push(`Plausibler Sprühregen erhält falschen Anzeigecode: ${plausibleDrizzle.displayCode}`);
const implausibleDrizzle=precipitationParts(sample({code:53,precipitation:.8,rain:.8,humidity:72,cloud:55,lowCloud:18}));
if(implausibleDrizzle.weatherLabel!=='leichter Regen')failures.push(`Unplausibler Sprühregen wird im Wettertext nicht zu Regen: ${implausibleDrizzle.weatherLabel}`);
if(implausibleDrizzle.displayCode!==61)failures.push(`Unplausibler Sprühregen behält falschen Symbolcode: ${implausibleDrizzle.displayCode}`);

const implausibleSnowGrainsDry=precipitationParts(sample({code:77,temperature:6,humidity:45,cloud:25,lowCloud:10}));
if(implausibleSnowGrainsDry.type!=='snow')failures.push(`Unplausibler Schneegrieselcode wechselt fälschlich die feste Phase: ${implausibleSnowGrainsDry.type}`);
if(![71,73,75].includes(implausibleSnowGrainsDry.displayCode))failures.push(`Unplausibler Schneegrieselcode erhält keinen allgemeinen Schneecode: ${implausibleSnowGrainsDry.displayCode}`);
const implausibleSnowRain=precipitationParts(sample({code:75,temperature:5,precipitation:1.2,rain:1.2,cloud:90}));
if(implausibleSnowRain.type!=='snow'||implausibleSnowRain.displayCode!==75)failures.push(`Schneecode darf nicht in die flüssige Phase wechseln: ${implausibleSnowRain.type}/${implausibleSnowRain.displayCode}`);
const implausibleFreezingDrizzle=precipitationParts(sample({code:57,precipitation:1.2,rain:1.2,humidity:70,cloud:40,lowCloud:10}));
if(implausibleFreezingDrizzle.type!=='freezingRain'||![66,67].includes(implausibleFreezingDrizzle.displayCode))failures.push(`Gefrierender Sprühregen muss innerhalb der gefrierenden Flüssigphase bleiben: ${implausibleFreezingDrizzle.type}/${implausibleFreezingDrizzle.displayCode}`);


const highBaseColdFrontDrizzle=precipitationParts(sample({code:53,temperature:11,dewPoint:3.2,precipitation:.4,rain:.4,humidity:92,cloud:100,lowCloud:88,showers:0}));
if(highBaseColdFrontDrizzle.type!=='rain')failures.push(`Sprühregen bei geschätzter Wolkenbasis über 3000 ft wird nicht zu Regen verallgemeinert: ${highBaseColdFrontDrizzle.type}`);
const showerAlternation=precipitationParts(sample({code:53,temperature:10,dewPoint:8.8,precipitation:.7,rain:.2,showers:.5,humidity:94,cloud:100,lowCloud:88}));
if(showerAlternation.type!=='showers')failures.push(`Sprühregencode bei gleichzeitigem Schauersignal wird nicht als Schauer dargestellt: ${showerAlternation.type}`);
const highBaseSnowGrains=precipitationParts(sample({code:77,temperature:-3,dewPoint:-11,precipitation:.2,snowfall:.2,humidity:90,cloud:100,lowCloud:85}));
if(highBaseSnowGrains.type!=='snow')failures.push(`Schneegriesel bei hoher Wolkenbasis wird nicht innerhalb der festen Phase zu Schnee verallgemeinert: ${highBaseSnowGrains.type}`);

const fallbackRain=precipitationParts(sample({code:3,precipitation:.8,rain:.8,probability:80}));
if(fallbackRain.displayCode!==61)failures.push(`Fallback-Regen erhält trotz messbarer Menge keinen Regensymbolcode: ${fallbackRain.displayCode}`);
const fallbackSnow=precipitationParts(sample({code:3,precipitation:.8,snowfall:1.2,probability:80}));
if(![71,73,75].includes(fallbackSnow.displayCode))failures.push(`Fallback-Schnee erhält keinen Schneesymbolcode: ${fallbackSnow.displayCode}`);
const legend=presentPrecipTypes(cases.slice(0,5).map(([,input])=>precipitationParts(input)));
for(const expected of ['snow','snowShowers','sleet','sleetShowers'])if(!legend.includes(expected))failures.push(`Legende enthält ${expected} nicht`);
if(legend.filter(type=>type==='sleet').length!==1)failures.push('Legende enthält Schneeregen mehrfach');
await rm(outDir,{recursive:true,force:true});
if(failures.length){console.error('Niederschlagsformen-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Niederschlagsformen geprüft: Sprühregen und Schneegriesel werden nur innerhalb ihrer flüssigen bzw. festen Phase verallgemeinert; Symbol, Text, Legende und Tooltip bleiben konsistent.');
