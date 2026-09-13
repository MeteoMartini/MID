# MID Testbericht 0.9.84.83

## Geprüft

- sichtbare 1-h-RADOLAN-Menge in „Aktuelles Wetter → Niederschlag“;
- sichtbare 24-h-RADOLAN-Menge in derselben Kachel;
- RW bleibt als angeeichte 1-h-Quelle priorisiert;
- RY bleibt ausschließlich nicht angeeichter 1-h-Fallback;
- SF bleibt angeeichte 24-h-Quelle;
- Produkt-/Angeeicht-Status bleibt im Info-Bereich erhalten;
- bestehende Aktuell-Wetter-, Karten-, Nowcast- und Historienverträge bleiben unverändert.

## Ergebnis

Die fokussierten Regressionen für aktuelle Wetterkarten, ausklappbare Metriken, Nowcards, Niederschlagsdarstellung und RADOLAN-Rückschau bestehen. Der neue Vertrag `test-current-precip-radolan-history-visible-098483.mjs` besteht ebenfalls.

Ein vollständiges lokales `npm ci` konnte in der isolierten Containerumgebung nicht zuverlässig beendet werden und wird deshalb nicht als bestandener Vollbuild ausgewiesen. Der letzte bekannte GitHub-Installerfehler aus v0.9.84.81 (`TS6133` im SubseasonalTrendPanel) ist bereits in v0.9.84.82 behoben und von dieser Änderung nicht berührt.
