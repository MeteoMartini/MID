# MID Implementation 0.9.78.54

## Schwerpunkt
CI-Korrektur für GitHub-Release #886. Der Produktionsbuild von v0.9.78.53 war bereits erfolgreich; der Lauf wurde ausschließlich von sieben historischen Regressionen blockiert, deren Quelltext-Erwartungen nicht mehr dem seit v0.9.78.49–.53 verbindlichen Warnungs-/Ensemblevertrag entsprachen.

## Umgesetzt

1. **Warnkarten-Hilfstexte**
   - Ältere Regressionen erwarten die bewusst entfernten Hilfs-/Prompttexte nicht mehr.
   - Geschützt bleibt stattdessen die kompakte Kennzeichnung `MID · PROGNOSEHINWEIS` sowie die Abwesenheit der entfernten Texte.

2. **Probabilistische Warnfenster**
   - Der historische Gültigkeitszeitraum-Test prüft nun den aktuellen probabilistischen Fenstertitel statt des früheren deterministischen Hinweises.
   - Disclosure bleibt vollständig erhalten; Tagesgruppen und Einzelhinweise erscheinen weiterhin erst nach Aufklappen.

3. **Windrichtung in MID-Hinweisen**
   - Drei ältere Tests prüfen weiterhin die echte Windrichtungslogik einschließlich Richtungswechsel und 360°-Übergang.
   - Ihr statischer Datenvertragscheck folgt nun dem aktuellen Aufbau: `weather.ts` speichert den richtungsfähigen Basistext direkt; die probabilistische Präsentationsschicht erzeugt den sichtbaren `displayText`.
   - Der entfernte Open-Meteo-/Nicht-amtlich-Disclaimer wird nicht wieder eingeführt.

4. **Ensemble-Resume**
   - Der Same-location-Reload-Test wurde von einer fragilen exakten Quelltextzeichenfolge auf eine semantische Prüfung des `if(!hadWeather)`-Schutzblocks umgestellt.
   - Der neu hinzugekommene `warningEnsemble`-Zustand darf den bewährten letzten Ensemble-Stand nicht als vermeintliche Regression erscheinen lassen.

## Fachliche Wirkung
Keine meteorologische Produktionslogik wurde geändert. Die Korrektur beseitigt ausschließlich veraltete Regressionserwartungen und schützt dabei die neueren Verträge strenger gegen eine versehentliche Rückkehr der entfernten Hilfstexte.

## Worker
Keine funktionale Worker-Änderung. Worker und Service Worker werden nur auf 0.9.78.54 versionssynchronisiert.
