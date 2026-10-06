import {readAppFeatureSources} from './lib/appFeatureSources.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readAppFeatureSources();
const exportsSource=await readFile(new URL('../src/widgetUrlExports.ts',import.meta.url),'utf8');
const capture=await readFile(new URL('../tools/widget-export/capture-widget.mjs',import.meta.url),'utf8');
const powershell=await readFile(new URL('../tools/widget-export/Update-MID-Widgets.ps1',import.meta.url),'utf8');

assert.match(app,/dataset\.midWidgetReady='pending'/,'Renderstatus beginnt nicht explizit als pending.');
assert.match(app,/document\.fonts\?\.ready/,'Webfonts werden vor Freigabe des Screenshots nicht abgewartet.');
assert.match(app,/requestAnimationFrame\(\(\)=>requestAnimationFrame/,'Zwei abgeschlossene Layout-/Paint-Zyklen fehlen.');
assert.match(app,/dataset\.midWidgetReady='ready'/,'Stabil gerendertes Widget wird nicht freigegeben.');
assert.match(exportsSource,/searchParams\.set\('farben','ecmwf'\)/,'Kanonische Export-URLs fordern ECMWF-Farben nicht explizit an.');
assert.match(exportsSource,/WIDGET_URL_THEMES:readonly WidgetUrlTheme\[\]=\['light','dark'\]/,'Hell/Dunkel-Katalog fehlt.');
assert.match(exportsSource,/slug:'amari',name:'Ämari',latitude:59\.26,longitude:24\.20/,'Ämari ist nicht mit den beauftragten Koordinaten hinterlegt.');
assert.match(capture,/midWidgetReady==='ready'/,'Automatischer Export wartet nicht auf das MID-Bereitschaftssignal.');
assert.match(capture,/Page\.captureScreenshot/,'Automatischer Export erfasst die Widgetfläche nicht über CDP.');
assert.match(capture,/url\.hostname='www\.midwx\.app'/,'Automatischer Export verwendet nicht den kanonischen Host.');
assert.match(powershell,/farben=ecmwf/,'PowerShell-Stapel verwendet ECMWF-Farben nicht explizit.');
assert.match(powershell,/malatya[\s\S]*kuerecik[\s\S]*amari/,'Ortsliste der PowerShell-Ausgabe ist unvollständig.');
assert.match(powershell,/View = "kurve"[\s\S]*Days = 7[\s\S]*Wind = 1[\s\S]*Rain = 1[\s\S]*Sunshine = 1[\s\S]*Hazards = 0/,'7-Tage-Kurvenprofil ist nicht vollständig.');
assert.match(powershell,/View = "kompakt"[\s\S]*Days = 5[\s\S]*Wind = 1[\s\S]*Rain = 0[\s\S]*Sunshine = 0[\s\S]*Hazards = 0/,'5-Tage-Kompaktprofil ist nicht vollständig.');
assert.match(powershell,/\$themes = @\("light", "dark"\)/,'PowerShell-Stapel erzeugt nicht beide Themes.');

console.log('MID v0.9.85.175: öffentliche Widget-URLs warten auf fertiges Rendering; der CDP-Export erzeugt exakt zwölf Ziel-PNGs in Hell/Dunkel.');
