import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const runtime=await readFile(new URL('./test-github-actions-runtime.mjs',import.meta.url),'utf8');
const maintenance=await readFile(new URL('./test-maintenance-recharts3-cache-ci-08260.mjs',import.meta.url),'utf8');
const flightBriefing=await readFile(new URL('./test-flight-text-vertical-briefing-09620.mjs',import.meta.url),'utf8');
const maintenanceContracts=await readFile(new URL('./test-maintenance-user-contracts-09630.mjs',import.meta.url),'utf8');
const baseline=JSON.parse(await readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
if(maintenance.includes("spawnSync('npm'")||maintenance.includes('npm install --package-lock-only'))failures.push('Wartungsregression startet weiterhin einen umgebungsabhängigen Offline-npm-Unterprozess.');
if(runtime.includes("#\\s*v${major}")||runtime.includes('action=(name,major)'))failures.push('Actions-Regression hängt weiterhin von unverbindlichen Versionskommentaren ab.');
if(!runtime.includes("requiredWorkflowNames=['install-mid.yml','deploy.yml','dependency-audit.yml']"))failures.push('Actions-Regression begrenzt sich nicht eindeutig auf die verbindlichen MID-Workflows.');
if(!maintenance.includes('lock.lockfileVersion!==3')||!maintenance.includes('Lockfile-Wurzel'))failures.push('Deterministische Lockfile-Strukturprüfung fehlt.');
for(const [label,source] of [['Flugbriefing',flightBriefing],['Wartungsverträge',maintenanceContracts]]){
 if(/import\(new URL\(['"]\.\.\/src\/[^'"]+\.ts/.test(source))failures.push(`${label}: TypeScript-Direktimport ist mit dem gepinnten Node.js 22.16.0 nicht kompatibel.`);
 if(!source.includes("createRequire(import.meta.url)('typescript-strada')")||!source.includes('transpileModule'))failures.push(`${label}: projektlokale TypeScript-Transpilierung für Node.js 22.16.0 fehlt.`);
}
if(!baseline.regressionTests?.includes('scripts/test-ci-regression-determinism-08262.mjs'))failures.push('Neue CI-Determinismusregression fehlt in MID_BASELINE.json.');
if(failures.length){console.error('CI-Determinismusprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}

const nowcastConsistency=await readFile(new URL('./test-nowcast-daily-consistency-08333.mjs',import.meta.url),'utf8');
assert.ok(nowcastConsistency.includes("const ts=require('typescript-strada')"),'Nowcast-Regressionsprüfung muss die gepinnte Strada-Test-API projektlokal laden');
assert.ok(nowcastConsistency.includes('fileURLToPath(import.meta.url)'),'Nowcast-Regressionsprüfung muss Dateipfade plattformstabil auflösen');
console.log('CI-Regressionen sind umgebungsunabhängig: TypeScript-7-CLI plus gepinnte Strada-Test-API, plattformstabile Pfade, keine Offline-npm-Probe und klare Lockfile-Strukturprüfung.');
