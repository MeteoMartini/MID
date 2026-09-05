import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

const source=readFileSync(new URL('../src/pressureAxis.ts',import.meta.url),'utf8');
const js=stripTypeScriptTypes(source,{mode:'strip'});
const moduleUrl=`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`;
const {nicePressureAxis}=await import(moduleUrl);
const failures=[];
const equalSpacing=ticks=>ticks.length<3||ticks.slice(1).every((value,index)=>ticks[index]-value===ticks[0]-ticks[1]);
const cases=[
 [1015.7,1016.1,1017.4,1018.2],
 [1002.4,1007.9,1012.6],
 [1027.8,1028.1,1028.4],
 [985,995,1005,1015]
];
for(const values of cases){
 const scale=nicePressureAxis(values);
 if(!scale.ticks.every(Number.isInteger))failures.push(`nicht-ganzzahlige Ticks: ${scale.ticks.join(',')}`);
 if(!equalSpacing(scale.ticks))failures.push(`ungleiche Tickabstände: ${scale.ticks.join(',')}`);
 if(scale.minimum>Math.min(...values)||scale.maximum<Math.max(...values))failures.push(`Datenbereich nicht vollständig: ${JSON.stringify(scale)}`);
 if(scale.ticks.length<4||scale.ticks.length>5)failures.push(`unerwartete Tickzahl ${scale.ticks.length}: ${scale.ticks.join(',')}`);
 if(![2,4,5,10,20,25,50].includes(scale.step))failures.push(`nicht erlaubter Schritt ${scale.step}`);
}
const cockpit=readFileSync(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
if(!cockpit.includes('return nicePressureAxis(points.map(point=>Number(point.pressure)))'))failures.push('24-h-Wetterprofil nutzt die gemeinsame Luftdruckachse nicht.');
if(cockpit.includes('const middle=Math.round(((minimum+maximum)/2)/2)*2'))failures.push('Alte ungleichmäßige Mittelmarke ist noch aktiv.');
if(!app.includes('const pressureScale=nicePressureAxis(pressureValues)'))failures.push('Tagesdetail nutzt die gemeinsame Luftdruckachse nicht.');
if(!app.includes('>{value}</text></g>})}</>'))failures.push('Tagesdetail formatiert Luftdruck-Ticks nicht als ganze hPa.');
if(failures.length){console.error(`Luftdruckachsen-Regressionsprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID v0.9.78.61: Luftdruckachsen verwenden ganzzahlige, gleichmäßig verteilte hPa-Ticks.');
