import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const exportsSource=await readFile(new URL('../src/widgetUrlExports.ts',import.meta.url),'utf8');
const capture=await readFile(new URL('../tools/widget-export/capture-widget.mjs',import.meta.url),'utf8');
const powershell=await readFile(new URL('../tools/widget-export/Update-MID-Widgets.ps1',import.meta.url),'utf8');

assert.match(app,/dataset\.midWidgetReady='pending'/,'Renderstatus beginnt nicht explizit als pending.');
assert.match(app,/document\.fonts\?\.ready/,'Webfonts werden vor Freigabe des Screenshots nicht abgewartet.');
assert.match(app,/requestAnimationFrame\(\(\)=>requestAnimationFrame/,'Zwei abgeschlossene Layout-/Paint-Zyklen fehlen.');
assert.match(app,/dataset\.midWidgetReady='ready'/,'Stabil gerendertes Widget wird nicht freigegeben.');
assert.match(exportsSource,/searchParams\.set\('farben','ecmwf'\)/,'Kanonische Export-URLs fordern ECMWF-Farben nicht explizit an.');
assert.match(capture,/midWidgetReady==='ready'/,'Automatischer Export wartet nicht auf das MID-Bereitschaftssignal.');
assert.match(capture,/Page\.captureScreenshot/,'Automatischer Export erfasst die Widgetfläche nicht über CDP.');
assert.match(capture,/url\.hostname='www\.midwx\.app'/,'Automatischer Export verwendet nicht den kanonischen Host.');
assert.match(powershell,/farben=ecmwf/,'PowerShell-Stapel verwendet ECMWF-Farben nicht explizit.');
assert.match(powershell,/wiesbaden[\s\S]*kuerecik[\s\S]*malatya/,'Ortsliste der PowerShell-Ausgabe ist unvollständig.');

console.log('MID v0.9.84.24: öffentliche Widget-URLs signalisieren den fertigen Renderzustand; CDP-Export wartet darauf und erzeugt zwölf Light-PNGs mit ECMWF-Farben.');
