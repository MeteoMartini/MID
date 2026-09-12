# MID 0.9.84.73 – Implementierung

## Ausgangsbasis
Direkte Fortsetzung des zuletzt gelieferten MID-Standes 0.9.84.72 auf Basis des erfolgreichen Stable-Standes 0.9.84.71 (`64dccfafa8f95c35f9668d6e7213d271442414f3`). Der Upload von 0.9.84.72 erreichte `main` als Commit `64ec10d712cb334ec3f5e543f1e016290958383d`, wurde aber nicht nach `mid-stable` promotet, weil der GitHub-Installer im TypeScript-Schritt an zwei nach der Istwetter-Verdichtung ungenutzten Imports scheiterte. v0.9.84.73 übernimmt alle funktionalen Änderungen aus 0.9.84.72 und enthält den gezielten Buildfix.

## Änderungen
1. Buildfix: `formatDayLengthChange` und `formatDuration` aus dem Astronomie-Import in `src/App.tsx` entfernt. Beide Helfer wurden nach der v0.9.84.72-Verdichtung nicht mehr verwendet; Wetter-/Astronomielogik bleibt unverändert.
2. Detail-/Popover-Audit für Datenbasis, UV-Index, Modelländerungsradar, Advanced Features und Push-Hinweise: historische 7–9-px-Texte auf semantische MID-Typografie angehoben.
3. Spät geladenes `v078.css` nachgezogen: Modellstände, Berg-/Wasser-Inline-Steuerungen und mobile Tmin/Tmax-Pille können die neueren Designverträge nicht mehr durch ältere Mikrogrößen überschreiben.
4. Ensemble-Tooltip neu skaliert: Desktop bis 340 px, Mobile bis 320 px und eigener <=360-px-Fallback; dichte Meta-/Matrixzeilen bleiben kompakt, sinken aber nicht mehr auf 7–8 px.
5. Stunden-Tooltip-Schließen auf 36 px und auf Touch 44 px angehoben.
6. Langfrist-/DWD-/C3S-Statusblöcke nachgezogen; Modellstatus, Qualitätsangaben und Quellenmetadaten verwenden jetzt `--mid-text-micro/xs`.
7. Modellstand-/Inline-Controls auf Touchgeräten mindestens 44 px; Fine-Pointer-Desktop bleibt kompakt.
8. Regression `scripts/test-secondary-detail-popover-readability-098473.mjs` ergänzt und um den TypeScript-Buildfix-Schutz erweitert; `test-current-header-density-098472.mjs` versionsresilient gemacht.
9. `src/styles.css` aus den fünf kanonischen Stylesheet-Modulen neu erzeugt und Releaseversion auf 0.9.84.73 synchronisiert.

## Nicht geändert
Keine meteorologische Messwert-/Forecastlogik, keine Modellfusion oder Quellengewichtung, keine Ensembleberechnung, keine Warnschwellen, keine Radar-/Nowcastlogik, keine WMO-/DWD-Terminologie, keine Wetterpiktogramme und keine Parameterfarben. Worker-Domainlogik unverändert; nur `WORKER_VERSION` synchronisiert.
