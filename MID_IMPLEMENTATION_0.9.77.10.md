# MID Implementation v0.9.77.10

## Install-/Deploy-Run #817
Der GitHub-Installer #817 kam erfolgreich durch ZIP-Entpacken, `npm ci` und Dependency-Audit und scheiterte anschließend ausschließlich im TypeScript-Gate. Die fünf konkreten Ursachen sind behoben:

- ungenutztes `safeCape` in der sommerlichen Bergzonenbewertung entfernt;
- obsoleten `daySpan`-Helper im Witterungstrend entfernt;
- Klimacache explizit als `ClimateCache` typisiert;
- Null-/Narrowing-Pfad des Klimacaches vor der Wochenaggregation stabilisiert;
- leere Klimabuckets explizit als `number[]` typisiert statt `never[]` zu erzeugen.

## Witterungstrend · Modellstand
- Der bisherige Datenabrufzeitpunkt wird nicht mehr als Modellstand missverstanden.
- MID fragt die Open-Meteo-Metadaten für `ecmwf_ec46` und `ncep_gefs05` ab und zeigt – sofern verfügbar – `last_run_initialisation_time` als tatsächlichen Modelllauf in UTC.
- Der Zeitpunkt des MID-Datenabrufs bleibt separat als **Datenabruf** sichtbar.
- Fällt die Metadatenabfrage aus, bleibt der Trenddatenabruf fail-soft funktionsfähig und behauptet keinen erfundenen Modelllauf.

## Kurzfristdiagramm · blaue Referenzlinie
An der ausgewählten blauen Zeitlinie werden nun direkt die Werte der zentralen Parameter angezeigt:

- Bewölkung gesamt sowie H/M/L,
- Temperatur, gefühlte Temperatur und Taupunkt,
- Niederschlagsmenge und -wahrscheinlichkeit,
- Wind und Böen in der gewählten Einheit,
- MSL-Luftdruck.

Die Beschriftungen folgen dem appweiten Parameter-Farbvertrag und wechseln am rechten Diagrammrand automatisch die Textausrichtung, damit sie mobil lesbar bleiben.

## Worker
Keine fachliche Worker-Änderung. Eine durch Versionssynchronisierung geänderte Worker-Versionskonstante ist keine semantische Worker-Änderung.

## Install-/Deploy-Run #818
Run #818 bestätigte erneut ZIP-Entpacken, `npm ci` und Dependency-Audit als grün und scheiterte anschließend an genau einem TypeScript-Vertrag: Die neue Open-Meteo-Modellstand-Abfrage verwendete `priority: 'low'`, obwohl MID ausschließlich `foreground | normal | background` zulässt.

- Die nichtkritische Metadatenabfrage läuft jetzt korrekt mit `priority: 'background'`.
- Dadurch bleibt sie bei Rate-Limits nachrangig und kann den eigentlichen Witterungstrend nicht blockieren.
- Der Buildfix-Regressionsvertrag prüft explizit, dass `low` nicht mehr vorkommt und `background` verwendet wird.
