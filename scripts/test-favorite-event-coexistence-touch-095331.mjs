import {readFile} from 'node:fs/promises';

const [app,eventCenter,stateContract,baseline,pkg]=await Promise.all([
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/eventCenter.ts',import.meta.url),'utf8'),
  readFile(new URL('../MID_STATE_INTEGRITY_CONTRACT.md',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8').then(JSON.parse),
  readFile(new URL('../package.json',import.meta.url),'utf8').then(JSON.parse)
]);
const failures=[];
const need=(source,token,label=token)=>{if(!source.includes(token))failures.push(`Fehlt ${label}`)};

need(app,"function favoriteLocation(loc:Location):Location{const clean={...normalizeLocation(loc)} as Location&Record<string,unknown>;for(const key of['date','startTime','endTime','isFavorite','favoriteUpdatedAt'])delete clean[key]",'Event-Metadaten-Bereinigung beim Ortsfavoriten');
need(app,'function favoriteLocationsEquivalentForSelection(a:Location|undefined|null,b:Location|undefined|null)','separate Auswahl-Näherungslogik');
need(app,'limit=poi?45:80','enge mutierende Favoritenidentität');
need(app,'limit=poi?180:450','großzügigere reine Auswahlzuordnung');
need(app,'return favorites.find(item=>favoriteLocationsIdentical(item.location,location))','strikter Stored-Favorite-Abgleich');
need(app,'return matchingStoredFavorite(favorites,location)??favorites.find(item=>favoriteLocationsEquivalentForSelection(item.location,location))','nicht-mutierende Näherungszuordnung');
need(app,'useLayoutEffect(()=>{favoritesPersistRef.current=favorites;navigationFavoritesRef.current=favorites},[favorites])','commit-sichere Favoriten-Refs');
need(app,'className={`favorite-toggle${locationIsFavorite?\' active\':\'\'}`} onClick={()=>toggleFavorite(loc)}','einzelner semantischer Click-Pfad des Favoritensterns');

if(app.includes('favoriteTogglePointerAt=useRef(0)'))failures.push('Zeitbasierter Pointer-/Click-Doppelpfad ist beim Favoritenstern noch vorhanden.');
if(/className=\{`favorite-toggle[\s\S]{0,450}onPointerUp=/.test(app))failures.push('Favoritenstern besitzt weiterhin einen zusätzlichen onPointerUp-Mutationspfad.');
if(app.includes('favoritesPersistRef.current=favorites;navigationFavoritesRef.current=favorites;navigationLocationRef.current=loc;'))failures.push('Favoriten-Authoritätsref wird weiterhin während des Renderns zurückgesetzt.');
if(eventCenter.includes("mid:favorites"))failures.push('Event-Center greift auf den Ortsfavoritenspeicher zu.');
need(stateContract,'Derselbe geografische Ort darf gleichzeitig als Event bzw. Event-Favorit und als Ortsfavorit gespeichert sein.','verbindlicher Koexistenzsatz');
need(stateContract,'Eine einzelne Nutzeraktivierung des Favoritensterns darf genau eine Favoritenmutation auslösen.','Einmal-Aktivierungsvertrag');
if(!baseline.requiredRegressionTests?.includes('scripts/test-favorite-event-coexistence-touch-095331.mjs'))failures.push('Neue Prüfung fehlt in requiredRegressionTests.');
if(pkg.version!==baseline.releaseVersion)failures.push(`Versionen nicht synchron: ${pkg.version}/${baseline.releaseVersion}`);

if(failures.length){console.error('Favoriten-/Event-Koexistenz und Touch-Integrität fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`Favoriten-/Event-Koexistenz geprüft (${pkg.version}): ein Tap = eine Mutation, Event und Ortsfavorit bleiben unabhängig, Näherung löscht nichts.`);
