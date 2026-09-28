# MID v0.9.36.3

## Kumuliertes 14-Tage-Ensemble – Niederschlag

### Fehlerbild
Im kumulierten Diagramm war das P25–P75-Band zwar als Ebene vorhanden, konnte aber trotz breitem P10–P90-Bereich `0,0–0,0 mm` anzeigen. Ursache war nicht Recharts, sondern die Aggregationsmethode: tägliche P25-/P75-Quantile wurden addiert. Bei Niederschlag sind Tagesverteilungen häufig stark null-inflationiert, sodass tägliche Quartile an mehreren Tagen null sein können, obwohl einzelne Ensemblemitglieder über den Gesamtzeitraum deutliche Summen erzeugen.

### Korrektur
- Für jedes Ensemblemitglied und jeden Vorhersagetag wird zunächst die Niederschlagssumme vom ersten bis zum aktuellen Vorhersagetag gebildet.
- Erst aus diesen kumulierten Member-Summen werden gewichtetes P10, P25, Mittel, P75 und P90 berechnet.
- Modellfamilien behalten die bestehende Gewichtungslogik; die Membergewichte werden innerhalb der Familie entsprechend normalisiert.
- P10–P90 und P25–P75 werden damit aus derselben kumulierten Verteilung abgeleitet.
- Best Match wird weiterhin aus den Best-Match-Tagesmengen kumuliert.
- Alte Ensemble-Caches ohne die neuen kumulierten Felder werden beim Lesen verworfen und automatisch neu aufgebaut.

### Dateien
- `src/weather.ts`
- `src/EnsemblePanel.tsx`
- `scripts/test-ensemble-cumulative-rain-09360.mjs`
- `scripts/test-ensemble-cumulative-rain-quartiles-09362.mjs`
- `scripts/test-ensemble-cumulative-member-quantiles-09363.mjs`

### Prüfung
- 354/354 automatisch erkannte MID-Regressionstests bestanden (vollständig in vier Laufblöcken ausgeführt).
- `src/weather.ts` und `src/EnsemblePanel.tsx` zusätzlich mit dem TypeScript-Parser geprüft.
- Cloudflare-Worker per `node --check` geprüft.

## Worker
Keine funktionale Workeränderung. Worker-ZIP wird nur versionssynchronisiert.
