# MID 0.9.72.0 – Apple Push-/Background-Refresh-Quellvorbereitung

## Ausgangsbasis

v0.9.71.1 schließt den WidgetKit-Regressionshotfix und den appweiten RUC-/Quellenaudit ab. Die vier historischen iOS-Tests erwarten ab v0.9.71.0 korrekt `apple-push-background-refresh-source-preparation`; verbliebene Ortsforecast-Schattenpfade in Lüftung, Prognoseänderungs-Push und Widgetfeed wurden an `forecast-fusion` gebunden. DWD ICON-D2-RUC/RUC-EPS bleibt innerhalb eines DWD-ICON-Unabhängigkeitsbudgets; KNMI/DMI HARMONIE teilen konservativ das UWC-West-HARMONIE-Budget.

## Ziel

Der iOS-Meilenstein `apple-push-background-refresh-source-preparation` wird quellenmäßig abgeschlossen, ohne Apple-Konto, Gerätesignierung, Push-Entitlement oder Hintergrundausführung zu aktivieren. Browser/PWA und iOS behalten denselben React/Vite-/Worker-Fachkern.

## Native Push-Quelle

`ios/App/App/MIDNativePushPreparation.swift` ist dem Haupt-App-Target hinzugefügt. `AppDelegate` leitet ausschließlich die von iOS vorgesehenen Callback-Einstiegspunkte für erfolgreiches/fehlgeschlagenes APNs-Token-Registrationsergebnis und eine spätere Hintergrund-Payload an diese Quelle weiter.

Bewusst **nicht** enthalten sind `requestAuthorization(...)`, `registerForRemoteNotifications()`, ein Token-Upload, Token-Persistenz, ein APNs-Provider-Schlüssel oder eine zweite native Wetter-/Warnlogik. Ein Token wird nur flüchtig in Hexform gehalten, falls ein späterer freigegebener Aktivierungsschritt die Registrierung überhaupt anstößt.

## Background Refresh

`ios/App/App/MIDBackgroundRefreshPreparation.swift` kapselt die spätere `BGAppRefreshTask`-Registrierung und -Planung mit dem Identifier `app.midwx.weather.background-refresh`. Der Identifier ist in `BGTaskSchedulerPermittedIdentifiers` deklariert. `AppDelegate` ruft weder Registrierung noch Scheduling auf; `UIBackgroundModes` bleibt absichtlich abwesend.

Damit ist die Xcode-Quelle kompilierbar und strukturell vorbereitet, ohne im aktuellen Release Hintergrundausführung anzufordern. Ein späterer Handler muss den gemeinsamen MID-Datenpfad anstoßen und darf keinen iOS-eigenen Forecast erzeugen.

## Sicherheits-/Kosten-Gate

Nicht aktiviert werden:

- `aps-environment` oder eine App-Entitlement-Datei,
- Xcode Push Notifications Capability,
- Background Modes / Background fetch / Remote notifications,
- Apple-Developer-Mitgliedschaft oder Gerätesignierung,
- APNs-Schlüssel/Zertifikate und Provider-Secrets,
- TestFlight/App Store,
- kostenpflichtige macOS-CI oder sonstige kostenpflichtige Infrastruktur.

Der verbindliche Vertrag steht in `MID_APPLE_PUSH_BACKGROUND_CONTRACT.md`.

## Regression

`scripts/test-apple-push-background-source-preparation-09720.mjs` schützt die PBX-Source-Verdrahtung, AppDelegate-Callbacks, den dormant BGTask-Quellpfad, den deklarierten Identifier und insbesondere das Fehlen jeder vorzeitigen Push-/Background-Aktivierung.

In der lokalen Linux-Laufzeit bestehen `project.pbxproj` und `Info.plist` `plutil -lint`; die neuen Swiftdateien und `AppDelegate.swift` bestehen den Swift-Parser. 563 der 565 zuvor vorhandenen automatisch erkannten Regressionen konnten unabhängig vom npm-Baum ausgeführt werden und sind nach Korrektur veralteter Schutzassertionen grün. Die beiden übrigen Extremwettertests benötigen `esbuild`, das wegen eines Registry-DNS-Fehlers (`EAI_AGAIN`) nicht lokal installiert werden konnte. Der vorherige v0.9.71.0-Run #751 hatte TypeScript und Vite bereits grün; für v0.9.72.0 bleibt der vollständige Release-CI-Lauf mit `npm ci`, TypeScript, Vite, allen Regressionen und `cap copy ios` das verbindliche Freigabegate.

## Nächster Meilenstein

Nach erfolgreicher Freigabe ist `apple-privacy-permission-manifest-preparation` der nächste native Quellmeilenstein. Ein Apple-SDK-/Geräte-Test bleibt weiterhin am vorhandenen macOS-/Signierungs-/Kosten-Gate.
