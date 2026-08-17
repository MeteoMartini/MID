import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const workflows=await Promise.all([
 ['Workflow-Patch','../workflow-patches/install-mid.yml'],
 ['Kanonischer Workflow','../ci/github/workflows/install-mid.yml']
].map(async([label,path])=>[label,await readFile(new URL(path,import.meta.url),'utf8')]));

for(const [label,workflow] of workflows){
 assert.match(workflow, /size = archive\.stat\(\)\.st_size/, `${label}: Installer muss die tatsächliche ZIP-Größe prüfen.`);
 assert.match(workflow, /hashlib\.sha256\(archive\.read_bytes\(\)\)\.hexdigest\(\)/, `${label}: Installer muss den SHA-256 des Uploads protokollieren.`);
 assert.match(workflow, /if size == 0:/, `${label}: 0-Byte-Uploads müssen vor ZipFile abgefangen werden.`);
 assert.match(workflow, /if not is_zipfile\(archive\):/, `${label}: Nicht-ZIP-Dateien müssen vor ZipFile erkannt werden.`);
 assert.match(workflow, /corrupt = zip_file\.testzip\(\)/, `${label}: ZIP-Einträge müssen vor dem Extrahieren CRC-geprüft werden.`);
 assert.match(workflow, /Release-ZIP ist leer \(0 Byte\)/, `${label}: Fehlermeldung für leere Uploads muss eindeutig sein.`);
 assert.match(workflow, /Release-Datei ist kein gültiges ZIP/, `${label}: Fehlermeldung für falsche Uploadformate muss eindeutig sein.`);
}
console.log('Installer-Release-ZIP-Validierung in Patch und kanonischem Workflow geprüft.');
