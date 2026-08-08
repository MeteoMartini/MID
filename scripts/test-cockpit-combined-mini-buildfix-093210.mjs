import {readFile} from 'node:fs/promises';
const [cockpit,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const count=(text,token)=>text.split(token).length-1;
if(count(cockpit,'tempMin=Math.min(...tempValues)')<2)failures.push('tempMin muss in Kurzfrist- und 7-Tage-Kombichart definiert sein');
if(count(cockpit,'tempRange=Math.max(1,tempMax-tempMin)')<2)failures.push('Temperaturspanne muss tempMin verwenden');
for(const token of ['cockpit-mini-ribbon short combo','cockpit-mini-ribbon seven combo','Kombinierter Kurzfristverlauf aus Temperatur und Niederschlag','Kombinierter 7-Tage-Verlauf aus Temperatur und Niederschlag'])if(!cockpit.includes(token))failures.push(`Kombichart fehlt: ${token}`);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;
if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error(`MID v0.9.32.10 Kombi-Mini-Buildfix fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID v0.9.32.10: tempMin-Skalierung für beide kombinierten Mini-Diagramme geprüft.');
