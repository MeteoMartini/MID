import {readFile} from 'node:fs/promises';

const [source,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

need('ForecastCockpit mean union',source,"'pressure'|'wind'|'direction'");
need('ForecastCockpit wind aggregation',source,"wind:mean('wind')");
need('Package script',pkg,'test:buildfix-shortterm-wind');
need('Baseline test',baseline,'scripts/test-buildfix-shortterm-wind-09144.mjs');

if(failures.length){
 console.error('Kurzfrist-Wind-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Kurzfrist-Wind-Aggregationstyp geprüft.');
