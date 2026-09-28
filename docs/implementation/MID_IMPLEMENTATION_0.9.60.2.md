# MID v0.9.60.2 – Weather aggregate type fix

- Behebt den CI-TypeScript-Fehler TS7006 im eventbezogenen Ensemble-PoP-Pfad.
- Die Typisierung des `freshness`-Callbacks liegt jetzt in der kanonischen weather-Teilquelle und überlebt `maintain:aggregates`.
- Neue Pflichtregression schützt den Typvertrag zwischen `src/weather-src/*` und dem erzeugten `src/weather.ts`.
- Keine fachliche Änderung der Modellgewichtung, PoP-Semantik oder Wetterzwilling-Logik gegenüber v0.9.60.1.
