# MID v0.9.79.2 · Optionales Bedienkonzept, Schritt 3

## Ausgangsbasis

Verbindlicher vorheriger Stand: **v0.9.79.1**.

## Umsetzung

- `RadarPanel` erhält den optionalen Prop `focusMode`; `App.tsx` aktiviert ihn ausschließlich bei `navigationMode === 'bottom-tabs'`.
- Im Fokusmodus wird die bisherige Preset-/Overlay-Fläche vor der Karte durch die kompakte Kartenaktion **Ebenen** ersetzt.
- Der Ebenendialog bietet Radar, Radar + Satellit, Gewitter, Winter, Synoptik sowie Niederschlagsart, Blitze, Zellen, Zugspuren und Warnungen.
- Die vollständige Sektion **Weitere Layer & Darstellung** bleibt verfügbar und liegt im Fokusmodus unter der Karte.
- Karte, MapLibre-Navigation, Standortzentrierung, Timeline, Wiedergabe und Geschwindigkeit verwenden dieselben bestehenden Komponenten.
- Klassischer Modus bleibt strukturell unverändert.
- `radarColorTables.ts` und alle Radar-/Satellitendatenpfade wurden nicht geändert.

## Verifikation

Required Regression: `scripts/test-modern-map-focus-09792.mjs`. Zusätzlich bleiben die Regressionen aus Schritt 1 und 2 sowie die bestehenden Radar-/Kompositverträge verpflichtend.
