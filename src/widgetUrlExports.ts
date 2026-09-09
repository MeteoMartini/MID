export type WidgetUrlView='cards'|'curve';
export type WidgetUrlDays=5|7;
export type WidgetUrlTheme='light'|'dark';

export type WidgetUrlLocation={id:number;slug:string;name:string;latitude:number;longitude:number};
export type WidgetUrlExportRequest={location:WidgetUrlLocation;view:WidgetUrlView;days:WidgetUrlDays;theme:WidgetUrlTheme};

// Einzige Pflegestelle fuer feste Widget-Orte. Jede Ortszeile erzeugt
// automatisch alle Kombinationen aus Ansicht und Tageszahl.
export const WIDGET_URL_LOCATIONS:readonly WidgetUrlLocation[]=[
 {id:980841301,slug:'wiesbaden',name:'Wiesbaden',latitude:50.09,longitude:8.24},
 {id:980841302,slug:'kuerecik',name:'Kürecik',latitude:38.35,longitude:37.79},
 {id:980841303,slug:'malatya',name:'Malatya',latitude:38.44,longitude:38.09}
] as const;
export const WIDGET_URL_DAYS:readonly WidgetUrlDays[]=[5,7] as const;
export const WIDGET_URL_VIEWS:readonly WidgetUrlView[]=['cards','curve'] as const;

function normalizedView(value:string|null):WidgetUrlView|null{const key=String(value||'').trim().toLowerCase();return key==='kompakt'||key==='compact'||key==='cards'?'cards':key==='kurve'||key==='curve'?'curve':null}
function normalizedTheme(value:string|null):WidgetUrlTheme|null{const key=String(value||'light').trim().toLowerCase();return key==='light'||key==='hell'?'light':key==='dark'||key==='dunkel'?'dark':null}

export function readWidgetUrlExportRequest(href:string):WidgetUrlExportRequest|null{
 try{const url=new URL(href),slug=String(url.searchParams.get('widget')||url.searchParams.get('mid-widget')||'').trim().toLowerCase(),location=WIDGET_URL_LOCATIONS.find(item=>item.slug===slug),view=normalizedView(url.searchParams.get('ansicht')||url.searchParams.get('view')),days=Number(url.searchParams.get('tage')||url.searchParams.get('days')),theme=normalizedTheme(url.searchParams.get('design')||url.searchParams.get('theme'));if(!location||!view||!WIDGET_URL_DAYS.includes(days as WidgetUrlDays)||!theme)return null;return{location,view,days:days as WidgetUrlDays,theme}}catch{return null}
}

export function widgetUrlExportVariants(baseUrl:string,theme:WidgetUrlTheme='light'){
 const base=new URL(baseUrl);base.hash='';base.search='';
 return WIDGET_URL_LOCATIONS.flatMap(location=>WIDGET_URL_VIEWS.flatMap(view=>WIDGET_URL_DAYS.map(days=>{const url=new URL(base);url.searchParams.set('widget',location.slug);url.searchParams.set('ansicht',view==='cards'?'kompakt':'kurve');url.searchParams.set('tage',String(days));url.searchParams.set('design',theme);return{location,view,days,theme,url:url.toString()}})));
}
