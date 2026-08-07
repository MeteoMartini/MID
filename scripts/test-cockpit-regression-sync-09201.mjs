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
  need(paths[index],script,'const needPattern=');
  need(paths[index],script,'overflow:(?:visible|clip)');
});
need('ForecastCockpit',cockpit,'className="cockpit-meteogram-pro__datafield"');
need('ForecastCockpit',cockpit,'chartSourcePoints=points.slice(0,Math.min(points.length,25))');
need('Styles',styles,'.cockpit-meteogram-pro__stage{');
need('Styles',styles,'.cockpit-meteogram-pro__canvas{');
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText);
if(pkg.version!==baseline.releaseVersion)failures.push(`Versionsabweichung: ${pkg.version} / ${baseline.releaseVersion}`);
if(failures.length){
  console.error('Cockpit-Regressionsynchronisierung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Cockpit-Meteogrammregressionen robust mit dem aktuellen Vollbreitenlayout synchronisiert.');
