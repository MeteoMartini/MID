import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [app,css]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC14ViewportFixes.css',import.meta.url),'utf8')
]);
assert.ok(app.includes('className="imprint-backdrop"'),'Impressum benötigt einen eigenen Backdrop.');
assert.ok(app.includes('className="imprint-dialog"'),'Impressum benötigt einen eigenen Dialog.');
assert.ok(app.includes('aria-label="Impressum schließen"'),'Impressum braucht einen expliziten Schließen-Button.');
assert.ok(css.includes('.imprint-dialog>header{'),'Der Schließen-Kopf muss separat geschützt werden.');
assert.ok(css.includes('position:sticky!important'),'Der Schließen-Kopf muss beim Scrollen erreichbar bleiben.');
assert.ok(css.includes('.imprint-dialog>.imprint-content{'),'Nur der Impressumsinhalt darf intern scrollen.');
assert.ok(css.includes('overflow-y:auto!important'),'Portrait-Inhalt muss intern vertikal scrollen können.');
assert.ok(css.includes('max-height:calc(100dvh'),'Dialoghöhe muss an den realen dynamischen Viewport gebunden sein.');
console.log('MID-C14: Impressum bleibt im Hoch- und Querformat schließbar.');
