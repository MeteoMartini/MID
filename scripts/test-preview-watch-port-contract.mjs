import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const config=await readFile(new URL('../vite.config.ts',import.meta.url),'utf8');
for(const token of [
 'port:5000',
 'strictPort:true',
 "'**/.local/**'",
 "'**/.agents/**'",
 "'**/node_modules/**'",
 "'**/.git/**'",
])assert.ok(config.includes(token),`Preview-Startvertrag fehlt: ${token}`);

console.log('Preview-Startvertrag geprüft: Port 5000 ohne stillen Wechsel, Replit-Store-/Metadaten-Verzeichnisse ausgeschlossen.');