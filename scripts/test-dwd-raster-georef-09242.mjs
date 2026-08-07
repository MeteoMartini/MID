import {readFile} from 'node:fs/promises';
const [radar,baseline]=await Promise.all([
  readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const gridBlock=radar.match(/const DWD_SOURCE_RASTER_GRID:GridPoint\[\]=\[([\s\S]*?)\];/)?.[1]||'';
const grid=[...gridBlock.matchAll(/\{lon:([-\d.]+),lat:([-\d.]+),x:([-\d.]+),y:([-\d.]+)\}/g)].map(match=>({lon:Number(match[1]),lat:Number(match[2]),x:Number(match[3]),y:Number(match[4])}));
if(grid.length!==16)failures.push(`DWD-Quellraster enthält ${grid.length} statt 16 Schnittpunkte.`);
const parsePolynomial=name=>{const match=radar.match(new RegExp(`const ${name}:RasterPolynomial=\\{c0:([-\\d.e]+),lon:([-\\d.e]+),lat:([-\\d.e]+),lon2:([-\\d.e]+),lonLat:([-\\d.e]+),lat2:([-\\d.e]+)\\}`));return match?{c0:Number(match[1]),lon:Number(match[2]),lat:Number(match[3]),lon2:Number(match[4]),lonLat:Number(match[5]),lat2:Number(match[6])}:null};
const px=parsePolynomial('DWD_SOURCE_X'),py=parsePolynomial('DWD_SOURCE_Y');
if(!px||!py)failures.push('DWD-Quellbild-Polynomkoeffizienten nicht auslesbar.');
const evalPoly=(c,lon,lat)=>c.c0+c.lon*lon+c.lat*lat+c.lon2*lon*lon+c.lonLat*lon*lat+c.lat2*lat*lat;
const forward=(lon,lat)=>({x:evalPoly(px,lon,lat),y:evalPoly(py,lon,lat)});
if(px&&py&&grid.length===16){
 let maxResidual=0;
 for(const point of grid){const projected=forward(point.lon,point.lat);maxResidual=Math.max(maxResidual,Math.hypot(projected.x-point.x,projected.y-point.y));}
 if(maxResidual>.0005)failures.push(`Quellraster-Polynom weicht zu stark von den DWD-Schnittpunkten ab: ${maxResidual.toFixed(6)}.`);
 const anchor=forward(10,50);
 if(!(anchor.x>.465&&anchor.x<.469&&anchor.y>.622&&anchor.y<.626))failures.push(`10°E/50°N liegt nicht im Vollbild-Rasterfenster: ${anchor.x.toFixed(5)}/${anchor.y.toFixed(5)}.`);
 const xs=grid.map(point=>point.x),ys=grid.map(point=>point.y);
 if(Math.min(...xs)<.23||Math.max(...xs)>.60||Math.min(...ys)<.43||Math.max(...ys)>.72)failures.push('DWD-Rasterkoordinaten sehen nach Crop-/Viewport-Koordinaten statt Vollbildkoordinaten aus.');
}
function inverse(x,y){let longitude=10+(x-.46686)/.0532,latitude=50-(y-.62403)/.0808;for(let iteration=0;iteration<10;iteration++){const point=forward(longitude,latitude),rx=point.x-x,ry=point.y-y,dxLon=px.lon+2*px.lon2*longitude+px.lonLat*latitude,dxLat=px.lat+px.lonLat*longitude+2*px.lat2*latitude,dyLon=py.lon+2*py.lon2*longitude+py.lonLat*latitude,dyLat=py.lat+py.lonLat*longitude+2*py.lat2*latitude,det=dxLon*dyLat-dxLat*dyLon;if(Math.abs(det)<1e-10)break;const deltaLon=(rx*dyLat-ry*dxLat)/det,deltaLat=(ry*dxLon-rx*dyLon)/det;longitude-=deltaLon;latitude-=deltaLat;if(Math.max(Math.abs(deltaLon),Math.abs(deltaLat))<1e-7)break}return{longitude,latitude}}
if(px&&py){
 for(const [name,lon,lat] of [['Hamburg',9.9937,53.5511],['Hannover',9.7320,52.3759],['Berlin',13.4050,52.5200],['Köln',6.9603,50.9375],['Frankfurt',8.6821,50.1109],['München',11.5820,48.1351],['Dresden',13.7373,51.0504]]){const p=forward(lon,lat),back=inverse(p.x,p.y);if(Math.abs(back.longitude-lon)>.003||Math.abs(back.latitude-lat)>.003)failures.push(`${name}: Vorwärts-/Rücktransformation weicht ab (${back.longitude.toFixed(3)}/${back.latitude.toFixed(3)}).`)}
}
for(const token of ['ORIGINALEN 900×900-DWD-Bildes','bereits gezoomten/cropped','DWD_SOURCE_RASTER_GRID','rasterPolynomialForward','rasterPolynomialInverse'])if(!radar.includes(token))failures.push(`Schutzvertrag fehlt: ${token}`);
if(!baseline.includes('scripts/test-dwd-raster-georef-09242.mjs'))failures.push('Baseline-Test fehlt.');
if(failures.length){console.error('DWD-Gradnetz-Georeferenzierung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD-Quellbild-Gradnetz geprüft: Vollbildkoordinaten, Projektionspolynom und deutschlandweite Rücktransformation sind konsistent.');
