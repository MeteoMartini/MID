import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const powershell=await readFile(new URL('../tools/widget-export/Update-MID-Widgets.ps1',import.meta.url),'utf8');
const launcher=await readFile(new URL('../tools/widget-export/Update-MID-Widgets.cmd',import.meta.url),'utf8');
const fallback=await readFile(new URL('../tools/widget-export/MID-Widget-Fallback.html',import.meta.url),'utf8');
const readme=await readFile(new URL('../tools/widget-export/FIRMENCLIENT-README.txt',import.meta.url),'utf8');

assert.doesNotMatch(powershell,/Get-Command\s+node|node\.exe|winget|npm\s+/i,'Firmenclient-Exporter darf Node/npm/winget nicht voraussetzen.');
assert.doesNotMatch(powershell,/ignore-certificate-errors|--no-sandbox|ExecutionPolicy\s+Bypass/i,'Firmenclient-Exporter darf Sicherheitsmechanismen nicht abschalten.');
assert.match(powershell,/SpecialFolder\]::MyPictures|SpecialFolder\]::MyPictures/i,'Standardausgabe liegt nicht im Benutzer-Bilderordner.');
assert.match(powershell,/Microsoft\\Edge\\Application\\msedge\.exe/,'Microsoft Edge wird nicht aus den normalen Installationspfaden ermittelt.');
assert.match(powershell,/--remote-debugging-port=0/,'Edge-CDP wird nicht mit einem ephemeren lokalen Port gestartet.');
assert.match(powershell,/--remote-debugging-address=127\.0\.0\.1/,'Edge-CDP wird nicht explizit an localhost gebunden.');
assert.match(powershell,/127\.0\.0\.1/,'CDP-Verbindung ist nicht explizit auf localhost begrenzt.');
assert.match(powershell,/midWidgetReady==='ready'/,'Exporter wartet nicht auf das MID-Render-Bereitschaftssignal.');
assert.match(powershell,/Page\.captureScreenshot/,'Exporter erfasst die tatsächliche Widget-Fläche nicht per Edge-CDP.');
assert.match(powershell,/\.mid-stage-/,'Transaktionaler Staging-Ordner fehlt.');
assert.match(powershell,/backupDirectory[\s\S]*committed[\s\S]*Copy-Item/,'Rollback-Sicherung für den Datei-Commit fehlt.');
assert.match(powershell,/Ungueltiger oder leerer Screenshot/,'PNG-Validierung fehlt.');
assert.match(powershell,/wiesbaden[\s\S]*kuerecik[\s\S]*malatya/,'Alle drei vereinbarten Orte müssen exportiert werden.');
assert.match(powershell,/farben=ecmwf/,'ECMWF-Temperaturfarben sind im Stapel nicht fest vorgegeben.');
assert.doesNotMatch(launcher,/ExecutionPolicy\s+Bypass/i,'CMD-Starter darf die PowerShell-Ausführungsrichtlinie nicht umgehen.');
assert.match(launcher,/MID-Widget-Fallback\.html/,'Browser-Fallback wird bei Policy-/Startfehlern nicht angeboten.');
assert.equal((fallback.match(/https:\/\/www\.midwx\.app\/\?widget=/g)||[]).length,12,'Fallback muss genau zwölf vereinbarte Live-Widget-Links enthalten.');
assert.match(readme,/keine Administratorrechte/i,'Firmenclient-Dokumentation benennt den No-Admin-Vertrag nicht.');
assert.match(readme,/Einfügen und verknüpfen/i,'PowerPoint-Vertrag für aktuelle und offline verfügbare Bilder fehlt.');

console.log('MID Firmenclient-Vertrag: Edge-only, no-admin/no-install, keine Security-Overrides, 12 transaktional validierte ECMWF-PNGs plus Browser-Fallback.');
