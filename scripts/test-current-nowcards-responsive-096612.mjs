import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const[app,stylesSource,styles,pkgRaw,baselineRaw,implementation]=await Promise.all([
 readFile('src/App.tsx','utf8'),
 readFile('src/styles-src/30-modern.css','utf8'),
 readFile('src/styles.css','utf8'),
 readFile('package.json','utf8'),
 readFile('MID_BASELINE.json','utf8'),
 readFile('MID_IMPLEMENTATION_0.9.66.12.md','utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-current-nowcards-responsive-096612.mjs';
assert.equal(pkg.version,'0.9.66.12');
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:current-nowcards-responsive'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes('MID_IMPLEMENTATION_0.9.66.12.md'));
assert.ok(app.includes('className="radar-nowcast-total-main"'),'Strukturierte Nowcast-Summenangabe fehlt.');
for(const token of [
 'container:current-nowcards/inline-size',
 'container:current-precip/inline-size',
 '@container current-precip (max-width:720px)',
 '@container current-nowcards (max-width:420px)',
 '.radar-nowcast-strip.compact{',
 'max-width:100%',
 'overflow:hidden',
 '.radar-nowcast-total-main',
 '.local-now-disclosure .thunder-fact-grid',
 '.thunder-place-row>b'
])assert.ok(stylesSource.includes(token),`Responsive Nowcard-Vertrag unvollständig: ${token}`);
assert.ok(stylesSource.includes('grid-template-columns:minmax(0,1fr)')&&stylesSource.includes('white-space:normal')&&stylesSource.includes('overflow-wrap:anywhere'),'Schmale Zusatzgefahrenfelder sind nicht gegen Textüberdeckung abgesichert.');
assert.ok(stylesSource.includes('.radar-nowcast-strip.compact .radar-nowcast-tick>b')&&stylesSource.includes('top:10px')&&stylesSource.includes('.radar-nowcast-strip.compact .radar-nowcast-now>b'),'Zeitmarken und Jetzt-Label teilen weiterhin denselben Lesebereich.');
assert.equal(styles,await ['src/styles-src/00-foundation.css','src/styles-src/10-features.css','src/styles-src/20-ensemble-composite.css','src/styles-src/25-extreme-outlook.css','src/styles-src/30-modern.css'].reduce(async(acc,path)=>(await acc)+await readFile(path,'utf8'),Promise.resolve('')),'styles.css ist nicht mit den kanonischen Modulen synchron.');
assert.ok(implementation.includes('Radar-Nowcast-Rahmen')&&implementation.includes('Gewitter-, Starkregen- und Sturzflutkarten'));
console.log('MID 0.9.66.12: Radar-Nowcast und lokale Zusatzgefahren bleiben ohne verdeckte Texte innerhalb ihrer Kartenbreite.');
