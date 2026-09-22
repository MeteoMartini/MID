import {readFile} from 'node:fs/promises';

const [source,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};

need('Kurzfrist feste Stundenreihe',source,"points=useMemo(()=>adjusted.filter(point=>point.source==='hourly'),[adjusted])");
need('24-h-Profil behält Windrichtung aus der kanonischen Stundenprobe',source,'return{...first,id:`profile-hour:${start}`');
need('24-h-Profil behält Böenmaximum je Stundenfenster',source,"gust:maximum('gust')");
need('Winddarstellung bleibt direkt am Punktwert',source,"function shortTermWindDetail(point:Pick<ShortTermForecastPoint,'direction'|'wind'|'gust'>");
reject('Entfernte 3-h-Kurzfristaggregation',source,'aggregateShortTermBlock(');
reject('Entfernte 1h/3h-Auswahlaggregation',source,'selectShortTermPoints(');
need('Package script',pkg,'test:buildfix-shortterm-wind');
need('Baseline test',baseline,'scripts/test-buildfix-shortterm-wind-09144.mjs');

if(failures.length){
 console.error('Kurzfrist-Wind-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Kurzfrist-Wind bleibt auf der kanonischen Stundenreihe mit Windrichtung und Böen geschützt; entfernte 3-h-Aggregation kehrt nicht zurück.');
