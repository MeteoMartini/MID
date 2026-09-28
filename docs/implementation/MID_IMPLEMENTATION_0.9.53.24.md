# MID v0.9.53.24

## Aktuelles Wetter: kompakte Hauptdarstellung bei vollständiger Datenbasis

- Marginale hyperlokale Restfeldkorrekturen werden in der Hauptkarte wieder zusammengefasst: Temperaturkorrekturen unter 0,2 K und Gelände-Windkorrekturen unter 1 % erscheinen als „Temp./Wind nahe Modell“ statt als scheinbar relevante Einzelwerte.
- Relevante Korrekturen bleiben numerisch sichtbar; der Modellhintergrund (z. B. DWD ICON-D2 · 2 km) bleibt in der Hyperlokalzeile erhalten.
- Die Einzelparameter-Kacheln werden wieder kompakter: Modellhintergrund und kleine Windkorrekturen werden nicht redundant in jede sichtbare Detailzeile geschrieben.
- Die Informationsdialoge der Parameter enthalten dafür wieder eine vollständige „Datenbasis“ mit Modellhintergrund, Analyseverfahren, Kontextquellen und parameterbezogenen Messwertquellen einschließlich Entfernung, Stand, Datenintervall, Gewicht und Qualitätskennzeichnung, soweit verfügbar.
- Liegt für einen Parameter keine ausreichend aktuelle Messwertquelle vor, weist die Info explizit aus, dass der Wert aus dem Modellhintergrund stammt.
- Die detaillierte Hyperlokal-Info behält die exakten Korrekturwerte, Gelände-/Oberflächeninformationen, Messnetze und Kontextquellen.

Neue Required-Regression: `scripts/test-current-data-basis-compact-095324.mjs`.
## Buildfix

- `forecastSourceLabel` wird innerhalb von `Current` vor seiner ersten Verwendung in der Hyperlokal-Datenbasis deklariert.
- `scripts/test-hyperlocal-parameter-relevance-09510.mjs` prüft die Deklarationsreihenfolge, damit TS2448/TS2454 nicht erneut auftreten.

