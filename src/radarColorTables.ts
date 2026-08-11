export type RadarColorTableId='dwd-standard'|'dwd-starkregen';
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
  detail:'universelle Niederschlagsintensität',
  wmsStyle:'',
  rateStops:[
   {value:.1,color:'#d9f3ff'},{value:.5,color:'#72c9ff'},{value:1,color:'#2f91e3'},{value:2.5,color:'#43c879'},
   {value:5,color:'#f0d447'},{value:10,color:'#f59b3d'},{value:20,color:'#e34b4b'},{value:50,color:'#b83fc8'}
  ]
 },
 {
  id:'dwd-starkregen',
  label:'DWD Starkregen',
  detail:'stärkere Hervorhebung hoher Intensitäten',
  wmsStyle:'Starkregen',
  rateStops:[
   {value:.1,color:'#e7f4ff'},{value:.5,color:'#9dd7ff'},{value:1,color:'#5bb5f5'},{value:2.5,color:'#48c77b'},
   {value:5,color:'#e9d13d'},{value:10,color:'#ff9d2e'},{value:20,color:'#f14d35'},{value:50,color:'#9d1cb4'}
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
 const hex=color.replace('#',''),r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16),alpha=rate<.5?155:rate<1?190:rate<2.5?214:rate<5?226:rate<10?238:rate<20?242:rate<50?246:249;
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
