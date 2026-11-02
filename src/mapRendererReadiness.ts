/** Independent rendering truth: source data may be ready while WebGL is unavailable. */
export type MapRendererStatus='loading'|'ready'|'error';
export type MapReadiness={tone:'ready'|'loading'|'unavailable';label:string;detail:string};
export function mapRendererReadiness(dataReady:boolean,hasTimes:boolean,renderer:MapRendererStatus):MapReadiness{
 if(renderer==='error')return{tone:'unavailable',label:'Karte nicht darstellbar',detail:hasTimes?'Kartendaten können vorhanden sein, aber WebGL/Kartenrenderer ist ausgefallen.':'Kartenrenderer ist ausgefallen; Verfügbarkeit der Kartendaten getrennt prüfen.'};
 if(renderer!=='ready')return{tone:'loading',label:dataReady?'Daten bereit · Karte startet':'Kartenrenderer startet',detail:'Die Darstellung wird vorbereitet. Ein vorhandener Datensatz beweist noch keine gerenderte Karte.'};
 if(!hasTimes)return{tone:'unavailable',label:'Keine Kartenzeitstände',detail:'Der Renderer ist verfügbar, aber die Quelle bietet keine geprüften Kartenzeitstände.'};
 if(!dataReady)return{tone:'loading',label:'Kartenebene lädt',detail:'Der Renderer ist aktiv; die gewählte Kartenebene wird noch geprüft.'};
 return{tone:'ready',label:'Karte und Daten bereit',detail:'Kartenrenderer aktiv und gewählte Hauptebene geladen.'};
}
