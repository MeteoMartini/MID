import {readFile} from 'node:fs/promises';
const [app,radar,ensemble,styles]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
for(const token of ['const FIVE_MINUTES=5*60000','Radar-Nowcast mit 5-Minuten-Balken','5-Minuten-Menge','<PortalPopover anchorRef={anchorRef}','onPointerUp={event=>selectSegment(event,segment)}'])if(!app.includes(token))failures.push(`5-Minuten-Nowcast fehlt: ${token}`);
for(const forbidden of ['5–15-minütig','Die y-Achse und Balkenhöhe zeigen die Intensität','radar-nowcast-events'])if(app.includes(forbidden))failures.push(`Veralteter Nowcast-Inhalt noch vorhanden: ${forbidden}`);
for(const token of ['iconSize:[19,27]','iconAnchor:[10,18]','popupAnchor:[0,-18]'])if(!radar.includes(token))failures.push(`Halbierter Standortmarker fehlt: ${token}`);
for(const token of ['function useCompactEnsembleChart()','function professionalEnsembleLayout(','leftAxisWidth:compact?48:62','rightAxisWidth:compact?42:58','professionalEnsembleLayout(compactTrendTooltip,exporting)','professionalEnsembleLayout(compact,exporting)','professionalEnsembleLayout(compactChart,exportingKind===\'precipitation\')'])if(!ensemble.includes(token))failures.push(`Responsive Ensemble-Logik fehlt: ${token}`);
for(const token of ['.ensemble-chart-export .chart,.ensemble-chart-export .recharts-responsive-container','.radar-nowcast-strip.compact','.radar-nowcast-popover','.radar-location-marker{width:19px!important'])if(!styles.includes(token))failures.push(`Responsive CSS fehlt: ${token}`);
if(failures.length){console.error('Responsive Nowcast-/Ensemble-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Responsive Nowcast-/Ensemble-Prüfung bestanden: 5-Minuten-Balken, Portal-Tooltip, halbierter Marker und viewportgebundene Diagramme.');
