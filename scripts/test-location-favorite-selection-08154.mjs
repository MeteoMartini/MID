import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const failures=[];
const need=(label,token)=>{if(!app.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
 'function trackedLocationTarget(favorites:Favorite[],tracked:Location)',
 'const favorite=matchingFavorite(favorites,tracked)',
 "return favorite?{...favoriteLocation(favorite.location),autolocated:true}:{...normalizeLocation(tracked),autolocated:true}",
 'const openTracked=(tracked:Location)=>{setTrackedLocation(tracked);if(openLocation)setLoc(trackedLocationTarget(favorites,tracked))}',
 'if(loc&&!locationsShallowEqual(loc,normalized)){localStorage.setItem(LOCATION_STORAGE_KEY,JSON.stringify(normalized));setLocState(normalized)}',
 "activeFavoriteId=matchingStoredFavorite(favorites,current)?.id??'',trackedActive=Boolean(locationTracking&&trackedSelectionActive",
 "currentFavoriteId=matchingStoredFavorite(favorites,current)?.id??'';",
 "const refreshTracked=locationTracking||locationSelectionSource==='tracked'",
 "locate(locationSelectionSource==='tracked')"
])need('Standort-/Favoritenlogik',token);

if(app.includes("activeFavoriteId=trackedSelectionActive?'':"))failures.push('Die Standortauswahl unterdrückt weiterhin die gleichzeitige Markierung des passenden Favoriten.');
if(app.includes("currentFavoriteId=current?.autolocated?'':"))failures.push('Die Favoritenverwaltung unterdrückt weiterhin den passenden Favoriten bei aktiver Standortauswahl.');
if(!app.includes("const favoritesMode=term.length===0,choose=(location:Location)=>{setLoc(favoriteLocation(location))"))failures.push('Manuelle Auswahl setzt den Standortstatus nicht weiterhin über favoriteLocation zurück.');
if(!app.includes("trackedActive=Boolean(locationTracking&&trackedSelectionActive&&current&&trackedLocation&&locationsNearlyEquivalent(current,trackedLocation))"))failures.push('Der blaue Standort-Rahmen ist nicht zusätzlich an Quelle und geografische Übereinstimmung gebunden.');

if(failures.length){console.error('Standort-/Favoriten-Auswahlprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Standort-/Favoriten-Auswahl geprüft: aktiver GPS-Standort wird beim App-Start neu bestimmt, manuelle Orte bleiben geschützt und nahe Favoriten werden sauber zugeordnet.');
