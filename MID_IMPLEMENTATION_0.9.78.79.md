# MID v0.9.78.79 — 14-Tage-Karten ohne abgeschnittene Inhalte

- Die vergrößerte Konfidenzpille behält den Außenabstand und die klare Signal-/Index-Trennung aus v0.9.78.78.
- Im mobilen Hochformat erhält die Konfidenzpille eine eigene kollisionsfreie Kopfzeilenfläche; die Wetterregime-Pille liegt darunter über die volle verfügbare Kartenbreite.
- Regime-/Kurzaussagen werden nicht mehr per Ellipsis abgeschnitten. Falls die Breite nicht reicht, dürfen sie umbrechen.
- Auch der Wettertext sowie Temperatur-/Niederschlags-/Wind-Metadaten dürfen bei knapper Breite wachsen bzw. umbrechen statt verborgen zu werden.
- Desktopkarten werden moderat von 224 auf 236 px verbreitert; horizontales Scrollen bleibt dort der bestehende Vertrag.
- Keine fachliche Workeränderung.
- Regression `test-fourteen-day-confidence-no-clipping-097879.mjs` schützt die kollisionsfreie Kopfzeile und die Nicht-Abschneide-Regeln.
