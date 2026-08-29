# MID – autonome Browser-/iOS-Roadmap

## Zielbild

MID bleibt ein gemeinsames Produkt mit zwei Auslieferungsformen: Browser/PWA und
iOS. React/Vite, Fachlogik, Wetterdaten, Modellfusion, Warnungen, Favoriten,
Events, Einheiten, Persistenz und Worker-Routen werden nur einmal gepflegt. Die
iOS-Hülle ergänzt ausschließlich plattformspezifische Fähigkeiten über kleine
Adapter.

## Verbindliche Reihenfolge

### 1. Gemeinsamer iOS-Container – abgeschlossen

- Capacitor 8 mit lokal gebündeltem `dist`-Build
- iOS-15-Projekt, Bundle-ID, Versionskopplung und deutsche Berechtigungstexte
- MID-App-Icon, Splashscreen, Safe Areas, App-Lifecycle und Deep-Link-Ereignisse
- Service Worker und PWA-Installationsdialog nur im Browser
- Browser-Produktionsbuild, Worker-Syntax und 548 Regressionstests bestanden

### Gemeinsamer Fachkern-Zwischenschritt v0.9.69.2 – DWD RUC/RUC-EPS

Die in MID 17.7.3 geplante DWD-ICON-D2-RUC/RUC-EPS-Integration wurde als gemeinsamer React/Vite-/Worker-Fachkernbaustein vorwärts portiert. Sie erzeugt keinen iOS-Fork und verändert keine native Datenhaltung. Browser/PWA und iOS profitieren identisch von der kanonischen 0–14-h-Kurzfristfusion. Die vorbereitete R2-Pipeline bleibt am Kosten-Gate deaktiviert. **v0.9.69.1 Produktionshärtung:** EPS-Wahrscheinlichkeiten/Quantile werden vorab in GitHub Actions aggregiert, native Member nur für kurzfristige Events gelesen, sämtliche Binärobjekte inklusive Lookup sind lauf-immutable und der R2-Publisher verifiziert Objekte vor dem atomaren `latest.json`-Wechsel. **v0.9.69.2 Betriebs-/Cloudflare-Härtung:** privater R2-Bucket mit deaktiviertem `r2.dev`, 48-h-Leck-Lifecycle, Fallback-sicherer Preflight-Cleanup, getrennte Bootstrap-/Publisher-Rechte und ein geheimnisfreier `ruc-health`-Smoketest. Custom Domain bleibt optional hinter einem gesonderten Öffentlichkeitsgate.

Der nächste native Meilenstein bleibt Lifecycle-/Offline-Wiederaufnahme ohne lokalen Datenverlust.

### 2. Native Plattformadapter – in Arbeit

Vor Beginn dieser Etappe wurde in v0.9.67.5 die gemeinsame MapLibre-6-
Produktions-Workergrenze repariert. Modellierte GeoJSON-Gefahrenflächen werden
damit in Browser/PWA und iOS-WebView wieder aus demselben Vite-Build gerendert.
Standortadapter und externe OAuth-Navigation sind inzwischen abgeschlossen;
der nächste Meilenstein ist Teilen/Import/Export mit Browserfallback.

- Standortadapter mit Browser-Fallback – abgeschlossen in v0.9.68.0:
  native Einmal-Ortung über Capacitor, unverändertes
  `navigator.geolocation` für Browser/PWA und als Brückenfallback, keine
  Hintergrund-Ortung oder adapterspezifische Persistenz
- externe OAuth-Navigation und sichere Rückkehr – abgeschlossen in v0.9.68.1:
  nativer SFSafariViewController über Capacitor Browser, eng validierter
  `midwx://oauth/netatmo`-Rücksprung für Warm- und Kaltstart sowie
  unveränderter Browser-/PWA-Fallback
- Teilen/Import/Export über native Systemdialoge – abgeschlossen in v0.9.68.2:
  temporäre Cachedateien über Capacitor Filesystem und Share, systemeigener
  iOS-Dokumentwähler über den gefilterten WebView-Dateiinput sowie
  unveränderte Web-Share-/Download-/Browser-Dateidialog-Fallbacks
- Lifecycle- und Offline-Wiederaufnahme ohne Verlust lokaler Daten

Jeder Adapter muss durch einen Browserpfad, einen nativen Pfad und einen
Regressionstest geschützt sein. Fachwerte dürfen im Adapter weder berechnet
noch verändert werden.

### 3. Apple-Integrationen ohne Veröffentlichung

- bestehendes `native/apple`-WidgetKit-Gerüst in die Xcode-Struktur überführen
- `mid.native.widget.v1` unverändert als Feedvertrag verwenden
- Quellvorbereitung für Push und Hintergrundaktualisierung
- Datenschutz- und Berechtigungsmanifest vollständig vorbereiten

Ein tatsächlicher APNs-/Geräte-Test kann Signierung und Apple-Entitlements
benötigen und bleibt daher am Kosten-/Kontogate stehen.

### 4. macOS-/Xcode-Qualitätssicherung

- Xcode-Build für iPhone- und iPad-Simulator
- Rotation, Safe Areas, Textskalierung, Dark Mode und Offline-Warmstart prüfen
- reale Touch-, Standort-, Deep-Link- und Wiederaufnahme-Tests
- Browser-Smoke-Test und vollständige MID-Suite erneut ausführen

Dieser Linux-Arbeitsstand kann das Xcode-Projekt erzeugen und strukturell
prüfen, aber keinen Apple-SDK-Build simulieren. Für diese Etappe ist eine
macOS-/Xcode-Laufzeit nötig; eine kostenlose vorhandene Laufzeit darf genutzt
werden, eine kostenpflichtige CI nur nach Freigabe.

### 5. Apple-Freigabegate

Vor Apple-Developer-Mitgliedschaft, Gerätesignierung, TestFlight oder
App-Store-Einreichung werden Kosten und notwendiger Kontozugriff genannt und
eine ausdrückliche Freigabe eingeholt. Ohne Freigabe erfolgt weder Kauf noch
Anmeldung noch Veröffentlichung.

## Prüf- und Auslieferungsvertrag je Etappe

1. Bestehende Verträge und `MID_IOS_STATUS.json` lesen.
2. Genau einen sicheren Meilenstein umsetzen.
3. Browser-Produktionsbuild, relevante Einzeltests und vollständige
   Regressionen ausführen.
4. Capacitor synchronisieren und das iOS-Projekt strukturell prüfen.
5. Status und Umsetzungsnachweis aktualisieren.
6. Unversionierte Professional- und Worker-ZIPs ausgeben und ausdrücklich
   angeben, ob ein Worker-Upload erforderlich ist.

Bei einem fachlichen Fehler wird nicht ausgeliefert. Bei Kosten-, Konto-,
Signierungs- oder Veröffentlichungsbedarf wird angehalten und um Freigabe
gebeten.
