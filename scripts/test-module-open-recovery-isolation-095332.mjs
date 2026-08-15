import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,persistence,storageSafety,portable,stateContract,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/persistence.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/storageSafety.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/portableUserData.ts',import.meta.url),'utf8'),
 readFile(new URL('../MID_STATE_INTEGRITY_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Release und Baseline müssen synchron sein.');

// Einmalige Heilungsmigration: alle Hauptsektionen werden geschlossen, einschließlich Langfrist.
assert.match(app,/const MODULE_OPEN_CONTRACT_KEY='mid:module-open-contract:v5'/,'Modulvertrag v5 fehlt.');
assert.match(app,/MODULES_DEFAULT_CLOSED=\['mountain','water','composite','ensemble','long-range'/,'Langfrist fehlt in der v5-Heilungsmigration.');
assert.match(app,/for\(const id of MODULES_DEFAULT_CLOSED\)persistModuleOpen\(id,false\)/,'v5 muss bestehende kontaminierte Offenstände einmalig schließen.');
assert.match(app,/mid:module-open-contract:v4/,'v4 muss als Legacy-Vertrag migriert werden.');

// Nutzer-Toggle muss vor einem möglichen App-Hintergrundwechsel synchron in LocalStorage landen.
assert.match(app,/const commitOpen=useCallback\(\(next:boolean\|\(\(value:boolean\)=>boolean\)\)=>\{setOpen\(value=>\{const resolved=typeof next==='function'\?next\(value\):next;persistModuleOpen\(id,resolved\);return resolved\}\)\}/,'CollapsibleModule persistiert den Nutzerzustand nicht synchron im State-Übergang.');
assert.doesNotMatch(app,/useEffect\(\(\)=>\{persistModuleOpen\(id,open\)\}/,'Modulzustand darf nicht ausschließlich über einen nachgelagerten Effect gespeichert werden.');

// Recovery-Snapshot und StorageSafety-Spiegel dürfen Hauptmodulzustände nie wieder als durable User-Daten behandeln.
assert.match(persistence,/function isMainModuleViewStateKey\(key:string\)/,'Recovery-Isolationsfilter fehlt in persistence.ts.');
assert.match(persistence,/!isMainModuleViewStateKey\(key\)/,'Recovery-Snapshot schließt Hauptmodulzustände nicht aus.');
assert.match(storageSafety,/export function isMainModuleViewStateKey\(key:string\)/,'StorageSafety-Isolationsfilter fehlt.');
assert.match(storageSafety,/return !isMainModuleViewStateKey\(key\)&&/,'StorageSafety behandelt Hauptmodulzustände weiterhin als durable.');
assert.match(storageSafety,/if\(isMainModuleViewStateKey\(key\)\)\{queueDelete\(key\);continue\}/,'Alte IndexedDB-Spiegelstände werden nicht aktiv entfernt.');
assert.match(storageSafety,/isMainModuleViewStateKey\(key\)\?native\?\.get\(key\)\?\?null/,'Nicht-durable Modulzustände dürfen nicht aus dem Fallback-Spiegel gelesen werden.');

// Geräte-Sync bleibt ebenfalls ausgeschlossen: alle drei Persistenzebenen müssen übereinstimmen.
assert.match(portable,/if\(\/\^mid:module:\[\^:\]\+:open\$\/\.test\(key\)\)return false/,'Geräte-Sync darf Modul-Offenzustände nicht transportieren.');
assert.ok(stateContract.includes('Recovery-/StorageSafety-Spiegel'),'State-Integritätsvertrag dokumentiert die Recovery-Isolation nicht.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-module-open-recovery-isolation-095332.mjs'),'Neue Sektions-Recovery-Regression ist nicht Required.');

console.log(`MID v${pkg.version}: Hauptsektionszustände sind aus Sync, Recovery-Snapshot und StorageSafety-Spiegel isoliert; v5-Heilungsmigration geprüft.`);
