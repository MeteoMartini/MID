import {readFile} from 'node:fs/promises';

const [radar,ensemble,styles,pkg]=await Promise.all([
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8').then(JSON.parse)
]);
const failures=[];
for(const token of [
 'function useDeviceHeading()',
 'webkitCompassHeading',
 'requestPermission',
 'function locationHeadingIcon',
 'radar-location-bearing',
 'Blickrichtung',
 'Standortsymbol antippen, um die Blickrichtung zu aktivieren.',
 '<Marker position={[lat,lon]} icon={headingIcon}'
])if(!radar.includes(token))failures.push(`Blickrichtungsmarker fehlt: ${token}`);
for(const token of [
 "import {toBlob} from 'html-to-image';",
 "import {MID_VERSION} from './version';",
 'function EnsembleShareButton',
 'navigator.share',
 'navigator.canShare',
 'ensemble-exporting',
 'MID · Meteorological Information Dashboard',
 '<b>Quellen:</b>',
 '<b>Modellstände:</b>',
 'kind="temperature"',
 'kind="precipitation"',
 'targetRef={temperatureExportRef}',
 'targetRef={rainExportRef}'
])if(!ensemble.includes(token))failures.push(`Ensemble-Teilen fehlt: ${token}`);
for(const token of ['.radar-location-marker','.radar-location-bearing','.ensemble-share-button','.ensemble-export-header','.ensemble-export-footer'])if(!styles.includes(token))failures.push(`Styling fehlt: ${token}`);
if(!pkg.dependencies?.['html-to-image'])failures.push('html-to-image-Abhängigkeit fehlt.');
if((ensemble.match(/<EnsembleShareButton/g)||[]).length!==2)failures.push('Es müssen genau zwei sichtbare Ensemble-Teilen-Buttons vorhanden sein.');
if(failures.length){console.error('Kartenrichtung/Ensemble-Export fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Kartenrichtung und Ensemble-Export geprüft: Kompassmarker, iOS-Berechtigung, zwei PNG-Teilen-Buttons, MID- und Quellenblock vorhanden.');
