import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const test='scripts/test-cost-governance-contract-095337.mjs';
const [contract,source,adapter,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../MID_COST_GOVERNANCE_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../MID_SOURCE_OF_TRUTH.md',import.meta.url),'utf8'),
 readFile(new URL('../MID_REGIONAL_ENSEMBLE_ADAPTER_SETUP.md',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
for(const token of [
 'Keine kostenpflichtigen Schritte ohne ausdrückliche Freigabe',
 'Kosten müssen vor der Entscheidung sichtbar sein',
 'Free/Open first',
 'keine kostenpflichtige Infrastruktur',
 'kein kostenpflichtiger VPS'
])assert.ok(`${contract}\n${source}\n${adapter}`.includes(token),`Kostenvertrag fehlt/ist zu schwach: ${token}`);
assert.ok(contract.includes('Anbieter und konkrete Leistung')&&contract.includes('Abrechnungsmodell')&&contract.includes('kostenlose bzw. bereits vorhandene Alternativen'),'Kostenpflichtige Optionen müssen vor Freigabe transparent vergleichbar sein.');
assert.ok(contract.includes('automatisch Kosten erzeugt')&&contract.includes('kostenpflichtiges Risiko'),'Auto-Overage-Free-Tiers müssen als Kostenrisiko behandelt werden.');
assert.ok(adapter.includes('success-driven Ensemblelogik'),'Nicht eingerichteter Adapter muss kostenfrei/fallback-fähig bleiben.');
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion);
assert.ok(baseline.requiredRegressionTests.includes(test),'Kosten-Governance muss Required Regression sein.');
console.log(`MID v${pkg.version}: keine kostenpflichtigen Projektschritte ohne vorherige transparente Kostenangabe und ausdrückliche Freigabe.`);
