import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

function read(path){return readFileSync(new URL(`../${path}`,import.meta.url),'utf8')}
function requireText(source,text,label){if(!source.includes(text))throw new Error(`${label}: ${JSON.stringify(text)} fehlt`)}
function forbidText(source,text,label){if(source.includes(text))throw new Error(`${label}: veralteter Inhalt ${JSON.stringify(text)} noch vorhanden`)}

const shortTerm=read('src/ShortTermForecast.tsx');
requireText(shortTerm,'export function plausibilizeShortTermThermals','Kurzfrist-Plausibilisierung');
requireText(shortTerm,'Math.abs(deviation)<.65','Kurzfrist-Ausreißerschwelle');
requireText(shortTerm,'quietThermalNeighbourhood(result,index)','meteorologisches Ruhefenster');
requireText(shortTerm,'current.thermalPlausibilityAdjusted=true','Transparenzkennzeichen');
requireText(shortTerm,'return plausibilizeShortTermThermals(points)','Plausibilisierung im produktiven Datenpfad');
requireText(shortTerm,'Verlauf plausibilisiert','sichtbare Kennzeichnung');

const app=read('src/App.tsx');
const temperatureTone=read('src/temperatureTone.ts');
const cockpit=read('src/ForecastCockpit.tsx');
requireText(temperatureTone,'export function hourlyTemperatureTone','zentrale stündliche Temperaturfarblogik');
requireText(temperatureTone,"var(--param-temperature-min)",'Tmin-Farbfamilie');
requireText(temperatureTone,"var(--param-temperature-max)",'Tmax-Farbfamilie');
requireText(cockpit,"import {dailyTemperatureAnomalyLabel,dailyTemperatureTone,hourlyTemperatureTone} from './temperatureTone'",'Cockpit nutzt zentrale Temperaturfarblogik');
requireText(app,"detailResolution==='1h'&&!compactDetailExpanded",'zentriertes 1h-Fenster');
requireText(app,"compactDetailCanExpand=detailResolution==='1h'",'Mehr-anzeigen nur im 1h-Raster');
requireText(app,'queueRequestedClockHour(d.date,clockHourInZone(timezone,nowTick))','Sprung zur aktuellen Ortsstunde');
requireText(app,'requestedClockSelectionRef=useRef<{date:string;hour:number}|null>(null)','stundenweiser Tageswechsel bleibt auf der Zieluhrzeit');
requireText(app,'data-weather-label={weatherLabel}','Wettertext als Overlayinhalt');
requireText(app,'size={52}','vergrößertes Stundenpiktogramm');
requireText(app,'Mehr anzeigen','vollständiger Tag auf Anforderung');
requireText(app,'thunderInfo.detailGroups?.length','gruppierte Gewitterdetails');
forbidText(app,'<small>{weatherLabel}</small>','sichtbarer redundanter Wettertext');

const styles=read('src/styles.css');
requireText(styles,'.forecast-inline-detail-weather::after','Hover-/Fokus-Overlay');
requireText(styles,'.thunder-detail-groups','strukturierte Gewitterdetails');
requireText(styles,'.thunder-fact.rotation','Mesozyklonen-Ton');

const weather=read('src/weather.ts');
for(const field of ['maxReflectivityDbz','echoTopKm','vilKgM2','maxHailSizeCm','mesocycloneDetected','mesocycloneObservedAt','mesocycloneDiameterEquivalentKm','mesocycloneShearMax','mesocycloneVelocityRotationalGroundMs','tornadoProbabilityPercent','muCapeJkg','windShear06Ms'])requireText(weather,field,`Gewitterdatenvertrag ${field}`);

const thunder=read('src/thunderstorm.ts');
for(const group of ['Zugbahn & Standort','Radar & Zelle','Gefahrenmerkmale','Mesozyklone','Atmosphäre (NWP)','Quelle & Aktualität'])requireText(thunder,group,`Gewitterdetailgruppe ${group}`);
requireText(thunder,'keine direkte Wahrscheinlichkeit im gelieferten Produkt','keine erfundene Tornadowahrscheinlichkeit');
requireText(thunder,"const labels=['gering','mäßig','markant','stark','sehr stark']",'MCD-Stufen 1 bis 5');
requireText(thunder,'Tiefe der Rotationssäule','Mesozyklonen-Höhenauswertung');
requireText(thunder,'Bodennahes Rotationsmaximum','Mesozyklonen-Profidaten');
forbidText(thunder,"'20 %'",'keine hartcodierte Tornadowahrscheinlichkeit');

const worker=read('worker/metar-proxy.js');
requireText(worker,'DWD_MESOCYCLONE_ROOTS','amtliches Mesozyklonenprodukt');
requireText(worker,'attachMesocyclones','Zuordnung Mesozyklone zu KONRAD3D-Zelle');
for(const tag of ['<(?:(?:\\w+):)?event','nowcast-parameters','mesocyclone_shear_mean','mesocyclone_momentum_max','mesocyclone_velocity_rotational_max_closest_to_ground'])requireText(worker,tag,`amtliches MCD-XML ${tag}`);
for(const field of ['maxReflectivityDbz','echoTopKm','vilKgM2','maxHailSizeCm','mesocycloneDetected','mesocycloneObservedAt','mesocycloneDiameterEquivalentKm','mesocycloneShearMax','mesocycloneVelocityRotationalGroundMs','muCapeJkg','windShear06Ms'])requireText(worker,field,`Worker-Feld ${field}`);

const mcdTemp=mkdtempSync(join(tmpdir(),'mid-mcd-'));
try{
 const workerModule=join(mcdTemp,'worker.mjs');writeFileSync(workerModule,`${worker}
export {parseMesocycloneDetections};
`);
 const {parseMesocycloneDetections}=await import(`${pathToFileURL(workerModule).href}?${Date.now()}`),mcdXml=`<?xml version="1.0"?><nowcast-data><event ID="7"><time time-coordinate="UTC">2026-08-04T11:20:34</time><location><area><ellipse><moving-point><latitude>50.80</latitude><longitude>7.10</longitude><polar_motion><speed units="km/h">49.0</speed></polar_motion></moving-point><major_axis units="km">6.0</major_axis><orientation units="degrees true">225</orientation></ellipse></area></location><nowcast-parameters><mesocyclone_shear_mean>5.95</mesocyclone_shear_mean><mesocyclone_shear_max>6.96</mesocyclone_shear_max><mesocyclone_momentum_mean>42.6</mesocyclone_momentum_mean><mesocyclone_momentum_max>50.77</mesocyclone_momentum_max><mesocyclone_diameter>6</mesocyclone_diameter><mesocyclone_diameter_equivalent>4.13</mesocyclone_diameter_equivalent><mesocyclone_top>5.28</mesocyclone_top><mesocyclone_base>2.53</mesocyclone_base><mesocyclone_echotop>8.81</mesocyclone_echotop><mesocyclone_vil>19.58</mesocyclone_vil><mesocyclone_shear_vectors>5</mesocyclone_shear_vectors><mesocyclone_shear_features>1</mesocyclone_shear_features><mean_dbz>47.12</mean_dbz><max_dbz>58.9</max_dbz><mesocyclone_velocity_max>10.7</mesocyclone_velocity_max><mesocyclone_velocity_rotational_max>9.4</mesocyclone_velocity_rotational_max><mesocyclone_velocity_rotational_mean>7.96</mesocyclone_velocity_rotational_mean><mesocyclone_velocity_rotational_max_closest_to_ground>9.4</mesocyclone_velocity_rotational_max_closest_to_ground><meso_intensity>2</meso_intensity></nowcast-parameters></event></nowcast-data>`,rows=parseMesocycloneDetections(mcdXml),row=rows[0];
 if(rows.length!==1||row.id!=='7'||row.level!==2||row.bottom!==2.53||row.top!==5.28||row.diameterEquivalent!==4.13||row.shearMax!==6.96||row.rotationalVelocityGround!==9.4||row.motionSpeedKmh!==49||row.orientationDeg!==225)throw new Error(`MCD-Ereignisparser unvollständig: ${JSON.stringify(row)}`);
 if(row.tornado!==undefined)throw new Error('MCD-Ereignisparser hat eine Tornadowahrscheinlichkeit erfunden.');
}finally{rmSync(mcdTemp,{recursive:true,force:true})}

const changelog=read('CHANGELOG.md'),readme=read('README.md');
requireText(changelog,'## 0.9.15.0','Releaseeintrag');
requireText(changelog,'Synoptic Data','Stationsanbieter bleibt dokumentiert');
for(const retired of ['professionelle MID-Synoptik','Interaktive Synoptik','Synoptik bewertet','Neues professionelles Synoptik-Modul','Routenwetter bleibt als optionale','Cross Section: Wetter-Abtastung','Neuer Bereich im Erweiterten Modus: „Flugmeteorologie“'])forbidText(changelog,retired,'bereinigte Release-Historie');
forbidText(readme,'MID-Synoptik','bereinigte README-Historie');

console.log('MID v0.9.15.0: Kurzfrist-Plausibilisierung, Stundenübersicht, Gewitterdetails und Changelog-Bereinigung geprüft.');
