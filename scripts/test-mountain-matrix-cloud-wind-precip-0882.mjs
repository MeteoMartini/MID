import {readFile} from 'node:fs/promises';
const [app,mountain,styles]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
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
need(app,'Wolkenbasis (NHN)','Bezugsniveau der Wolkenbasis ist nicht ausgewiesen.');
need(app,'m ü. Grund','relative Wolkenbasishöhe über dem Stationsniveau fehlt.');
need(app,'mountainWindWarningMeta','Wind-Warnstufenklasse fehlt.');
need(app,'mountainPrecipitationClass','Niederschlagsintensitätsklasse fehlt.');
need(styles,'mountain-wind-warning-50','schwache Einfärbung der ersten Windwarnstufe fehlt.');
need(styles,'mountain-wind-warning-140','Einfärbung der höchsten Windwarnstufe fehlt.');
need(styles,'mountain-precip-trace','blasse Niederschlagseinfärbung fehlt.');
need(styles,'mountain-precip-heavy','dunkelblaue Niederschlagseinfärbung fehlt.');
need(styles,'.mountain-matrix-row>span.mountain-precip-heavy small{color:rgba(255,255,255,.86)}','Textkontrast bei starkem Niederschlag ist nicht abgesichert.');
if(failures.length){console.error('Höhenwetter-Farb-/Wolkenplausibilitätsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Höhenwetter geprüft: Windwarnfarben, Niederschlagsintensität, NHN-Bezug und Sichtkorrektur in dichter Wolkenschicht.');
