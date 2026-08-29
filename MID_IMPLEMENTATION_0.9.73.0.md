# MID 0.9.73.0 – Apple Privacy-/Berechtigungsmanifest-Vorbereitung

## Ausgangsbasis

v0.9.72.0 enthält die dormant kompilierte APNs-/BGAppRefresh-Quellvorbereitung und den appweiten RUC-/Quellenaudit. Push, Background Modes, Signierung und Apple-Entitlements sind weiterhin nicht aktiviert.

## Umsetzung

Das Haupt-App-Target und die Widget-Extension besitzen nun jeweils ein eigenes `PrivacyInfo.xcprivacy`, das als Resource in das jeweilige ausführbare Bundle eingebunden wird.

Das Haupt-App-Manifest deklariert die tatsächlichen off-device Kategorien `PreciseLocation`, `DeviceID`, `OtherUserContent`, `ProductInteraction` und `PerformanceData`. Sämtliche Datenkategorien sind nicht für Tracking bestimmt und nicht an eine Nutzeridentität gekoppelt. App-Funktionsdaten werden nur für die jeweiligen MID-Funktionen verwendet; Cloudflare Web Analytics bleibt auf Analytics/Performance beschränkt.

Für den bereits vorhandenen Capacitor-Filesystem-Adapter ist `NSPrivacyAccessedAPICategoryFileTimestamp` mit Apples/Capacitors empfohlenem Reason `C617.1` deklariert.

Das `MIDWidgets`-Manifest bleibt bewusst kleiner: `PreciseLocation` und `OtherUserContent` für den vom Nutzer konfigurierten `mid.native.widget.v1`-Feed; keine Tracking-Domains und keine Required-Reason-API.

## Keine neue Berechtigung

Der Meilenstein aktiviert weder ATT noch Push, Background Modes oder Hintergrund-Ortung. `aps-environment`, App-Entitlements, Notification-Berechtigungsabfrage, `registerForRemoteNotifications()` und `UIBackgroundModes` bleiben abwesend. Damit bleibt der Stand kostenfrei und ohne Apple-Konto baubar, soweit die Plattformlaufzeit verfügbar ist.

## Regression

`scripts/test-apple-privacy-permission-manifest-09730.mjs` schützt die beiden Privacy-Manifeste, die Xcode-Resource-Verdrahtung, Tracking=false, den Filesystem-Reason C617.1, die fachlich begründeten Datentypen und das Fehlen jeder vorzeitigen Apple-Aktivierung.

Die historischen iOS-Regressionen beziehen ihren erwarteten `nextMilestone` nun zentral aus `expectedIosNextMilestone(...)`, damit ein abgeschlossener Apple-Meilenstein nicht erneut durch veraltete harte Statusvergleiche blockiert wird.

## Nächstes Gate

Der nächste Schritt ist `macos-xcode-simulator-quality-assurance`. Er benötigt eine macOS-/Xcode-Laufzeit für Apple-SDK-Build, Simulator und Xcode-Privacy-Report. Kostenpflichtige CI, Apple-Mitgliedschaft, Signierung, TestFlight und App Store bleiben ohne ausdrückliche Freigabe gesperrt.
## Lokale Abschlussprüfung

- `PrivacyInfo.xcprivacy` für App und Widget, `Info.plist` sowie `project.pbxproj` bestehen `plutil -lint`.
- `AppDelegate.swift`, `MIDNativePushPreparation.swift`, `MIDBackgroundRefreshPreparation.swift` und sämtliche Widget-Swift-Dateien bestehen den verfügbaren `swiftc -parse`-Check.
- Der aus den modularen `worker-src`-Quellen erzeugte `worker/metar-proxy.js` ist syntaktisch gültig; `worker.js` ist nach `maintain:aggregates` wieder bytegleich.
- 565 von 565 in dieser Linux-Laufzeit ausführbaren automatischen MID-Regressionen sind grün. Der Gesamtbestand umfasst 567 Tests; `test-extreme-outlook-modelled-areas-096618.mjs` und `test-extreme-regions-flight-null-096619.mjs` benötigen das lokal nicht vorhandene `esbuild`.
- Ein erneutes vollständiges TypeScript-/Vite-Gate ist in dieser Laufzeit nicht reproduzierbar, weil `npm ci` durch die nicht auflösbare npm-Registry blockiert ist; der Offline-Cache ist ebenfalls unvollständig (`yauzl` fehlt). Die daraus resultierenden TypeScript-Fehler sind ausschließlich fehlende installierte Pakete/Typdeklarationen, kein belastbares Quellcode-Gate. Run #751 hatte für v0.9.71.0 TypeScript und Vite bereits grün.
- Der semantische Worker-Diff gegen den hochgeladenen v0.9.71.0-Ausgangskandidaten ist **fachlich geändert**. Damit muss der normale Installer bei erfolgreichem Release-Gate den Worker automatisch stagen/smoken/promovieren; ein manueller Worker-Upload bleibt Notfallweg.
- Aktive und kanonische `install-mid.yml`, `deploy.yml` und `mid-ruc-preprocess.yml` sind bytegleich. Der kostenfreie DWD-RUC-Pages-Pfad bleibt damit unverändert maßgeblich; R2 wird nicht aktiviert.
- Die eingebettete iOS-Webkopie steht weiterhin nachvollziehbar auf v0.9.68.2. Sie wird nicht künstlich umetikettiert; `npm run ios:sync`/Capacitor-Copy gehört zum nächsten echten macOS-/Xcode-Gate.

## Releasekandidat

Der Quellstand wird als unversioniertes Releasepaar `MID-professional-replacement.zip` und `MID-worker.zip` ausgeliefert. Das Professional-ZIP enthält keinen `node_modules/`-, `dist/`- oder `.git/`-Baum; das Worker-ZIP enthält ausschließlich den kanonischen `worker.js`. Vor der Übernahme nach `mid-stable` müssen die normale GitHub-Installationspipeline (`npm ci`, Dependency-Audit, TypeScript, Vite, Worker-Syntax, vollständige Regressionen, Capacitor-Copy) und anschließend das macOS-/Xcode-Simulator-Gate grün sein.
