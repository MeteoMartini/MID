import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const [astronomy,app,styles,pkg,lock]=await Promise.all([
 readFile(new URL('../src/astronomy.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../package-lock.json',import.meta.url),'utf8')
]);
assert.match(astronomy,/from 'astronomy-engine'/,'Astronomy Engine fehlt.');
assert.match(astronomy,/SearchLocalSolarEclipse\(/,'Lokale Sonnenfinsternis-Suche fehlt.');
assert.match(astronomy,/eclipse\.peak\.altitude>0/,'Sonnenhöhe wird für lokale Sichtbarkeit nicht geprüft.');
assert.match(astronomy,/SearchLunarEclipse\(/,'Mondfinsternis-Suche fehlt.');
assert.match(astronomy,/peak\.getTime\(\)>at\.getTime\(\)/,'Zukunftsfilter für Finsternismaximum fehlt.');
assert.match(astronomy,/obscuration:kind==='penumbral'\?undefined/,'Halbschatten wird nicht von Prozent-Verdeckung getrennt.');
assert.doesNotMatch(astronomy,/2026-08-12|12\.08\.2026/,'Finsternisdatum darf nicht hart codiert sein.');
assert.match(app,/Nächste Finsternis/,'Nächste Finsternis fehlt im Sonne/Mond-Infopopover.');
assert.match(app,/Maximum \{formatAstronomyTime\(event\.peak/,'Maximumzeit fehlt.');
assert.match(app,/astronomy\.nextEclipse&&eclipseTimeRange\(astronomy\)/,'Finsternis muss im Astronomie-Infopopover erreichbar sein.');
assert.match(app,/info:<AstronomyExplanation astronomy=\{astronomy\}\/>/,'Sonne/Mond-Kachel muss das Astronomie-Infopopover anbieten.');
assert.match(app,/zertifizierter Sonnenfinsternisbrille|sicherem Sonnenfilter/,'Sicherheitshinweis bei Sonnenfinsternis fehlt.');
assert.match(styles,/MID v0\.9\.45\.2[^\n]*nächste standortrelevante Finsternis/,'Finsternis-CSS-Vertrag fehlt.');
assert.equal(JSON.parse(pkg).dependencies['astronomy-engine'],'^2.1.19');
assert.equal(JSON.parse(lock).packages['node_modules/astronomy-engine'].version,'2.1.19');
console.log('Standortrelevante Finsternisse geprüft: fachlich erhalten und platzsparend hinter (i) erreichbar.');
