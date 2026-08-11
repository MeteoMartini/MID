export type RadarColorTableId='dwd-standard';
export type RadarPhase='rain'|'mixed'|'snow'|'freezing'|'uncertain';
export type RadarIntensityColorTable={
 id:RadarColorTableId;
 label:string;
 detail:string;
 wmsStyle:string;
 rateStops:{value:number;color:string}[];
};

// MID verwendet wieder ausschließlich die jeweiligen Standardfarben der Radarprodukte.
// DWD-WMS: nativer Default-Stil; lokal dekodierte PX/HX-/OPERA-Raster: feste DWD-nahe Standardskala.
export const DEFAULT_RADAR_COLOR_TABLE:RadarColorTableId='dwd-standard';
export const RADAR_COLOR_TABLES:RadarIntensityColorTable[]=[{
 id:'dwd-standard',
 label:'Standardfarben',
 detail:'jeweilige Standarddarstellung des Radarprodukts',
 wmsStyle:'',
 rateStops:[
  {value:.1,color:'#dff3ff'},{value:.3,color:'#9bd6ff'},{value:.6,color:'#57b1f2'},{value:1,color:'#2f8ae0'},
  {value:2.5,color:'#34c36d'},{value:5,color:'#dfd34a'},{value:10,color:'#f2a03a'},{value:20,color:'#df533b'},{value:50,color:'#b23fc3'}
 ]
}];
const TABLE=RADAR_COLOR_TABLES[0];
export function radarColorTable(_id?:string|null){return TABLE}
export function radarColorPreview(_id?:string|null){const last=Math.max(1,TABLE.rateStops.length-1);return `linear-gradient(90deg, ${TABLE.rateStops.map((item,index)=>`${item.color} ${Math.round(index/last*100)}%`).join(', ')})`}
export function radarRateColor(rate:number,_id?:string|null):[number,number,number,number]{
 if(!Number.isFinite(rate)||rate<.08)return[0,0,0,0];let color=TABLE.rateStops[0].color;
 for(const stop of TABLE.rateStops){if(rate>=stop.value)color=stop.color;else break}
 const hex=color.replace('#',''),r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16),alpha=rate<.3?145:rate<.6?168:rate<1?188:rate<2.5?208:rate<5?224:rate<10?236:rate<20?243:rate<50?247:250;
 return[r,g,b,alpha];
}
export function radarDbzColor(dbz:number,id?:string|null):[number,number,number,number]{
 if(!Number.isFinite(dbz)||dbz<5)return[0,0,0,0];const rate=Math.pow(Math.max(0,Math.pow(10,dbz/10)/200),1/1.6);return radarRateColor(rate,id);
}

// Legacy exports bleiben absichtlich als No-op erhalten, damit ältere gespeicherte Einstellungen
// und Importpfade keine Laufzeitfehler erzeugen. Eine Auswahl gibt es in der Oberfläche nicht mehr.
export const RADAR_COLOR_TABLE_STORAGE_KEY='mid:radar-color-table:v1';
export const RADAR_COLOR_TABLE_EVENT='mid:radar-color-table-change';
export function readRadarColorTableSetting():RadarColorTableId{return DEFAULT_RADAR_COLOR_TABLE}
export function writeRadarColorTableSetting(_id:RadarColorTableId){try{localStorage.removeItem(RADAR_COLOR_TABLE_STORAGE_KEY)}catch{};return DEFAULT_RADAR_COLOR_TABLE}

export const PRECIPITATION_TYPE_COLORS={rain:'#21b65b',mixed:'#d45ac6',snow:'#4d9fff',graupel:'#7e86ff',hail:'#36a9e1',freezing:'#ef4b43',uncertain:'#7f8794'} as const;
export const PRECIPITATION_TYPE_LEGEND=[
 {phase:'mixed',label:'Mischphase / Schneeregen',color:PRECIPITATION_TYPE_COLORS.mixed,symbol:'Schneeregen'},
 {phase:'snow',label:'Schnee',color:PRECIPITATION_TYPE_COLORS.snow,symbol:'Schnee'},
 {phase:'snow-grains',label:'Schneekörner',color:PRECIPITATION_TYPE_COLORS.snow,symbol:'Schneekörner'},
 {phase:'graupel',label:'Graupel / Eiskörner',color:PRECIPITATION_TYPE_COLORS.graupel,symbol:'Graupel'},
 {phase:'hail',label:'Hagel',color:PRECIPITATION_TYPE_COLORS.hail,symbol:'Hagel'},
 {phase:'freezing',label:'gefrierender Niederschlag',color:PRECIPITATION_TYPE_COLORS.freezing,symbol:'Gefrierend'}
] as const;
