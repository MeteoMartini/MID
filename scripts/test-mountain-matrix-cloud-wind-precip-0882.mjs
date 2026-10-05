import {readAppFeatureSources} from './lib/appFeatureSources.mjs';
import {readFile} from 'node:fs/promises';
const [app,mountain,styles]=await Promise.all([
 readAppFeatureSources(),
 readFile(new URL('../src/mountainSports.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
need(mountain,'MOUNTAIN_CLOUD_PROFILE_LEVELS=[1000,950,925,900,850,800,700,600]','Druckniveau-Vertikalprofil für Wolken fehlt.');
need(mountain,'`cloud_cover_${level}hPa`','Wolkenbedeckung auf Druckniveaus wird nicht abgerufen.');
need(mountain,'`geopotential_height_${level}hPa`','Geopotentialhöhe als NHN-Bezug fehlt.');
need(app,'function mountainCloudLayerAssessment','Wolkenschicht-Auswertung fehlt.');
need(app,'cloud.cover>62.5','5/8-Plausibilitätsgrenze fehlt.');
need(app,'Math.min(raw,1000)','Sicht wird innerhalb dichter Wolkenschichten nicht konservativ begrenzt.');
need(app,'zeitweise innerhalb einer Wolkenschicht: Sicht stark reduziert','Höhenzonenrisiko für Wolkensicht fehlt.');
need(app,'<tr><th scope="row">Sicht</th>','Sicht fehlt in der stündlichen Höhenprognose.');
need(app,'<tr><th scope="row">Tiefe Wolken</th>','Tiefe Wolken fehlen als sekundärer stündlicher Fachwert.');
need(app,'const pair=validateWindPair(row.wind,row.gust)','Stündliche Wind-/Böenwerte werden nicht plausibilisiert.');
need(app,'<WindDirectionArrow direction={row.direction} gust={pair.gust}/>','Windrichtung und plausibilisierte Böe werden nicht gemeinsam dargestellt.');
need(app,'mountainPrecipitationClass(row.precipitation)','Stündlicher Niederschlag verliert seine Intensitätsklasse.');
need(styles,'.mountain-hourly-precip.mountain-precip-trace','blasse stündliche Niederschlagseinfärbung fehlt.');
need(styles,'.mountain-hourly-precip.mountain-precip-heavy','starke stündliche Niederschlagseinfärbung fehlt.');
need(styles,'.mountain-hourly-precip.mountain-precip-heavy>small{color:rgba(255,255,255,.88)}','Textkontrast bei starkem Niederschlag ist nicht abgesichert.');
if(failures.length){console.error('Höhenwetter-Stundenansicht/Wolkenplausibilität fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Höhenwetter geprüft: Wolkenprofil/Sichtkorrektur, plausibilisierte Wind/Böen und Niederschlagsdarstellung der stündlichen Höhenansicht.');
