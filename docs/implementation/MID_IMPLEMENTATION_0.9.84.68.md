# MID 0.9.84.68 – Implementierungsnachweis

## Ausgangsbasis
- Fortsetzung des lokalen, bereits geprüften MID-Standes 0.9.84.67.
- Vor Beginn des Merges standen GitHub `main` und `mid-stable` auf 0.9.84.66; damit war der lokale 0.9.84.67-Stand die neuere Projektfortsetzung. Unmittelbar vor der finalen Paketierung wurden beide Zweige erneut geprüft und standen inzwischen auf dem erfolgreich installierten v0.9.84.67-Commit `a796b8f3bd306e6c0d2e8dbae0ff251fee63578a`. Damit baut v0.9.84.68 direkt auf dem nun auch kanonisch bestätigten v0.9.84.67 auf.
- Eingebundener Zusatzpatch: `MID-OpenMeteo-Watch-20260912(1).patch`.

## Open-Meteo-Watch
Der Patch wurde semantisch auf den aktuellen modularen MID-Stand übertragen. Seine Hunks besitzen keine Standard-Zeilenpositionsangaben und ließen sich deshalb nicht blind mit `patch` anwenden; die Änderungen wurden gegen die jeweiligen kanonischen Source-Fragmente verifiziert und anschließend über den MID-Aggregat-Builder reproduzierbar erzeugt.

### KMA
- `kma_ldps` und `kma_gdps` aus dem aktiven Frontend-Modellkatalog entfernt.
- Dieselben Modelle aus `FORECAST_FUSION_MODELS` des Workers entfernt.
- Verwaiste `kma_gdps`-Referenz aus der globalen Worker-Auswahl entfernt.
- Südkorea-Hintergrundkette von KMA LDPS auf `jma_msm` → `jma_seamless` → `best_match` umgestellt.
- Veraltetes KMA-LDPS-Anzeigelabel aus dem Hyperlokalpfad entfernt.

Begründung: Open-Meteo dokumentiert, dass KMA die UM-basierten Modelle Ende März 2026 eingestellt und auf KIM umgestellt hat; Open-Meteo hat KMA-Updates während der Migration der neuen Quelle suspendiert.

### Météo-France AROME HD 15 min
- In der bestehenden Worker-Familie `meteofrance_arome` wird `meteofrance_arome_france_hd_15min` nun zuerst probiert.
- Stündliches AROME HD, AROME France und Météo-France Seamless bleiben unverändert als Fallbackpfade erhalten.
- Damit wird kein zusätzlicher unabhängiger Modellstimmanteil erzeugt; die bestehende Météo-France-Unabhängigkeitsgruppe bleibt erhalten.

Begründung: Open-Meteo Commit `9701689dd81ebef2d478800366c586c8a02c0c19` vom 11.09.2026 behandelt fehlende native 15-min Niederschlags- und Schneeschritte von AROME France HD. Fehlende Viertelstunden werden aus rollierenden Stundensummen und den drei vorangegangenen Viertelstunden deaggregiert.

## Design-/Konsistenzaudit – Fortsetzung
- Ensemble-Erweiterungsheader erhalten eine Mindesthöhe von 40 px, auf groben Touch-Pointern 44 px.
- Mikrotexte der Ensemble-Offenlegung, Szenario-Erklärung, Modelllauf-Änderungsradar, Prognose-Kompass und Wetter-Quickfacts verwenden die gemeinsame MID-Typografieskala `--mid-text-micro/xs`.
- Keine Diagrammgeometrie, Ensembleberechnung, Wahrscheinlichkeit, Modellgewichtung oder Szenario-Clustering verändert.

## Funktionsschutz
Unverändert bleiben insbesondere:
- WMO-/DWD-Wetterterminologie und Piktogramme,
- Niederschlagsphasen- und Farblogik,
- 15-/60-/90-Minuten-Zeitverträge,
- Warnschwellen und amtliche Warntrennung,
- Ensemble-Unabhängigkeitsgruppen und deren Gewichtung,
- Radar/Nowcast/Komposit sowie Hyperlokal- und Forecast-Fusion außerhalb der genannten Modellquellenänderungen.
