import {readFile} from 'node:fs/promises';
const [phase,ruc,baseline]=await Promise.all([
 readFile(new URL('./test-radar-model-phase-reliability-09395.mjs',import.meta.url),'utf8'),
 readFile(new URL('./test-ruc-rapid-update-policy-09400.mjs',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8').then(JSON.parse)
]);
const name='scripts/test-ruc-time-robustness-09401.mjs';
if(!baseline.requiredRegressionTests?.includes(name))throw new Error('RUC-Zeitrobustheit fehlt im Baseline-Vertrag.');
for(const [label,text] of [['Phasenraster',phase],['RUC-Metadaten',ruc]]){
 if(!text.includes('Date.now()'))throw new Error(`${label}: Testzeit wird nicht zur Laufzeit erzeugt.`);
 if(/2026-08-10T(?:1[0-9]|2[0-3]):/.test(text))throw new Error(`${label}: aktueller Modelllauf ist hart codiert und wird zeitabhängig veralten.`);
}
if(!phase.includes('targetMs=Math.floor'))throw new Error('Phasentest erzeugt keinen relativen 15-Minuten-Zielzeitpunkt.');
if(!ruc.includes('latestRunMs=Math.floor'))throw new Error('RUC-Test erzeugt keinen relativen stündlichen DWD-Lauf.');
console.log('RUC-Regressionen zeitrobust geprüft: Modellläufe und Zielzeitpunkte werden relativ zur Testlaufzeit erzeugt.');
