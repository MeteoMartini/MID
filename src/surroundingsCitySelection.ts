// Maps must label real settlements, not synthetic corners of a model raster.
export type SurroundingsCityCandidate={
 name:string;lat:number;lon:number;population?:number;rank?:number;
 kind?:'city'|'town'|'village';origin?:'vector'|'natural-earth';
};
export type SurroundingsCity=SurroundingsCityCandidate&{id:string;priority:number};
export type SurroundingsCityBounds={west:number;south:number;east:number;north:number};
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const mercatorY=(lat:number)=>Math.log(Math.tan(Math.PI/4+Math.max(-85,Math.min(85,lat))*Math.PI/360))*180/Math.PI;

export function chooseSurroundingsCities(
 candidates:readonly SurroundingsCityCandidate[],
 center:{lat:number;lon:number},bounds:SurroundingsCityBounds,maximum=4,viewport?:{width:number;height:number}
):SurroundingsCity[]{
 if(!finite(center.lat)||!finite(center.lon)||![bounds.west,bounds.east,bounds.south,bounds.north].every(finite)||
  bounds.east<=bounds.west||bounds.north<=bounds.south||!Number.isInteger(maximum)||maximum<1||maximum>6)return[];
 // Match MapLibre's fitBounds/Web-Mercator viewport instead of assuming a fixed 512×256 raster.
 const width=viewport?.width??512,height=viewport?.height??256;
 if(!finite(width)||!finite(height)||width<180||height<155||width>4000||height>4000)return[];
 const spanX=bounds.east-bounds.west,top=mercatorY(bounds.north),bottom=mercatorY(bounds.south),spanY=top-bottom;
 if(!finite(spanY)||spanY<=0)return[];
 const scale=Math.min((width-16)/spanX,(height-16)/spanY);
 const offsetX=(width-spanX*scale)/2,offsetY=(height-spanY*scale)/2;
 const centerX=offsetX+(center.lon-bounds.west)*scale,centerY=offsetY+(top-mercatorY(center.lat))*scale;
 const pool=candidates.flatMap(item=>{
  const name=String(item.name||'').trim(),lat=item.lat,lon=item.lon;
  if(!name||name.length>70||!finite(lat)||!finite(lon)||!finite(item.population??0)||!finite(item.rank??1))return[];
  const x=offsetX+(lon-bounds.west)*scale,y=offsetY+(top-mercatorY(lat))*scale;
  const marginX=Math.min(70,width*.25),marginY=24;
  if(x<marginX||x>width-marginX||y<marginY||y>height-marginY)return[];
  // Do not put a large city label over the selected-site marker.
  if(Math.abs(x-centerX)<58&&Math.abs(y-centerY)<18)return[];
  const dx=(lon-center.lon)*Math.cos(center.lat*Math.PI/180)*111.2,dy=(lat-center.lat)*111.2;
  if(Math.hypot(dx,dy)<6)return[]; // The selected location has its own site marker.
  const population=Math.max(0,item.population??0),rank=Math.max(1,Math.min(20,item.rank??8));
  const type=item.kind??'city';
  const importance=population>0?Math.log10(population+1):(type==='city'?5.45:type==='town'?4.8:4.1)-.055*rank;
  const priority=importance+(item.origin==='vector'?.23:0)-.003*Math.min(Math.hypot(dx,dy),150);
  return[{...item,name,id:`city:${lat.toFixed(5)}:${lon.toFixed(5)}`,priority,x,y}];
 }).sort((a,b)=>b.priority-a.priority||a.name.localeCompare(b.name,'de'));
 const chosen:typeof pool=[];
 for(const item of pool){
  if(chosen.some(other=>Math.hypot((other.lon-item.lon)*Math.cos(center.lat*Math.PI/180)*111.2,(other.lat-item.lat)*111.2)<6))continue;
  if(chosen.some(other=>Math.abs(item.x-other.x)<140&&Math.abs(item.y-other.y)<52))continue;
  chosen.push(item);
  if(chosen.length>=maximum)break;
 }
 return chosen.map(({x,y,...city})=>city);
}

/** Extract city and town coordinates from the very same visible OpenFreeMap vector tiles. */
export function citiesFromMapFeatures(features:readonly unknown[]):SurroundingsCityCandidate[]{
 const cities:SurroundingsCityCandidate[]=[],seen=new Set<string>();
 for(const item of features){
  if(!item||typeof item!=='object')continue;
  const feature=item as {geometry?:{type?:string;coordinates?:unknown};properties?:Record<string,unknown>};
  const coordinates=feature.geometry?.type==='Point'?feature.geometry.coordinates:null,p=feature.properties;
  if(!Array.isArray(coordinates)||coordinates.length<2||!finite(coordinates[0])||!finite(coordinates[1])||!p)continue;
  const kind=p.class==='city'||p.class==='town'||p.class==='village'?p.class:null;
  if(!kind)continue;
  const name=String(p['name:de']||p.name||'').trim(),lon=coordinates[0],lat=coordinates[1];
  if(!name||name.length>70)continue;
  const id=`${name.toLocaleLowerCase('de')}:${lat.toFixed(3)}:${lon.toFixed(3)}`;
  if(seen.has(id))continue;seen.add(id);
  const population=Number(p.population),rank=Number(p.rank);
  cities.push({name,lat,lon,kind,origin:'vector',...(Number.isFinite(population)&&population>0?{population}:{}),...(Number.isFinite(rank)&&rank>0?{rank}:{})});
  if(cities.length>=250)break;
 }
 return cities;
}
