import {readFile} from 'node:fs/promises';

const [cross,worker,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/CrossSectionPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const forbid=(label,text,token)=>{if(text.includes(token))failures.push(`${label}: unnötiger Altpfad vorhanden: ${token}`)};

for(const token of [
 "const SAMPLES_KEY='mid:flightCrossSection:samples';",
 "Math.max(17,Math.min(49,Number(storageGet(SAMPLES_KEY,'25'))||25))",
 '<span>Streckendichte</span>',
 '17 · schnell',
 '25 · ausgewogen',
 '33 · detailliert',
 '41 · hoch',
 '49 · maximal'
])need('Streckenbriefing-UI',cross,token);

for(const token of [
 'function flightRouteGeometry(airports){',
 'function flightRoutePointAtDistance(airports,segmentKm,totalDistanceKm,targetKm){',
 'function flightRouteSamples(airports,count){',
 'const route=flightRouteSamples(airports,samples)',
 'weatherSampleCount:route.points.length',
 'officialBriefing'
])need('Worker-Streckenbriefing',worker,token);

for(const legacy of [
 "const OPEN_METEO_ELEVATION='https://api.open-meteo.com/v1/elevation';",
 'async function flightTerrainProfile(airports,route){',
 'terrainProfile',
 'terrainSampleCount',
 'Open-Meteo Elevation HTTP'
])forbid('Separate Terrain-Pipeline',worker,legacy);

need('Package-Test',pkg,'test:flight-cross-section-terrain');
need('Baseline-Test',baseline,'scripts/test-flight-cross-section-terrain-08182.mjs');
if(failures.length){console.error('Cross-Section-Strecken-/Terrain-Vertrag fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Cross Section geprüft: Route wird wetterseitig ausreichend abgetastet; separate hochauflösende Terrain-/Grafikpipeline bleibt entfernt.');
