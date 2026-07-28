import {readFile} from 'node:fs/promises';
const [engine,panel,styles]=await Promise.all([
 readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastVerificationPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
need(engine,'function adaptiveWeightCap(','Adaptive, vertrauensabhängige Gewichtsobergrenze fehlt.');
need(engine,'globalDays<6?48:globalDays<12?52:globalDays<18?56:globalDays<36?60:62','Datenmengenabhängige Grundstaffel der Obergrenze fehlt.');
need(engine,'validation.samples<6','Kontrollgruppen-Freigabe der Gewichtsobergrenze fehlt.');
need(engine,'clamp(Math.round(max),48,65)','Adaptive Obergrenze ist nicht sicher auf 48–65 % begrenzt.');
need(engine,'parameterWeightCap(','Parameterbezogene Vertrauensgrenze fehlt.');
if(engine.includes('max=58'))failures.push('Die alte starre 58-%-Standardgrenze ist noch aktiv.');
need(engine,"const PROFILE_INFERENCE_VERSION=2",'Versionierte Standortableitung fehlt.');
need(engine,"https://api.open-meteo.com/v1/elevation",'DEM-Höhenumfeld wird nicht für den Standortfingerabdruck abgerufen.');
need(engine,'function metadataTerrain(','POI-/Ortsmetadaten werden nicht für die Vorauswahl ausgewertet.');
need(engine,'function pointAtDistance(','Mehrpunkt-Höhenprofil im Umfeld fehlt.');
need(engine,'DEM-Relief im 10-km-Umfeld','Nachvollziehbare DEM-Begründung fehlt.');
need(engine,'export async function refreshTwinSiteProfileInference','Automatische, persistente Neuberechnung des Fingerabdrucks fehlt.');
need(panel,'refreshTwinSiteProfileInference(locationKey,location,controller.signal,false)','Standortfingerabdruck wird nicht automatisch verfeinert.');
need(panel,'Automatik wiederherstellen','Editierbare Vorauswahl kann nicht auf die Automatik zurückgesetzt werden.');
need(panel,'weather-twin-site-reasons','Begründungen der automatischen Vorauswahl werden nicht angezeigt.');
need(styles,'.weather-twin-site-status','Status-/Resetgestaltung des Standortfingerabdrucks fehlt.');
need(styles,'.weather-twin-site-reasons','Gestaltung der Ableitungsgründe fehlt.');
if(failures.length){console.error('Adaptive Gewichtung/Standortfingerabdruck fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Adaptive vertrauensabhängige Modellobergrenze und editierbarer DEM-/Metadaten-Standortfingerabdruck geprüft.');
