import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [radar,styles,worker,pkgText,baselineText,implementation]=await Promise.all([
 'src/DwdPrecipitationTypeRadar.tsx',
 'src/styles.css',
 'worker/metar-proxy.js',
 'package.json',
 'MID_BASELINE.json',
 'MID_IMPLEMENTATION_0.9.76.11.md'
].map(path=>readFile(new URL(path,root),'utf8')));

for(const token of [
 'DWD_IMAGE_GEO_BILINEAR',
 'DWD_IMAGE_GEO_CENTER={longitude:10,latitude:51.5}',
 'x:{origin:.506145794481,lon:.0527570530389,lat:.0000737501280844,cross:-.0015334680047}',
 'y:{origin:.401459603686,lon:.0000554164716641,lat:-.0818027514158,cross:-.000302836311194}',
 'dwdPrecipitationTypeImagePosition',
 'geoFromImagePoint',
 'dwdLocationCropWidth',
 'dwd-precip-type-radar__original-canvas',
 'dwd-precip-type-radar__location-marker',
 'dwd-precip-type-radar__source-legend',
 'src={imageUrl}',
 'await inspectOriginalPoint(x,y)',
 "expected:meta?.observedAt||''",
 'Originallegende aus demselben DWD-Bild'
])assert.ok(radar.includes(token),`Ortsausschnitt-/Originalpixelvertrag fehlt: ${token}`);

assert.ok((radar.match(/src=\{imageUrl\}/g)||[]).length>=2,'Kartenbild und Originallegende müssen dieselbe DWD-Bildantwort verwenden.');
assert.ok(styles.includes('.dwd-precip-type-radar__source-legend{position:absolute'),'Originallegende ist nicht dauerhaft in den Ausschnitt eingebettet.');
assert.match(radar,/<\/div>\n  \{!loading&&!error&&imageUrl\?<div className="dwd-precip-type-radar__source-legend"/,'Originallegende muss außerhalb des scrollbaren Bildbereichs am Ausschnittsrahmen verankert sein.');
assert.ok(styles.includes('.dwd-precip-type-radar__location-marker{position:absolute'),'Standortmarker fehlt im Originalbildausschnitt.');
assert.ok(styles.includes('aspect-ratio:4/3'),'Mobiler Hoch-/Querformat-Ausschnitt fehlt.');
for(const forbidden of ['DwdPrecipitationMap','HymecNgOverlay','ImageOverlay','MID-Komposit · georeferenziert'])assert.ok(!radar.includes(forbidden),`Verbotene Originalbild-Rekonstruktion gefunden: ${forbidden}`);
for(const token of ["DWD_PRECIPITATION_TYPE_IMAGE='https://www.dwd.de/DWD/wetter/sat/satwetter/njob_satrad.png'","mode==='dwd-precipitation-type-info'"])assert.ok(worker.includes(token),`Amtlicher Workerpfad fehlt: ${token}`);

const geometry={center:{longitude:10,latitude:51.5},x:{origin:.506145794481,lon:.0527570530389,lat:.0000737501280844,cross:-.0015334680047},y:{origin:.401459603686,lon:.0000554164716641,lat:-.0818027514158,cross:-.000302836311194}};
const imagePoint=(latitude,longitude)=>{const lon=longitude-geometry.center.longitude,lat=latitude-geometry.center.latitude;return{x:geometry.x.origin+geometry.x.lon*lon+geometry.x.lat*lat+geometry.x.cross*lon*lat,y:geometry.y.origin+geometry.y.lon*lon+geometry.y.lat*lat+geometry.y.cross*lon*lat}};
const geoPoint=(x,y)=>{const gx=geometry.x,gy=geometry.y,linearDet=gx.lon*gy.lat-gx.lat*gy.lon,px=x-gx.origin,py=y-gy.origin;let lon=(px*gy.lat-gx.lat*py)/linearDet,lat=(gx.lon*py-px*gy.lon)/linearDet;for(let iteration=0;iteration<7;iteration+=1){const residualX=gx.origin+gx.lon*lon+gx.lat*lat+gx.cross*lon*lat-x,residualY=gy.origin+gy.lon*lon+gy.lat*lat+gy.cross*lon*lat-y,j11=gx.lon+gx.cross*lat,j12=gx.lat+gx.cross*lon,j21=gy.lon+gy.cross*lat,j22=gy.lat+gy.cross*lon,det=j11*j22-j12*j21,lonStep=(residualX*j22-j12*residualY)/det,latStep=(j11*residualY-residualX*j21)/det;lon-=lonStep;lat-=latStep}return{longitude:lon+geometry.center.longitude,latitude:lat+geometry.center.latitude}};

// Unabhängig aus dem bereitgestellten DWD-Referenzbild abgelesene Zentren der
// sichtbaren weißen Stadtanker. 0,012 entsprechen dort rund zehn Bildpixeln.
const cityAnchors=[
 {name:'Kiel',latitude:54.3233,longitude:10.1228,x:.514495,y:.174939},
 {name:'Rostock',latitude:54.0924,longitude:12.0991,x:.604451,y:.189202},
 {name:'Hamburg',latitude:53.5511,longitude:9.9937,x:.512403,y:.238421},
 {name:'Bremen',latitude:53.0793,longitude:8.8017,x:.444533,y:.270190},
 {name:'Hannover',latitude:52.3759,longitude:9.732,x:.492219,y:.327140},
 {name:'Berlin',latitude:52.52,longitude:13.405,x:.683353,y:.311587},
 {name:'Magdeburg',latitude:52.1205,longitude:11.6276,x:.588631,y:.351462},
 {name:'Leipzig',latitude:51.3397,longitude:12.3731,x:.632129,y:.417070},
 {name:'Dresden',latitude:51.0504,longitude:13.7373,x:.703182,y:.435783},
 {name:'Düsseldorf',latitude:51.2277,longitude:6.7735,x:.341854,y:.417913},
 {name:'Köln',latitude:50.9375,longitude:6.9603,x:.337020,y:.439936},
 {name:'Frankfurt',latitude:50.1109,longitude:8.6821,x:.435793,y:.513549},
 {name:'Erfurt',latitude:50.9848,longitude:11.0299,x:.560094,y:.442386},
 {name:'Saarbrücken',latitude:49.2402,longitude:6.9969,x:.337340,y:.585693},
 {name:'Nürnberg',latitude:49.4521,longitude:11.0767,x:.566756,y:.574352},
 {name:'Stuttgart',latitude:48.7758,longitude:9.1829,x:.463475,y:.627361},
 {name:'München',latitude:48.1351,longitude:11.582,x:.596683,y:.677819}
];
let squaredError=0;
for(const anchor of cityAnchors){const point=imagePoint(anchor.latitude,anchor.longitude),error=Math.hypot(point.x-anchor.x,point.y-anchor.y);squaredError+=error*error;assert.ok(error<=.012,`${anchor.name}: Marker liegt außerhalb der tolerierten DWD-Stadtankerlage (${error.toFixed(5)}).`);const inverse=geoPoint(point.x,point.y);assert.ok(Math.abs(inverse.latitude-anchor.latitude)<1e-6&&Math.abs(inverse.longitude-anchor.longitude)<1e-6,`${anchor.name}: inverse Originalpixel-Rückrechnung ist nicht stabil.`)}
assert.ok(Math.sqrt(squaredError/cityAnchors.length)<.006,'Mittlerer Fehler der deutschlandweiten Stadtankerkalibrierung ist zu groß.');
for(const edge of [{name:'Flensburg',latitude:54.7937,longitude:9.4469},{name:'Aachen',latitude:50.7753,longitude:6.0839},{name:'Görlitz',latitude:51.1527,longitude:14.9872},{name:'Freiburg',latitude:47.999,longitude:7.8421},{name:'Passau',latitude:48.5667,longitude:13.4319}]){const point=imagePoint(edge.latitude,edge.longitude);assert.ok(point.x>0&&point.x<1&&point.y>0&&point.y<1,`${edge.name}: deutscher Randort fällt aus dem DWD-Originalbild.`)}
assert.ok(radar.includes("if(code&&code!=='DE'&&code!=='DEU'"),'Explizit ausländische Favoriten müssen vom deutschen Ortsausschnitt ausgeschlossen bleiben.');

const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),testPath='scripts/test-dwd-location-crop-original-pixels-097611.mjs';
const versionAtLeast=(value,minimum)=>{const a=String(value).split('.').map(Number),b=String(minimum).split('.').map(Number),n=Math.max(a.length,b.length);for(let i=0;i<n;i++){const av=a[i]||0,bv=b[i]||0;if(av!==bv)return av>bv}return true};
assert.ok(versionAtLeast(pkg.version,'0.9.76.11'),'Releaseversion muss den Ortsausschnitt-Meilenstein ausweisen.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline- und Paketversion weichen ab.');
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles','requiredTests','protectedFiles'])assert.ok(baseline[key]?.includes(testPath),`${key} schützt den neuen DWD-Ortsausschnitttest nicht.`);
assert.ok(baseline.implementationProof?.includes('MID_IMPLEMENTATION_0.9.76.11.md'),'Umsetzungsnachweis fehlt in der Baseline.');
assert.ok(implementation.includes('Kein manueller Worker-Upload erforderlich'),'Worker-Entscheidung fehlt im Umsetzungsnachweis.');
assert.ok(implementation.includes('17 sichtbaren DWD-Stadtankern'),'Deutschlandweite Mehrortprüfung fehlt im Umsetzungsnachweis.');
console.log('DWD-Ortsausschnitt: 17 Stadtanker plus fünf deutsche Randorte, fester Originallegendeneinsatz und inverse Originalpixel-Auswertung geprüft.');
