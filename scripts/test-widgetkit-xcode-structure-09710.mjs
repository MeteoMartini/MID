import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const project=read('ios/App/App.xcodeproj/project.pbxproj');
const info=read('ios/App/MIDWidgets/Info.plist');
const widget=read('ios/App/MIDWidgets/MIDWidget.swift');
const provider=read('ios/App/MIDWidgets/MIDWidgetProvider.swift');
const snapshot=read('ios/App/MIDWidgets/MIDWidgetSnapshot.swift');
const readme=read('native/apple/README.md');
const schema=JSON.parse(read('native/apple/widget-feed-v1.schema.json'));
const worker=read('worker/metar-proxy.js');

for(const file of ['MIDWidget.swift','MIDWidgetConfiguration.swift','MIDWidgetProvider.swift','MIDWidgetSnapshot.swift','Info.plist']){
 assert.ok(fs.existsSync(path.join(root,'ios/App/MIDWidgets',file)),`Xcode-Widgetdatei fehlt: ${file}`);
}
assert.ok(!fs.existsSync(path.join(root,'native/apple/MIDWidgets')),'altes Widget-Quellverzeichnis darf nicht parallel kanonisch bleiben');
assert.ok(!fs.existsSync(path.join(root,'native/apple/MIDWidgetShared')),'altes Shared-Quellverzeichnis darf nicht parallel kanonisch bleiben');

assert.match(project,/\/\* MIDWidgets \*\/ = \{\n\s*isa = PBXNativeTarget;/,'MIDWidgets-PBXNativeTarget fehlt');
assert.match(project,/productType = "com\.apple\.product-type\.app-extension";/,'Widget-Target ist keine App Extension');
assert.match(project,/MIDWidgets\.appex in Embed Foundation Extensions/,'Widget Extension wird nicht in die App eingebettet');
assert.match(project,/dstSubfolderSpec = 13;/,'Widget Extension wird nicht in PlugIns eingebettet');
assert.match(project,/target = [A-F0-9]{24} \/\* MIDWidgets \*\//,'App besitzt keine MIDWidgets-Target-Abhängigkeit');
assert.match(project,/PRODUCT_BUNDLE_IDENTIFIER = app\.midwx\.weather\.MIDWidgets;/,'Widget-Bundle-ID fehlt');
assert.match(project,/INFOPLIST_FILE = MIDWidgets\/Info\.plist;/,'Widget-Info.plist ist nicht am Target verdrahtet');
assert.equal((project.match(/IPHONEOS_DEPLOYMENT_TARGET = 17\.0;/g)??[]).length,2,'Widget Debug/Release müssen iOS 17.0 verwenden');
assert.ok((project.match(/IPHONEOS_DEPLOYMENT_TARGET = 15\.0;/g)??[]).length>=4,'Haupt-App/Projekt dürfen nicht auf iOS 17 hochgezogen werden');
for(const source of ['MIDWidget.swift','MIDWidgetConfiguration.swift','MIDWidgetProvider.swift','MIDWidgetSnapshot.swift']){
 assert.ok(project.includes(`${source} in Sources`),`${source} fehlt in der Widget-Sources-Phase`);
}

assert.match(info,/<string>com\.apple\.widgetkit-extension<\/string>/,'WidgetKit-NSExtensionPointIdentifier fehlt');
assert.ok(!info.includes('NSWidgetWantsLocation'),'Widget darf keine eigene Standortberechtigung anfordern; Koordinaten kommen aus der Konfiguration');
assert.ok(!project.includes('com.apple.security.application-groups'),'App Group darf vor dem Entitlement-/Kontogate nicht aktiviert werden');

assert.equal(schema.$id?.includes('mid.native.widget.v1')||schema.properties?.schema?.const==='mid.native.widget.v1',true,'Schema-Datei schützt mid.native.widget.v1 nicht');
assert.ok(snapshot.includes('static let expectedSchema = "mid.native.widget.v1"'),'Swift-Modell schützt den Feedvertrag nicht');
assert.ok(provider.includes('snapshot.schema == MIDWidgetSnapshot.expectedSchema'),'Widget Provider validiert den Schema-Vertrag nicht');
assert.ok(provider.includes('https://mid-data-proxy.midwx.workers.dev/'),'Produktiver Worker-Endpunkt fehlt');
assert.ok(provider.includes('URLQueryItem(name: "mode", value: "native-widget-feed")'),'native-widget-feed-Route fehlt');
assert.ok(worker.includes("schema:'mid.native.widget.v1'"),'Worker liefert nicht den unveränderten v1-Vertrag');

assert.ok(widget.includes('AppIntentConfiguration'),'Widget verwendet nicht die vorgesehene App-Intent-Konfiguration');
for(const family of ['.systemSmall','.systemMedium','.systemLarge','.accessoryInline','.accessoryCircular','.accessoryRectangular'])assert.ok(widget.includes(family),`iOS-Widgetfamilie fehlt: ${family}`);
assert.match(widget,/#if os\(watchOS\)[\s\S]*\.accessoryCorner[\s\S]*#endif/,'watchOS-only accessoryCorner ist nicht plattformgeschützt');
assert.match(readme,/keine App\s*Group erforderlich/i,'Dokumentation muss App-Group-Aufschub erklären');
assert.ok(readme.includes('watchOS-Target'),'Dokumentation muss iOS-Widget und späteres watchOS-Target trennen');

console.log('MID v0.9.71.0: WidgetKit-App-Extension ist im Xcode-Projekt eingebettet; mid.native.widget.v1, iOS-17-AppIntent-Grenze und kostenfreier Entitlement-Aufschub sind geschützt.');
