import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL(path,import.meta.url),'utf8');
const [app,module,worker,pkg,docs]=await Promise.all([read('../src/App.tsx'),read('../src/mountainSports.ts'),read('../worker/metar-proxy.js'),read('../package.json'),read('../docs/mountain-winter-sports.md')]);
const failures=[];
for(const token of ['Berg-/Wintersport','Automatisch bestimmen','Mittelstation','Saisonprofil','Sommer','Winter'])if(!app.includes(token))failures.push(`App fehlt: ${token}`);
for(const token of ["type MountainSeason='auto'|'summer'|'winter'",'mountain-profile','snow-observations','snow_depth','past_hours','profileConfidence','middleEnabled','directMountainProfile','directSnowObservations','mountainTimeEpoch','overpass-api.de/api/interpreter','api.open-meteo.com/v1/elevation','tawes-v1-10min','SCHNEE','maxDistance=point.role===\'valley\'?20000:point.role===\'middle\'?25000:30000'])if(!module.includes(token))failures.push(`mountainSports.ts fehlt: ${token}`);
for(const token of ["mode==='mountain-profile'","mode==='snow-observations'",'aerialway:station','SCHNEE','overpass-api.de','api.open-meteo.com/v1/elevation'])if(!worker.includes(token))failures.push(`Worker fehlt: ${token}`);
const packageJson=JSON.parse(pkg);if(packageJson.version!=='0.7.91')failures.push('Paketversion ist nicht 0.7.91');
if(packageJson.scripts?.['test:mountain-sports']!=='node scripts/test-mountain-sports.mjs')failures.push('Mountain-Testskript fehlt');
if(!String(packageJson.scripts?.verify||'').includes('npm run test:mountain-sports'))failures.push('Mountain-Test fehlt in verify');
for(const token of ['OpenStreetMap','Copernicus GLO-90','GeoSphere Austria','keine Pistenschneehöhe','direkten CORS-Fallback','höchstens 20 km','höchstens 30 km'])if(!docs.includes(token))failures.push(`Dokumentation fehlt: ${token}`);
if(failures.length){console.error(`Berg-/Wintersport-Prüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('Berg-/Wintersport geprüft: Saisonprofile, automatische Höhen mit direktem Fallback, drei Niveaus, Modell- und Messschnee sowie Worker-Routen sind vorhanden.');
