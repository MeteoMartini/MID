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
 ['Sprühregen bleibt bei feuchter tiefer Stratuslage Sprühregen',sample({code:53,precipitation:.3,rain:.3,humidity:95,cloud:100,lowCloud:92}), 'drizzle'],
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
const plausibleDrizzle=precipitationParts(sample({code:53,precipitation:.3,rain:.3,humidity:95,cloud:100,lowCloud:92}));
if(plausibleDrizzle.weatherLabel!=='mäßiger Sprühregen')failures.push(`Plausibler Sprühregen erhält falschen Wettertext: ${plausibleDrizzle.weatherLabel}`);
if(plausibleDrizzle.displayCode!==53)failures.push(`Plausibler Sprühregen erhält falschen Anzeigecode: ${plausibleDrizzle.displayCode}`);
const implausibleDrizzle=precipitationParts(sample({code:53,precipitation:.8,rain:.8,humidity:72,cloud:55,lowCloud:18}));
if(implausibleDrizzle.weatherLabel!=='leichter Regen')failures.push(`Unplausibler Sprühregen wird im Wettertext nicht zu Regen: ${implausibleDrizzle.weatherLabel}`);
if(implausibleDrizzle.displayCode!==61)failures.push(`Unplausibler Sprühregen behält falschen Symbolcode: ${implausibleDrizzle.displayCode}`);
const legend=presentPrecipTypes(cases.slice(0,5).map(([,input])=>precipitationParts(input)));
for(const expected of ['snow','snowShowers','sleet','sleetShowers'])if(!legend.includes(expected))failures.push(`Legende enthält ${expected} nicht`);
if(legend.filter(type=>type==='sleet').length!==1)failures.push('Legende enthält Schneeregen mehrfach');
await rm(outDir,{recursive:true,force:true});
if(failures.length){console.error('Niederschlagsformen-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Niederschlagsformen geprüft: WMO-Code steuert Symbol, Legende und Tooltip konsistent; Mischformen entstehen im Fallback nur bei gleichzeitig festem und flüssigem Anteil.');
