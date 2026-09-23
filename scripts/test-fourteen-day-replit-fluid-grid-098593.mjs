import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [cockpit,layout,main]=await Promise.all([
 read('src/ForecastCockpit.tsx'),
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
need('14d zeigt vollständige Serie',fourteen,'{series.map(item=>');
reject('14d darf nicht auf sieben Tage gekürzt werden',fourteen,'series.slice(0,7)');

need('Replit-CSS zuletzt geladen',main,"import './midC18FourteenReplitFluidGrid.css';");
assert.ok(main.indexOf("import './midC18FourteenReplitFluidGrid.css';")>main.indexOf("import './midC18I7ResponsiveFixes.css';"),'14d-CSS muss als letzte Prognosekorrektur geladen werden.');

need('Vertikale Tagesliste',layout,"grid-template-columns:minmax(0,1fr)!important");
need('Keine horizontale Kartenreihe',layout,'grid-auto-flow:row!important');
need('Kompakter Tageskopf',layout,'grid-template-areas:"heading temps confidence"!important');
need('Kompakte Metazeile',fourteen,'cockpit-fourteen-compact-meta');
need('Niederschlag direkt in Metazeile',fourteen,'className="precipitation"');
need('Wind/Böen direkt in Metazeile',fourteen,'className={`wind warning-');
need('Konfidenz bleibt im Tageskopf',fourteen,'<CockpitConsistencyPill');
need('Genau eine Skybar im 14d-Rendering',fourteen,'data-mid-skybar="fourteen-row"');
assert.equal((fourteen.match(/data-mid-skybar="fourteen-row"/g)||[]).length,1,'14d darf nur einen Skybar-Renderer je Tageszeile definieren.');
reject('Keine zweite Detail-Skybar',fourteen,'cockpit-fourteen-detail-skybar');
reject('Keine 24h-Doppelskybar',fourteen,'Skybar · 24 Einzelstunden');
reject('Keine interaktive Doppel-Skybar',fourteen,'setSelectedDetailHour');
reject('Kein separater Sonnenscheinblock im Default',fourteen,'cockpit-fourteen-sunshine');
reject('Keine separate Temperaturspur im Default',fourteen,'cockpit-fourteen-temp-track');
reject('Keine separate Regime-Pille im Default',fourteen,'cockpit-fourteen-regime');

need('Details starten geschlossen',fourteen,"const [expandedDate,setExpandedDate]=useState<string|null>(null)");
need('Details werden nur per Tap umgeschaltet',fourteen,"setExpandedDate(current=>current===item.date?null:item.date)");
reject('Global selectedDate darf Details nicht automatisch öffnen',fourteen,"isActive=selected?.date===item.date");
need('Inline-Details nur sekundär',fourteen,'Sonnenscheindauer');
need('Inline-Details mit Temperaturabweichung',fourteen,'Temperaturabweichung');
need('Inline-Details mit Prognosekonfidenz',fourteen,'Prognosekonfidenz');
need('Kompaktes Inline-Detail',fourteen,'mid-forecast-row-detail compact');
need('Detail ohne zweite Skybar',layout,'keine zweite Skybar');
need('Smartphone bleibt vertikal',layout,'@media(max-width:720px)');
need('Smartphone kompakter Header',layout,'grid-template-areas:');
need('Schmale Geräte ohne Überlauf',layout,'@media(max-width:390px)');
need('Light/Dark über Theme-Variablen',layout,'var(--text)');
reject('Kein fixer Light-Hintergrund',layout,'background:#fff');
reject('Kein fixer Dark-Hintergrund',layout,'background:#000');

console.log('MID 18.2.9: 14 Tage als kompakte vertikale Tagesliste mit genau einer Skybar, Primärwerten im Default und sekundären Inline-Details geprüft.');
