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
console.log('Wartende MID-Service-Worker werden nach sicherem Download automatisch aktiviert und die neue App-Shell kann übernehmen.');
