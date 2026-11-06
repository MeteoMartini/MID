import {precipitationTypeSymbolSvg,type PrecipitationSymbolPhase} from './precipitationTypeSymbols';
/**
 * Original MID schematic glyphs based on WMO No. 306 table 4677 semantics.
 * Model-code interpretation ONLY: not SYNOP station observations or official WMO artwork.
 * All unknown/corrupt codes produce no glyph; no temperature/radar-created ww codes.
 */
export type ModelPrecipGroup='drizzle'|'rain'|'rain-shower'|'freezing'|'mixed'|'snow'|'snow-shower'|'snow-grains'|'snow-crystals'|'ice-pellets'|'pellets-hail'|'hail'|'thunder'|'thunder-hail';
export type ModelPrecipGlyph={ww:number;group:ModelPrecipGroup;severity:1|2|3;label:string;sourceClass:'model-weather-code';shower:boolean};
type Row=readonly [ModelPrecipGroup,1|2|3,string];
const INDEX:Readonly<Record<number,Row>>={
 51:['drizzle',1,'leichter Sprühregen'],53:['drizzle',2,'mäßiger Sprühregen'],55:['drizzle',3,'starker Sprühregen'],
 56:['freezing',1,'leichter gefrierender Sprühregen'],57:['freezing',3,'mäßiger/starker gefrierender Sprühregen'],
 61:['rain',1,'leichter Regen'],63:['rain',2,'mäßiger Regen'],65:['rain',3,'starker Regen'],
 66:['freezing',1,'leichter gefrierender Regen'],67:['freezing',3,'mäßiger/starker gefrierender Regen'],
 68:['mixed',1,'leichter Regen mit Schnee'],69:['mixed',3,'mäßiger/starker Regen mit Schnee'],
 71:['snow',1,'leichter Schnee'],73:['snow',2,'mäßiger Schnee'],75:['snow',3,'starker Schnee'],
 77:['snow-grains',1,'Schneegriesel'],78:['snow-crystals',1,'einzelne Schneekristalle'],79:['ice-pellets',2,'Eiskörner'],
 80:['rain-shower',1,'leichte Regenschauer'],81:['rain-shower',2,'mäßige/starke Regenschauer'],82:['rain-shower',3,'heftige Regenschauer'],
 83:['mixed',1,'leichte Regen- und Schneeschauer'],84:['mixed',3,'mäßige/starke Regen- und Schneeschauer'],
 85:['snow-shower',1,'leichte Schneeschauer'],86:['snow-shower',3,'mäßige/starke Schneeschauer'],
 87:['pellets-hail',1,'Graupel oder kleiner Hagel'],88:['pellets-hail',3,'mäßiger/starker Graupel oder kleiner Hagel'],
 89:['hail',1,'leichter Hagelschauer'],90:['hail',3,'mäßiger/starker Hagelschauer'],
 95:['thunder',2,'Gewitter ohne Hagel'],96:['thunder-hail',2,'Gewitter mit Hagel/kleinem Hagel/Graupel'],
 97:['thunder',3,'starkes Gewitter ohne Hagel'],99:['thunder-hail',3,'starkes Gewitter mit Hagel/kleinem Hagel/Graupel']
};
const showers=new Set([80,81,82,83,84,85,86,87,88,89,90]);
export function verifiedModelPrecipGlyph(raw:unknown):ModelPrecipGlyph|null{
 if(typeof raw!=='number'||!Number.isInteger(raw))return null;
 const row=INDEX[raw];if(!row)return null;
 return {ww:raw,group:row[0],severity:row[1],label:row[2],sourceClass:'model-weather-code',shower:showers.has(raw)};
}
const solidGroups=new Set<ModelPrecipGroup>(['freezing','mixed','snow','snow-shower','snow-grains','snow-crystals','ice-pellets','pellets-hail','hail','thunder-hail']);
export function solidOrMixedModelGlyph(glyph:ModelPrecipGlyph){return solidGroups.has(glyph.group)}
/** Shared opaque phase plates; never infer a solid phase from thunder alone. */
export function modelPrecipGlyphSvg(glyph:ModelPrecipGlyph,size=30):string{
 if(!Number.isInteger(size)||size<20||size>48)throw new Error('Invalid map symbol target size');
 if(!solidOrMixedModelGlyph(glyph))return '';
 const phase:PrecipitationSymbolPhase=glyph.group==='mixed'?'mixed':glyph.group==='freezing'?'freezing':glyph.group==='snow-grains'?'snow-grains':glyph.group==='snow-crystals'?'snow-stars':glyph.group==='ice-pellets'?'ice-pellets':glyph.group==='pellets-hail'?'graupel-hail':glyph.group==='hail'||glyph.group==='thunder-hail'?'hail':'snow';
 return precipitationTypeSymbolSvg(phase,glyph.ww).replace('aria-hidden="true"',`role="img" aria-label="Modellcode ww ${glyph.ww}: ${glyph.label}"`).replace('width="100%" height="100%"',`width="${size}" height="${size}"`);
}
export type ModelGrid={lats:readonly number[];lons:readonly number[];weather:readonly(number|null)[]};
export type Pixel={x:number;y:number};
export type MapGlyph={lat:number;lon:number;pixel:Pixel;glyph:ModelPrecipGlyph};
/** Sparse markers on a real model-code grid; never interpolate or infer codes. */
export function sparseModelWeatherGlyphs(grid:ModelGrid,project:(lat:number,lon:number)=>Pixel,viewport:{width:number;height:number},options:{max?:number;minDistancePx?:number;hideRainIfRadar?:boolean}={}):MapGlyph[]{
 const rows=grid.lats.length,cols=grid.lons.length,max=Math.min(90,Math.max(1,options.max??64)),spacing=Math.max(44,options.minDistancePx??76);
 if(rows<2||cols<2||rows*cols!==grid.weather.length||rows*cols>6_000_000||!Number.isFinite(viewport.width)||!Number.isFinite(viewport.height)||viewport.width<=0||viewport.height<=0)return[];
 const stride=Math.max(1,Math.floor(Math.sqrt(rows*cols/4500))),candidates:MapGlyph[]=[];
 const risk=(o:MapGlyph)=>((o.glyph.group==='thunder-hail'||o.glyph.group==='hail')?6:o.glyph.group==='thunder'?5:o.glyph.group==='freezing'?4:o.glyph.group==='mixed'||o.glyph.group==='pellets-hail'?3:o.glyph.group==='snow'||o.glyph.group==='snow-shower'||o.glyph.group==='snow-crystals'?2:1)*10+o.glyph.severity;
 // Every ORIGINAL code in each aggregation block is inspected, not just the
 // upper-left sample. A one-cell severe event must never disappear because
 // its pixel happened not to land on a stride boundary. Block winner is the
 // highest hazard (no weather-code averaging/smoothing or interpolation).
 for(let row=0;row<rows;row+=stride)for(let col=0;col<cols;col+=stride){
  let winner:{row:number;col:number;glyph:ModelPrecipGlyph;priority:number}|null=null;
  for(let r=row;r<Math.min(rows,row+stride);r++)for(let c=col;c<Math.min(cols,col+stride);c++){
   const glyph=verifiedModelPrecipGlyph(grid.weather[r*cols+c]);if(!glyph||!solidOrMixedModelGlyph(glyph))continue;
   if(options.hideRainIfRadar&&['rain','drizzle','rain-shower'].includes(glyph.group))continue;
   const priority=((glyph.group==='thunder-hail'||glyph.group==='hail')?6:glyph.group==='thunder'?5:glyph.group==='freezing'?4:glyph.group==='mixed'||glyph.group==='pellets-hail'?3:glyph.group==='snow'||glyph.group==='snow-shower'||glyph.group==='snow-crystals'?2:1)*10+glyph.severity;
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

/** Same verified representative code in the UI and vector/raster export legends. */
export function modelWeatherLegendGlyph(codes:readonly number[]){return codes.map(verifiedModelPrecipGlyph).find((glyph):glyph is ModelPrecipGlyph=>glyph!==null&&solidOrMixedModelGlyph(glyph))??null}
