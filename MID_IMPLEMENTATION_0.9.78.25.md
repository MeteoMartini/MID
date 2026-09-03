# MID 0.9.78.25

## Trends 14 d+

Der Bereich `Trends 14 d+` ist verbindlich in zwei visuell und semantisch getrennte Untersektionen gegliedert:

- **Witterungstrend**: Tag 15–46 mit ECMWF EC46 und NOAA GEFS, Wochenblöcken, eigener Modell-/Parameterwahl und bestehender probabilistischer Darstellung.
- **Saisonvorhersagen**: Monats- und 3-Monats-Anomalien, Poor-Man’s-Ensemble, Einzelmodellvergleich und DWD-Deutschland-Perspektive.

Die Datenwege bleiben fachlich getrennt; die Untergliederung ist eine UI-/Informationsarchitekturänderung und führt keine neue Modell-Doppelgewichtung ein.

## 14-Tage-Sonnenscheindauer

Die 14-Tage-Kachel behält Stundenwert und P10–P90-Spanne unverändert bei. Nur das Sonnensymbol erhält eine relative Zusatzkodierung:

- 100 % der astronomisch möglichen Sonnenscheindauer: vollständige gelbe Sonne.
- 50 %: vier von acht Strahlen gelb.
- 0 %: vollständige Darstellung im bisherigen gedeckten Sonnenton.
- Der Sonnenkern blendet kontinuierlich zwischen Grundton und Parameterfarbe.

Als 100-%-Bezug dient die jeweilige astronomische Tageslänge aus `sunrise`/`sunset`; der Quotient wird auf 0–100 % begrenzt. Fehlende Daten werden nicht erfunden.

## Plattformvertrag

Die Änderung liegt im gemeinsamen React-/Vite-Fachkern und gilt identisch für Browser, PWA und die Capacitor-iOS-Hülle. Es gibt keine fachliche Worker-Änderung.
