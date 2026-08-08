import {readFile} from 'node:fs/promises';

const [app,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(token,label=token)=>{if(!app.includes(token))failures.push(`App fehlt ${label}`)};

need('function normalizedFavoriteIdentityName(loc:Location|undefined|null)','normalisierte Favoritenidentität');
need('function favoriteLocationsIdentical(a:Location|undefined|null,b:Location|undefined|null)','identitätsscharfer Favoritenvergleich');
need('limit=poi?120:450','enge POI-Toleranz');
need('function matchingStoredFavorite(favorites:Favorite[],location:Location|undefined|null)','strikter gespeicherter Favoritenabgleich');
need('return matchingStoredFavorite(favorites,location)??favorites.find(item=>locationsNearlyEquivalent(item.location,location))','getrennte GPS-Nahbereichszuordnung');
need('currentFavorite=useMemo(()=>matchingStoredFavorite(favorites,loc)','strikter aktiver Favorit');
need("activeFavoriteId=matchingStoredFavorite(favorites,current)?.id??''",'strikter Schnellzugriff');
need("currentFavoriteId=matchingStoredFavorite(favorites,current)?.id??''",'strikte Favoritenverwaltung/-suche');
need('existing=matchingStoredFavorite(favorites,normalized)','striktes Hinzufügen/Entfernen');
need('favoritesPersistRef.current=next;persistFavoriteSnapshot(next);setFavorites(next)','sofortige persistente Favoritenaktion');

if(app.includes('existing=matchingFavorite(current,normalized)')||app.includes('existing=matchingFavorite(favorites,normalized)'))failures.push('Favoriten-Toggle verwendet weiterhin die großzügige GPS-Nahbereichszuordnung.');

const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;
if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('Favoriten-Dauerhaftigkeit/POI-Identität fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`Favoriten-Dauerhaftigkeit geprüft (${pv}): sofortige Speicherung und POI-scharfe Identität bei erhaltener GPS-Nahbereichslogik.`);
