import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=await readFile(path.join(root,'scripts','test-feature-change-coverage.mjs'),'utf8');
const failures=[];
for(const token of [
  "git(['ls-files','--others','--exclude-standard','--','scripts/test-*.mjs'])",
  'const changedTests=[...new Set([...modifiedTests,...untrackedTests])];',
  'Funktionscode geändert, aber kein Regressionstest ergänzt oder angepasst'
])if(!source.includes(token))failures.push(`Änderungsabdeckung berücksichtigt neue ungetrackte Regressionstests nicht vollständig: ${token}`);
if(failures.length){console.error('Prüfung des Änderungsabdeckungs-Wächters fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Änderungsabdeckungs-Wächter geprüft: neue, beim ZIP-Install zunächst ungetrackte test-*.mjs-Dateien zählen als Regressionstest-Abdeckung.');
