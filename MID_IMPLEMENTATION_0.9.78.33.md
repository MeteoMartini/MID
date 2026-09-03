# MID v0.9.78.33

## Release-Installer-Hotfix nach GitHub Actions #869

Der Release-Lauf #869 baute MID v0.9.78.32 erfolgreich mit TypeScript 7.0.2 und Vite 6.4.3, scheiterte danach ausschließlich an zwei Regressionstests.

- `test-ensemble-resume-refresh-097619.mjs` erwartete noch die alte wörtliche 45-s-Timerimplementierung. Der produktive Ensemble-Pfad besitzt jetzt einen robusteren Retryvertrag: ein transienter Fehler markiert einen ausstehenden Retry; der Timer bleibt aktiv, und nach Hintergrundphase oder Offlinezustand wird bei `visibilitychange` bzw. `online` unmittelbar weitergeladen. Vorhandene Ensemble-Daten bleiben sichtbar.
- `test-witterung-seven-day-curve-097729.mjs` prüfte noch auf die frühere inline `segmentRx`-Implementierung in `ForecastCockpit.tsx`. Die Rundungs-/Nahtlogik liegt seit v0.9.78.32 korrekt im gemeinsamen `SkyBarSegmentsSvg`-Renderer. Die Regression prüft nun den tatsächlichen Komponentenvertrag inklusive kantenloser Nachbarschaftsverbindung und gerundeter Außenkanten.

Keine fachliche Worker-Funktion wurde geändert. Die Worker-Version wird nur releaseweit synchronisiert.
