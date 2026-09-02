import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [decoder,server,readme,dockerfile,setup,workerContract,decoderContract,models,baseline,pkg,packer]=await Promise.all([
 read('tools/knmi_eps_decoder/decoder.py'),read('tools/knmi_eps_decoder/server.py'),read('tools/knmi_eps_decoder/README.md'),read('tools/knmi_eps_decoder/Dockerfile'),read('MID_REGIONAL_ENSEMBLE_ADAPTER_SETUP.md'),read('MID_KNMI_HARMONIE_EPS_WORKER_CONTRACT.md'),read('MID_KNMI_HARMONIE_EPS_DECODER_CONTRACT.md'),read('src/weather-src/00-types-models-search.tsfrag'),read('MID_BASELINE.json').then(JSON.parse),read('package.json').then(JSON.parse),read('tools/release/create_professional_zip.py')
]);

const selftest=spawnSync('python3',['-m','tools.knmi_eps_decoder.selftest'],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
assert.equal(selftest.status,0,`KNMI Decoder selftest fehlgeschlagen:\n${selftest.stdout}\n${selftest.stderr}`);
assert.match(selftest.stdout,/PASS/);

assert.match(decoder,/REQUEST_SCHEMA = "mid\.knmi\.harmonie-eps\.point-decode-request\.v1"/);
assert.match(decoder,/MANIFEST_SCHEMA = "mid\.knmi\.harmonie-eps\.rolling-manifest\.v1"/);
assert.match(decoder,/EXPECTED_ARCHIVES = 6/);
assert.match(decoder,/EXPECTED_MEMBERS_PER_ARCHIVE = 5/);
assert.match(decoder,/EXPECTED_MEMBERS = 30/);
assert.match(decoder,/MAX_FORECAST_HOURS = 54/);
assert.match(decoder,/MAX_RANGE_PARTS = 16/);
assert.match(decoder,/def _range_header_groups/);
assert.match(decoder,/Splitting is allowed only at exact supplied range/);
assert.match(decoder,/status != 206/);
assert.doesNotMatch(decoder,/status\s*==\s*200[^\n]*return/);
assert.match(decoder,/edition != 1/);
assert.match(decoder,/"temperature_2m": \(11, 105, 2, 0\)/);
assert.match(decoder,/"precipitation": \(181, 105, 0, 4\)/);
assert.match(decoder,/"wind_speed_10m": \(\(33, 105, 10, 0\), \(34, 105, 10, 0\)\)/);
assert.match(decoder,/"wind_gusts_10m": \(\(162, 105, 10, 2\), \(163, 105, 10, 2\)\)/);
assert.match(decoder,/def _precipitation_increments/);
assert.match(decoder,/result\[valid_time\] = 0\.0/);
assert.match(decoder,/value - previous/);
assert.match(decoder,/"latestInitialization": manifest\.get\("latestInitialization"\)/);
assert.doesNotMatch(decoder,/temporaryDownloadUrl[^\n]{0,120}_cache_key/);
assert.match(server,/MID_KNMI_HARMONIE_EPS_POINT_TOKEN/);
assert.match(server,/ThreadingHTTPServer/);
assert.match(server,/\/knmi-harmonie-eps/);
assert.doesNotMatch(server,/print\([^\n]*(payload|Authorization|temporaryDownloadUrl)/i);

for(const text of [decoder,readme,setup,workerContract,decoderContract]){
 assert.doesNotMatch(text,/open-data\/v1\/datasets|datasetFiles|versions\/.*files/i,'Decoderseite darf keine zweite KNMI-Listinglogik enthalten.');
}
assert.match(readme,/does not persist or log signed download URLs/);
assert.match(readme,/GRIB1/);
assert.match(dockerfile,/python:3\.12-slim/);
assert.match(packer,/__pycache__/);
assert.match(packer,/\.pyc/);
assert.match(setup,/tools\/knmi_eps_decoder\//);
assert.match(decoderContract,/dritte von vier/);
assert.match(decoderContract,/Abschnitt 4\/4/);

const modelRow=models.match(/\{id:'knmi_harmonie_arome_cy43_eps'[^\n]+\}/)?.[0]??'';
assert.ok(modelRow,'KNMI HARMONIE EPS model row missing');
assert.match(modelRow,/resolutionKm:5\.5/,'P4a Europe must use the official lower-resolution DINI/EU grid metadata');
assert.match(modelRow,/updateHours:1/,'P4a rolling ensemble is updated hourly');
assert.match(modelRow,/maxDays:2\.5/);

assert.equal(pkg.version,'0.9.77.22');
assert.equal(baseline.releaseVersion,'0.9.77.22');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-knmi-eps-point-decoder-097722.mjs'));
assert.ok(baseline.regressionTests.includes('scripts/test-knmi-eps-point-decoder-097722.mjs'));

console.log('KNMI HARMONIE EPS Punktdecoder: Worker-Manifest-only, GRIB1, 6×5 Rolling-Member, HTTP-206-Ranges, Rolling-Regenkorrektur und P4a-5,5-km/1-h-Metadaten geschützt.');
