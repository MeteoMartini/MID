# MID – Apple Push- und Background-Refresh-Quellvertrag

## Zweck

Die native iOS-Hülle darf Push und Hintergrundaktualisierung vorbereiten, ohne einen zweiten Wetterfachkern zu erzeugen. Sichtbare Wetterwerte, Warnregeln, Ereignislogik und Modellfusion bleiben im gemeinsamen React/Vite-/Worker-Fachkern. Dieser Vertrag beschreibt ausschließlich die spätere native Transport- und Ausführungsgrenze.

## Vorbereiteter APNs-Pfad

`MIDNativePushPreparation` ist eine dormant kompilierte Quelle im Haupt-App-Target. `AppDelegate` kann von iOS gelieferte Registrierungsresultate und Hintergrund-Payloads an diese Quelle weiterreichen. Der aktuelle Quellstand:

- fordert **keine** Notification-Berechtigung an,
- ruft **nicht** `registerForRemoteNotifications()` auf,
- lädt **keinen** APNs-Gerätetoken zu MID oder einem Drittanbieter hoch,
- persistiert den Token **nicht** in UserDefaults, Keychain, Datei oder Webspeicher,
- erzeugt **keine** zweite native Warn-/Forecastlogik,
- akzeptiert für eine spätere Tap-Navigation nur MID-eigene HTTPS-Ziele bzw. das bereits etablierte eng begrenzte `midwx://oauth/...`-Schema.

Ein späterer APNs-Provider muss die bestehenden MID-Pushregeln und kanonischen Forecast-/Warnpfade serverseitig wiederverwenden. Eine parallele native Wetterbewertung ist unzulässig.

## Vorbereiteter Background-Refresh-Pfad

`MIDBackgroundRefreshPreparation` kapselt ausschließlich die spätere `BGAppRefreshTask`-Registrierung und -Planung. Der Identifier lautet:

`app.midwx.weather.background-refresh`

Er ist in `BGTaskSchedulerPermittedIdentifiers` deklariert. Die Haupt-App ruft `registerPreparedTask()` und `schedulePreparedRefresh(...)` in diesem Meilenstein **nicht** auf. `UIBackgroundModes` wird nicht aktiviert. Ein späterer Handler muss den gemeinsamen MID-Datenpfad anstoßen und darf keine eigene Wetterlogik enthalten.

## Kosten-/Entitlement-Grenze

Nicht Teil dieser Quellvorbereitung sind:

1. `aps-environment` oder eine andere Push-Entitlement-Datei,
2. Aktivierung der Xcode-Capability Push Notifications,
3. Aktivierung von Background Modes / Remote notifications / Background fetch,
4. Apple-Developer-Mitgliedschaft, Signierung oder Geräteinstallation,
5. APNs-Schlüssel/Zertifikate, Provider-Secrets oder Token-Upload-Endpunkte,
6. TestFlight/App-Store-Veröffentlichung,
7. kostenpflichtige macOS-CI oder sonstige kostenpflichtige Infrastruktur.

Diese Punkte bleiben am ausdrücklichen Apple-/Kosten-Gate.

## Browser/PWA

Der vorhandene Web-Push-/Workerpfad bleibt unverändert nutzbar. Die neue Swift-Quelle ersetzt ihn nicht und verändert keine Browserberechtigung. Browser/PWA und iOS behalten denselben React/Vite-/Worker-Fachkern.
