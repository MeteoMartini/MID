# MID v0.9.79.18 – CI-Regressionsfix nach Release #927

## Ursache
GitHub-Release #927 installierte die Abhängigkeiten erfolgreich und baute TypeScript/Vite vollständig. Anschließend scheiterte genau eine von 716 Regressionen: `scripts/test-day-detail-probability-wind-contrast-09700.mjs`.

Der Test erwartete noch die ältere punktweise Erzeugung der Niederschlagswahrscheinlichkeitskurve über `p.map`. Seit v0.9.79.16 wird die PoP-Kurve fachlich korrekt als stufenförmiges Vorwärtsintervall über `p.reduce` aufgebaut, damit z. B. der Wert 19:00 das Intervall 19:00–20:00 belegt.

## Korrektur
- Keine Änderung an `App.tsx` oder der sichtbaren Wetterdarstellung.
- Die historische Regression erkennt nun den aktuellen `p.reduce`-Intervallpfad.
- Zusätzlich wird explizit geschützt, dass `showProbability` den Niederschlagsbereich auch ohne Mengenbalken öffnet und die PoP-Kurve nicht an `showRainBars` gekoppelt ist.
- Kontrast-Halo und zentrale Niederschlagsfarbe bleiben unverändert geprüft.

## Worker
Keine fachliche Workeränderung. Nur die Releasekennung wird versionssynchronisiert.
