## MID v0.8.26.10 umgesetzt

**Versionsbewertung:** Wartungsrelease ab v0.8.26.9. Wiederherstellung und Stabilisierung vorhandener Ensemble-Funktionen ohne Funktionsabbau.

### Ensemble-Darstellung

- Sonne-/Wolken-Kästchen werden für jeden Vorhersagetag in einer eigenständigen, sichtbaren Tageszeile gerendert.
- Niederschlagsart, -stärke und Gewittersignal werden innerhalb des jeweiligen Tageskästchens angezeigt.
- Hazardmarker erscheinen oberhalb des betroffenen Tageskästchens.
- Die Wetterzeile verwendet dieselben Achsenreserven und dieselbe Tagesanzahl wie Temperatur-, Niederschlags- und Winddiagramm.
- Keine experimentellen Recharts-Skalenhooks oder ZIndexLayer-Abhängigkeiten mehr.

### Temperatur-Tooltip

- Alle Werte und Zusatzinformationen bleiben einzeilig.
- Lange Bezeichnungen werden kontrolliert mit Ellipse gekürzt.
- Mobile Schrift- und Spaltenmaße sind auf schmale Viewports abgestimmt.

### Performance

- Zusätzliche Recharts-Accessibility-DOM-Schicht entfernt.
- ResizeObserver verarbeitet contentRect direkt und führt keine Layoutmessung während des Scrollens aus.
- Offscreen-Ensemble-Diagramme nutzen content-visibility.
- Recharts-Flächen erlauben touch-action: pan-y für flüssiges vertikales Scrollen.

### Worker

- Keine funktionale Worker-Änderung.
- Worker nur auf v0.8.26.10 versionssynchronisiert.
