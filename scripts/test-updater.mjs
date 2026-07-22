import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const updater=read('../src/v078.ts'),main=read('../src/main.tsx'),pwa=read('../src/pwa.ts'),index=read('../index.html'),serviceWorker=read('../public/service-worker.js'),legacyWorker=read('../public/sw.js');
const failures=[];
for(const token of["new URL('./version.json',document.baseURI)","cache:'no-store'",'MID_ACTIVATE_UPDATE','controllerchange','location.replace','visibilitychange','pageshow'])if(!updater.includes(token))failures.push(`Updater-Merkmal fehlt: ${token}`);
for(const token of['getMidUpdateStatus','repairMidCache','rollbackMidVersion','resetMidServiceWorker','markMidRuntimeHealthy'])if(!pwa.includes(token))failures.push(`PWA-Systemfunktion fehlt: ${token}`);
for(const token of['mid:runtime-healthy','markMidRuntimeHealthy','registerMidServiceWorker'])if(!main.includes(token))failures.push(`Start-Gesundheitsprüfung fehlt: ${token}`);
for(const token of['MID_ROLLBACK_IF_PENDING','setTimeout','20000','mid-rollback'])if(!index.includes(token))failures.push(`Inline-Rückfallwächter fehlt: ${token}`);
const installBody=serviceWorker.match(/self\.addEventListener\('install',[\s\S]*?\);\nself\.addEventListener\('activate'/)?.[0]||'';
if(!installBody.includes('cacheShell(CACHE)'))failures.push('Service Worker prüft und cached den vollständigen App-Shell nicht vor Aktivierung.');
if(installBody.includes('skipWaiting'))failures.push('Service Worker aktiviert sich weiterhin unkontrolliert während install.');
for(const token of['MID_RUNTIME_HEALTHY','MID_ROLLBACK_IF_PENDING','MID_ROLLBACK','MID_REPAIR_CACHE','MID_GET_STATUS','previousCache','rollbackDocument','__mid_shell_valid__.json'])if(!serviceWorker.includes(token))failures.push(`Service-Worker-Rückfallmerkmal fehlt: ${token}`);
if(serviceWorker.includes("filter(key=>key.startsWith('mid-shell-')&&key!==CACHE)"))failures.push('Service Worker löscht weiterhin sämtliche vorherigen App-Versionen.');
if(serviceWorker!==legacyWorker)failures.push('Kompatibilitäts-Service-Worker sw.js weicht vom primären Service Worker ab.');
const descriptor=JSON.parse(read('../public/version.json')),pkg=JSON.parse(read('../package.json'));
if(descriptor.version!==pkg.version)failures.push('Versionsdatei und Paketversion weichen ab.');
if(!serviceWorker.includes(`mid-shell-v${pkg.version}`))failures.push('Service-Worker-Cacheversion stimmt nicht mit Paketversion überein.');
if(failures.length){console.error('Updater-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`Updater geprüft: vollständiger Shell-Check vor Aktivierung, Gesundheitsmeldung, automatische Rückfalloption, manuelle Reparatur/Reset und Erhalt einer Vorversion für ${descriptor.version}.`);
