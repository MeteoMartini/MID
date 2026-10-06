export type WidgetUrlView='cards'|'curve';
export type WidgetUrlDays=5|7;
export type WidgetUrlTheme='light'|'dark';
export type WidgetUrlTemperatureColors='ecmwf';

export type WidgetUrlLocation={id:number;slug:string;name:string;latitude:number;longitude:number};
export type WidgetUrlVisibility={showWind:boolean;showRain:boolean;showSunshine:boolean;showHazards:boolean};
export type WidgetUrlExportRequest={location:WidgetUrlLocation;view:WidgetUrlView;days:WidgetUrlDays;theme:WidgetUrlTheme;temperatureColors:WidgetUrlTemperatureColors}&WidgetUrlVisibility;
export type WidgetUrlProfile={view:WidgetUrlView;days:WidgetUrlDays}&WidgetUrlVisibility;

// Einzige Pflegestelle fuer feste Widget-Orte.
export const WIDGET_URL_LOCATIONS:readonly WidgetUrlLocation[]=[
 {id:980841302,slug:'kuerecik',name:'Kürecik',latitude:38.35,longitude:37.79},
 {id:980841303,slug:'malatya',name:'Malatya',latitude:38.44,longitude:38.09},
 {id:980841304,slug:'amari',name:'Ämari',latitude:59.26,longitude:24.20}
] as const;
export const WIDGET_URL_DAYS:readonly WidgetUrlDays[]=[5,7] as const;
export const WIDGET_URL_VIEWS:readonly WidgetUrlView[]=['cards','curve'] as const;
export const WIDGET_URL_THEMES:readonly WidgetUrlTheme[]=['light','dark'] as const;

// Kanonische SharePoint-/PNG-Profile: 7d Kurve mit Wind, Niederschlag und Sonne;
// 5d Kompakt nur mit Wind. ECMWF-Farben sind fuer beide verbindlich.
export const WIDGET_URL_PROFILES:readonly WidgetUrlProfile[]=[
 {view:'curve',days:7,showWind:true,showRain:true,showSunshine:true,showHazards:false},
 {view:'cards',days:5,showWind:true,showRain:false,showSunshine:false,showHazards:false}
] as const;

function normalizedView(value:string|null):WidgetUrlView|null{const key=String(value||'').trim().toLowerCase();return key==='kompakt'||key==='compact'||key==='cards'?'cards':key==='kurve'||key==='curve'?'curve':null}
function normalizedTheme(value:string|null):WidgetUrlTheme|null{const key=String(value||'light').trim().toLowerCase();return key==='light'||key==='hell'?'light':key==='dark'||key==='dunkel'?'dark':null}
function normalizedTemperatureColors(value:string|null):WidgetUrlTemperatureColors|null{const key=String(value||'ecmwf').trim().toLowerCase();return key==='ecmwf'?'ecmwf':null}
function normalizedFlag(value:string|null,fallback:boolean){if(value===null)return fallback;const key=String(value).trim().toLowerCase();if(['1','true','on','yes','ja'].includes(key))return true;if(['0','false','off','no','nein'].includes(key))return false;return fallback}
function profileDefaults(view:WidgetUrlView,days:WidgetUrlDays):WidgetUrlVisibility{
 const canonical=WIDGET_URL_PROFILES.find(item=>item.view===view&&item.days===days);
 return canonical?{showWind:canonical.showWind,showRain:canonical.showRain,showSunshine:canonical.showSunshine,showHazards:canonical.showHazards}:{showWind:true,showRain:true,showSunshine:true,showHazards:true};
}

export function readWidgetUrlExportRequest(href:string):WidgetUrlExportRequest|null{
 try{
  const url=new URL(href),slug=String(url.searchParams.get('widget')||url.searchParams.get('mid-widget')||'').trim().toLowerCase(),location=WIDGET_URL_LOCATIONS.find(item=>item.slug===slug),view=normalizedView(url.searchParams.get('ansicht')||url.searchParams.get('view')),days=Number(url.searchParams.get('tage')||url.searchParams.get('days')),theme=normalizedTheme(url.searchParams.get('design')||url.searchParams.get('theme')),temperatureColors=normalizedTemperatureColors(url.searchParams.get('farben')||url.searchParams.get('colors'));
  if(!location||!view||!WIDGET_URL_DAYS.includes(days as WidgetUrlDays)||!theme||!temperatureColors)return null;
  const typedDays=days as WidgetUrlDays,defaults=profileDefaults(view,typedDays),showWind=normalizedFlag(url.searchParams.get('wind'),defaults.showWind),showRain=normalizedFlag(url.searchParams.get('regen')??url.searchParams.get('rain'),defaults.showRain),showSunshine=normalizedFlag(url.searchParams.get('sonne')??url.searchParams.get('sunshine'),defaults.showSunshine),showHazards=normalizedFlag(url.searchParams.get('hazards'),defaults.showHazards);
  return{location,view,days:typedDays,theme,temperatureColors,showWind,showRain,showSunshine,showHazards};
 }catch{return null}
}

export function widgetUrlExportVariants(baseUrl:string,theme?:WidgetUrlTheme){
 const base=new URL(baseUrl);base.hash='';base.search='';
 const themes:readonly WidgetUrlTheme[]=theme?[theme]:WIDGET_URL_THEMES;
 return WIDGET_URL_LOCATIONS.flatMap(location=>WIDGET_URL_PROFILES.flatMap(profile=>themes.map(currentTheme=>{const url=new URL(base);url.searchParams.set('widget',location.slug);url.searchParams.set('ansicht',profile.view==='cards'?'kompakt':'kurve');url.searchParams.set('tage',String(profile.days));url.searchParams.set('design',currentTheme);url.searchParams.set('farben','ecmwf');url.searchParams.set('wind',profile.showWind?'1':'0');url.searchParams.set('regen',profile.showRain?'1':'0');url.searchParams.set('sonne',profile.showSunshine?'1':'0');url.searchParams.set('hazards',profile.showHazards?'1':'0');return{location,...profile,theme:currentTheme,temperatureColors:'ecmwf' as const,url:url.toString()}})));
}
