# MID Weather-Regime Colour Contract

Stand: MID v0.9.79.11

## Ziel
Sichtbare Wetterregime werden app-weit fachlich gleich klassifiziert und farblich gleich dargestellt. Unterschiedliche Ansichten dürfen keine eigene Regimeentscheidung oder eigene Regimepalette pflegen.

## Gemeinsame Fachlogik
`src/forecastRegime.ts` ist der kanonische Vertrag.

- Typ: `ForecastDayRegime`
- Klassifikation: `forecastDayRegime(day, hours)`
- Kurzlabel für Regimeansichten: `forecastRegimeLabel(...)`

Die sechs visuellen Regime bleiben:
- `wet`
- `showery`
- `sunny`
- `windy`
- `warm`
- `quiet`

Die kompakte 7-Tage-Kurzform darf weiterhin ansichtsgerecht „Schauer“, „Regen“, „Schnee“ usw. formulieren, muss ihre zugrunde liegende Regimeklasse aber ebenfalls aus `forecastDayRegime(...)` beziehen.

## Verbindliche Root-Farbvariablen
- `--weather-regime-wet`
- `--weather-regime-showery`
- `--weather-regime-sunny`
- `--weather-regime-windy`
- `--weather-regime-warm`
- `--weather-regime-quiet`

## Verbindliche UI-Ableitung
Regimefarben werden über `--mid-weather-regime-accent` abgeleitet. Der Vertrag umfasst:
- 7-Tage-Cockpitkarten und Regime-Pillen
- 14-Tage-Cockpitkarten und Regime-Pillen
- mobile Kartenhintergründe
- Mini-Ribbons / historische Phase-Line
- 7-Tage-Legende
- klassische 7-Tage-Ansicht (`ForecastConditionPills`)

## Kritische Guards
1. `showery` muss eigenständig behandelt werden und darf weder auf `wet` noch auf Grau zurückfallen.
2. Die klassische 7-Tage-Pille erhält dieselbe Regime-Akzentfarbe wie das Forecast-Cockpit.
3. Neue Regimefarben dürfen nicht als lokale Hexwerte in den genannten Komponenten eingeführt werden.
4. Warnstufen-, Parameter- und Temperaturfarben bleiben eigene Verträge und werden nicht mit Wetterregimefarben vermischt.
