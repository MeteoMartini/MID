import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [cockpit,skybar,layout,main]=await Promise.all([
 read('src/ForecastCockpit.tsx'),
 read('src/SkyBarSegments.tsx'),
 read('src/midC18FourteenReplitFluidGrid.css'),
 read('src/main.tsx')
]);

const need=(name,text,token)=>assert.ok(text.includes(token),name+': '+token);
const reject=(name,text,token)=>assert.ok(!text.includes(token),name+': '+token);

const start=cockpit.indexOf('function FourteenDayHorizon');
const end=cockpit.indexOf('function MiniRibbon',start);
assert.ok(start>=0&&end>start,'FourteenDayHorizon fehlt.');
const fourteen=cockpit.slice(start,end);

need('14d kein Horizontal-Scroll',fourteen,'data-cockpit-horizontal-scroll="false"');
reject('14d alter Horizontal-Scroll entfernt',fourteen,'data-cockpit-horizontal-scroll="true"');
need('14d zeigt die vollständige Serie',fourteen,'{series.map(item=>');
reject('14d darf im Hauptgrid nicht auf sieben Tage gekürzt werden',fourteen,'series.slice(0,7)');

need('Replit-CSS zuletzt geladen',main,"import './midC18FourteenReplitFluidGrid.css';");
assert.ok(main.indexOf("import './midC18FourteenReplitFluidGrid.css';")>main.indexOf("import './midC18I7ResponsiveFixes.css';"),'Replit-14d-CSS muss nach dem alten I.7-Horizontalscroll geladen werden.');

need('14 Tage bleiben eine vertikale Liste',layout,"grid-template-columns:minmax(0,1fr)!important");
need('Desktop vier interne Spalten',layout,'grid-template-columns:repeat(4,minmax(0,1fr))!important');
need('Tablet zwei interne Spalten',layout,'grid-template-columns:repeat(2,minmax(0,1fr))!important');
need('Smartphone eine interne Spalte',layout,'grid-template-columns:minmax(0,1fr)!important');
need('Smartphone ohne Karten-Snap',layout,'scroll-snap-align:none!important');
need('Text darf nicht zeichenweise brechen',layout,'word-break:normal!important');
need('Keine starre Karten-Mindestbreite',layout,'min-width:0!important');
need('Details-Steuerung sichtbar',fourteen,"cockpit-fourteen-inline-cue");
need('Sonnenscheindauer in Tageskarte',fourteen,"cockpit-fourteen-sunshine");
need('Wind und Böen gemeinsam',fourteen,"cockpit-fourteen-wind-meta");

need('24h Detail-Skybar vorhanden',fourteen,'Skybar · 24 Einzelstunden');
need('Lokale 00-23-Achse vorhanden',fourteen,'00–23 Lokalzeit');
need('24h Detailzellen auswählbar',fourteen,'interactive onSelectIndex=');
need('Auswahlzustand pro Datum',fourteen,'setSelectedDetailHour({date:item.date,index})');
need('Ausgewählte Wetterlage sichtbar',fourteen,'detailHourWeatherLabel');
need('Stunden-Tooltip enthält Uhrzeit',fourteen,'dayDetailCells=daySkyBarHourCells.map');
need('Skybar-Komponente unterstützt Interaktion',skybar,'interactive?:boolean');
need('Skybar-Komponente unterstützt Auswahlcallback',skybar,'onSelectIndex?:(index:number)=>void');
need('Tastatur Enter/Leertaste',skybar,"event.key==='Enter'||event.key===' '");
need('ARIA pressed für Stundenzellen',skybar,'aria-pressed={interactive?index===selectedIndex:undefined}');

need('Detail-Skybar kein Überlauf',layout,'.cockpit-fourteen-detail-skybar');
need('Light/Dark nur via Theme-Variablen',layout,'var(--text)');
reject('Kein fixer Light-Hintergrund im neuen Layout',layout,'background:#fff');
reject('Kein fixer Dark-Hintergrund im neuen Layout',layout,'background:#000');

console.log('Replit-14d-Vertrag geprüft: 14 vertikale Tageskarten; intern 1/2/4-spaltig; kein Horizontal-Scroll; interaktive 24h-Detail-Skybar.');
