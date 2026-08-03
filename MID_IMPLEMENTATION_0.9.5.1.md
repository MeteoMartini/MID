# MID v0.9.5.1

## Anlass

Der GitHub-Produktionsbuild von v0.9.5.0 brach in `src/EnsemblePanel.tsx` mit zwei TypeScript-Fehlern `TS2345` ab. Die Vorschau des Wind-/Böen-Schalters übergab den reinen Anzeige-String `kt` an `weather.wind()`, obwohl der zentrale Typ `WindUnit` intern `kn` verwendet und erst bei der Ausgabe `kt` schreibt.

## Korrektur

- beide Aufrufe in `EnsembleMetricDeck` verwenden nun die gültige interne Einheit `kn`
- die sichtbare Beschriftung bleibt unverändert `kt`
- keine fachliche Änderung an Windwerten, Umrechnung, Farben oder Diagrammskalierung
- neuer Regressionstest schützt die Trennung zwischen internem `WindUnit='kn'` und sichtbarer Einheit `kt`

## Version

Wartungsrelease `0.9.5.1` auf Basis von `0.9.5.0`.
