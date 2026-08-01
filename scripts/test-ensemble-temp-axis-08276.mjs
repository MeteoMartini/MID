import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/EnsemblePanel.tsx', import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css', import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json', import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json', import.meta.url),'utf8'));
const fails=[];
const parts=String(pkg.version).split('.').map(Number),minimum=[0,8,27,6],atLeastMinimum=parts.every((value,index)=>value===minimum[index])||parts.some((value,index)=>value>minimum[index]&&parts.slice(0,index).every((part,partIndex)=>part===minimum[partIndex]));
if(!atLeastMinimum)fails.push(`package.json liegt vor 0.8.27.6: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)fails.push(`MID_BASELINE.json ${baseline.releaseVersion} passt nicht zu package.json ${pkg.version}`);
if(!/xAxisHeight=compact\?96:106/.test(app))fails.push('Temperatur-X-Achsenhöhe fehlt.');
if(!/cellLift=xAxisHeight>=60\?Math\.max\(30,cellHeight\*2\.05\):Math\.max\(20,cellHeight\*1\.7\)/.test(app))fails.push('Anhebung der Wetterkacheln fehlt.');
if(!/height=\{exporting\?336:372\}/.test(app))fails.push('Erhöhte Temperatur-Chart-Höhe fehlt.');
if(!css.includes('MID v0.8.27.6 · sichtbare Temperatur-Tagesachse und präziser zentrierte Wetterkacheln'))fails.push('CSS-Fix für Temperaturachse fehlt.');
if(fails.length){
  console.error('Regression fehlgeschlagen:\n- '+fails.join('\n- '));
  process.exit(1);
}
console.log('MID Ensemble-Temperaturachsen-Regression ab v0.8.27.6 bestanden.');
