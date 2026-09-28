# MID v0.9.79.3 · Optionales Bedienkonzept, Schritt 4

## Ausgangsbasis

Verbindlicher vorheriger Stand: **v0.9.79.2**.

## Umsetzung

- Nur im persistent wählbaren Modus `bottom-tabs` wird im Bereich **Heute** auf kompakten Geräten eine neue Zusammenfassung vor der unveränderten aktuellen Detailansicht gerendert.
- Die Zusammenfassung nutzt ausschließlich bereits berechnete MID-Daten: kanonische Stunden-/Niederschlagsreihe, `displayDays`, vorhandene amtliche Warnungen sowie bereits geladene Gewitter-/Starkregenindikatoren.
- Aktuelles Wetter, gefühlte Temperatur, Wind, Feuchte und Luftdruck werden kompakt dargestellt.
- **Heute relevant** priorisiert bis zu drei vorhandene Signale: amtliche Warnung, Starkregen-/Gewitterindikator, Niederschlagsbeginn, stärkste Böen oder ein trockenes Zeitfenster.
- Stündliche Kurzleiste und 7-Tage-Kurzblick verwenden die verbindlichen MID-Wetterpiktogramme und führen über vorhandene Navigation zu 24 h beziehungsweise 7 Tagen.
- `Alle Details` führt zur bestehenden `Current`-Ansicht; sie wurde nicht ersetzt oder fachlich verändert.
- Die bisherige `place-nowcards`-Fläche wird nur im neuen mobilen Modus ausgeblendet. Klassischer Modus und alle Detail-/Warnmodule bleiben vollständiger Fallback.
- Keine neuen Requests, keine Änderung an Radar-/Satellitenprodukten, Radarfarben, Parameterfarben, Einheiten oder Quellenlogik.

## Verifikation

Neue verpflichtende Regression: `scripts/test-modern-today-overview-09793.mjs`. Die Regressionen aus Schritt 1–3 bleiben weiterhin verpflichtend.
