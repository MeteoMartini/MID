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

**v0.9.69.3–0.9.69.6 Release-Automatisierung:** Der gemeinsame Worker wird bei fachlichen Änderungen nach erfolgreichem Browser-Build und vollständiger Regression automatisch versioniert hochgeladen, zunächst mit 0 % Traffic gegen den produktionsgleichen Versionsoverride geprüft und erst danach auf 100 % promoviert. Fehlgeschlagene Vorläufe bleiben fail-closed. v0.9.69.6 verwendet dafür den dokumentierten `command-output` von `cloudflare/wrangler-action`, um die von Wrangler gelieferte Worker-Version-ID eindeutig zu bestimmen.

**v0.9.69.7 Mitteleuropa-Wiederherstellung:** Der vollständige ICON-D2-Mitteleuropa-Ausblick aus der v0.9.67.x-Linie ist wieder verbindlich; eine Kartenkontextlage oberhalb der Gefahrenflächen hält Grenzen, Kartenlinien und Städtenamen auch bei mehreren Gebietslayern sichtbar.

**v0.9.70.0 kostenfreier RUC-Produktionspfad:** RUC/RUC-EPS wird ohne R2 über DWD Open Data → GitHub Actions/ecCodes → GitHub Pages → Worker → gemeinsamen MID-Fachkern ausgeliefert. Der Pages-Pfad nutzt immutable Chunks statt Range-Requests, bewahrt den letzten Snapshot über normale App-Releases hinweg und lässt R2 als rein optionale spätere Speicheroptimierung unangetastet. Die Tagesansicht schützt zusätzlich Niederschlagswahrscheinlichkeit über Niederschlagsbalken und kontrastreiche Windrichtungspfeile in Hell/Dunkel.

**v0.9.70.2 Lifecycle-/Offline-Wiederaufnahme:** Browser/PWA und Capacitor-iOS verwenden denselben Runtime-Lifecycle-Bridge. Suspend checkpointet lokale Persistenz best-effort, Offline-Warmstarts liefern einen vorhandenen höchstens 18 Stunden alten Kernforecast unmittelbar mit Standzeit und Netzrückkehr nutzt wieder den gemeinsamen Forecast-Loader. Lokale Nutzerdaten werden beim Lifecycle niemals pauschal gelöscht oder zurückgesetzt. Run #750 bestätigte TypeScript, Vite, Worker-Syntax, 564/564 Regressionen und `cap copy ios`.

**v0.9.71.0 WidgetKit-Xcode-Struktur:** Das bisherige Apple-Widget-Gerüst liegt als echtes eingebettetes `MIDWidgets`-App-Extension-Target im bestehenden Capacitor-Xcode-Projekt. Der Feedvertrag bleibt `mid.native.widget.v1`, die Extension nutzt den produktiven MID-Worker und iOS 17 als bewusste `AppIntentConfiguration`-Grenze; Haupt-App iOS 15, Browser/PWA und der gemeinsame Wetterfachkern bleiben unverändert. App Group, Signierung und ein eigenes watchOS-Target werden in diesem kostenfreien Strukturmeilenstein nicht aktiviert.

Die Quellvorbereitung für Push und Hintergrundaktualisierung ist in v0.9.72.0 ohne Geräte-/Signierungsaktivierung abgeschlossen. Das Apple-Datenschutz- und Berechtigungsmanifest ist in v0.9.73.0 vollständig quellenmäßig vorbereitet. Das nächste Gate ist die macOS-/Xcode-Qualitätssicherung mit Apple SDK und Simulator.

**v0.9.75.0 gemeinsames 24-h-Profil:** Das Wetterprofil verwendet in Browser/PWA und Capacitor-iOS dieselbe durchgängige Story Axis. Wetterband, astronomische Ereignisse und alle Parameter sind zeitlich deckungsgleich; Bewölkung erscheint ohne Prozentachse als vier neutrale Gesamt/H/M/L-Intensitätsbänder, der Luftdruck als deutlich sichtbare eigene Kurve. Hoch- und Querformat bleiben responsive Darstellungen desselben React/Vite-Kerns. Das nächste native Gate bleibt die macOS-/Xcode-Simulator-Qualitätssicherung.

**v0.9.73.7 gemeinsamer Kurzfrist-/Darstellungsfeinschliff:** Der kostenfreie DWD-RUC-Pages-Pfad liefert für das deterministische Nahfenster 0–6 h nun 15-minütliche Schritte und danach weiterhin stündlich bis +14 h. Die Metadaten unterscheiden dafür deterministische und EPS-Zeitachsen sauber, sodass der gemeinsame Worker die feinere Nowcasting-Nähe lesen kann, ohne das stündliche RUC-EPS zu verbiegen. Parallel wurde das 24-h-Wolkenprofil vereinheitlicht: keine höhenabhängigen Grautöne mehr, sondern ein neutrales Grau mit Bedeckungs-gesteuerter Dunkelheit und weicheren Fade-in/Fade-out-Übergängen. Browser/PWA und iOS profitieren identisch; das nächste Gate bleibt unverändert die macOS-/Xcode-Qualitätssicherung.

**v0.9.73.9 Branding-/Wolkenprofil-Hotfix:** MID nutzt nun beide bereitgestellten Logo-Varianten produktiv. In den Einstellungen kann zwischen Auto, dunklem Logo und hellem Logo gewählt werden; Auto folgt dem jeweiligen Layoutkontrast und greift bereits im Startbildschirm und Header. Zusätzlich wurden die Wolkenkästchen im 24-h-Wetterprofil repariert: statt losgelöster Vollbandoptik sind H/M/L wieder sauber stundenweise im Raster verankert, mit dezenten Frames und weiterhin neutral-grauer, bedeckungsabhängiger Füllung. Der Worker bleibt fachlich unverändert; das nächste Gate bleibt unverändert die macOS-/Xcode-Qualitätssicherung.


**v0.9.73.10 RUC-Zeitachsenfix (durch v0.9.73.11 fachlich erweitert):** Run #6 zeigte korrekt, dass eine gemeinsame 15-Minuten-Achse für alle Zustandsfelder unzulässig ist. Der gemeinsame Mehrvariablen-Zustandsvektor bleibt daher stündlich 0…+14 h und fehlende Temperatur-/Wind-/Druck-/Wolkenzwischenwerte werden nicht interpoliert. v0.9.73.11 ergänzt darauf aufbauend getrennte parameter-native 5-/15-Minuten-Rapid-Produkte; v0.9.73.10 ist deshalb nicht als reiner Stunden-RUC-Endvertrag zu lesen. RUC-EPS bleibt stündlich.
### 2. Native Plattformadapter – in Arbeit

Vor Beginn dieser Etappe wurde in v0.9.67.5 die gemeinsame MapLibre-6-
Produktions-Workergrenze repariert. Modellierte GeoJSON-Gefahrenflächen werden
damit in Browser/PWA und iOS-WebView wieder aus demselben Vite-Build gerendert.
Standortadapter und externe OAuth-Navigation sind inzwischen abgeschlossen;
Teilen/Import/Export, Lifecycle-/Offline-Wiederaufnahme, WidgetKit-Xcode-Struktur, Push-/Background-Quellvorbereitung sowie Apple Privacy-/Berechtigungsmanifest sind abgeschlossen; das nächste Gate ist die macOS-/Xcode-Qualitätssicherung.

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
- Lifecycle- und Offline-Wiederaufnahme ohne Verlust lokaler Daten – abgeschlossen in v0.9.70.2: gemeinsamer Browser/PWA-/Capacitor-Bridge, best-effort Persistenzcheckpoint, Offline-Warmstart aus lokalem Kernforecast-Cache und gezielter Refresh bei Netzrückkehr
- WidgetKit-Xcode-Struktur – abgeschlossen in v0.9.71.0: echtes eingebettetes `MIDWidgets`-App-Extension-Target, unveränderter `mid.native.widget.v1`-Feedvertrag, produktiver Worker-Endpunkt und plattformgeschützte spätere watchOS-Quelle ohne Entitlement-/Signierungsaktivierung
- Push-/Background-Refresh-Quellvorbereitung – abgeschlossen in v0.9.72.0: kompilierbare APNs-Callback- und `BGAppRefreshTask`-Quellen im Haupt-App-Target, deklarierter Task-Identifier, aber keine Notification-Berechtigungsabfrage, kein `registerForRemoteNotifications()`, kein Token-Upload, kein `UIBackgroundModes` und kein `aps-environment` vor dem Apple-Gate

Jeder Adapter muss durch einen Browserpfad, einen nativen Pfad und einen
Regressionstest geschützt sein. Fachwerte dürfen im Adapter weder berechnet
noch verändert werden.

### 3. Apple-Integrationen ohne Veröffentlichung

- bestehendes `native/apple`-WidgetKit-Gerüst in die Xcode-Struktur überführen – **abgeschlossen in v0.9.71.0**
- `mid.native.widget.v1` unverändert als Feedvertrag verwenden – **abgeschlossen in v0.9.71.0**
- Quellvorbereitung für Push und Hintergrundaktualisierung – **abgeschlossen in v0.9.72.0**
- Datenschutz- und Berechtigungsmanifest – abgeschlossen in v0.9.73.0
- macOS-/Xcode-Qualitätssicherung – **nächstes Gate**

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

**v0.9.73.11 parameter-native RUC-Integration:** Der gemeinsame DWD-ICON-D2-RUC-Zustandskern bleibt stündlich bis +14 h; native Rapid-Produkte werden getrennt verarbeitet: `TOT_PREC` 5-minütlich bis +6 h, Konvektion/Reflektivität/Phase/Strahlung 15-minütlich bis +6 h und ausgewählte Specialist-Diagnostik stündlich. Der 0–6-h-Extremwetterpfad erhält zusätzliche RUC-Organisationssignale, Radar/Blitz/KONRAD3D bleiben höher priorisiert. Ein vollständiger Audit des aktuellen DWD-v1-Parameterbaums verhindert unnötige 3D-/Mikrophysik-Duplizierung; SRH/WSHEAR bleiben bis zur expliziten `lvt1`-Layerprüfung deaktiviert. Browser/PWA und iOS nutzen unverändert denselben gemeinsamen Fachkern; das nächste iOS-Gate bleibt macOS/Xcode-Simulator-QA.
