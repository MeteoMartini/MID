# MID v0.9.84.13 · Feste Live-URLs für Wetterwidgets

- Wiesbaden, Kürecik und Malatya sind in `src/widgetUrlExports.ts` zentral konfiguriert.
- Je Ort entstehen automatisch Kompakt- und Kurvenansicht für 5 und 7 Tage, insgesamt zwölf Light-URLs.
- Jeder Aufruf lädt aktuelle kanonische MID-Ortsdaten und zeigt ausschließlich das Widget ohne App-Kopf, Navigation, Menü oder Exportbuttons.
- URL-Werte haben Vorrang vor lokalen Einstellungen; Wind, Niederschlag, Sonnenschein und Hazards sind vollständig aktiviert.
- Neue oder entfernte Orte erfordern künftig nur eine Änderung in `WIDGET_URL_LOCATIONS`; alle Varianten entstehen daraus automatisch.

Required Regression: `scripts/test-widget-url-exports-098413.mjs`.
