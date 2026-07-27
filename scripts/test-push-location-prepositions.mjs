import {readFile} from 'node:fs/promises';

const workerText=await readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const failures=[];
for(const token of ["{at:`in ${name}`", "title:`MID · Niederschlag ${place.at}`", "title:`MID · Gewitter ${place.at}`", "title:`MID · Prognoseänderung für ${visibleName}`"])
 if(!workerText.includes(token))failures.push(`Push-Präposition fehlt: ${token}`);
for(const bad of ['{at:`bei ${name}`','Prognoseänderung bei ${visibleName}'])if(workerText.includes(bad))failures.push(`Unnatürliche Ortspräposition verblieben: ${bad}`);
const worker=await import(`../worker/metar-proxy.js?push-prepositions=${Date.now()}`);
const body=worker.thunderPushBody({status:'at-site',currentDistanceKm:.4},{id:'muenster',name:'Münster'});
if(!body.includes('unmittelbar in Münster'))failures.push(`Statischer Ort wird nicht mit „in“ formuliert: ${body}`);
const tracked=worker.thunderPushBody({status:'at-site',currentDistanceKm:.4},{id:'tracked-location',name:'Aktueller Standort · Münster'});
if(!tracked.includes('unmittelbar am Standort'))failures.push(`Dynamischer Standort falsch formuliert: ${tracked}`);
if(failures.length){console.error('Push-Ortspräpositionen fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Push-Ortspräpositionen geprüft: statische Orte „in …“, dynamische Position „am Standort“.');
