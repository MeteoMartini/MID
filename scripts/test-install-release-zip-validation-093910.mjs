import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const workflow = await readFile(new URL('../workflow-patches/install-mid.yml', import.meta.url), 'utf8');

assert.match(workflow, /size = archive\.stat\(\)\.st_size/, 'Installer muss die tatsächliche ZIP-Größe prüfen.');
assert.match(workflow, /hashlib\.sha256\(archive\.read_bytes\(\)\)\.hexdigest\(\)/, 'Installer muss den SHA-256 des Uploads protokollieren.');
assert.match(workflow, /if size == 0:/, '0-Byte-Uploads müssen vor ZipFile abgefangen werden.');
assert.match(workflow, /if not is_zipfile\(archive\):/, 'Nicht-ZIP-Dateien müssen vor ZipFile erkannt werden.');
assert.match(workflow, /corrupt = zip_file\.testzip\(\)/, 'ZIP-Einträge müssen vor dem Extrahieren CRC-geprüft werden.');
assert.match(workflow, /Release-ZIP ist leer \(0 Byte\)/, 'Fehlermeldung für leere Uploads muss eindeutig sein.');
assert.match(workflow, /Release-Datei ist kein gültiges ZIP/, 'Fehlermeldung für falsche Uploadformate muss eindeutig sein.');
console.log('Installer-Release-ZIP-Validierung geprüft.');
