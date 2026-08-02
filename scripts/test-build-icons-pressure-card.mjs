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
for(const token of ['className="pressure-detail"','className="pressure-tendency"','className="pressure-source"',"value:`${formatDecimalFixed(pressure,1)} hPa`","source(qffStationPressure,'Best Match')"]){
 if(!app.includes(token))failures.push(`Luftdruckkarten-Struktur fehlt: ${token}`);
}
for(const token of ['.metrics .pressure-detail','.metrics .pressure-tendency','.metrics .pressure-source']){
 if(!styles.includes(token))failures.push(`Luftdruckkarten-Styling fehlt: ${token}`);
}
if(/pressure-tendency[^>]*>.*?<\/span>}<span>/s.test(app))failures.push('Trend und Quelle stehen wieder ohne trennenden Layout-Container nebeneinander.');
if(app.includes('Best Match · pressure_msl'))failures.push('Technische API-Feldbezeichnung pressure_msl ist wieder in der sichtbaren Luftdruckquelle enthalten.');
if(app.includes("value:`${Math.round(pressure)} hPa`"))failures.push('Luftdruck wird wieder ganzzahlig statt mit einer Nachkommastelle dargestellt.');
if(failures.length){console.error('Build-/Luftdruckkarten-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('RadioTower-Import und getrennte Luftdruckdarstellung geprüft.');
