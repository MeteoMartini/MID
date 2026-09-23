import fs from 'node:fs';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const weatherParts=['src/weather-src/00-types-models-search.tsfrag','src/weather-src/10-observations-specialized.tsfrag','src/weather-src/20-mapping-day-character.tsfrag','src/weather-src/30-ensemble-climate-hazards.tsfrag'];
const styleParts=['src/styles-src/00-foundation.css','src/styles-src/10-features.css','src/styles-src/20-ensemble-composite.css','src/styles-src/25-extreme-outlook.css','src/styles-src/30-modern.css'];
const workerParts=['worker-src/00-core-observations.js','worker-src/05-knmi-eps-cache.js','worker-src/10-radar-nowcast.js','worker-src/20-composite-models.js','worker-src/25-dach-extreme-outlook.js','worker-src/30-push-events.js','worker-src/40-aviation-router.js'];
assert.equal(fs.existsSync(new URL('src/weather.tsfrag',root)),false,'Veralteter paralleler weather.tsfrag-Stand darf nicht zurückkehren.');
assert.equal(read('src/weather.ts'),weatherParts.map(read).join(''),'weather.ts muss exakt aus weather-src erzeugt sein.');
assert.equal(read('src/styles.css'),styleParts.map(read).join(''),'styles.css muss exakt aus styles-src erzeugt sein.');
const worker=workerParts.map(read).join('');
assert.equal(read('worker.js'),worker,'worker.js muss exakt aus worker-src erzeugt sein.');
assert.equal(read('worker/metar-proxy.js'),worker,'worker/metar-proxy.js muss exakt aus worker-src erzeugt sein.');
const builder=read('scripts/build-maintenance-aggregates.mjs');
for(const part of [...weatherParts,...styleParts,...workerParts])assert.ok(builder.includes(part),`Aggregate-Builder kennt ${part} nicht.`);
console.log('MID Aggregate-Source-of-Truth: weather-src/styles-src/worker-src sind kanonisch; parallele Altquelle entfernt.');
