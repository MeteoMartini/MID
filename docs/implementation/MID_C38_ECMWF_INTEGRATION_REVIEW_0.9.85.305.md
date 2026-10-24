# MID-C38 · Prüfung der vorbereiteten ECMWF-Anbindung

Stand21.10.2026. Verifizierte freigegebene Basis: main=mid-stable438bfb7838a727ad8753940872c8b8ab140bb7c2 (.304). Geprüfter paralleler Pilot#433: b8d7121f78994bd999550bfd7f7e744a7305744c; unverändert gelassen.

## Bestehende produktive Einbindung und Actions

`tools/ruc/build_synoptic_fields.py::global_product('ifs',...)` lädt bereits direkt bei data.ecmwf.int IFS0p25 via indexgebundenen HTTP206-Ranges. Gleicher Lauf/Termin für T/Q850, Geopotentialhöhe500, MSL, T/Q700 und U/V300; daraus die vorhandenen fünf Synoptik-Komponenten. Der bestehende `mid-ruc-preprocess.yml`-Pfad veröffentlicht sie gemeinsam mit dem geprüften Snapshot. Gemeinsamer Kartenkatalog `ifs`, Browser/Ortswerte und bestehende IFS-Karten bleiben erhalten. Die Prognose nutzt daneben den vorhandenen Open-Meteo-IFS-Adapter; kein zusätzlicher unabhängiger ECMWF-Konsensbeitrag.

Veröffentlichung bleibt unverändert: `chatgpt-pr-gate.yml` (MID ChatGPT/Codex Source-PR Gate, Runname MID-Agent-Quellstand prüfen) → `agent-source-release.yml` (Geprüften Agent-PR automatisch veröffentlichen) → serverseitiges ZIP → `install-mid.yml` (MID-Release aus ZIP installieren und veröffentlichen) → Worker/Pages/Stable. Ein Draft startet diese Jobs absichtlich nicht. Der RUC-Horizont-Canary ist eine read-only Datenvorprüfung und ersetzt keine dieser Actions. PR435 wurde an das vorhandene deutsche Benamungsschema „MID v0.9.85.305: …“ angeglichen; branch-/SHA-Provenienz bleibt unverändert.

## Tatsächlich nachgeprüfter 0,1°-Pilot

Run39510643473 auf exaktem Pilot-HEAD erfolgreich. Artefakt12304884614, ZIP-SHA2563c739d321c50f3bad97f10ae109966dd04760bab2bf99fc28791da8c7165f91e wurde heruntergeladen und unabhängig geprüft. Enthaltenes JSON: pilotPassed=true; readyForProduction/mapsEnabled/fusionEnabled/published=false. IFS-Lauf20.10.2026 12UTC, drei Parameter2t/msl/z500 jeweils+0/+24h, insgesamt17009389Bytes. GRIB2/ECMWF, reguläres interpoliertes0,1°-Raster3600×1801 (6483600Punkte), Units K/Pa/m²s⁻², Lauf/Gültigkeit und sieben Samples je Feld. `fullSpatialValidation=false` für jedes Feld. Lokale Wiederholung der vorhandenen9Unit-Tests bestand. Das Artefakt existiert tatsächlich; keine unbelegte Upload-Fehlerbehauptung.

## Konkreter Anschluss an die vorhandene Pipeline

Der0,1°-Pilot ist noch kein vollständiger Ersatz des bisherigen Synoptik-Produkts: T/Q850, T/Q700 und U/V300 fehlen im Pilot;2t ersetzt nicht T850. Eine blinde Änderung0p25→0p1 würde die vorhandenen Komponenten, Range-Limits, Raster-/Payload-/Speicher- und Laufzeitbudgets unbewiesen verändern. Gleicher geografischer Ausschnitt enthält bei0,1° ungefähr6,25mal so viele Zellen wie bei0,25°. Die sechs kleinen Pilotausschnitte beweisen kein vollständiges Produktbudget.

Nächste Integration soll den **vorhandenen** `global_product`-/`write_fields`-/Snapshot-/Katalog-/Export-Pfad erweitern, keinen zweiten Produktionsworkflow schaffen:

1. Offizielle0p1-Indexeinträge für sämtliche bestehenden acht Eingabefelder und alle verlangten Termine eines festgelegten Laufs prüfen; `gh` vs `z` samt Einheit explizit behandeln. Alle Komponenten müssen denselben ausgewählten Quellrastervertrag besitzen.
2. Vollgitter-/Bitmap-/Koordinaten-/Extremwert-/Zeit-/Einheitenprüfung, native Quellen-SHA/Byte-Provenienz und numerische Referenzen vor Zuschnitt/Quantisierung. Quellenraster0,1° ist nicht das interne O1280-Gitter. AIFS nicht als0,1° deklarieren.
3. Download/RAM/CPU, Kartenframes/Konturen/Exporte, unveränderte900MB-Snapshot-/950MB-Sitegrenzen und RUC-Aktualität real messen. Quellenwechsel atomar für das gesamte IFS-Produkt desselben Laufs; keine gemischten0,25°-/0,1°-Komponenten.
4. Bewährte0,25°-Quelle als vollständigen, klar diagnostizierten Rückfall erhalten; gleiche Modellfamilie/Model-ID statt doppelter Gewichtung. Quellenauflösung, ECMWF-Nennung/Lizenz in Karte und Exporten korrekt führen.
5. Bereits vorhandene Source-/Heavy-Karten-/Installer-/Worker-/Pages-/Stable-Gates verwenden. Erst danach0,1° produktiv anbieten; bis dahin den funktionierenden IFS-Kartenpfad behalten.

Die Prüfung führt zu keiner heimlichen0,1°-Aktivierung, keinem Merge von#433 und keiner Störung des laufenden RUC-Kartenreleases. Die Aufnahmepunkte sind jetzt konkret und quellcodebezogen dokumentiert.

Primärquelle nachgeprüft21.10.2026: https://www.ecmwf.int/en/forecasts/datasets/open-data bestätigt IFS0,1° parallel zu0,25° seit20.10.2026, getrennte sfc/pl-Dateien, ungefähr2h spätere Publikation, AIFS weiter0,25° und parameterabhängig angepasste GRIB-Bits-per-Value. Diese Paket-/Pfadänderung ist ein weiterer Grund, den alten0p25-Range-String nicht blind umzuschreiben. Die vorhandenen Felder t/q/u/v/z/gh/msl sind im offiziellen Katalog benannt.
