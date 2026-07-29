import {readFile} from 'node:fs/promises';

const [cross,worker,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/CrossSectionPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
 '17 · schnell',
 '25 · ausgewogen',
 '33 · detailliert',
 '41 · hoch',
 '49 · maximal',
 'Das Geländeprofil wird separat und deutlich höher aufgelöst berechnet.',
 'terrainSampleCount??data.terrainProfile?.length??data.points.length'
])need('Cross-Section-UI',cross,token);
for(const token of [
 "const OPEN_METEO_ELEVATION='https://api.open-meteo.com/v1/elevation';",
 'function flightRouteGeometry(airports){',
 'function flightRoutePointAtDistance(airports,segmentKm,totalDistanceKm,targetKm){',
 'async function flightTerrainProfile(airports,route){',
 'Math.max(181,Math.min(361',
 'const [weatherResponse,terrainProfile]=await Promise.all([',
 "weatherSampleCount:route.points.length",
 "terrainSampleCount:terrainProfile.length"
])need('Worker-Terrain',worker,token);
need('Package-Test',pkg,'test:flight-cross-section-terrain');
need('Baseline-Test',baseline,'scripts/test-flight-cross-section-terrain-08182.mjs');
if(failures.length){console.error('Cross-Section-Terrain-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Cross-Section-Terrain geprüft: unabhängiges Elevation-Profil, erhöhte Wetterstützpunkte und Terrain-Metadaten vorhanden.');
