# MID v0.9.18.5

## Schwerpunkt
Meteorologisch präzisere Überarbeitung des 24-h-Meteogramms nach Vergleich mit der Kachelmann-Wetter-Anmutung.

## Umgesetzt
- klare Datum-/Zeitachse mit separaten Stundenmarken und Tagesmarkern im 24-h-Meteogramm
- wetterbezogene Symbole nur noch auf Achsenpunkten statt an jeder Stunde, dadurch deutlich weniger Überlagerung
- Umstellung der unteren Windsignale auf meteorologische Windfiedern nach WMO-Prinzip (Geschwindigkeit in Knoten, Richtung = Wind aus ...)
- mobile Verdichtung der Meteogramm-Overlays für bessere Vollständigkeit und Lesbarkeit

## Dateien
- `src/ForecastCockpit.tsx`
- `src/styles.css`
- `CHANGELOG.md`
## Buildfix Windfiedern
- Ungültige WindUnit `kt` durch den gültigen internen Wert `kn` ersetzt.
- Nach Umstellung auf meteorologische Windfiedern ungenutzten lokalen Helfer `SvgWindDirectionArrow` aus `ForecastCockpit.tsx` entfernt.
- Eigene Regression `test-cockpit-windbarb-buildfix-09185.mjs` ergänzt.

