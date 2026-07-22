import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const updater=read('../src/v078.ts'),pwa=read('../src/pwa.ts'),main=read('../src/main.tsx'),index=read('../index.html');
const workers=[read('../public/service-worker.js'),read('../public/sw.js')];
const pkg=JSON.parse(read('../package.json')),descriptor=JSON.parse(read('../public/version.json'));
const checks=[
 ['Versionsprüfung ohne Browsercache',updater.includes("new URL('./version.json',document.baseURI)")&&updater.includes("cache:'no-store'")],
 ['sicherer Update-Einstieg',updater.includes('activateMidUpdate(version)')&&updater.includes('Update nicht ausgeführt')],
 ['Rückkehr-/Sichtbarkeitsprüfung',updater.includes('visibilitychange')&&updater.includes('pageshow')],
 ['Release-Preflight',pwa.includes('preflightRelease')&&pwa.includes('DOMParser')&&pwa.includes('mid-preflight')],
 ['kontrollierte SW-Aktivierung',pwa.includes('registration.update()')&&pwa.includes('SKIP_WAITING')&&pwa.includes('controllerchange')],
 ['kanonische SW-Registrierung',main.includes('registerMidServiceWorker')&&!main.includes("register(new URL('./sw.js'")],
 ['Boot-/Reparaturansicht',index.includes('mid-boot-fallback')&&index.includes('mid-boot-repair')&&index.includes('mid:boot-recovery')]
];
for(const [label,ok] of checks)if(!ok){console.error(`Updater-Prüfung fehlgeschlagen: ${label}`);process.exit(1)}
if(descriptor.version!==pkg.version){console.error('Versionsdatei und Paketversion weichen ab');process.exit(1)}
for(const [indexNumber,worker] of workers.entries()){
 const version=worker.match(/const MID_VERSION='([^']+)'/)?.[1];
 if(version!==pkg.version){console.error(`Service Worker ${indexNumber+1} hat Version ${version||'unbekannt'} statt ${pkg.version}`);process.exit(1)}
 const installBlock=worker.split("self.addEventListener('activate'")[0];
 if(installBlock.includes('skipWaiting')){console.error(`Service Worker ${indexNumber+1} aktiviert sich bereits während install`);process.exit(1)}
 if(!worker.includes("if(event.data?.type==='SKIP_WAITING')")){console.error(`Service Worker ${indexNumber+1} kennt die kontrollierte Aktivierung nicht`);process.exit(1)}
}
console.log(`Updater geprüft: v${pkg.version}, vollständiger Preflight, kontrollierte Aktivierung, Boot-Fallback und Cache-Reparatur vorhanden.`);
