# MID Implementation v0.9.78.6

Datum: 2026-09-03

## Anlass

Für 53859 Niederkassel/Rheidt zeigte die operative Stundenprognose im Vergleich zur DWD-Punktdarstellung auffällig hohe Niederschlagsmengen. Die Codeprüfung ergab keinen klassischen Faktor-/Summenfehler, aber eine zu aggressive deterministische RUC-Mengenfusion: ein nasser RUC erhielt bislang zusätzliches Gewicht, während der bereits geladene DWD-MOSMIX-Punktniederschlag nicht genutzt wurde.

## Umsetzung

### MOSMIX-Stundenniederschlag

`fetchMosmixForecast()` übernimmt zusätzlich das Bright-Sky-Feld `precipitation`. Dieses Feld beschreibt die Niederschlagsmenge der vorherigen 60 Minuten und ist zeitlich mit den ebenfalls als vorangegangene Stunde definierten Open-Meteo-Stundenakkumulationen kompatibel. MOSMIX bleibt ein DWD-Postprocessing-Pfad und wird nicht als unabhängige Modellfamilie in den Mehrmodellkonsens aufgenommen.

### Getrennter RUC-Niederschlagsanteil

Die meteorologische RUC-Gewichtung für Temperatur, Wind, Wolken und konvektive Parameter bleibt erhalten. Für die Niederschlagsmenge gilt ein eigener Vertrag:

- kein Nass-Selbstbonus mehr,
- bei deutlich nasserem RUC Vergleich mit Best Match, MOSMIX und RUC-EPS,
- kontinuierliche statt binärer Dämpfung,
- keine pauschale Mengenobergrenze,
- konvektiv und probabilistisch gestützte RUC-Signale behalten substantiellen Einfluss.

### Kohärente Niederschlagsphase

Nach der finalen Mengenfusion werden Regen-, Schauer- und Schneeanteile proportional auf die neue Gesamtmenge skaliert. Damit kann die Mengenfusion nicht mehr einen hohen Stundenwert erzeugen, während die Komponenten noch die alte Best-Match-Menge repräsentieren.

### Diagnose

Jede RUC-kalibrierte Stunde kann nun intern ausweisen:

- `basePrecipitationMm`,
- `rucRawPrecipitationMm`,
- `rucPrecipitationWeight`,
- `rucPrecipitationSupport`,
- `mosmixPrecipitationMm`,
- `mosmixPrecipitationWeight`,
- `rucEpsProbability`.

Damit lassen sich künftige lokale Ausreißer ohne Rückrechnung direkt nachvollziehen.
