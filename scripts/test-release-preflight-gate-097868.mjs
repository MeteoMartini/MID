import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),read=file=>readFileSync(new URL(file,root),'utf8');
const packer=read('tools/release/create_professional_zip.py'),preflight=read('scripts/release-preflight.mjs');
for(const token of ['def run_preflight()','scripts" / "release-preflight.mjs','subprocess.run(command, cwd=ROOT, check=True)','verify_zip.testzip()'])assert.ok(packer.includes(token),`Packer-Gate fehlt: ${token}`);
for(const token of ["['ci','--ignore-scripts','--no-audit','--no-fund']","['run','build']","['run','test:regressions']","scripts/test-versioning.mjs","scripts/test-baseline-079526-contract.mjs","scripts/test-release-lineage.mjs","scripts/test-release-upload-budget-097410.mjs"])assert.ok(preflight.includes(token),`Release-Preflight unvollständig: ${token}`);
console.log('Release-ZIP ist durch vollständigen Build-, Regressions-, Versions-, Baseline- und Lineage-Preflight gesperrt.');
