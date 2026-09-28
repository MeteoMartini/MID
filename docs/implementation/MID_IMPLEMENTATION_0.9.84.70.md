# MID 0.9.84.70 – Implementierung

## Ausgangsbasis
Fortsetzung des lokalen, zuletzt gelieferten MID 0.9.84.69. Zum Start und vor der Bearbeitung standen GitHub `main` und `mid-stable` noch auf 0.9.84.68; deshalb wurde der neuere lokale 0.9.84.69-Fortsetzungsstand nicht verworfen.

## Änderungen
1. App-weiten Designvertrag in `src/styles-src/30-modern.css` ergänzt. Er umfasst Klima, Meteogramm, Ensemble, Langfrist, Subseasonal, Synoptik, Flugmeteorologie, Wasser, Events, Reise, Wetterkarten, Lüftungsassistent, Extremwetter, DWD-Radar, Kurzfrist, Warnungen und Radar. Bereits zuvor gehärtete Istwetter-, Forecast-/14-Tage-, Settings- und Navigationsbereiche bleiben bestehen.
2. Touch-/Hybrid-Controls in Toolbars, Controls und Actions erhalten 44 px Mindestziel; Fine-Pointer-Desktop bleibt kompakt.
3. iOS/iPadOS-Eingaben auf Touchbreiten mit 16 px abgesichert, um Fokuszoom in WebKit zu vermeiden.
4. Visualisierungs-Audit Block 1: Klima, Meteogramm, Ensemble, 7-Tage-Kurve, Langfrist/Subseasonal und Synoptik mit gezielten Mindestgrößen für Achsen, Legenden und Tooltips.
5. Zwei neue Regressionen: `test-appwide-design-coverage-098470.mjs` und `test-visualization-readability-098470.mjs`.
6. `src/styles.css` aus den fünf kanonischen CSS-Modulen neu synchronisiert.
7. Releaseversion auf 0.9.84.70 synchronisiert, einschließlich Service Worker, iOS-Metadaten und Worker-Versionstring.

## Finaler Quellenabgleich
Unmittelbar vor der Paketierung standen GitHub `main` und `mid-stable` beide auf dem erfolgreich installierten MID 0.9.84.69 (Commit `327e28e285ec40c6baf6c813c689126055ac034d`). Der lokale 0.9.84.70-Stand ist damit die direkte Fortsetzung des aktuellen kanonischen Stable-Stands.

## Nicht geändert
Keine fachliche Worker-Logik, keine Wetterdatenlogik, keine Modellgewichtung, keine Warnlogik, keine Piktogramm- oder Parameterfarblogik.
