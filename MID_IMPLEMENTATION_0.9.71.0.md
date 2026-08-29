# MID 0.9.71.0 – WidgetKit-Xcode-Struktur mit `mid.native.widget.v1`

## Ausgangsbasis

Verbindliche Basis ist der erfolgreich veröffentlichte v0.9.70.2-Stand auf
`mid-stable`, Commit `28b24fd84e0d73642cd8d3a3462032980539fe39`. Release-Run #750 bestätigte die
Professional-ZIP mit SHA-256
`45a35c63a791e2ced0a13db95961c9513a057cc5cb9b7dbc5f9edf60943362be`,
TypeScript, Vite-Produktionsbuild, Worker-Syntax, **564/564 Regressionen** und
das anschließende `cap copy ios`. Der Worker war semantisch unverändert und
wurde deshalb korrekt ohne Cloudflare-Zugriff übersprungen; Pages und
`mid-stable` wurden erfolgreich finalisiert.

## Ziel

Der offene Milestone `widgetkit-xcode-structure-with-mid-native-widget-v1`
wird ohne eigenen iOS-Wetterfachkern umgesetzt. Das bisher unter
`native/apple` vorbereitete Swift-Gerüst wird in das bereits vorhandene
Capacitor-Xcode-Projekt überführt und als echte WidgetKit App Extension
verdrahtet. Der Worker-/JSON-Vertrag bleibt exakt `mid.native.widget.v1`.

## Xcode-Struktur

Im bestehenden `ios/App/App.xcodeproj` existiert nun das Target `MIDWidgets`
mit Produkt `MIDWidgets.appex` und Produkttyp
`com.apple.product-type.app-extension`. Die Haupt-App besitzt eine
`Embed Foundation Extensions`-Phase in `PlugIns` sowie eine explizite
Target-Abhängigkeit auf `MIDWidgets`. Die vier Swiftquellen und das
Extension-`Info.plist` liegen kanonisch unter `ios/App/MIDWidgets`.

Das `Info.plist` deklariert ausschließlich den WidgetKit-Extension-Point
`com.apple.widgetkit-extension`. Es wird keine Standortberechtigung innerhalb
der Extension angefordert, weil die Koordinaten aus der expliziten
Widgetkonfiguration stammen.

## Plattformgrenze

`AppIntentConfiguration` / `WidgetConfigurationIntent` ist der moderne
konfigurierbare Widgetpfad ab iOS 17. Deshalb hat ausschließlich die Widget
Extension `IPHONEOS_DEPLOYMENT_TARGET = 17.0`; das vorhandene Capacitor-App-
Target und das Projekt bleiben auf iOS 15.0. Die iOS-/iPadOS-Extension enthält
systemSmall, systemMedium, systemLarge sowie accessoryInline,
accessoryCircular und accessoryRectangular. `accessoryCorner` bleibt im
gemeinsamen Swift-Quellstand hinter `#if os(watchOS)` und wird erst mit einem
späteren echten watchOS-Target ausgeliefert.

## Feed und Schema

Der Provider verwendet den produktiven Endpunkt
`https://mid-data-proxy.midwx.workers.dev/?mode=native-widget-feed` und sendet
nur Standortname, Koordinaten und Windeinheit aus der Widgetkonfiguration. Nach
dem `Codable`-Decode muss `snapshot.schema` exakt
`MIDWidgetSnapshot.expectedSchema == "mid.native.widget.v1"` entsprechen;
ein inkompatibler zukünftiger Feed wird als Widgetfehler verworfen statt
lautlos falsch dargestellt zu werden.

## Kosten-/Entitlement-Grenze

Der v1-Widgetfeed ist netzwerkbasiert und benötigt in dieser Stufe keine
App Group. Daher werden weder App Group noch Entitlement-Datei, Apple-
Developer-Signierung, Geräteinstallation, TestFlight oder ein watchOS-Target
aktiviert. Das hält den Meilenstein vollständig innerhalb der kostenfreien
Quellvorbereitung. Gemeinsame lokale Favoriten/Snapshots können eine App Group
in einem späteren, ausdrücklich freigegebenen Apple-Schritt benötigen.

## Regression und strukturelle Prüfung

Neu ist `scripts/test-widgetkit-xcode-structure-09710.mjs`. Der Test schützt:

- das echte `MIDWidgets`-PBXNativeTarget und `.appex`-Produkt,
- Target-Abhängigkeit und Embed-Phase,
- iOS-17-Grenze nur für die Extension bei erhaltener iOS-15-Haupt-App,
- WidgetKit-`Info.plist`, Bundle-ID und fehlende vorzeitige App-Group-Aktivierung,
- kanonische Swiftquellen in der Xcode-Struktur ohne parallele Altquelle,
- produktiven Worker-Endpunkt und exakten `mid.native.widget.v1`-Schema-Check,
- iOS-/iPadOS-Familien und die watchOS-only-Compile-Grenze für
  `accessoryCorner`.

Auf Linux wurden `project.pbxproj` und das Extension-`Info.plist` mit `plutil`
strukturell validiert; die Swift-Dateien bestanden den reinen Swift-Parser.
Worker-Syntax sowie die gezielten WidgetKit-, Cross-Platform-, Lifecycle-, Mitteleuropa-, Tagesdetail-, RUC- und Release-Verträge sind lokal grün. Ein reproduzierbares lokales `npm ci` lief in dieser isolierten Containerlaufzeit in einen Transport-Timeout; daher wird kein vollständiger lokaler TypeScript-/Vite-/565er-Erfolg behauptet und GitHub CI bleibt das verbindliche Voll-Gate.
Ein echter Apple-SDK-/Simulator-Build ist weiterhin erst in einer macOS/Xcode-
Laufzeit möglich und wird hier nicht vorgetäuscht.

Mit der neuen Required Regression umfasst der Kandidat **565 automatisch
erkannte Regressionstests**. Vor der Freigabe muss der unveränderte Release-
Installer erneut Dependency-Audit, TypeScript, Vite, Worker-Syntax und alle 565
Regressionen ausführen und anschließend den geprüften Web-Build per
`cap copy ios` in die iOS-Hülle übernehmen.

## Auslieferung

Der Worker erhält nur die synchronisierte Versionsmarke. Es ist keine
fachliche Workeränderung vorgesehen; der semantische Worker-Diff soll den
Cloudflare-Deploy deshalb erneut überspringen. Es ist keine Änderung an
`.github/workflows` erforderlich. Nach erfolgreicher Freigabe ist der nächste
Milestone `apple-push-background-refresh-source-preparation`.
