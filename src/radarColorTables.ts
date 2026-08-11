export type RadarColorTableId='dwd-standard'|'dwd-starkregen'|'nexrad-classic'|'eccc-14'|'eumetnet-spectrum';
export type RadarPhase='rain'|'mixed'|'snow'|'freezing'|'uncertain';
export type RadarIntensityColorTable={
 id:RadarColorTableId;
 label:string;
 detail:string;
 wmsStyle:string;
 rateStops:{value:number;color:string}[];
};

export const DEFAULT_RADAR_COLOR_TABLE:RadarColorTableId='dwd-standard';
export const RADAR_COLOR_TABLES:RadarIntensityColorTable[]=[
 {
  id:'dwd-standard',
  label:'DWD Standard',
  detail:'klassische universelle DWD-Anmutung für Niederschlagsintensität',
  wmsStyle:'',
  rateStops:[
   {value:.1,color:'#dff3ff'},{value:.3,color:'#9bd6ff'},{value:.6,color:'#57b1f2'},{value:1,color:'#2f8ae0'},
   {value:2.5,color:'#34c36d'},{value:5,color:'#dfd34a'},{value:10,color:'#f2a03a'},{value:20,color:'#df533b'},{value:50,color:'#b23fc3'}
  ]
 },
 {
  id:'dwd-starkregen',
  label:'DWD Starkregen',
  detail:'offizieller DWD-WMS-Stil mit stärkerem Fokus auf hohe Intensitäten',
  wmsStyle:'Starkregen',
  rateStops:[
   {value:.1,color:'#edf7ff'},{value:.3,color:'#b7e0ff'},{value:.6,color:'#73bef8'},{value:1,color:'#4aa3eb'},
   {value:2.5,color:'#4bc679'},{value:5,color:'#ead03f'},{value:10,color:'#ff9d2f'},{value:20,color:'#f24d37'},{value:50,color:'#9f20b4'}
  ]
 },
 {
  id:'nexrad-classic',
  label:'NEXRAD Classic',
  detail:'klassische NOAA-/NEXRAD-Reflektivitätsanmutung in kräftigen Kontraststufen',
  wmsStyle:'',
  rateStops:[
   {value:.1,color:'#0ea7ff'},{value:.3,color:'#27d7ff'},{value:.6,color:'#00c36e'},{value:1,color:'#00a14b'},
   {value:2.5,color:'#c9dc33'},{value:5,color:'#ffd64a'},{value:10,color:'#ff992d'},{value:20,color:'#eb4a3a'},{value:50,color:'#d01db0'}
  ]
 },
 {
  id:'eccc-14',
  label:'Canada 14-stufig',
  detail:'an die 14-Farben-Radarlegende von Environment Canada angelehnte Staffelung',
  wmsStyle:'',
  rateStops:[
   {value:.1,color:'#d8f4ff'},{value:.2,color:'#a6e6ff'},{value:.35,color:'#6fd3ff'},{value:.5,color:'#36bbff'},
   {value:.8,color:'#1f9fe8'},{value:1.2,color:'#20c06a'},{value:2,color:'#69d84f'},{value:3,color:'#b6dc3f'},
   {value:5,color:'#f1d94d'},{value:8,color:'#f5b543'},{value:12,color:'#f58a3b'},{value:20,color:'#ef5f3d'},{value:35,color:'#d73653'},{value:50,color:'#8b3fd0'}
  ]
 },
 {
  id:'eumetnet-spectrum',
  label:'Europa Spektrum',
  detail:'ruhigere europäische Blau‑Gelb‑Rot-Skala mit guter Differenzierung schwacher Echos',
  wmsStyle:'',
  rateStops:[
   {value:.1,color:'#dff7ff'},{value:.25,color:'#9de7ff'},{value:.5,color:'#59c8ff'},{value:1,color:'#3f9bf0'},
   {value:2,color:'#5fc85b'},{value:4,color:'#b7d746'},{value:7,color:'#efca45'},{value:12,color:'#ef9442'},{value:20,color:'#e05b44'},{value:35,color:'#c43b6d'},{value:50,color:'#7f4acb'}
  ]
 }
];
const TABLE_INDEX=new Map<RadarColorTableId,RadarIntensityColorTable>(RADAR_COLOR_TABLES.map(item=>[item.id,item]));

export function radarColorTable(id:string|undefined|null){return TABLE_INDEX.get((id||DEFAULT_RADAR_COLOR_TABLE) as RadarColorTableId)||TABLE_INDEX.get(DEFAULT_RADAR_COLOR_TABLE)!}
export function radarColorPreview(id:string|undefined|null){const table=radarColorTable(id),last=Math.max(1,table.rateStops.length-1);return `linear-gradient(90deg, ${table.rateStops.map((item,index)=>`${item.color} ${Math.round(index/last*100)}%`).join(', ')})`}
export function radarRateColor(rate:number,id:string|undefined|null):[number,number,number,number]{
 if(!Number.isFinite(rate)||rate<.08)return[0,0,0,0];
 const table=radarColorTable(id),stops=table.rateStops;let color=stops[0].color;
 for(const stop of stops){if(rate>=stop.value)color=stop.color;else break}
 const hex=color.replace('#',''),r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16),alpha=rate<.3?145:rate<.6?168:rate<1?188:rate<2.5?208:rate<5?224:rate<10?236:rate<20?243:rate<50?247:250;
 return[r,g,b,alpha];
}
export function radarDbzColor(dbz:number,id:string|undefined|null):[number,number,number,number]{
 if(!Number.isFinite(dbz)||dbz<5)return[0,0,0,0];
 const rate=Math.pow(Math.max(0,Math.pow(10,dbz/10)/200),1/1.6);
 return radarRateColor(rate,id);
}


export const RADAR_COLOR_TABLE_STORAGE_KEY='mid:radar-color-table:v1';
export const RADAR_COLOR_TABLE_EVENT='mid:radar-color-table-change';
export function readRadarColorTableSetting():RadarColorTableId{try{return radarColorTable(localStorage.getItem(RADAR_COLOR_TABLE_STORAGE_KEY)).id}catch{return DEFAULT_RADAR_COLOR_TABLE}}
export function writeRadarColorTableSetting(id:RadarColorTableId){const value=radarColorTable(id).id;try{localStorage.setItem(RADAR_COLOR_TABLE_STORAGE_KEY,value)}catch{};if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent(RADAR_COLOR_TABLE_EVENT,{detail:value}));return value}

// Feste klassische Niederschlagsart-Palette: bewusst nicht benutzerumschaltbar.
export const PRECIPITATION_TYPE_COLORS={
 rain:'#21b65b',
 mixed:'#d45ac6',
 snow:'#4d9fff',
 freezing:'#ef4b43',
 uncertain:'#7f8794'
} as const;
export const PRECIPITATION_TYPE_LEGEND=[
 {phase:'rain',label:'Regen',color:PRECIPITATION_TYPE_COLORS.rain},
 {phase:'mixed',label:'Mischphase / Schneeregen',color:PRECIPITATION_TYPE_COLORS.mixed},
 {phase:'snow',label:'Schnee',color:PRECIPITATION_TYPE_COLORS.snow},
 {phase:'freezing',label:'gefrierender Niederschlag',color:PRECIPITATION_TYPE_COLORS.freezing}
] as const;
