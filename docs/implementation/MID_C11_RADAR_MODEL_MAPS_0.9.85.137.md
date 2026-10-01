# C11 · Radar und Modellkarten · v0.9.85.137

Verifizierte Basis: 82fe63ea483afe74c264c15b6978726f9cb47143, main = mid-stable, v0.9.85.136.

## Befund und Datenvertrag

Der aktuelle DWD-RV-GetFeatureInfo-JSON liefert `RV_ANALYSIS`. Der alte Parser erkannte dieses Feld nicht; die Zwischenzeiten ohne flächige Kartenabfrage blieben deshalb fehlend. Liveabgleich DWD/Bright Sky am 01.10.2026, Standort 50,8 N / 7,15 E: native Beobachtung 12:55 UTC = 0,02 mm/5 min, Bright-Sky-RV-Gitterwert 2 in 0,01 mm/5 min. Der historische WMS-Stilabstract mm/h beschreibt nicht die native RV_ANALYSIS-Bandeinheit. `RV_ANALYSIS`, `RV_FORECAST`, `RV_PREDICTION`: ×12 → mm/h; generische Legacy-RATE/GRAY_INDEX bleiben unverändert.

Direkte DWD-WMS-Quelle beibehalten. Bright Sky als native kostenlose Alternative untersucht; kein zusätzlicher produktiver Anbieter nötig. Serverformatbeschreibung und Maintainer-Dokumentation: https://github.com/jdemaeyer/brightsky/issues/144. DWD-WMS-Capabilities: https://maps.dwd.de/geoserver/wms?service=WMS&request=GetCapabilities.

Jeder numerische RV-Zeitpunkt bezeichnet das Ende seines fünfminütigen Akkumulationsintervalls. `intervalStartAt = time − 5 min`, `intervalEndAt = time`. Renderer und Forecast-Fusion verwenden diese Grenzen. Legacy-Adapter ohne solche Grenzen behalten ihren bestehenden Zeitvertrag. Zwei Stunden ab `observedAt` umfassen exakt die 24 Endzeitpunkte +5 bis +120 min. Duplikate zählen einmal, fehlende/negative/ungültige Werte niemals als Null-Evidenz. Fehlende Schritte erzeugen eine Teilsumme mit verfügbarer Minutenzahl; vollständige 2-h-Summe und Szenarioquartile erscheinen nur bei vollständiger Abdeckung. Die zentrale angezeigte Menge ist die Summe final kalibrierter Standortmengen, nicht der geometrisch/timingabhängig abweichende Ensemblemedian. RS darf unvollständige Stunden nicht auf die verbleibenden Schritte verteilen.

## Karten- und Navigationsvertrag

Unter Karte genau Radar/Satellit/Blitz und Modellkarten. ICON-D2-Niederschlagssummen als Produkt mit eigenen 6/12/24/48-h-Fenstern, Favoriten und unveränderten produktgeprüften Exporten. Modellauswahl, nach Wetterparameter gruppierte Produktauswahl und gemeinsame Kartenbasis; bisherige WMS- und Rasterprodukte bleiben vorhanden. Legacy-Summenansicht wird auf Modellkarten/ICON-D2/Summen migriert, andere gespeicherte Einstellungen bleiben erhalten.

Geografie: Natural Earth, Public Domain, https://www.naturalearthdata.com/about/terms-of-use/. Länder 1:110m, vorhandene Deutschlandgrenze 1:50m, 16 Bundesländer und Orte aus 1:10m, vereinfacht als lokales JSON-Asset, einmalig bei Bedarf geladen, ohne externen API-Key oder Kosten. Länder immer, Bundesländer ab 4,8, Ortsnamen ab 5,7 mit zusätzlicher Ortsrelevanz und Kollisionsvermeidung. Gemeinsames Canvas über dem GL-Modellfeld, unter Kartensteuerung und Favoritenmarkern, Redraw bei Kartenrender/Resize. Bundeslandgrenzen auch im Download, Lizenznachweis erhalten.

## Regressionen und Veröffentlichung

`test-radar-model-map-contract-0985137.mjs` prüft reale Bandnamen/Einheiten mit Mockantworten, alle 37 Schritte, Zeitgrenzen, komplette/partielle Summen, RS-Lücken, exakt drei native 5-Minutenintervalle in 15 Minuten, gespeicherte Navigation und zoomabhängige Geografie. Betroffene historische Assertions werden absichtlich aktualisiert: drei getrennte Reiter → zwei gemeinsame; prioritärer Szenario-Median → tatsächlich verfügbare zentrale Summen mit Vollständigkeitsnachweis. Keine unverwandten Assertions oder Release-Gates entfernt. Alle 895 Regressiondateien in beiden Baseline-Listen.

Validierung: `npm run verify` erfolgreich, 895/895 Regressionen; TypeScript/Vite/Worker-Syntax und unveränderte Bundle-Budgets bestanden. Dependency-Audit ohne HIGH/CRITICAL. `cap copy ios`, Cross-Platform-Shell und Runtime-Lifecycle/Offline-Resume erfolgreich, iOS-Version 0.9.85.137. Browsermatrix 390×844, 412×915, 1024×768, 1440×900, 844×390 jeweils Hell/Dunkel: keine JS-Fehler oder horizontalen Überläufe, Mindesthöhe 44 px, Produktwechsel, native vollständige/partielle Radarfixtures sowie PNG/SVG-Downloads. Echte verifizierte ICON-D2-Rasterdatei als lokale Browserfixture, WMS-Metadaten/Kacheln für reproduzierbare Ergonomie gemockt. Kontrastfehler durch nicht existierende `--card`-Variable in der bisherigen Summenkarten-CSS korrigiert (`--surface`).
