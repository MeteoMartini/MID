import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const runtime=await readFile(new URL('./test-github-actions-runtime.mjs',import.meta.url),'utf8');
const maintenance=await readFile(new URL('./test-maintenance-recharts3-cache-ci-08260.mjs',import.meta.url),'utf8');
const baseline=JSON.parse(await readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
if(maintenance.includes("spawnSync('npm'")||maintenance.includes('npm install --package-lock-only'))failures.push('Wartungsregression startet weiterhin einen umgebungsabhängigen Offline-npm-Unterprozess.');
if(runtime.includes("#\\s*v${major}")||runtime.includes('action=(name,major)'))failures.push('Actions-Regression hängt weiterhin von unverbindlichen Versionskommentaren ab.');
if(!runtime.includes("requiredWorkflowNames=['install-mid.yml','deploy.yml','dependency-audit.yml']"))failures.push('Actions-Regression begrenzt sich nicht eindeutig auf die verbindlichen MID-Workflows.');
if(!maintenance.includes('lock.lockfileVersion!==3')||!maintenance.includes('Lockfile-Wurzel'))failures.push('Deterministische Lockfile-Strukturprüfung fehlt.');
if(!baseline.regressionTests?.includes('scripts/test-ci-regression-determinism-08262.mjs'))failures.push('Neue CI-Determinismusregression fehlt in MID_BASELINE.json.');
if(failures.length){console.error('CI-Determinismusprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}

const nowcastConsistency=await readFile(new URL('./test-nowcast-daily-consistency-08333.mjs',import.meta.url),'utf8');
assert.ok(nowcastConsistency.includes("try{ts=require('typescript')}catch"),'Nowcast-Regressionsprüfung muss TypeScript zuerst projektlokal laden');
assert.ok(nowcastConsistency.includes('fileURLToPath(import.meta.url)'),'Nowcast-Regressionsprüfung muss Dateipfade plattformstabil auflösen');
console.log('CI-Regressionen sind umgebungsunabhängig: lokale TypeScript-Auflösung, plattformstabile Pfade, keine Offline-npm-Probe und klare Lockfile-Strukturprüfung.');
