import {readFile} from 'node:fs/promises';
const [cockpit,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 'function miniRibbonPrecipitationStyle(amount:number,probability:number,referenceAmount:number)',
 'miniRibbonPrecipitationStyle(point.precipitation,point.probability,2.5)',
 'miniRibbonPrecipitationStyle(day.precipitation,day.probability,10)',
 'fillOpacity={item.barOpacity}',
 'className="signal-time"',
 "value:maxImpact.summary,meta:formatProfilePointTime(maxImpactPoint)"
]) if(!cockpit.includes(token)) failures.push(`ForecastCockpit fehlt erwarteter Baustein: ${token}`);
for(const token of [
 '.cockpit-weather-profile__signals .signal-time{',
 'white-space:normal',
 'text-overflow:clip'
]) if(!styles.includes(token)) failures.push(`Styles fehlen erwarteter Baustein: ${token}`);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;
if(pv!==bv) failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(pv!=='0.9.32.14') failures.push(`Erwartete Version 0.9.32.14, erhalten ${pv}`);
if(failures.length){
 console.error(`MID v0.9.32.14 Mini-Niederschlags- und Zeitbarkeits-Regressionsprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);
 process.exit(1);
}
console.log('MID v0.9.32.14: Mini-Niederschlagskombination und sichtbare Zeitangaben im 24-h-Wetterprofil geprüft.');
