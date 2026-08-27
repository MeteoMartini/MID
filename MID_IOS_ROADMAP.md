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

### 2. Native Plattformadapter – nächste autonome Etappe

- Standortadapter mit unverändertem Browser-`navigator.geolocation`-Fallback
- externe OAuth-Navigation und sichere Rückkehr über bestehende Deep Links
- Teilen/Import/Export über eine native Schnittstelle mit Browserfallback
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
