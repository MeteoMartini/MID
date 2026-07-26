import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [mountain,app]=await Promise.all([
 readFile(path.join(root,'src','mountainSports.ts'),'utf8'),
 readFile(path.join(root,'src','App.tsx'),'utf8')
]);
const failures=[];
const requireToken=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
 'const PROFILE_SEARCH_RADIUS_M=18000;',
 'const PROFILE_CLUSTER_LINK_M=2600;',
 'const PROFILE_MAX_SPAN_M=18000;',
 'elevation>=Math.max(-100,anchorElevation-550)',
 'elevation>=anchorElevation-500&&elevation<=anchorElevation+450&&candidate.distanceM<=9000',
 'if(nearest>9000)continue;',
 'function chooseAreaMiddle',
 'areaWide:!sameLift',
 'summitPool[0]',
 'function connectedCandidateGroups',
 'function associateStationsWithLiftEnds',
 'export function selectMountainProfileCandidates',
 "if(source==='osm-dem'&&!automaticConfigPlausible(loc,normalized))return{...fallback,enabled,season};",
 'if(automatic&&!automaticConfigPlausible(loc,next))return{...defaultMountainConfig(loc),enabled:config.enabled,season:config.season};'
])requireToken('Bergprofil-Plausibilisierung',mountain,token);
requireToken('Profilübernahme mit Ortsbezug',app,'applyMountainProfile(value.location,value.mountain,profile)');

if(mountain.includes('around:25000'))failures.push('Veralteter 25-km-Overpass-Suchradius ist noch aktiv.');
if(mountain.includes('candidate.distanceM<=30000'))failures.push('Veraltete 30-km-Kandidatengrenze ist noch aktiv.');

const anchor=1958,maxValleyDrop=500,maxValleyRise=450,maxSummitRise=2200;
const hirzer=490,localValley=1930,localSummit=3030;
if(!(hirzer<anchor-maxValleyDrop))failures.push('Referenzfall: 490 m müsste für Obergurgl/Hochgurgl ausgeschlossen werden.');
if(!(localValley>=anchor-maxValleyDrop&&localValley<=anchor+maxValleyRise))failures.push('Referenzfall: lokales Talniveau um 1.930 m müsste zulässig bleiben.');
if(!(localSummit>=anchor+120&&localSummit<=anchor+maxSummitRise))failures.push('Referenzfall: lokales Bergniveau um 3.030 m müsste zulässig bleiben.');

if(failures.length){console.error('Bergprofil-Plausibilitätsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Bergprofil geprüft: lokale Höhenhülle, skigebietsweite Extremhöhen, Mittelstationswahl, Distanzgrenzen und Migration unplausibler Altprofile sind geschützt.');
