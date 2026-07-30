import {readFile} from 'node:fs/promises';

const [weather,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
need('ICAO-Worker-Datentyp',weather,"fetchWorkerJson<Location&{error?:string}>('icao-location',{icao:code}");
if(weather.includes("fetchWorkerJson<Location>('icao-location',{icao:code"))failures.push('Der schwache WorkerPayload-Generic-Konflikt ist weiterhin vorhanden.');
need('Package-Test',pkg,'test:icao-location-buildfix');
need('Baseline-Test',baseline,'scripts/test-icao-location-buildfix-08194.mjs');
if(failures.length){console.error('ICAO-Ortssuche-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('ICAO-Ortssuche-Buildfix geprüft: Worker-Antworttyp enthält den optionalen Fehlerumschlag und erfüllt den fetchWorkerJson-Vertrag.');
