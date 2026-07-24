import {readFile} from 'node:fs/promises';

const [app,component,manifest,index,styles]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/PwaInstallButton.tsx',import.meta.url),'utf8'),
 readFile(new URL('../public/manifest.webmanifest',import.meta.url),'utf8'),
 readFile(new URL('../index.html',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
for(const token of ["import {PwaInstallButton} from './PwaInstallButton';",'<PwaInstallButton/>'])if(!app.includes(token))failures.push(`App-Einbindung fehlt: ${token}`);
for(const token of ['beforeinstallprompt','appinstalled',"(display-mode: standalone)",'navigator as NavigatorWithStandalone','MID als App nutzen','MID jetzt installieren','Zu Home-Bildschirm hinzufügen','Als Web-App öffnen'])if(!component.includes(token))failures.push(`Installationslogik/-hinweis fehlt: ${token}`);
const parsed=JSON.parse(manifest);
if(parsed.display!=='standalone')failures.push('Manifest ist nicht als standalone konfiguriert.');
if(parsed.start_url!=='./'||parsed.scope!=='./')failures.push('Manifest-Start-URL oder Scope passt nicht zu GitHub Pages.');
if(!Array.isArray(parsed.icons)||!parsed.icons.length)failures.push('Manifest enthält kein App-Symbol.');
for(const token of ['apple-mobile-web-app-capable','apple-touch-icon','rel="manifest"'])if(!index.includes(token))failures.push(`iOS-/PWA-Metadatum fehlt: ${token}`);
for(const token of ['.footer-install-button','.pwa-install-backdrop','.pwa-install-dialog','@media(max-width:620px)'])if(!styles.includes(token))failures.push(`Responsive Installationsoberfläche fehlt: ${token}`);
if(failures.length){console.error(`PWA-Installationsprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('PWA-Installationsprüfung bestanden: sichtbarer MID-App-Button, direkter Chromium-Dialog, iOS-Anleitung, Standalone-Erkennung und responsive Oberfläche sind vorhanden.');
