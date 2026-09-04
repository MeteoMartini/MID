# MID Implementation 0.9.78.50

## Schwerpunkt
Hybrid-Warnungen und MID-Prognosehinweise fachlich und visuell bereinigt.

## Umgesetzt
1. **DWD-Untertitel mit offiziellen Werteketten**
   - `officialAlertMetric()` wertet jetzt neben Beschreibung auch `instruction` aus.
   - Bei Wind-/Schneeverwehungswarnungen werden für die aktuell gewählte Einheit direkte DWD-Angaben bevorzugt (z. B. `33 kn` statt intern gerundet `32 kt`).
   - Der amtliche Warntext bleibt unverändert.

2. **MID-Hinweise ohne Prompt-Artefakte**
   - Zusätzliche Hilfs-/Prompt-Schnipsel innerhalb des expandierten MID-Hinweises entfernt.
   - Footer-Hinweise unterhalb der Sektion entfernt.

3. **Probabilistische MID-Warnfenster**
   - Neue Hilfslogik in `weather` für parameterabhängige Unsicherheits-/Zeitfenster (`hazardProbabilisticWindow`).
   - Für Wind, Gewitter, Starkregen, Dauerregen, Schnee, Schneeverwehungen, Nebel, Glätte, Hitze und Frost werden MID-Hinweise zeitlich verbreitert und als Wahrscheinlichkeitsbereich dargestellt.
   - Windböen-Bänder berücksichtigen einen probabilistischen Korridor, so dass der MID-Hinweis begründet über der Punktvorhersage liegen kann.

## Betroffene Dateien
- `src/App.tsx`
- `src/weather-src/30-ensemble-climate-hazards.tsfrag`
- `src/weather.ts`
- `scripts/test-warning-hybrid-probabilistic-097850.mjs`
- `package.json`
- `MID_BASELINE.json`
- `CHANGELOG.md`
