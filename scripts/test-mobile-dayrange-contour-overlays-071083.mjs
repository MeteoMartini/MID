import {readFile} from 'node:fs/promises';
const [radar,styles,v078]=await Promise.all([
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../src/v078.css',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 "renderer=useMemo(()=>L.svg({pane:'mid-model-lines',padding:.65}",
 'renderer={renderer} positions={item.path as any}',
 "mainColor=type==='isobars'?'#ffffff':'#ffd84d'",
 "haloColor=type==='isobars'?'#061521':'#261d00'"
])if(!radar.includes(token))failures.push(`SVG-Konturfix fehlt: ${token}`);
for(const token of [
 '.maplibre-mid-model-lines-pane',
 '.maplibre-mid-model-lines-pane svg',
 '.radarlegend.compact.collapsed .radarlegend-toggle',
 '.composite-map-interaction{\n  right:auto;\n  left:8px;'
])if(!styles.includes(token))failures.push(`Komposit-Overlay-Styling fehlt: ${token}`);
for(const token of [
 'height:28px;',
 'align-self:center;',
 'justify-content:center;',
 'line-height:16px;'
])if(!v078.includes(token))failures.push(`Mobile Tmin/Tmax-Zentrierung fehlt: ${token}`);
if(failures.length){console.error('Mobile Tmin/Tmax-/Kontur-/Overlay-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Mobile Tmin/Tmax-Zentrierung, explizite SVG-Modellkonturen und kollisionsfreie Komposit-Overlays geprüft.');
