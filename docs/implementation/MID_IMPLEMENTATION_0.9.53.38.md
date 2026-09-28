# MID v0.9.53.38 – frische Beobachtungen, evidenzadaptive Temperatur und UI-Standardisierung

## Hyperlokale Temperatur

- Die direkte Temperaturstütze bleibt ein Zusatz zur modellgestützten Restfeldanalyse und benötigt weiterhin mindestens zwei deduplizierte, frische, hinreichend nahe und konsistente Messpunkte.
- Der bisher starre Nacht-/Tag-Deckel wird durch eine evidenzadaptive Obergrenze ersetzt. Bei schwacher Evidenz bleibt die bisherige enge Begrenzung wirksam; bei mehreren frischen, nahen und kohärenten Messpunkten kann ein klarer räumlicher Modellgradientenfehler mehrere Kelvin korrigiert werden.
- Auch bei sehr starker Evidenz wird der direkte Messkonsens nicht vollständig übernommen. Einzelne Flughäfen, einzelne Privatstationen und stark widersprüchliche Messungen können weiterhin keine starke Rückführung erzwingen.
- Die Korrekturstärke berücksichtigt effektive Messpunktzahl, gewichtete Distanz, Alter, räumliche Streuung, Größe der Zielpunktabweichung sowie nachts zusätzlich die Durchmischung über den Wind.
- Die appweite Forecast-Konsistenz bleibt unverändert: die resultierende lokale Temperaturkorrektur ist der kanonische Korrekturwert und wird nicht in einzelnen Modulen erneut berechnet.

## DWD SYNOP / POI und CDC 10 Minuten

- DWD CDC bleibt die native 10-Minuten-Quelle und behält die 10-Minuten-Provenienz.
- DWD SYNOP/OpenData POI wird nicht mehr fälschlich als 10-Minuten-Temperaturquelle ausgezeichnet. Temperatur, Taupunkt, Feuchte und Druck tragen 60-Minuten-Quellenintervall; das 10-Minuten-Mittel für Windrichtung/-geschwindigkeit bleibt als feldbezogenes Messintervall erhalten.
- Der POI-Parser verlässt sich nicht mehr auf die Reihenfolge der CSV-Zeilen, sondern bestimmt aus allen zulässigen Meldungen explizit den neuesten Zeitstempel.
- Cachezeiten bleiben bewusst unverändert. Es entstehen keine zusätzlichen Dauerabfragen oder überflüssigen Datenflüsse.

## Appweite Design-/Bedienstandardisierung

- `AppPortalPopover` berücksichtigt nun `visualViewport` inklusive dessen Resize-/Scroll-Ereignissen. Popover bleiben damit auf iOS bei Browserleisten, Zoom und Bildschirmtastatur im tatsächlich sichtbaren Bereich.
- Gemeinsame Portal-Popover erhalten einheitliches internes Scrollen, `overscroll-behavior`, stabile Scrollbar-Geometrie und auf Smartphones eine kompaktere Maximalhöhe, damit Wetterkontext sichtbar bleibt.
- Tastaturfokus erhält appweit einen konsistenten sichtbaren `:focus-visible`-Ring.
- Kompakte Info-Trigger nutzen auf Touchgeräten eine gemeinsame Mindest-Touchfläche (`--mid-ui-compact-touch`) statt weiterer lokaler Sondermaße.
- Die historisch spezialisierten Ensemble-Tooltips bleiben gemäß UI-Vertrag unangetastet.

## Regressionen

- `scripts/test-hyperlocal-direct-temperature-consensus-095337.mjs` aktualisiert
- `scripts/test-hyperlocal-source-freshness-095338.mjs` neu
- `scripts/test-ui-standardization-095338.mjs` neu
