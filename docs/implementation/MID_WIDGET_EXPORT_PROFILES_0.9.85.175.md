# MID v0.9.85.175 · Widget-Exportprofile Malatya, Kürecik und Ämari

## Verifizierte Basis

Ausgangsbasis ist `main` v0.9.85.174, Commit `c5bcdc09ae97072ec3c6b7c9fca75d8debd248a5`. Zum Start des Arbeitspakets existierte kein offener PR. `mid-stable` stand auf v0.9.85.173; die beiden v0.9.85.174-Main-Commits änderten keine Widget-/Exportdatei.

## Kanonische Orte

- Malatya: 38,44°N, 38,09°E
- Kürecik: 38,35°N, 37,79°E
- Ämari: 59,26°N, 24,20°E

Wiesbaden ist nicht mehr Teil des kanonischen Stapel-Exports. Der technische Slug für Ämari lautet `amari`, die sichtbare Ortsbezeichnung bleibt `Ämari`.

## Kanonische Exportprofile

Je Ort werden ausschließlich folgende SharePoint-/PNG-Zielprofile automatisiert erzeugt:

1. **7 Tage · Kurve**
   - Wind an
   - Niederschlag an
   - Sonnenschein an
   - Hazards aus
   - ECMWF-Temperaturfarben an
   - Light und Dark

2. **5 Tage · Kompakt**
   - Wind an
   - Niederschlag aus
   - Sonnenschein aus
   - Hazards aus
   - ECMWF-Temperaturfarben an
   - Light und Dark

Damit entstehen exakt **12 PNG-Dateien**: 3 Orte × 2 Profile × 2 Themes.

## URL- und Renderingvertrag

`src/widgetUrlExports.ts` trägt die Sichtbarkeiten explizit in die kanonischen URLs (`wind`, `regen`, `sonne`, `hazards`). `WidgetGenerator.tsx` übernimmt diese Werte bei URL-Exports direkt; lokale gespeicherte Widget-Einstellungen können den automatisierten Export daher nicht verändern.

Nichtkanonische bestehende Direkt-URLs mit 5/7 Tagen und Kompakt/Kurve bleiben lesbar. Fehlen dort Sichtbarkeitsparameter, bleibt ihr bisheriges Verhalten mit allen Zusatzwerten aktiv.

Der PNG-Exporter bleibt unverändert: `tools/widget-export/capture-widget.mjs` öffnet den kanonischen Host `www.midwx.app`, setzt einen Cache-Buster, wartet auf `document.documentElement.dataset.midWidgetReady === 'ready'` und erfasst anschließend ausschließlich die aktuelle `.weatherwidget`-Fläche über CDP.

## Dateinamen

Der Batch bewahrt das bestehende Dateinamenschema:

- `malatya-kurve-7d-light.png`
- `malatya-kurve-7d-dark.png`
- `malatya-kompakt-5d-light.png`
- `malatya-kompakt-5d-dark.png`
- entsprechend für `kuerecik` und `amari`.

## Regressionen

Die vorhandenen Required Regressions wurden erweitert:

- `scripts/test-widget-url-exports-098413.mjs`: Orte, Koordinaten, beide Themes, beide Profile, Sichtbarkeitsparameter, ECMWF und Rückwärtsverträglichkeit.
- `scripts/test-widget-render-readiness-098424.mjs`: Ämari, Light/Dark, beide Batchprofile, `midWidgetReady`, CDP-Screenshot und kanonischer Host.

Keine meteorologische Prognose-, Warn-, Karten-, RUC- oder Worker-Fachlogik wurde verändert. Veröffentlichung ausschließlich über den bestehenden Source-PR-/Installer-/Stable-Promotion-Pfad.
