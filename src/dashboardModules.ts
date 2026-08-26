export type DashboardModuleId=
 |'current'
 |'ventilation'
 |'mountain'
 |'water'
 |'warnings'
 |'extreme-outlook'
 |'short-term'
 |'forecast'
 |'composite'
 |'ensemble'
 |'long-range'
 |'forecast-verification'
 |'travel-planner'
 |'event-planner'
 |'flight-meteorology'
 |'weather-maps'
 |'widget';

export type DashboardModuleDefinition={
 id:DashboardModuleId;
 label:string;
 description:string;
 advancedOnly?:boolean;
 conditional?:string;
};

export type DashboardModuleSettings={
 order:DashboardModuleId[];
 enabled:Record<DashboardModuleId,boolean>;
 updatedAt?:string;
};

export const DASHBOARD_MODULE_SETTINGS_KEY='mid:dashboard-modules:v1';

export const DASHBOARD_MODULE_DEFINITIONS:DashboardModuleDefinition[]=[
 {id:'current',label:'Aktuelles Wetter',description:'Aktuelle Werte und Messwertkacheln'},
 {id:'ventilation',label:'Lüftungsassistent',description:'Innenraumsensoren und prognosegestützte Lüftungsfenster'},
 {id:'mountain',label:'Berg- und Wintersport',description:'Höhenprofil und Bergwetter',conditional:'nur bei aktivem Favoritenprofil'},
 {id:'water',label:'Wassersport',description:'Wasserwetter, Gezeiten und Bedingungen',conditional:'nur bei aktivem Favoritenprofil'},
 {id:'warnings',label:'Warnungen und Gefahren',description:'Eigene Warnindikatoren und amtliche Warnungen'},
 {id:'extreme-outlook',label:'Extremwetter-Ausblick',description:'Eigene probabilistische DACH-Prognose für Gewitter, Regen, Sturm, Schnee und Eisregen'},
 {id:'short-term',label:'Kurzfristvorhersage',description:'15-Minuten-Schritte und Stundenverlauf bis +24 h'},
 {id:'forecast',label:'7-Tage-Vorhersage',description:'Tagesübersicht und Tagesdetails'},
 {id:'composite',label:'Kompositbild',description:'Radar, Satellit und aktuelle Beobachtungen'},
 {id:'ensemble',label:'14-Tage-Ensemble',description:'Unsicherheit und mögliche Entwicklung'},
 {id:'long-range',label:'Langfrist',description:'Monatliche Temperatur- und Niederschlagsanomalien im saisonalen Modellvergleich'},
 {id:'forecast-verification',label:'Prognosegüte und Rückblick',description:'Vorhersagekontrolle und lokale Modellgüte',advancedOnly:true},
 {id:'travel-planner',label:'Reiseplaner',description:'Reisewetter, Klimatologie und Reisezeitfenster'},
 {id:'event-planner',label:'Eventplaner',description:'Termine und Aktivitäten mit Wettercheck, Tipps und Modellupdates'},
 {id:'flight-meteorology',label:'Flugmeteorologie',description:'Meteogramme und Flugwetterwerkzeuge',advancedOnly:true},
 {id:'weather-maps',label:'Wetterkarten',description:'DWD Modell-, Höhen- und Signifikanzkarten mit Zeitschritten',advancedOnly:true},
 {id:'widget',label:'Widget- und PNG-Generator',description:'Konfigurierbare Exportansicht',advancedOnly:true}
];

export const DEFAULT_DASHBOARD_MODULE_ORDER:DashboardModuleId[]=DASHBOARD_MODULE_DEFINITIONS.map(item=>item.id);

function defaultEnabled(){return Object.fromEntries(DEFAULT_DASHBOARD_MODULE_ORDER.map(id=>[id,id==='weather-maps'?false:true])) as Record<DashboardModuleId,boolean>}

export function defaultDashboardModuleSettings():DashboardModuleSettings{return{order:[...DEFAULT_DASHBOARD_MODULE_ORDER],enabled:defaultEnabled()}}

function isModuleId(value:unknown):value is DashboardModuleId{return typeof value==='string'&&DEFAULT_DASHBOARD_MODULE_ORDER.includes(value as DashboardModuleId)}

export function normalizeDashboardModuleSettings(value:unknown):DashboardModuleSettings{
 const defaults=defaultDashboardModuleSettings(),raw=value&&typeof value==='object'?value as Partial<DashboardModuleSettings>:{};
 const seen=new Set<DashboardModuleId>(),order:DashboardModuleId[]=[];
 for(const id of Array.isArray(raw.order)?raw.order:[]){if(isModuleId(id)&&!seen.has(id)){seen.add(id);order.push(id)}}
 for(const id of DEFAULT_DASHBOARD_MODULE_ORDER)if(!seen.has(id))order.push(id);
 const enabled={...defaults.enabled};
 if(raw.enabled&&typeof raw.enabled==='object')for(const id of DEFAULT_DASHBOARD_MODULE_ORDER){const current=(raw.enabled as Partial<Record<DashboardModuleId,unknown>>)[id];if(typeof current==='boolean')enabled[id]=current}
 const updatedAt=typeof raw.updatedAt==='string'&&Number.isFinite(Date.parse(raw.updatedAt))?raw.updatedAt:undefined;
 return{order,enabled,...(updatedAt?{updatedAt}:{})};
}

export function readDashboardModuleSettings():DashboardModuleSettings{
 try{
  const raw=JSON.parse(localStorage.getItem(DASHBOARD_MODULE_SETTINGS_KEY)||'{}') as Partial<DashboardModuleSettings>,normalized=normalizeDashboardModuleSettings(raw),rawOrder=Array.isArray(raw.order)?raw.order:[],rawEnabled=raw.enabled&&typeof raw.enabled==='object'?raw.enabled:{};
  const migrated=!normalized.updatedAt||normalized.order.length!==rawOrder.length||normalized.order.some((id,index)=>id!==rawOrder[index])||DEFAULT_DASHBOARD_MODULE_ORDER.some(id=>typeof (rawEnabled as Partial<Record<DashboardModuleId,unknown>>)[id]!=='boolean');
  return migrated?writeDashboardModuleSettings(normalized):normalized;
 }catch{return writeDashboardModuleSettings(defaultDashboardModuleSettings())}
}

export function writeDashboardModuleSettings(settings:DashboardModuleSettings){
 const normalized=normalizeDashboardModuleSettings(settings),previous=Date.parse(normalized.updatedAt||''),now=Date.now(),updatedAt=new Date(Number.isFinite(previous)&&previous>=now?previous+1:now).toISOString(),saved={...normalized,updatedAt};
 try{localStorage.setItem(DASHBOARD_MODULE_SETTINGS_KEY,JSON.stringify(saved))}catch{}
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('mid:dashboard-modules',{detail:saved}));
 return saved;
}

export function moveDashboardModule(settings:DashboardModuleSettings,source:DashboardModuleId,target:DashboardModuleId){
 if(source===target)return settings;
 const order=[...settings.order],from=order.indexOf(source),to=order.indexOf(target);
 if(from<0||to<0)return settings;
 const[item]=order.splice(from,1);order.splice(to,0,item);
 return{...settings,order};
}
