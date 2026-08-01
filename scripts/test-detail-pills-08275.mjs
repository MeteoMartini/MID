import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/App.tsx', import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css', import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json', import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json', import.meta.url),'utf8'));
const fails=[];
const parts=String(pkg.version).split('.').map(Number),minimum=[0,8,27,5],atLeastMinimum=parts.every((value,index)=>value===minimum[index])||parts.some((value,index)=>value>minimum[index]&&parts.slice(0,index).every((part,partIndex)=>part===minimum[partIndex]));
if(!atLeastMinimum)fails.push(`package.json liegt vor 0.8.27.5: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)fails.push(`MID_BASELINE.json ${baseline.releaseVersion} passt nicht zu package.json ${pkg.version}`);
if(!app.includes('UVI max.'))fails.push('UVI-Pille fehlt.');
if(!app.includes('maxUvi=uviValues.length?Math.max(...uviValues):Number.NaN'))fails.push('Max-UVI-Berechnung fehlt.');
if(!css.includes('MID v0.8.27.5 · kompaktere Tagesdetail-Pillen mit UVI-Maximum'))fails.push('Quickfacts-CSS-Anpassung fehlt.');
if(fails.length){
  console.error('Regression fehlgeschlagen:\n- '+fails.join('\n- '));
  process.exit(1);
}
console.log('MID Detail-Pillen-Regression ab v0.8.27.5 bestanden.');
