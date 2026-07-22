import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const failures=[];
for(const token of ["type SettingsSection='view'|'appearance'|'units'|'favorites'|'system'",'function SettingsManager','Ansichtsoptionen','Farbdesign','Einheitenauswahl','MID-Systemstatus','embedded/'])if(!app.includes(token))failures.push(`Einstellungsmenü fehlt: ${token}`);
if(!app.includes("onOpenSettings('favorites')"))failures.push('Favoritenverwaltung ist nicht aus der Suche als Einstellungs-Untermenü erreichbar.');
if(!app.includes("section==='favorites'&&<FavoritesManager"))failures.push('Favoritenmanager ist nicht in das Einstellungsmenü eingebettet.');
if(!app.includes("section==='system'&&<SystemUpdateManager"))failures.push('MID-Systemstatus ist nicht in das Einstellungsmenü eingebettet.');
const header=app.slice(app.indexOf('function Header('),app.indexOf('function sunshineDurationLabel'));
for(const oldToken of ['desktop-view-control','mobile-view-switch','theme-mode-control','system-update-button','FavoriteQuickStrip'])if(header.includes(oldToken))failures.push(`Alter Kopfbereich-Regler noch vorhanden: ${oldToken}`);
for(const token of ['settings-button','compact-actions'])if(!header.includes(token))failures.push(`Kompakter Kopfbereich fehlt: ${token}`);
for(const token of ['.settings-backdrop','.settings-dialog','.settings-nav','.settings-choice-grid','.settings-unit-grid','.favorite-modal.embedded','.system-update-dialog.embedded'])if(!styles.includes(token))failures.push(`Einstellungs-CSS fehlt: ${token}`);
if(failures.length){console.error('Einstellungsmenü-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Einstellungsmenü geprüft: Ansicht, Farbdesign, Einheiten, Favoriten und MID-Systemstatus sind zentral integriert; der Kopfbereich enthält nur Einstellungen und Neuladen.');
