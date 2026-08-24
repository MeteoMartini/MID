# MID 0.9.65.10 – PoP-Nullboden und eindeutiger Trockenwortlaut

## Ziel
Niederschlagswahrscheinlichkeiten dürfen appweit nicht künstlich auf mindestens 5 % angehoben werden. In stabil trockenen Lagen muss 0 % ebenso wie 1–4 % darstellbar bleiben. Gleichzeitig soll der Prognosetext nicht „überwiegend trocken“ sagen, wenn Niederschlag im ausgewerteten Zeitraum praktisch ausgeschlossen ist.

## Umsetzung
- `ShortTermForecast.tsx`: die frühere Anzeigeuntergrenze wurde entfernt; der finale Fusionswert wird nur noch physikalisch auf 0–100 % begrenzt.
- `ForecastCockpit.tsx`: sämtliche PoP-Ausgaben verwenden den unveränderten kanonischen Wert; keine UI-Untergrenze.
- `forecastWording.ts`: gemeinsame Niederschlags-Tendenzlogik. Bei Gesamtmenge ≤ 0,1 mm und maximaler PoP ≤ 5 % wird „trocken“ verwendet.
- `ForecastCockpit.tsx` und `EnsemblePanel.tsx`: beide Prognose-Kompassvarianten greifen auf dieselbe zentrale Wortlogik zu.
- `travelPlanner.ts`: auch klimatologische Texte unterscheiden vollständig trockene Zeiträume von lediglich überwiegend trockenen Zeiträumen.

## Regression
`scripts/test-precipitation-zero-floor-wording-096510.mjs` schützt:
1. keine künstliche 5-%-PoP-Untergrenze,
2. unveränderte 0/1/4-%-Werte,
3. eindeutigen Trockenwortlaut bei praktisch ausgeschlossenem Niederschlag,
4. abgestufte Wortwahl bei realem Rest- oder erhöhtem Niederschlagsrisiko,
5. identische Logik in Cockpit und Ensemble.
