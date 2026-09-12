import {readFile} from 'node:fs/promises';

const [radar,app,styles]=await Promise.all([
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const lucideImport=radar.match(/import\s*\{([^}]+)\}\s*from ['"]lucide-react['"]/s)?.[1]||'';
if(!/\bRadioTower\b/.test(lucideImport))failures.push('RadioTower fehlt im lucide-react-Import.');
if((radar.match(/<RadioTower\b/g)||[]).length<2)failures.push('Die beiden Radar-Ladehinweise verwenden RadioTower nicht mehr.');
for(const token of [
 "label:'Luftdruck'",
 "value:`${formatDecimalFixed(pressure,1)} hPa`",
 'className="pressure-tendency compact"',
 "sourceFor(['pressure'],qffStationPressure,'Best Match')",
 "fieldSourceInfo([{label:'Luftdruck',fields:['pressure']}])"
]) if(!app.includes(token))failures.push(`Luftdruckkarten-Vertrag fehlt: ${token}`);
for(const token of ['.pressure-tendency.compact','.metrics .pressure-tendency']){
 if(!styles.includes(token))failures.push(`Luftdruckkarten-Styling fehlt: ${token}`);
}
if(app.includes('Best Match · pressure_msl'))failures.push('Technische API-Feldbezeichnung pressure_msl ist wieder in der sichtbaren Luftdruckquelle enthalten.');
if(app.includes("value:`${Math.round(pressure)} hPa`"))failures.push('Luftdruck wird wieder ganzzahlig statt mit einer Nachkommastelle dargestellt.');
if(failures.length){console.error('Build-/Luftdruckkarten-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('RadioTower und Luftdruckkarte geprüft: kompakter Wert; QFF/Quelle bleiben hinter (i) erhalten.');
