# MID – Apple Privacy- und Berechtigungsmanifest-Vertrag

## Zweck

MID führt Browser/PWA und iOS weiterhin aus demselben React/Vite-/Worker-Fachkern. Die Apple-Privacy-Manifeste beschreiben ausschließlich die tatsächlich verwendeten nativen bzw. off-device Datenpfade und dürfen keine neue Datenerhebung, kein Tracking und keine zusätzliche Berechtigung aktivieren.

## App-Target

`ios/App/App/PrivacyInfo.xcprivacy` ist als Resource des Haupt-App-Targets gebündelt.

Deklariert werden:

- `NSPrivacyCollectedDataTypePreciseLocation` / `NSPrivacyCollectedDataTypePurposeAppFunctionality`: vom Nutzer ausgewählte oder ausdrücklich angeforderte exakte Koordinaten werden für lokale Wetter-, Warn-, Radar- und Forecastabfragen an den gemeinsamen MID-/Datenquellenpfad übergeben.
- `NSPrivacyCollectedDataTypeDeviceID` / `NSPrivacyCollectedDataTypePurposeAppFunctionality`: nur bei freiwillig aktivierter MID-Gerätesynchronisation wird ein zufälliger, appinterner Gerätebezeichner zusammen mit dem verschlüsselten Synchronisationsstand an den MID-Worker gesendet. Es handelt sich weder um IDFA noch um Fingerprinting.
- `NSPrivacyCollectedDataTypeOtherUserContent` / `NSPrivacyCollectedDataTypePurposeAppFunctionality`: freiwillig synchronisierte portable MID-Daten wie Favoriten, Events/Aktivitäten, Einstellungen und Wetterzwilling-Archiv werden vor der Übertragung clientseitig verschlüsselt.
- `NSPrivacyCollectedDataTypeProductInteraction` und `NSPrivacyCollectedDataTypePerformanceData` / `NSPrivacyCollectedDataTypePurposeAnalytics`: die vorhandene Cloudflare-Web-Analytics-RUM-Einbindung misst Seitenaufrufe und Performance/Core-Web-Vitals ohne Cookies oder persistenten Browser-Identifier.

Alle Einträge sind `NSPrivacyCollectedDataTypeTracking = false` und `NSPrivacyCollectedDataTypeLinked = false`. `NSPrivacyTracking` ist `false`; `NSPrivacyTrackingDomains` wird deshalb nicht deklariert. MID aktiviert keinen ATT-Prompt.

## Required-Reason-API

Die vorhandene native Dateiübergabe verwendet `@capacitor/filesystem`. Dessen veröffentlichter Apple-Privacy-Vertrag verlangt für Dateizeit-/Metadatenzugriffe:

- `NSPrivacyAccessedAPICategoryFileTimestamp`
- Reason `C617.1`

Diese Required-Reason-API wird nur im Haupt-App-Manifest deklariert. Die Widget-Extension verwendet den Filesystem-Adapter nicht.

## Widget-Target

`ios/App/MIDWidgets/PrivacyInfo.xcprivacy` ist als Resource des `MIDWidgets`-Targets gebündelt. Die Extension sendet die in ihrer AppIntent-Konfiguration gewählten Koordinaten und den frei eingegebenen Standortnamen an den bestehenden `mid.native.widget.v1`-Feed. Daher deklariert sie ausschließlich `PreciseLocation` und `OtherUserContent` für `AppFunctionality`; Tracking und Required-Reason-APIs bleiben dort deaktiviert.

## Berechtigungsgrenze

Dieser Meilenstein ändert keine Laufzeitberechtigung. Insbesondere bleiben unverändert bzw. inaktiv:

- keine Hintergrund-Ortung,
- keine Push-Berechtigungsabfrage,
- kein `registerForRemoteNotifications()`,
- kein `aps-environment`,
- kein `UIBackgroundModes`,
- kein App-Tracking-Transparency-Prompt,
- keine Apple-Signierung, TestFlight- oder App-Store-Aktivierung.

Die vorhandenen `NSLocationWhenInUseUsageDescription`- und `NSMotionUsageDescription`-Texte bleiben bestehen. Das vorhandene `NSLocationAlwaysAndWhenInUseUsageDescription` ist nur beschreibend vorhanden; MID fordert weiterhin keine Always-Location-Berechtigung an.

## Nächstes Gate

Nach dieser reinen Quell-/Manifestvorbereitung ist der nächste Schritt die macOS-/Xcode-Qualitätssicherung mit Apple SDK, iPhone-/iPad-Simulator und Xcodes Privacy Report. Eine vorhandene kostenlose macOS-Laufzeit darf genutzt werden. Kostenpflichtige macOS-CI, Apple-Developer-Mitgliedschaft, Signierung oder Geräte-/Store-Veröffentlichung bleiben freigabepflichtig.
