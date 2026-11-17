# MID-Karten 1.13 · gemeinsame Radar-/Satelliten-Zeit- und Puffergates (Source-Draft, kein Release)

## Verifizierte Ausgangsbasis

- `main` = `mid-stable` = `a78465b655d25cafc9ecc0390080694cb7aca957`; veröffentlichte Version `0.9.85.486`; fünf aktive Rulesets.
- Parallel: Leitchat-PR #868 HEAD `d8ef67807cc74d3c6b120db5d340cda4e4d90327` bei Beginn, Karten-Spezial-PR #869 HEAD `6ceca22c1704f76cadf5b9b6979490fbfa855c3b`. Das hier geänderte `src/CompositeTimeline.ts` gehört nicht zu den zuletzt gelesenen 128 #868-Diffpfaden. Vor selektivem Intake erneut SHA-/Diff-Abgleich.
- Keine Änderung in den zwischen parallelen Chats bearbeiteten `src/RadarPanel.tsx`, `src/CurrentSurroundings.tsx`, `src/UnifiedWeatherMap.tsx` oder `src/MapLibreCore.tsx`.

## Tatsächlicher laufzeitwirksamer Fix im großen Kartenbereich

`RadarPanel.tsx` nutzt `retainLoadedRadarStand(stableDwdFrame.time, referenceSeconds, targetSeconds)` bereits zur Entscheidung, ob eine geladene Radar-WMS-Kachel während eines ausstehenden neuen Bildes sichtbar bleiben darf. Die bisherige Prüfung kontrollierte nur das Alter und die Nähe, **nicht** den Kategorienwechsel bei `referenceSeconds+90s`. Dadurch konnte ein altes Beobachtungsbild als Zwischenbild in einen zukünftigen Nowcast-Zieltermin hineinreichen.

Die zentrale, bereits importierte Funktion `src/CompositeTimeline.ts` prüft nun ebenfalls `originalIsNowcast === requestedIsNowcast`. Innerhalb der Beobachtungsphase gelten weiterhin die bisherigen Grenzen (Quellstand höchstens 45 Minuten alt und maximal 30 Minuten Abstand zur angeforderten Quellzeit). Innerhalb der Nowcast-Phase darf erstmals ein tatsächlich geladener Nowcast-Rasterstand für höchstens 15 Minuten Zielzeitabstand im Puffer bleiben, begrenzt auf +120 Minuten Prognosehorizont. Ein altes Beobachtungsbild wird nicht mehr als künftiger Radarstand beibehalten, und ein Nowcast nie als Messung ausgegeben. Fehlende/ungültige Zeitstempel werden abgewiesen; NoData und Quellenidentität bleiben unverändert. Die 350-ms-MapLibre-Crossfade-Routine wird nicht überschrieben.

Das ist ein **echter, sofort durch den vorhandenen `RadarPanel`-Aufruf konsumierbarer** Source-Fix und keine nur dokumentierte Absicht. Der volle Source-/Review-/Browser-/Releasepfad muss vor Live-Nutzung bestanden werden.

## Gemeinsamer Architekturvertrag und weitere offene Aufgaben

- **Große Karte:** Die Source-Originalzeitachse verwendet bereits `buildAvailableCompositeTimeline` (nur echte gemeldete Beobachtungs-, Nowcast- und Forecastzeiten), gepufferte Leaflet-WMS-Raster und einen zeitgebundenen DWD-/Satelliten-Frame-Ledger. Dieser Bestand bleibt erhalten.
- **Umfeldwetter:** Das #869-5-Minuten-Auswahl- und Buffer-QA-Modul ist noch nicht in `CurrentSurroundings` produktiv integriert; fehlende Daten dürfen keine synthetischen 5-Minuten-Satellitenbilder, gleichzeitige Radar-/Satellitenzeiten oder alte Bilder unter neuer Quellenzeit erzeugen. Die bestehende `ImageQuadLayer`-GPU-Ready-Barriere und 350-ms-Überblendung ist wiederzuverwenden.
- **Beide Ansichten:** Gemeinsame eindeutige Quellidentität (Produkt/Provider, run wo vorhanden, gültiger Originalzeitstempel, Orts/BBOX-Scope, Render-Phase), bounded cache/retain, Fehler- und NoData-Semantik, separate Ziel- und tatsächlich angezeigte Bildzeit, verspätete Ladeantworten ignorieren. Erst danach eigene Leaflet-/MapLibre-renderer-spezifische Einbindung.
- **Reale QA:** gezielte Unit- und Typecheck-Regressionen auf exakt diesem Branch, danach Quelle/Browser/Performance/Responsive/Reduced Motion und Datenlücken für beide Oberflächen, WebKit und reale iOS-/VoiceOver-Abnahme separat. Full Source-PR-Gate→SHA-Merge→ZIP→Installer→Worker/Pages→Stable strikt Leitchat.
- **Nicht Umfang dieses Drafts:** WMS-/Satellitenprovider-Lizenzen erweitern, source-only Simulationen als echte Daten freigeben, andere Warnungs-/Modellpipelines verändern oder geschützte Branches umgehen. #740/#839 verbleibt beim Release-Spezialchat.

Quellen: DWD RADOLAN Übersicht mit 5-Minuten-RY-Produkten https://www.dwd.de/DE/leistungen/radolan/produktuebersicht/radolan_produktuebersicht_pdf.pdf ; MapLibre ImageSource https://maplibre.org/maplibre-gl-js/docs/API/classes/ImageSource/ .

**QA DRAFT / NO READY / NO MERGE / NO RELEASE.**
