# MID v0.9.84.5 – Prüfbericht

- Widget-Kurvenregression: eigenständige 3-/7-Tage-Ansicht mit Tageskopf, Piktogrammen, Tmin/Tmax, Skybar, Temperaturkurve und Niederschlagssäulen bestanden.
- Der alte parallele `WidgetCurve`-Renderer ist entfernt; das Widget bindet den kanonischen `SevenDayCurveOverview`-Renderer.
- Auswahlpersistenz unter `mid:0.7.1:widget-settings` bleibt erhalten.
- TypeScript- und Vite-Produktionsbuild sowie die vollständige MID-Regressionssuite sind vor dem Release erneut auszuführen.
