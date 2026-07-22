import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/v078.ts',import.meta.url),'utf8');
const required=["new URL('./version.json',document.baseURI)","cache:'no-store'","mid-refresh","registration.update()","SKIP_WAITING","visibilitychange","pageshow"];
const missing=required.filter(token=>!source.includes(token));
if(missing.length){console.error('Updater-Prüfung fehlgeschlagen:',missing.join(', '));process.exit(1)}
const descriptor=JSON.parse(fs.readFileSync(new URL('../public/version.json',import.meta.url),'utf8'));
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
if(descriptor.version!==pkg.version){console.error('Versionsdatei und Paketversion weichen ab');process.exit(1)}
console.log(`Updater geprüft: version.json ${descriptor.version}, Cache-Bypass, SW-Aktualisierung und Reload-Schutz vorhanden.`);
