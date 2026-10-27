# MID v0.9.85.347 · Automatische Revision: Chromium und WebKit vollständig vorbereiten

Die automatische und nächtliche MID-Code-Revision installiert die fest vorgegebenen Chromium- und WebKit-Laufzeiten einschließlich benötigter Systembibliotheken jetzt vor der vollständigen Regression in einem separat zeitlich begrenzten Schritt. Dadurch ist die WebKit-Prüfung der 14-Tage-CSS-Parität auch auf frisch gestarteten Runnern ausführbar. Eine gescheiterte Browserbereitstellung bleibt ein harter Fehler und wird in der nächtlichen Revision ausdrücklich gemeldet. Das Zeitbudget berücksichtigt die zusätzliche Vorbereitung; kein Browser, visueller Vergleich oder Regressionstest wird übersprungen.

Wetterwerte, Modelle, RUC, amtliche Warnungen, Karteninhalte und UI bleiben fachlich unverändert.
