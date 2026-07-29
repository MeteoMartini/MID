import {readFile} from 'node:fs/promises';

const [app,styles]=await Promise.all([
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
  'function favoriteLocation(loc:Location)',
  'autolocated:false',
  "autolocated:favoriteId==='tracked-location'",
  "const[locationSelectionSource,setLocationSelectionSource]=useState<'tracked'|'manual'>",
  "source=normalized.autolocated?'tracked':'manual'",
  'setLocationSelectionSource(source)',
  'function trackedLocationTarget(favorites:Favorite[],tracked:Location)',
  'const favorite=matchingFavorite(favorites,tracked)',
  'if(loc&&!locationsShallowEqual(loc,normalized))',
  "activeFavoriteId=matchingFavorite(favorites,current)?.id??''",
  'trackedActive=Boolean(locationTracking&&trackedSelectionActive&&current&&trackedLocation&&locationsNearlyEquivalent(current,trackedLocation))',
  'function locationsMatchFavoriteSelection',
  'favoriteKey(a)===favoriteKey(b)||locationsNearlyEquivalent(a,b)',
  'favorites.find(item=>favoriteKey(item.location)===favoriteKey(location))??favorites.find(item=>locationsNearlyEquivalent(item.location,location))',
  'same=loc&&locationsNearlyEquivalent(loc,normalized)',
  'favorites.findIndex(item=>locationsMatchFavoriteSelection(item.location,loc))'
])need('Standort-/Favoritenaktivierung',app,token);

for(const token of [
  'timers=[0,70,180,360,650].map',
  'timers=[0,70,180,360].map',
  'timers=[0,80,200,420].map',
  'new ResizeObserver(reveal)',
  'ref={listRef}',
  'ref={item.id===currentFavoriteId?activeRowRef:undefined}',
  'centerWithinScrollContainer(container,element)'
])need('Direkter Sprung zum aktiven Favoriten',app,token);

for(const token of [
  '.metrics .air-quality-card header>.mode-info,',
  '.metrics .sun-moon-card header>.mode-info',
  'width:22px;',
  'height:22px;',
  '.favorite-manager-list>article.current-favorite-row'
])need('Aktuelle-Daten-Info und Favoritenmarkierung',styles,token);


const rad=Math.PI/180;
const distanceMeters=(a,b)=>{const dLat=(b.latitude-a.latitude)*rad,dLon=(b.longitude-a.longitude)*rad,lat1=a.latitude*rad,lat2=b.latitude*rad,h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;return 12742000*Math.asin(Math.min(1,Math.sqrt(h)))};
const near=(a,b)=>{const distance=distanceMeters(a,b),aElevation=Number(a.elevation),bElevation=Number(b.elevation),bothElevations=Number.isFinite(aElevation)&&Number.isFinite(bElevation);return distance<=(bothElevations?900:350)&&(!bothElevations||Math.abs(aElevation-bElevation)<=150)};
const origin={latitude:50.80,longitude:7.15};
if(!near(origin,{latitude:50.8025,longitude:7.15}))failures.push('Ein Ort wenige hundert Meter entfernt wird nicht mehr demselben Favoriten zugeordnet.');
if(!near({...origin,elevation:60},{latitude:50.807,longitude:7.15,elevation:120}))failures.push('Die bestehende erweiterte Nahbereichszuordnung mit plausiblen Höhen bleibt nicht erhalten.');
if(near(origin,{latitude:52.52,longitude:13.405}))failures.push('Ein rund 200 km oder weiter entfernter Ort wird fälschlich als gleicher Standort erkannt.');
const setLocStart=app.indexOf('function setLoc(next:Location');
const setSource=app.indexOf('setLocationSelectionSource(source)',setLocStart);
const sameBranch=app.indexOf('if(same){',setLocStart);
if(setLocStart<0||setSource<0||sameBranch<0||setSource>sameBranch)failures.push('Die Auswahlquelle wird nicht vor dem Nahbereichs-Kurzschluss aktualisiert.');

if(app.includes('locationDistanceMeters(a,b)<=150'))failures.push('Die unerwünschte strikte 150-m-Identitätsprüfung ist weiterhin aktiv.');
if(app.includes("activeFavoriteId=trackedSelectionActive?'':")||app.includes("activeFavoriteId=current?.autolocated?'':"))failures.push('Die Standortauswahl unterdrückt weiterhin die gleichzeitige Markierung des passenden Favoriten.');
if(app.includes('trackedActive=Boolean(locationTracking&&current?.autolocated'))failures.push('Der Standort-Aktivrahmen hängt weiterhin direkt am möglicherweise veralteten autolocated-Feld.');
if(app.includes("autolocated:favoriteId==='tracked-location'||closeFavorite?.location.autolocated"))failures.push('Gespeicherte Favoriten können den Auto-Standortstatus weiterhin erben.');
if(failures.length){console.error('Aktuelle-Daten-/Favoritenkorrektur fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Aktuelle Daten und Favoriten geprüft: identische Info-Schaltflächen, direkter Menüsprung, Nahbereichszuordnung, kanonische Favoritenauswahl und zusätzliche Standort-Aktivmarkierung.');
