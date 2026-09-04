# MID 0.9.78.61 – 7d-Regressionsvertrag Buildfix

## Anlass
GitHub Actions Run #893 kompilierte MID v0.9.78.60 mit TypeScript 7 vollständig und baute den Vite-Produktionsstand erfolgreich. Der Release brach erst in der historischen Regressionssuite ab: Zwei Tests erwarteten weiterhin den vor der 7d-Kompaktumstellung sichtbaren ausführlichen Wettercharakter.

## Umsetzung
- Keine Produktionslogik zurückgebaut. Die 7-Tage-Kacheln behalten verbindlich die kompakte einzeilige Kurzform (`Sonnig`, `Regen`, `Schauer`, `Ruhig`, `Windig`, `Warm`, `Schnee`, `Schneeregen`, `Gewitter`).
- `test-app-helper-block-buildfix-097857.mjs` schützt weiterhin den vollständigen App-Helferblock, prüft für die 7d-Kachel aber nun den aktuellen `compactConditionLabel`-Vertrag und verbietet die alte Mehrteil-Pille.
- `test-precipitation-form-snow-units-093222.mjs` schützt weiterhin Niederschlagsart und Schneemengen, erwartet im 7d-Cockpit nun jedoch die kompakte `sevenDayRegimeLabel(...)`-/`regimeText`-Darstellung statt des alten ausführlichen `conditionText`.
- Keine Änderung an Niederschlagsphysik, Prognosedaten, Warnlogik oder Worker-Fachlogik.
