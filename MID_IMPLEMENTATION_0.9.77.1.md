# MID v0.9.77.1 – Parameterfarben und Trend 14d+ Polish

## Umsetzung
- Appweiter Parameter-Farbvertrag als zentrale CSS-Tokens: Temperatur, Tmin/Tmax, Niederschlag, Luftdruck, Wind, Böen, Bewölkung, Sonnenschein, Feuchte, Taupunkt und Schnee.
- Bestehende Meteogramm-/Ensemble-/Forecast-Farben auf den zentralen Vertrag gezogen, ohne DWD-Warnstufenfarben zu verändern.
- Trend 14d+ mobil ohne erzwungene horizontale Diagrammbreite; Modell-/Parameterwahl als responsive Grid-Steuerung und Refresh/Info platzsparend im Kopf.
- Witterungstrend mit modellkonsistenter gestrichelter ECMWF-EC46-Klimareferenz aus offiziellen Wochenmittel-/Anomaliefeldern.
- Bewölkungsskala fest 0–100 %, Luftdruck plausibel/gerundet innerhalb 940–1060 hPa, übrige Skalen rund und parameterbezogen.
- Wind im Witterungstrend folgt der appweit gewählten Einheit.
- Tendenzaussagen werden relativ zur verfügbaren Klimareferenz formuliert und vermeiden deterministische Wetterlagenbehauptungen.

## Architektur
- Keine Rückmischung des Tag-15+-Trends in `displayHours` oder `displayMinutes15`.
- Keine neue Worker-Route und keine kostenpflichtige Datenquelle.
- Browser/PWA/iOS nutzen weiterhin denselben React/Vite-Fachkern.

## Regression
- `scripts/test-parameter-colors-trend14plus-09771.mjs`
- bestehender `scripts/test-trend14plus-09770.mjs` auf Wartungsstände v0.9.77.x gehärtet.
