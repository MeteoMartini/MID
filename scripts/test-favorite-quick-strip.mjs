import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const failures=[];
for(const token of ['function FavoriteQuickStrip','favorite-strip header-favorites','favorite-bubbles','data-quick-favorite-id','favorite-quick-grip','onDragStart','onDragOver','onDrop','onPointerDown','moveTo(active.id,target)','tracked-location','favorite-profile-icons'])if(!app.includes(token))failures.push(`Favoriten-Schnellleiste fehlt: ${token}`);
const header=app.slice(app.indexOf('function Header('),app.indexOf('function sunshineDurationLabel'));
for(const token of ['setFavorites:FavoriteSetter','current:Location|null','<FavoriteQuickStrip','onOpenSettings(\'favorites\')'])if(!header.includes(token))failures.push(`Kopfbereich bindet Schnellleiste nicht vollständig ein: ${token}`);
if(!app.includes("section==='favorites'&&<FavoritesManager"))failures.push('Detailverwaltung der Favoriten ist nicht ausschließlich im Einstellungsbereich verankert.');
for(const token of ['.settings-header>.header-favorites','grid-column:1/-1','.favorite-bubbles>button','.favorite-strip-manage'])if(!styles.includes(token))failures.push(`Kompaktes Schnellleisten-CSS fehlt: ${token}`);
if(failures.length){console.error('Favoriten-Schnellleisten-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Favoriten-Schnellleiste geprüft: zweite kompakte Kopfzeile, Standort/Favoritenauswahl, Profilkennzeichen sowie Maus- und Touch-Drag&Drop sind vorhanden; Detailverwaltung bleibt im Einstellungsmenü.');
