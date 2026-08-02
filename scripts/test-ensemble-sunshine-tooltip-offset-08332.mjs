import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
const versionParts=String(pkg.version).split('.').map(Number),minimum=[0,8,33,2];let versionOk=true;for(let i=0;i<minimum.length;i++){if((versionParts[i]??0)>minimum[i])break;if((versionParts[i]??0)<minimum[i]){versionOk=false;break}}if(!versionOk)failures.push(`Paketversion liegt vor 0.8.33.2: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} passt nicht zu ${pkg.version}`);
for(const token of [
 'MID v0.8.33.2 · Sonne-Wertblock im Ensemble-Temperaturtooltip leicht nach rechts versetzt',
 '.ensemble-pro-tooltip .trend-tooltip-meta .sunshine-tooltip-line.single-value>.tooltip-meta-value{',
 'padding-left:8px!important;',
 'padding-left:6px!important'
])if(!css.includes(token))failures.push(`CSS fehlt: ${token}`);
if(failures.length){console.error('MID v0.8.33.2 Sonne-Tooltip-Abstand fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID v0.8.33.2 geprüft: Sonne-Wertblock bleibt einzeilig und ist leicht nach rechts versetzt.');
