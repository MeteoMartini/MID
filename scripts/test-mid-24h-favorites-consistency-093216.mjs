import {readFile} from 'node:fs/promises';
const [cockpit,app,sync,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/deviceSync.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(source,token,label=token)=>{if(!source.includes(token))failures.push(`${label} fehlt`)};
need(cockpit,'spotlightPoints=timelinePoints.length?timelinePoints:previewPoints','24-h-Kacheln nutzen sichtbare Timeline');
for(const token of ['peakGustPoint=spotlightPoints.reduce','peakRainPoint=spotlightPoints.reduce','peakWarmPoint=spotlightPoints.reduce','coolestPoint=spotlightPoints.reduce'])need(cockpit,token,'24-h-Extremwertbindung');
need(cockpit,"item.precipitation===best.precipitation&&item.probability>best.probability",'Niederschlagstie-Break nach Wahrscheinlichkeit');
need(cockpit,'{Math.round(peakRainPoint.probability)} % · {relativePointTime(peakRainPoint)}','Niederschlagskarte zeigt Wahrscheinlichkeit desselben Zeitpunkts');
if(cockpit.includes('Math.max(...points.map(item=>item.probability))'))failures.push('Niederschlagskarte verwendet weiterhin den Gesamtdatensatz statt des 24-h-Zeitpunkts.');
need(app,"const FAVORITES_UPDATED_AT_KEY='mid:favorites:updated-at'",'Favoriten-Revision');
need(app,'function favoriteIdentityNamesEquivalent(a:Location|undefined|null,b:Location|undefined|null)','POI-Namensvarianten');
need(app,'if(changed||!localStorage.getItem(FAVORITES_UPDATED_AT_KEY))localStorage.setItem(FAVORITES_UPDATED_AT_KEY,new Date().toISOString())','Favoritenrevision wird persistiert');
need(sync,"const FAVORITES_UPDATED_AT_KEY='mid:favorites:updated-at'",'Sync kennt Favoritenrevision');
need(sync,'function prepareSnapshotForApply(snapshot:SyncSnapshot)','favoritensicheres Snapshot-Merge');
need(sync,'preserveLocalFavorites=localFavorites!==null&&Number.isFinite(localFavoriteRevision)','neuere lokale Favoriten geschützt');
need(sync,'if(applied.preservedLocalFavorites)await pushDeviceSync(readDeviceSyncConfig())','geschützter Favoritenstand wird zurückpubliziert');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;
if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(pv!=='0.9.32.18')failures.push(`unerwartete Version ${pv}`);
if(failures.length){console.error('MID v0.9.32.18 24-h-/Favoritenkonsistenz fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID v0.9.32.18: 24-h-Kacheln und revisionsgeschützte Favoriten geprüft.');
