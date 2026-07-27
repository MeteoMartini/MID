import {readFile} from 'node:fs/promises';
const [radar,styles]=await Promise.all([
  readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
need(radar,'function forecastConeGeometry(cell:Konrad3dCell)','Geometrie des Wahrscheinlichkeitskegels fehlt.');
need(radar,'<Polygon positions={geometry.cone as any}','Wahrscheinlichkeitskegel wird nicht gezeichnet.');
need(radar,'className:\'konrad-probability-cone\'','Wahrscheinlichkeitskegel besitzt kein eigenes Styling.');
need(radar,'<CircleMarker center={forecast as any} radius={5.5}','Prognose-Endpunkt der Zellprognose fehlt.');
need(radar,'Zellprognose','Zellprognose-Text im Overlay/Popup fehlt.');
need(radar,'Wahrscheinlichkeitskegel','Legendeneintrag für den Wahrscheinlichkeitskegel fehlt.');
need(radar,'<Pane name="mid-nowcast-objects"','Nowcast-Objekte liegen nicht in einem eigenen Overlay-Pane.');
need(styles,'.konrad-cone-sample','Legendenstil für den Wahrscheinlichkeitskegel fehlt.');
need(styles,'.konrad-probability-cone','Sichtbarkeitsstil für den Wahrscheinlichkeitskegel fehlt.');
if(failures.length){console.error('K3D-/NowCastMIX-Wahrscheinlichkeitskegel-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('K3D-/NowCastMIX-Wahrscheinlichkeitskegel, Zellprognose und Overlay-Legende sind geprüft.');
