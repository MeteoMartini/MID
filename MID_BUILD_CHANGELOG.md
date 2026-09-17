# MID Build-Changelog · v0.9.85.32

## Redesign-Stufe C12 · Vorhersage

- `src/midC12ForecastRedesign.css` wird nach C11 geladen und setzt die verbindliche visuelle Hierarchie der Vorhersage um.
- 7 Tage: Verlaufsgrafik bleibt Primärvisualisierung; Tageswerte bilden ein zusammenhängendes Band; die stündliche Detailansicht wird in denselben Arbeitsraum integriert.
- 14 Tage: Ensemble-/Konsistenzinformationen bleiben vollständig erhalten; Tagesdarstellung wird als fortlaufende Spalten organisiert; der gewählte Tag erhält eine integrierte Detailtiefe statt einer zweiten gleichgewichteten Karte.
- Responsive Verträge schützen Smartphone Hoch-/Querformat, Tablet, Desktop, Safe-Areas, horizontale Prognosebereiche und reduzierte Bewegung.
- Keine Änderung an Wetterdaten, Nowcast-/RUC-Logik, Warnschwellen, Piktogrammlogik, Parameterfarben oder Zeitsemantik.
- `scripts/test-c12-forecast-redesign-098532.mjs` schützt Struktur, Auswahlzustände, Responsive-Verträge und den ausgelieferten, nichttechnischen App-Changelog.

## Veröffentlichung

Verbindlicher Pfad: **Source-PR-Gate → Auto-Merge → Release-ZIP → Installer → Stable-Promotion**. Der Stand darf erst nach grünem Gate und erfolgreicher Stable-Promotion als veröffentlicht gelten.
