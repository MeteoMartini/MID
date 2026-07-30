import {readFile} from 'node:fs/promises';

const [app,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};

for(const token of [
 "localStorage.getItem('mid:current-metrics-open')!=='0'",
 "localStorage.setItem('mid:current-metrics-open',metricsOpen?'1':'0')",
 'className="current-metrics-toggle"',
 'aria-expanded={metricsOpen}',
 'aria-controls="current-weather-metrics"',
 "metricsOpen?'weniger':'mehr'",
 'aria-label={metricsOpen?',
 'id="current-weather-metrics" className="metrics" hidden={!metricsOpen}'
])need('Aktuelles Wetter',app,token);
for(const token of [
 '.current-metrics-toggle{position:absolute;',
 '.current-metrics-toggle:focus-visible',
 '.metrics[hidden]{display:none}'
])need('Darstellung',styles,token);
need('Package-Test',pkg,'test:current-metrics-collapse');
need('Baseline-Test',baseline,'scripts/test-current-metrics-collapse-08240.mjs');

if(failures.length){
 console.error('Ein-/ausklappbare Aktuell-Wetter-Kacheln fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Ein-/ausklappbare und dauerhaft gespeicherte Aktuell-Wetter-Kacheln geprüft.');
