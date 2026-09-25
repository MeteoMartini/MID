import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,install]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/PwaInstallButton.tsx',import.meta.url),'utf8'),
]);

assert.ok(app.includes("suppressInstallHint={activeNavSection==='composite'||activeNavSection==='weather-maps'}"),
 'Transiente Installationseinblendung muss in Komposit- und Kartenbereich unterdrückt werden.');
assert.ok(app.includes('<PwaInstallButton suppressHint={suppressInstallHint}/>'),
 'Navigationszustand muss bis zum PWA-Installationsbutton durchgereicht werden.');
assert.ok(install.includes('if(suppressHint){setHintReady(false);return}'),
 'Beim Betreten der Kartenbereiche muss die transiente Einblendung samt Timer gestoppt werden.');
assert.ok(install.includes('!suppressHint&&<aside className="pwa-install-hint"'),
 'Die transiente Einblendung darf über aktiven Karten-/Kompositflächen nicht gerendert werden.');
assert.ok(install.includes('<button type="button" className={`header-install-button'),
 'Der dauerhafte App-Kopfzeilenbutton muss trotz unterdrückter Einblendung verfügbar bleiben.');
assert.equal((install.match(/storeHintDismissed\(\)/g)||[]).length,4,
 'Speicherfunktion darf nur durch Definition, Installation oder explizites Schließen auftauchen.');
const suppressBranch=install.match(/if\(suppressHint\)\{[^}]+\}/)?.[0]||'';
assert.ok(suppressBranch&&!suppressBranch.includes('storeHintDismissed'),
 'Unterdrücken darf keine persistente Ablehnung setzen.');
assert.ok(install.includes('[hintDismissed,installed,suppressHint]'),
 'Navigation muss den Timerzustand aktualisieren und beim Verlassen des Bereichs wieder aktivieren können.');

console.log('PWA-Kartenvertrag geprüft: transiente Einblendung pausiert, App-Kopfzeilenbutton bleibt verfügbar, keine gespeicherte Ablehnung.');