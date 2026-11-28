/** Export from the SAME admitted native overview scene, not from a new
 * provider request. Full-grid export, not a viewport screenshot.
 * Labels are collision filtered for the fixed document dimensions.
 */
import type {NativeOverviewPresentation,OverviewPlace} from './nativeOverviewPresentation';
import {nativeOverviewAt} from './nativeOverviewPresentation';
import {nativeMapScale} from './nativeModelFields';
import {mapScaleSvg} from './modelMapColorScale';
import {mercatorY} from './precipitationTotals';
import {compactPrecipitationAmount} from './forecastAmountFormat';
import {modelMapValue} from './modelMapUnits';
const xml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
export function nativeOverviewSvg(scene:NativeOverviewPresentation,places:readonly OverviewPlace[]){
 const {frame,pressure,locations,variant}=scene;
 const raster=scene.mapFrame.raster?.url??'';
 if(!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(raster))throw Error('Overview-Export: Raster fehlt oder ist nicht zugelassen.');
 const west=frame.cloud.lons[0],east=frame.cloud.lons[frame.width-1],south=mercatorY(frame.cloud.lats[0]),north=mercatorY(frame.cloud.lats[frame.height-1]);
 const x=(lon:number)=>40+(lon-west)/(east-west)*710,y=(lat:number)=>175+(north-mercatorY(lat))/(north-south)*730;
 const date=(v:string)=>new Date(v).toISOString().slice(0,16).replace('T',' ')+' UTC';
 const title=variant==='winter-overview'?'Winter Overview':'Overview';
 const legendY=Math.max(970,270+places.length*64),height=legendY+190;
 // Match the existing adaptive pressure contour convention for a full-grid
 // document (5 hPa); all admitted original geometry remains in the scene.
 const paths=pressure.data.features.filter(f=>f.properties.level%5===0).map(f=>`<path d="${f.geometry.coordinates.map(([lon,lat],i)=>`${i?'L':'M'}${x(lon).toFixed(1)},${y(lat).toFixed(1)}`).join(' ')}"${f.properties.level<1013?' stroke-dasharray="3 2"':''}/>`).join('');
 const occupied:{x:number;y:number;w:number}[]=[];
 const labels=locations.features.flatMap(f=>{
  const [lon,lat]=f.geometry.coordinates,px=x(lon),py=y(lat),label=f.properties.label;
  const w=Math.min(250,Math.max(28,label.length*7));
  if(px-w/2<40||px+w/2>750||py<190||py>890||occupied.some(o=>Math.abs(o.x-px)<(o.w+w)/2+7&&Math.abs(o.y-py)<20))return [];
  occupied.push({x:px,y:py,w});
  return [`<text x="${px.toFixed(1)}" y="${py.toFixed(1)}" text-anchor="middle" fill="#182d43" stroke="white" stroke-width="3" paint-order="stroke" font-size="12">${xml(label)}</text>`];
 }).join('');
 const rows=places.map((p,i)=>{
  const v=nativeOverviewAt(frame,p.latitude,p.longitude),yy=230+i*64;
  return `<text x="775" y="${yy}" font-size="15" font-weight="bold">${xml(p.name.slice(0,38))}</text><text x="775" y="${yy+21}" font-size="13">${v?xml(modelMapValue('temperature',v.temperature,'°C','kn')+' °C · '+compactPrecipitationAmount(v.precipitation)+' mm/1 h · '+Math.round(v.pressure)+' hPa · '+Math.round(v.cloud)+' %'):'– · Keine gemeinsame Rasterabdeckung'}</text><text x="775" y="${yy+41}" font-size="12">${v?xml('WW '+v.weatherCode+' · '+(v.endpointWeather?.label??'unbekannt')):''}</text>`;
 }).join('');
 const scale=nativeMapScale(frame.precipitation,'absolute');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}"><rect width="1200" height="${height}" fill="#08131f"/><g fill="#e5eff8" font-family="Arial,sans-serif"><text x="40" y="46" font-size="28" font-weight="bold">MID · ${title}</text><text x="40" y="77" font-size="16">ICON-D2 · Lauf ${date(frame.run)} · gültig ${date(frame.time)}</text><text x="40" y="105" font-size="14">Niederschlagsintervall ${date(frame.intervalStart)} – ${date(frame.time)} · WW am Modelltermin</text><text x="40" y="130" font-size="14">Wolken: grau · Niederschlagsmenge: Farbskala · Isobaren: 5 hPa · Temperatur: °C</text><rect x="40" y="175" width="710" height="730" fill="#112434"/><image style="image-rendering:pixelated" href="${raster}" x="40" y="175" width="710" height="730" preserveAspectRatio="none"/><g fill="none" stroke="#fff" stroke-width="2.6">${paths}</g><g fill="none" stroke="#20384d" stroke-width="1">${paths}</g>${labels}<text x="775" y="198" font-size="19" font-weight="bold">ORTSWERTE</text>${rows}${mapScaleSvg(scale,v=>compactPrecipitationAmount(v),'mm/1 h',40,legendY,710)}<text x="40" y="${height-70}" font-size="13">${xml(scene.weatherLabel)} · ausgelassene Isobarensegmente: ${pressure.omittedSegments}</text><text x="40" y="${height-45}" font-size="13">Vollständiger Modellraster-Ausschnitt · keine Messung, keine amtliche Warnung</text><text x="40" y="${height-22}" font-size="12">${xml(scene.sourceLabel)}</text></g></svg>`;
}
