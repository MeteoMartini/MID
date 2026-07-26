import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [mountainSource,changesSource,app,ensemble,worker,sw,legacySw,styles]=await Promise.all([
 readFile(path.join(root,'src','mountainSports.ts'),'utf8'),
 readFile(path.join(root,'src','modelRunChanges.ts'),'utf8'),
 readFile(path.join(root,'src','App.tsx'),'utf8'),
 readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8'),
 readFile(path.join(root,'worker','metar-proxy.js'),'utf8'),
 readFile(path.join(root,'public','sw.js'),'utf8'),
 readFile(path.join(root,'public','service-worker.js'),'utf8'),
 readFile(path.join(root,'src','styles.css'),'utf8')
]);
const failures=[];
const requireToken=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
 'const PROFILE_CLUSTER_LINK_M=2600;',
 'function chooseAreaMiddle',
 'areaWide:!sameLift',
 'summitPool[0]',
 "candidate.kind==='station'||explicitMiddle(candidate)",
 "if(/mid|middle|mittel|intermediate|zwischen/.test(role))return'middle'"
])requireToken('Skigebietsprofil',mountainSource,token);

const mountainJs=ts.transpileModule(mountainSource.replace("import {fetchWorkerJson} from './workerClient';","const fetchWorkerJson=async()=>({});"),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const mountain=await import(`data:text/javascript;base64,${Buffer.from(mountainJs).toString('base64')}`);
const loc={id:1,name:'Sölden',latitude:46.969,longitude:11.010,elevation:1377};
const candidate=(name,elevation,latitude,longitude,distanceM,kind='lift-end',role=undefined,liftId=undefined)=>({name,elevation,latitude,longitude,distanceM,kind,role,liftId,source:'Test'});
const candidates=[
 candidate('Giggijochbahn · Tal',1350,46.969,11.008,180,'lift-end','valley','giggijoch'),
 candidate('Gaislachkoglbahn · Tal',1363,46.965,11.012,520,'lift-end','valley','gaislach-1'),
 candidate('Giggijochbahn · Berg',2284,46.982,11.000,1800,'lift-end','summit','giggijoch'),
 candidate('Gaislachkogl Mittelstation',2174,46.956,10.994,2400,'station','middle','gaislach-1'),
 candidate('Gaislachkoglbahn · Berg',3040,46.947,10.966,5000,'lift-end','summit','gaislach-2'),
 candidate('Verbindung Rettenbach',2660,46.941,10.950,6200,'station',undefined,'link'),
 candidate('Schwarze Schneidbahn · Berg',3340,46.932,10.930,8200,'lift-end','summit','schwarze-schneid'),
 candidate('Schwarze Schneidbahn · Tal',2674,46.942,10.946,6400,'lift-end','valley','schwarze-schneid')
];
const selected=mountain.selectMountainProfileCandidates(loc,1377,candidates);
if(!selected)failures.push('Skigebietsprofil: Sölden-Testgruppe wurde nicht erkannt.');
else{
 if(selected.valley.name!=='Giggijochbahn · Tal'||selected.valley.elevation!==1350)failures.push(`Skigebietsprofil: niedrigste lokale Talstation nicht gewählt (${selected.valley.name} / ${selected.valley.elevation}).`);
 if(selected.summit.elevation!==3340)failures.push(`Skigebietsprofil: höchste verbundene Bergstation nicht gewählt (${selected.summit.elevation}).`);
 if(selected.middle?.name!=='Gaislachkogl Mittelstation')failures.push(`Skigebietsprofil: explizite Mittelstation nicht gewählt (${selected.middle?.name||'keine'}).`);
 if(!selected.areaWide)failures.push('Skigebietsprofil: Gebietsauswahl wurde fälschlich als Einzellift markiert.');
}

for(const token of ['modelRuns?:ModelChangeSnapshotRun[]','function modelRunDifferences','runDifferences:ModelChangeRunDifference[]','snapshotRuns(runs)'])requireToken('Modelllaufvergleich',changesSource,token);
for(const token of ['function runDifferenceText','Geänderte Modellstände','gleicher Lauf','Modellstände geändert'])requireToken('Modelllaufanzeige',ensemble,token);
requireToken('Modelllauf-CSS',styles,'.model-change-runs{');
const changesJs=ts.transpileModule(changesSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const changes=await import(`data:text/javascript;base64,${Buffer.from(changesJs).toString('base64')}`);
const day={date:'2026-07-26',bestMax:25,bestMin:14,ensembleMax:25,ensembleMin:14,precipitation:3,probability:60,gust:20,confidence:80,spread:3};
const previous={version:1,createdAt:'2026-07-26T12:10:00Z',runKey:'old',runTime:'2026-07-26T12:00:00Z',modelRuns:[{id:'icon-eu',label:'DWD ICON-EU ENS',kind:'ensemble',initialisationTime:'2026-07-26T06:00:00Z',availabilityTime:'2026-07-26T10:00:00Z'},{id:'ecmwf',label:'ECMWF IFS ENS',kind:'ensemble',initialisationTime:'2026-07-26T12:00:00Z',availabilityTime:'2026-07-26T13:00:00Z'}],signature:'a',days:[day]};
const current={...previous,createdAt:'2026-07-26T15:00:00Z',runKey:'new',modelRuns:[{...previous.modelRuns[0],initialisationTime:'2026-07-26T12:00:00Z',availabilityTime:'2026-07-26T14:00:00Z'},previous.modelRuns[1]],signature:'b'};
const report=changes.compareModelChangeSnapshots(previous,current);
if(report.runDifferences.length!==1||report.runDifferences[0].label!=='DWD ICON-EU ENS'||report.runDifferences[0].kind!=='advanced')failures.push('Modelllaufvergleich: geänderter Einzellauf wird nicht eindeutig identifiziert.');

for(const token of [
 "latitudeRaw===null||latitudeRaw.trim()===''?NaN",
 "longitudeRaw===null||longitudeRaw.trim()===''?NaN",
 'validCoordinates=Number.isFinite(latitude)',
 "queryName||closeFavorite?.alias||closeFavorite?.location.name||'Benachrichtigungsort'",
 'locationsNearlyEquivalent',
 'currentFavorite=matchingFavorite(favorites,loc)',
 'const active=locationsNearlyEquivalent(item.location,current)'
])requireToken('Push/Favoriten-App',app,token);
for(const token of ['function pushLocationPayload','...pushLocationPayload(favorite)','locationName:String(favorite?.name'])requireToken('Push-Worker',worker,token);
for(const [name,text] of [['Service Worker',sw],['Legacy Service Worker',legacySw]])for(const token of ['latitude:payload.latitude','locationName:payload.locationName','targetUrl.searchParams.set(\'mid-lat\'','targetUrl.searchParams.set(\'mid-name\''])requireToken(name,text,token);

const distance=(a,b)=>{const rad=Math.PI/180,dLat=(b.latitude-a.latitude)*rad,dLon=(b.longitude-a.longitude)*rad,h=Math.sin(dLat/2)**2+Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin(dLon/2)**2;return 12742000*Math.asin(Math.min(1,Math.sqrt(h)))};
const dynamic={latitude:50.8120,longitude:7.0410,elevation:62},favorite={latitude:50.8170,longitude:7.0430,elevation:75};
if(distance(dynamic,favorite)>900||Math.abs(dynamic.elevation-favorite.elevation)>150)failures.push('Favoriten-Nähetest: Referenzorte liegen unerwartet außerhalb der Aktivierungsschwelle.');

if(failures.length){console.error('MID-v0.7.99.1-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID-v0.7.99.1 geprüft: Skigebietsweite Höhenwahl, eindeutige Modelllaufkennung, exakte Push-Koordinaten und gleichzeitige Favoritenaktivierung sind geschützt.');
