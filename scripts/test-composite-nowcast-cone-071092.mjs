import {readFile} from 'node:fs/promises';
const [radar,styles]=await Promise.all([
  readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
need(radar,'function resolvedKonradTrack(cell:Konrad3dCell)','Auflösung der amtlichen KONRAD3D-Prognosepunkte fehlt.');
need(radar,'function konradForecastCorridor(','Zusammenhängender 1σ-Prognosekorridor fehlt.');
need(radar,'<Polygon positions={corridor as any}','1σ-Prognosekorridor wird nicht gezeichnet.');
need(radar,"className:'konrad-probability-corridor'",'Prognosekorridor besitzt kein eigenes Styling.');
need(radar,"className:'konrad-uncertainty-ellipse'",'Amtliche Unsicherheitsellipsen werden nicht gezeichnet.');
need(radar,'<CircleMarker center={[point.latitude,point.longitude]}','Prognose-Zeitpunkte der Zellzugbahn fehlen.');
need(radar,'Zellprognose','Zellprognose-Text im Overlay/Popup fehlt.');
need(radar,'1σ-Unsicherheitskorridor','Legendeneintrag für den 1σ-Korridor fehlt.');
need(radar,'<Pane name="mid-nowcast-objects"','Nowcast-Objekte liegen nicht in einem eigenen Overlay-Pane.');
need(styles,'.konrad-cone-sample','Legendenstil für den Prognosekorridor fehlt.');
need(styles,'.konrad-probability-corridor','Sichtbarkeitsstil für den Prognosekorridor fehlt.');
need(styles,'.konrad-forecast-node','Sichtbarkeitsstil für Prognosepunkte fehlt.');
if(failures.length){console.error('K3D-/NowCastMIX-Prognosekorridor-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('K3D-/NowCastMIX-Zellfläche, amtliche Prognosepunkte, 1σ-Korridor und Overlay-Legende sind geprüft.');
