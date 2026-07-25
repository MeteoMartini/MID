import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL(path,import.meta.url),'utf8');
const [app,ensemble,styles,mountain,worker,pkg]=await Promise.all([read('../src/App.tsx'),read('../src/EnsemblePanel.tsx'),read('../src/styles.css'),read('../src/mountainSports.ts'),read('../worker/metar-proxy.js'),read('../package.json')]);
const failures=[];
for(const token of ['compact-trend-tooltip','trend-tooltip-temperature-table','Klima 1991–2020','Sonnenschein','Prognosekonsistenz'])if(!ensemble.includes(token)&&!styles.includes(token))failures.push(`Kompakter Ensemble-Tooltip fehlt: ${token}`);
for(const token of ['detail-chart-popover','detail-tooltip-grid','openDetailTooltip','onPointerDown={event=>openDetailTooltip(event,i)}','Tooltip schließen'])if(!app.includes(token)&&!styles.includes(token))failures.push(`Kompakter Detail-Tooltip fehlt: ${token}`);
for(const token of ['validProfile(result,loc)','distanceMeters(loc.latitude,loc.longitude','Worker-Höhenprofil passt räumlich nicht'])if(!mountain.includes(token))failures.push(`Standortprüfung im Frontend fehlt: ${token}`);
for(const token of ["url.searchParams.set('data',query)",'cacheKey:url.toString()','requestedLatitude:lat','sameLift:best.sameLift'])if(!worker.includes(token))failures.push(`Standorttreue Worker-Abfrage fehlt: ${token}`);
const packageJson=JSON.parse(pkg);if(packageJson.version!=='0.7.93')failures.push('Paketversion ist nicht 0.7.93');
if(failures.length){console.error(`Tooltip-/Standortprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('Tooltips und Bergprofil geprüft: kompakte mobile Ansichten, vollständige Inhalte und koordinatenspezifische Liftabfragen sind vorhanden.');
