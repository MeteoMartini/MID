import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const failures=[];
for(const token of ["type SettingsSection='view'|'appearance'|'units'|'notifications'|'favorites'|'twin'|'sync'|'system'",'function SettingsManager','Ansichtsoptionen','Farbdesign','Einheitenauswahl','Benachrichtigungen','Lokaler Wetterzwilling','Daten & Synchronisation','System & Updates'])if(!app.includes(token))failures.push(`Einstellungsmenü fehlt: ${token}`);
if(!app.includes("onOpenSettings('favorites')"))failures.push('Favoritenverwaltung ist nicht aus der Suche als Einstellungs-Untermenü erreichbar.');
if(!app.includes("section==='favorites'&&<FavoritesManager"))failures.push('Favoritenmanager ist nicht in das Einstellungsmenü eingebettet.');
if(!app.includes("section==='twin'&&<WeatherTwinSettingsPanel/>"))failures.push('Lokaler Wetterzwilling besitzt keinen eigenen intuitiven Einstellungsbereich.');
if(!app.includes("section==='sync'&&<DeviceSyncSettings/>"))failures.push('Gerätesynchronisation besitzt keinen eigenen Einstellungsbereich.');
if(!app.includes("section==='system'&&<SystemUpdateManager open onClose={onClose} embedded/>"))failures.push('System- und Updatebereich ist nicht separat eingebettet.');
const header=app.slice(app.indexOf('function Header('),app.indexOf('function sunshineDurationLabel'));
for(const oldToken of ['desktop-view-control','mobile-view-switch','theme-mode-control','system-update-button'])if(header.includes(oldToken))failures.push(`Alter Kopfbereich-Regler noch vorhanden: ${oldToken}`);
for(const token of ['settings-button','compact-actions'])if(!header.includes(token))failures.push(`Kompakter Kopfbereich fehlt: ${token}`);
for(const token of ['.settings-backdrop','.settings-dialog','.settings-nav','.settings-choice-grid','.settings-unit-grid','.settings-section-stack','.favorite-modal.embedded','.system-update-dialog.embedded'])if(!styles.includes(token))failures.push(`Einstellungs-CSS fehlt: ${token}`);
if(failures.length){console.error('Einstellungsmenü-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Einstellungsmenü geprüft: Ansicht/Design/Einheiten sind gebündelt; Favoriten, Wetterzwilling, Synchronisation und System/Updates besitzen intuitive getrennte Bereiche.');
