import {readFile} from 'node:fs/promises';

const workerText=await readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const failures=[];
for(const token of [
 'function thunderPushBody(result)',
 'currentDistanceKm',
 'forecastDistanceKm',
 "status=near?(currentDistanceKm<1?'at-site':'near'):'approaching'",
 'body:thunderPushBody(result)',
 'export {pushThunderState,thunderPushBody};'
])if(!workerText.includes(token))failures.push(`Worker-Schutz fehlt: ${token}`);

const worker=await import(`../worker/metar-proxy.js?thunder-push=${Date.now()}`);
const base={id:'K3D-X',latitude:50.8,longitude:7.1,severity:1,trend:0};

const misleading={nearbyCells:[{...base,currentDistanceKm:42,relevanceDistanceKm:0,forecastDistanceKm:6,forecastEffectiveDistanceKm:0,arrivalMinutes:30,isApproaching:true}]};
const approach=worker.pushThunderState(misleading);
const approachBody=worker.thunderPushBody(approach);
if(approach.currentDistanceKm!==42)failures.push(`Aktuelle Entfernung wurde nicht beibehalten: ${approach.currentDistanceKm}`);
if(approach.status!=='approaching')failures.push(`Annäherungsstatus falsch: ${approach.status}`);
if(!approachBody.includes('aktuell etwa 42 km entfernt'))failures.push(`Aktuelle Entfernung fehlt im Pushtext: ${approachBody}`);
if(!approachBody.includes('in 30 min'))failures.push(`Annäherungszeit fehlt im Pushtext: ${approachBody}`);
if(approachBody.includes('Abstand etwa 0 km')||approachBody.includes('aktuell etwa 0 km'))failures.push(`Widersprüchliche Nullkilometer-Angabe verblieben: ${approachBody}`);

const direct={nearbyCells:[{...base,currentDistanceKm:.35,relevanceDistanceKm:0,forecastDistanceKm:4,forecastEffectiveDistanceKm:0,arrivalMinutes:30,isApproaching:true}]};
const directState=worker.pushThunderState(direct);
const directBody=worker.thunderPushBody(directState);
if(directState.status!=='at-site')failures.push(`Unmittelbarer Zellstatus falsch: ${directState.status}`);
if(directState.arrivalMinutes!==undefined)failures.push(`Bei unmittelbarer Zelle darf keine Annäherungszeit bleiben: ${directState.arrivalMinutes}`);
if(!directBody.includes('unmittelbar am Favoriten'))failures.push(`Unmittelbarer Pushtext fehlt: ${directBody}`);
if(directBody.includes('Annäherung'))failures.push(`Unmittelbarer Pushtext enthält weiterhin Annäherung: ${directBody}`);

const near={nearbyCells:[{...base,currentDistanceKm:12,relevanceDistanceKm:5,forecastDistanceKm:3,forecastEffectiveDistanceKm:1,arrivalMinutes:25,isApproaching:true}]};
const nearState=worker.pushThunderState(near);
const nearBody=worker.thunderPushBody(nearState);
if(nearState.status!=='near')failures.push(`Nahstatus falsch: ${nearState.status}`);
if(nearState.arrivalMinutes!==undefined)failures.push('Bei bereits naher Zelle darf keine spätere Annäherungszeit gemeldet werden.');
if(!nearBody.includes('aktuell etwa 12 km'))failures.push(`Nahtext falsch: ${nearBody}`);
if(nearBody.includes('Annäherung'))failures.push(`Nahtext enthält widersprüchliche Annäherung: ${nearBody}`);

if(failures.length){console.error(`Gewitter-Push-Konsistenz fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('Gewitter-Push geprüft: aktuelle Entfernung, Prognoseabstand und Annäherungszeit sind widerspruchsfrei getrennt.');
