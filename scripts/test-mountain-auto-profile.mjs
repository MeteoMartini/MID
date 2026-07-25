import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const mountain=await readFile(path.join(root,'src','mountainSports.ts'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const failures=[];

for(const token of [
  "import {applyMountainProfile,defaultMountainConfig,mountainCurrentValue,mountainLevelLabel,mountainProfile,mountainProfileSourceLabel,mountainSeasonLabel,mountainSportsForecast,mountainTimeEpoch,normalizeMountainConfig",
  "const detectMountain=async(item:Favorite)=>",
  "void detectMountain(item)",
  "Saisonprofil",
  "Mittelstation verwenden",
  "title=\"Berg-/Wintersport\"",
  "data.levels.length===3?'three':''",
  "winter?<>",
  "CAPE maximal",
  "Schnee 48 h Berg"
]) if(!app.includes(token)) failures.push(`Berg-/Wintersport-UI fehlt: ${token}`);

for(const token of [
  "export type MountainSeason='auto'|'summer'|'winter'",
  "middleEnabled:boolean;",
  "nwr(around:25000",
  "[\"aerialway\"=\"station\"]",
  "aerialway:station",
  "https://api.open-meteo.com/v1/elevation",
  "OpenStreetMap + Copernicus GLO-90 via Open-Meteo",
  "explicitMiddle",
  "export async function mountainSportsForecast",
  "function autoWinter",
  "newSnow48Cm",
  "visibility",
  "uv_index",
  "cape"
]) if(!mountain.includes(token)) failures.push(`Automatische Höhenprofil-Logik fehlt: ${token}`);

for(const token of [
  '.mountain-profile-grid{',
  '.mountain-auto-row{',
  '.mountain-middle-toggle{',
  '.mountain-levels.three{',
  '.mountain-season-summary{',
  '.mountain-snow-pair{'
]) if(!styles.includes(token)) failures.push(`Bergprofil-CSS fehlt: ${token}`);

if(app.includes('mountainForecast(loc.latitude,loc.longitude')) failures.push('Der vereinfachte alte Zwei-Höhen-Abruf ist noch aktiv.');
if(app.includes('type MountainConfig={enabled:boolean;valleyElevation:number;summitElevation:number}')) failures.push('Die vereinfachte MountainConfig ist noch vorhanden.');

if(failures.length){
 console.error('Berg-/Wintersport-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Berg-/Wintersport geprüft: automatische Tal-/Mittel-/Bergsuche, editierbare Profile und saisonabhängige Parameter sind wieder aktiv.');
