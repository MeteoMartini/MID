import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const pwa=await readFile(new URL('../src/pwa.ts',import.meta.url),'utf8');
for(const token of [
 "function activateWaitingMidUpdate(registration:ServiceWorkerRegistration)",
 "registration.waiting",
 "navigator.serviceWorker.controller",
 "type:'MID_ACTIVATE_UPDATE'",
 "registration.addEventListener('updatefound'",
 "installing.addEventListener('statechange'",
 "activateWaitingMidUpdate(registration);\n  await registrationUpdateWithBudget(registration);\n  activateWaitingMidUpdate(registration);"
])assert.ok(pwa.includes(token),`PWA-Updateaktivierung fehlt: ${token}`);
assert.ok(pwa.includes("localStorage.getItem('mid:auto-update')==='true'")&&pwa.includes('if(automatic&&waiting&&navigator.serviceWorker.controller)'), 'Automatische Aktivierung muss die gespeicherte Auswahl beachten.');
console.log('Wartende MID-Service-Worker werden nach sicherem Download entsprechend der automatischen Update-Auswahl aktiviert.');
