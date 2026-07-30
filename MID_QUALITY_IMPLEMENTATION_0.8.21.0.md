# MID v0.8.21.0 – Genauigkeits- und Performanceverbesserungen

## Umgesetzt

- Zentrales Quellenqualitätsregister für amtliche, professionelle, PWS- und Bürgernetze.
- Feldspezifische räumliche und zeitliche Gewichtung für Temperatur/Feuchte, Wind, Sicht/Bewölkung und Niederschlag.
- Berücksichtigung von Standorttyp, Höhendifferenz und Quellen-Vertrauensfaktor.
- Konservative Dämpfung lokaler Restfeldkorrekturen bei nur einem schwachen oder weit entfernten Messsignal; mehrere übereinstimmende Messpunkte erhöhen die Stützung.
- Explizite 10-/60-Minuten-Niederschlagsintervalle und Normalisierung vor der Assimilation.
- Kurzzeitcache für Stationsanalyse und Modellhintergrund mit begrenztem Stale-Fallback.
- Lokaler Worker-Antwortcache und Circuit-Breaker für wiederholt fehlschlagende Endpunkte.
- Cache-Limits gegen unbegrenztes Speicherwachstum.
- Worker-Vertrag um Niederschlagsintervalle für DWD/Bright Sky, GeoSphere und Synoptic erweitert.

## Bewusst noch nicht automatisch aktiviert

- Direkter Parser für die DWD-POI-/BEOB-Dateien: Die amtliche Quelle ist geeignet, benötigt aber einen belastbaren Stationsindex, dokumentierte Spaltenzuordnung und einen eigenen Worker-Cache, damit keine Vielzahl einzelner Dateien abgefragt wird.
- Numerische MTG-Wolkenmaskenassimilation: Sie bleibt ein sinnvoller nächster Schritt, erfordert aber eine räumliche Pixelabfrage und Qualitätskontrolle, damit die zusätzliche Quelle nicht mehr Datenverkehr als Nutzen erzeugt.
- Direkte LINET-Punktdaten: weiterhin nur mit autorisiertem nowcast/LINET-Zugang möglich.

## Prüfstrategie

- 169 automatisch erkannte Regressionstests in getrennten Testbatches erfolgreich ausgeführt.
- 58 TypeScript-/TSX-Dateien syntaktisch geprüft.
- Neue reine TypeScript-Module unter `strict`, `noUnusedLocals` und `noUnusedParameters` geprüft.
- Worker und beide Service Worker per `node --check` geprüft.
