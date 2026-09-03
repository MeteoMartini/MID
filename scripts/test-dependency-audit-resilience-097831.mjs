import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const audit=await readFile(new URL('./audit-production-dependencies.mjs',import.meta.url),'utf8');

assert.equal(pkg.scripts?.['audit:dependencies'],'node scripts/audit-production-dependencies.mjs && node scripts/check-dependency-upgrade-policy.mjs','audit:dependencies muss den resilienten MID-Audit vor der Upgrade-Policy verwenden.');
assert.ok(audit.includes('/-/npm/v1/security/advisories/bulk'),'Der offizielle npm Bulk Advisory Endpoint fehlt.');
assert.ok(audit.includes('https://api.osv.dev/v1/querybatch'),'Der unabhängige OSV-Fallback fehlt.');
assert.ok(audit.includes("severityRank")&&audit.includes("critical:4")&&audit.includes("high:3"),'HIGH/CRITICAL-Auswertung fehlt.');
assert.ok(audit.includes("process.exit(1)")&&audit.includes('HIGH/CRITICAL-Sicherheitsbefunde'),'HIGH/CRITICAL-Befunde müssen den Release weiterhin blockieren.');
assert.ok(audit.includes("npm',['ls','--omit=dev','--all','--json']"),'Lokale Konsistenzprüfung des installierten Produktionsbaums fehlt.');
assert.ok(audit.includes('OSV-Fallback wird verwendet'),'Fallback bei npm-Advisory-Ausfall fehlt.');
assert.ok(audit.includes('reinen externen Advisory-Service-Ausfalls nicht blockiert'),'Externe Advisory-Doppelstörung muss als Warnung statt als falscher App-/Lockfile-Fehler behandelt werden.');
assert.ok(!audit.includes('/security/audits/quick'),'Der auslaufende/instabile npm Quick-Audit-Endpunkt darf nicht mehr verwendet werden.');
assert.ok(!pkg.scripts?.['audit:dependencies']?.includes('npm audit'),'Der Workflow darf nicht mehr direkt vom npm-Quick-Audit abhängen.');

console.log(`MID v${pkg.version}: Dependency-Audit nutzt npm Bulk + OSV-Fallback und blockiert HIGH/CRITICAL weiterhin.`);
