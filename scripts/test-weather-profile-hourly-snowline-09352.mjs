import {readFile} from 'node:fs/promises';
const [cockpit,mountain,app,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/mountainSports.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(scope,text,token)=>{if(!text.includes(token))failures.push(`${scope}: fehlt ${token}`)};
for(const token of ['function shortTermProfileHourlyPoints(hours:Hour[],timezone:string,now=Date.now())','hours.slice(startIndex,startIndex+24)','intervalLabel:\'1 h\'','const chartSourcePoints=profileHourlyPoints'])need('24-h-Profil',cockpit,token);
if(cockpit.includes('const chartSourcePoints=adjusted.filter(point=>point.offsetMinutes<=24*60)'))failures.push('24-h-Profil verwendet weiterhin 15-Minuten-Punkte.');
for(const token of ['function snowLineNumber(value:unknown)','const temperature850=snowLineNumber(t850[index])','height850=snowLineNumber(z850[index])','freeze=snowLineNumber(freezing[index])','let mean=dwdSnowfallLimit({temperature850,geopotentialHeight850:height850,freezingLevelHeight:freeze})','if(!Number.isFinite(mean))mean=snowLineNumber(snow[index])'])need('Schneefallgrenze',mountain,token);
if(mountain.includes('let mean=Number(snow[index]),spread=Number(snowSpread[index])'))failures.push('Schneefallgrenze konvertiert null weiterhin zu 0 m.');
for(const token of ['yMin=0,yMax=4500','ticks=[0,500,1000,1500,2000,2500,3000,3500,4000,4500]','mountainSnowLinePrecipSignal','mountain-snowline-precip','Niederschlag erwartet'])need('Schneefallgrenzen-Diagramm',app,token);
need('Styles',styles,'.mountain-snowline-precip{');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('MID v0.9.35.2 Stundenprofil/Schneefallgrenze fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID: 24-h-Profil stündlich ab aktueller Stunde; Schneefallgrenze null-sicher, 0–4,5 km und Niederschlagssignale geprüft.');
