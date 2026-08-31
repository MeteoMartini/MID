import {readFile} from 'node:fs/promises';

const paths=[
  './test-cockpit-meteogram-pro-09180.mjs',
  './test-cockpit-shortterm-interaction-09173.mjs',
  './test-cockpit-shortterm-premium-09172.mjs'
];
const scripts=await Promise.all(paths.map(path=>readFile(new URL(path,import.meta.url),'utf8')));
const [pkgText,baselineText,cockpit,styles]=await Promise.all([
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'),
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

scripts.forEach((script,index)=>{
  need(paths[index],script,'packageVersion!==baselineVersion');
});
for(const token of [
  '24-h-Wetterprofil',
  'const chartSourcePoints=profileDisplayPoints.length?profileDisplayPoints:hourlyPoints.slice(0,25)',
  'chartWidth=Math.max(320,chartViewportWidth)',
  'className="cockpit-meteogram-pro__datafield"',
  'className="cockpit-weather-profile__signals"'
])need('ForecastCockpit',cockpit,token);
for(const token of [
  '.cockpit-meteogram-pro__stage{width:100%;max-width:100%;overflow:visible',
  '.cockpit-meteogram-pro__canvas{position:relative;width:100%;min-width:0;max-width:100%;',
  '.cockpit-weather-profile__signals{'
])need('Styles',styles,token);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText);
if(pkg.version!==baseline.releaseVersion)failures.push(`Versionsabweichung: ${pkg.version} / ${baseline.releaseVersion}`);
if(failures.length){
  console.error('Cockpit-Regressionsynchronisierung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Cockpit-Regressionsynchronisierung auf das responsive 24-h-Wetterprofil geprüft.');
