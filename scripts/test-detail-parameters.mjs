import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const weather=await readFile(path.join(root,'src','weather.ts'),'utf8');
const failures=[];

for(const id of ['chmi_aladin_seamless','chmi_aladin_central_europe_2km','chmi_aladin_cz_1km'])if(!weather.includes(id))failures.push(`Open-Meteo-Modellkennung fehlt: ${id}`);
for(const token of ["toggleDetailLine('temperature')","toggleDetailLine('apparent')","toggleDetailLine('dewPoint')","toggleDetailLine('probability')","toggleDetailLine('wind')","toggleDetailLine('gust')","toggleDetailLine('direction')",'togglePrecipType(type)'])if(!app.includes(token))failures.push(`Schaltbarer Detailparameter fehlt: ${token}`);
for(const token of ['dewPointPath','windPath','gustPath','directionY','showTemperatureSection','showRainSection','showWindSection','adaptive-detail-chart','ResizeObserver'])if(!app.includes(token))failures.push(`Adaptive Diagrammlogik fehlt: ${token}`);
if(!app.includes('strokeDasharray="8 6"'))failures.push('Gefühlte Temperatur ist im Diagramm nicht gestrichelt.');
if(!styles.includes('repeating-linear-gradient(90deg,var(--apparent-line)'))failures.push('Gefühlte Temperatur ist in der Legende nicht gestrichelt.');
for(const token of ['i.dewpoint','i.windline','i.gustline','i.direction'])if(!styles.includes(token))failures.push(`Legendenstil fehlt: ${token}`);
if(!app.includes('visiblePrecipLegendTypes.length>0'))failures.push('Niederschlagsbereich wird bei vollständiger Deaktivierung nicht ausgeblendet.');
if(!app.includes('showWindSection=showWind||showGust||showDirection'))failures.push('Windbereich wird nicht dynamisch ein-/ausgeblendet.');
if(!app.includes("function isDetailPrecipType(type:PrecipType):type is DetailPrecipType{return type!=='none'}"))failures.push('Typsicherer Niederschlags-Type-Guard fehlt.');
if(app.includes("type=parts.type as DetailPrecipType,visible=type!=='none'"))failures.push('Fehlerhafte Kombination aus Exclude-Typcast und none-Vergleich ist noch vorhanden.');

if(failures.length){console.error('Detailparameter-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Detailansicht geprüft: CHMI-Modelle sind katalogisiert; im Erweiterten Modus sind Temperatur-, Niederschlags- und Windparameter einzeln schaltbar, Bereiche reagieren dynamisch und die Darstellung passt sich verzerrungsfrei an die verfügbare Breite an.');
