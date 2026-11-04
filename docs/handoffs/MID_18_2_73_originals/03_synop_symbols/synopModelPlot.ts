/**
 * Original MID schematic glyphs based on WMO No. 306 table 4677 semantics.
 * Model-code interpretation ONLY: not SYNOP station observations or official WMO artwork.
 * All unknown/corrupt codes produce no glyph; no temperature/radar-created ww codes.
 */
export type ModelPrecipGroup='drizzle'|'rain'|'rain-shower'|'freezing'|'mixed'|'snow'|'snow-shower'|'snow-grains'|'ice-pellets'|'pellets-hail'|'hail'|'thunder'|'thunder-hail';
export type ModelPrecipGlyph={ww:number;group:ModelPrecipGroup;severity:1|2|3;label:string;sourceClass:'model-weather-code';shower:boolean};
type Row=readonly [ModelPrecipGroup,1|2|3,string];
const INDEX:Readonly<Record<number,Row>>={
 51:['drizzle',1,'leichter Sprühregen'],53:['drizzle',2,'mäßiger Sprühregen'],55:['drizzle',3,'starker Sprühregen'],
 56:['freezing',1,'leichter gefrierender Sprühregen'],57:['freezing',3,'starker gefrierender Sprühregen'],
 61:['rain',1,'leichter Regen'],63:['rain',2,'mäßiger Regen'],65:['rain',3,'starker Regen'],
 66:['freezing',1,'leichter gefrierender Regen'],67:['freezing',3,'starker gefrierender Regen'],
 68:['mixed',1,'leichter Regen mit Schnee'],69:['mixed',3,'mäßiger/starker Regen mit Schnee'],
 71:['snow',1,'leichter Schnee'],73:['snow',2,'mäßiger Schnee'],75:['snow',3,'starker Schnee'],
 77:['snow-grains',1,'Schneegriesel'],78:['snow',1,'einzelne Schneekristalle'],79:['ice-pellets',2,'Eiskörner'],
 80:['rain-shower',1,'leichte Regenschauer'],81:['rain-shower',2,'mäßige/starke Regenschauer'],82:['rain-shower',3,'heftige Regenschauer'],
 83:['mixed',1,'leichte Regen- und Schneeschauer'],84:['mixed',3,'starke Regen- und Schneeschauer'],
 85:['snow-shower',1,'leichte Schneeschauer'],86:['snow-shower',3,'starke Schneeschauer'],
 87:['pellets-hail',1,'Schneekörner oder kleiner Hagel'],88:['pellets-hail',3,'starke Schneekörner/kleiner Hagel'],
 89:['hail',1,'leichter Hagelschauer'],90:['hail',3,'starker Hagelschauer'],
 95:['thunder',2,'Gewitter ohne Hagel'],96:['thunder-hail',2,'Gewitter mit Hagel'],
 97:['thunder',3,'starkes Gewitter ohne Hagel'],99:['thunder-hail',3,'starkes Gewitter mit Hagel']
};
const showers=new Set([80,81,82,83,84,85,86,87,88,89,90]);
export function verifiedModelPrecipGlyph(raw:unknown):ModelPrecipGlyph|null{
 if(typeof raw!=='number'||!Number.isInteger(raw))return null;
 const row=INDEX[raw];if(!row)return null;
 return {ww:raw,group:row[0],severity:row[1],label:row[2],sourceClass:'model-weather-code',shower:showers.has(raw)};
}
/** DOM-safe SVG fragment; no external images, font, or network requests. */
export function modelPrecipGlyphSvg(glyph:ModelPrecipGlyph,size=30):string{
 if(!Number.isInteger(size)||size<20||size>48)throw new Error('Invalid map symbol target size');
 const p=(x:number,y:number)=>`<circle cx="${x}" cy="${y}" r="1.65" fill="currentColor"/>`;
 const snow=(x:number,y:number)=>`<path d="M${x-3} ${y}h6M${x} ${y-3}v6M${x-2.1} ${y-2.1}l4.2 4.2M${x+2.1} ${y-2.1}l-4.2 4.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`;
 const comma=(x:number,y:number)=>`<path d="M${x-1} ${y-2}q5 0 2 4l-2 2" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
 const count=glyph.severity===1?1:glyph.severity===2?2:3;
 const xs=count===1?[16]:count===2?[11,21]:[8,16,24];
 let marks='';
 switch(glyph.group){
  case 'drizzle':marks=xs.map(x=>comma(x,14)).join('');break;
  case 'rain':case 'rain-shower':marks=xs.map(x=>p(x,14)).join('');break;
  case 'freezing':marks=xs.map(x=>glyph.ww<=57?comma(x,12):p(x,12)).join('')+'<path d="M11 21h10M16 17v8" stroke="currentColor" stroke-width="1.6"/>';break;
  case 'mixed':marks=xs.map((x,i)=>i%2?snow(x,15):p(x,15)).join('');if(count===1)marks+=snow(22,15);break;
  case 'snow':case 'snow-shower':marks=xs.map(x=>snow(x,15)).join('');break;
  case 'snow-grains':marks=xs.map(x=>p(x,14)).join('');break;
  case 'ice-pellets':case 'pellets-hail':marks=xs.map(x=>`<circle cx="${x}" cy="15" r="2.1" fill="none" stroke="currentColor" stroke-width="1.7"/>`).join('');break;
  case 'hail':marks=xs.map(x=>`<path d="M${x} 11l3 5h-6z" fill="currentColor"/>`).join('');break;
  case 'thunder':case 'thunder-hail':marks='<path d="M18 3l-5 9h5l-5 10 12-13h-6l3-6z" fill="none" stroke="currentColor" stroke-width="2"/>';
   if(glyph.group==='thunder-hail')marks+='<path d="M7 13l3 5H4z" fill="currentColor"/>';break;
 }
 if(glyph.shower)marks='<path d="M7 7h18l-9 7z" fill="none" stroke="currentColor" stroke-width="1.3"/>'+marks;
 // A bounded, consistent transparent-backdrop outline keeps symbol visible on bright/cloudy/dark maps.
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 28" width="${size}" height="${size}" role="img" aria-label="Modellcode ww ${glyph.ww}: ${glyph.label}"><rect x=".75" y=".75" width="30.5" height="26.5" rx="7" fill="var(--mid-plot-bg, #f9fcff)" fill-opacity=".85" stroke="var(--mid-plot-border, #536679)" stroke-opacity=".65" stroke-width="1.1"/><g color="var(--mid-plot-fg, #12273a)">${marks}</g></svg>`;
}
export type ModelGrid={lats:readonly number[];lons:readonly number[];weather:readonly(number|null)[]};
export type Pixel={x:number;y:number};
export type MapGlyph={lat:number;lon:number;pixel:Pixel;glyph:ModelPrecipGlyph};
/** Sparse markers on a real model-code grid; never interpolate or infer codes. */
export function sparseModelWeatherGlyphs(grid:ModelGrid,project:(lat:number,lon:number)=>Pixel,viewport:{width:number;height:number},options:{max?:number;minDistancePx?:number;hideRainIfRadar?:boolean}={}):MapGlyph[]{
 const rows=grid.lats.length,cols=grid.lons.length,max=Math.min(90,Math.max(1,options.max??64)),spacing=Math.max(44,options.minDistancePx??76);
 if(rows<2||cols<2||rows*cols!==grid.weather.length||rows*cols>6_000_000||!Number.isFinite(viewport.width)||!Number.isFinite(viewport.height)||viewport.width<=0||viewport.height<=0)return[];
 const stride=Math.max(1,Math.floor(Math.sqrt(rows*cols/4500))),candidates:MapGlyph[]=[];
 const risk=(o:MapGlyph)=>((o.glyph.group==='thunder-hail'||o.glyph.group==='hail')?6:o.glyph.group==='thunder'?5:o.glyph.group==='freezing'?4:o.glyph.group==='mixed'||o.glyph.group==='pellets-hail'?3:o.glyph.group==='snow'||o.glyph.group==='snow-shower'?2:1)*10+o.glyph.severity;
 // Every ORIGINAL code in each aggregation block is inspected, not just the
 // upper-left sample. A one-cell severe event must never disappear because
 // its pixel happened not to land on a stride boundary. Block winner is the
 // highest hazard (no weather-code averaging/smoothing or interpolation).
 for(let row=0;row<rows;row+=stride)for(let col=0;col<cols;col+=stride){
  let winner:{row:number;col:number;glyph:ModelPrecipGlyph;priority:number}|null=null;
  for(let r=row;r<Math.min(rows,row+stride);r++)for(let c=col;c<Math.min(cols,col+stride);c++){
   const glyph=verifiedModelPrecipGlyph(grid.weather[r*cols+c]);if(!glyph)continue;
   if(options.hideRainIfRadar&&['rain','drizzle','rain-shower'].includes(glyph.group))continue;
   const priority=((glyph.group==='thunder-hail'||glyph.group==='hail')?6:glyph.group==='thunder'?5:glyph.group==='freezing'?4:glyph.group==='mixed'||glyph.group==='pellets-hail'?3:glyph.group==='snow'||glyph.group==='snow-shower'?2:1)*10+glyph.severity;
   if(!winner||priority>winner.priority)winner={row:r,col:c,glyph,priority};
  }
  if(!winner)continue;
  const lat=grid.lats[winner.row],lon=grid.lons[winner.col];if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;
  const pixel=project(lat,lon);if(!Number.isFinite(pixel.x)||!Number.isFinite(pixel.y)||pixel.x<0||pixel.y<0||pixel.x>viewport.width||pixel.y>viewport.height)continue;
  candidates.push({lat,lon,pixel,glyph:winner.glyph});
 }
 candidates.sort((a,b)=>risk(b)-risk(a)||a.pixel.y-b.pixel.y||a.pixel.x-b.pixel.x);
 const result:MapGlyph[]=[];
 for(const cand of candidates){if(result.some(p=>Math.hypot(p.pixel.x-cand.pixel.x,p.pixel.y-cand.pixel.y)<spacing))continue;result.push(cand);if(result.length>=max)break}
 return result;
}
