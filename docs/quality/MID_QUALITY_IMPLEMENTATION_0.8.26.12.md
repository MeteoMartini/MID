## MID v0.8.26.12 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab **v0.8.26.11**, da die Ensemble-Darstellung und Scroll-Performance regressionssicher auf den bewährten optischen Stand vor dem Audit zurückgeführt wurden.

### Ensemble-Diagramme

- Optische Grundlage des Temperatur-Ensembles aus **v0.8.25.4** wiederhergestellt.
- Schmale tagesgenaue Sonne-/Wolkenfelder statt großer überlagernder Karten.
- Regen-, Schnee-, Misch- und Gewittersymbolik innerhalb der Tagesfelder.
- Hazardmarker oberhalb des betroffenen Tages.
- Einheitliche Tagesdomäne, Tickfolge und Achsenreserven in Temperatur, Niederschlag und Wind.
- Temperatur-Tooltip ohne partielle Zeilenumbrüche und ohne Ellipsen-Abschneiden.

### Performance

- Keine Recharts-Accessibility-Zusatzebene in den drei Diagrammen.
- Keine experimentellen Recharts-Skalenhooks.
- Keine `content-visibility`-Rasterisierung der Ensemble-Karten.
- Keine animierten Diagrammserien.
- ResizeObserver aktualisiert nur bei tatsächlicher Größenänderung.
- `touch-action: pan-y` priorisiert vertikales Scrollen.

### Worker

- Kein funktionaler Worker-Umbau.
- Nur Versionssynchronisation auf **v0.8.26.12**.
