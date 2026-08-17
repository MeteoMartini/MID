import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const install=await readFile(new URL('ci/github/workflows/install-mid.yml',root),'utf8');
const failures=[];
for(const token of [
  'for attempt in 1 2 3 4 5; do',
  'http_code="$(curl --silent --show-error',
  '[ "$http_code" = 429 ]',
  '[[ "$http_code" =~ ^5[0-9][0-9]$ ]]',
  'status_written=false',
  'if [ "$status_written" != true ]; then',
  'der Release bleibt gültig',
  'Finalen Stable-SHA verifizieren und Qualitätsstatus setzen',
  'ls-remote --heads origin refs/heads/mid-stable'
]) if(!install.includes(token))failures.push(token);
if(!install.includes('nicht-temporären GitHub-API-Fehlers')||!install.includes('exit 1'))failures.push('Nicht-temporäre API-Fehler müssen weiterhin hart fehlschlagen.');
if(!install.includes('mid-stable zeigt auf ${remote_sha:-<leer>} statt auf den geprüften Release'))failures.push('Stable-SHA-Abweichung muss weiterhin hart fehlschlagen.');
if(failures.length){console.error('Stable-Quality-Status-Retry v0.9.57.3 fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Stable-Quality-Status-Retry geprüft: SHA-Vertrag bleibt hart; GitHub-5xx beim Statussetzen wird mit Backoff wiederholt und nach fünf temporären Fehlern nur als Warnung gewertet.');
