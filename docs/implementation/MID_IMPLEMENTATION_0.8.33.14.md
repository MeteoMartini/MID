# MID v0.8.33.14

## Codeaudit und mobile Interaktionslatenz

Die Prüfung umfasste die React-Hook-Reihenfolge, Render-Seiteneffekte, Pointer-/Touch-Ereignisse, Scrollschutz, Tooltip-Lebenszyklen, mobile Hover-Zustände sowie unnötige Neuberechnungen bei der Stundenwahl.

### Behobene Codefehler

- In `Forecast` lagen zwei `useMemo`-Hooks hinter einem bedingten Rücksprung. Beim Wechsel zwischen leerer und gefüllter Stundenreihe konnte React dadurch eine abweichende Hook-Reihenfolge erhalten. Sämtliche Hooks werden nun vor dem Rücksprung ausgeführt; leere Tageslisten besitzen außerdem sichere Skalen-Fallbacks.
- Das Flugmeteogramm setzte bei einem Normalisierungsfehler aus einem `useMemo` heraus per `setTimeout` einen Fehlerzustand. Die Normalisierung ist nun rein; der Zustandswechsel erfolgt kontrolliert in einem `useEffect`.

### Unmittelbare Bedienung auf Touchgeräten

- Der schnelle Scrollmodus deaktiviert Radar- und Ensembleflächen nicht mehr per `pointer-events:none`. Er reduziert weiterhin nur teure Schatteneffekte.
- Das stündliche Detaildiagramm besitzt einen direkten Pointer-down-/Pointer-up-Tap-Pfad. Bewegungen über 12 Pixel gelten als Scrollgeste und lösen keine Stundenauswahl aus.
- Der bisherige mobile Zwangsfokus der gesamten Diagrammfläche wurde entfernt. Die Tastatur- und Mausradsteuerung bleibt auf Desktop erhalten.
- Ensemble-Temperatur-, Niederschlags- und Windtooltips werden bereits bei `pointerdown` aus ihrem geschlossenen Zustand freigegeben. Der nachfolgende Recharts-Klick kann deshalb sofort denselben Tap auswerten.
- Der Tooltip-Schließzustand wird zusätzlich in einer Ref geführt; Dokument-Listener werden nicht mehr bei jeder Schließzustandsänderung neu registriert.
- Einstellungsdialog, Schalter, Legenden, Kartensteuerungen und Diagrammflächen verwenden auf Touchgeräten passende `touch-action`-Regeln. Der Dialog erlaubt vertikales Scrollen und Pinch-Zoom statt sämtliche Gesten zu sperren.
- Layoutverändernde Hover-Transformationen werden auf Geräten ohne echtes Hover beziehungsweise mit grobem Zeiger unterdrückt. Ein direkter Active-Zustand liefert sofortige visuelle Rückmeldung.

### Render- und Tooltip-Performance

- Die aufwendigen Tageszeilen der 7-Tage-Vorhersage werden memoisiert. Eine neue Stundenwahl berechnet daher nicht erneut Tagescharakter, Tagesstundenfilter und Tages-Hazards für alle sieben Tage.
- Pointerbewegungen in den vier Flugmeteogramm-Diagrammtypen werden über `requestAnimationFrame` gebündelt. Pro Bildaufbau entsteht höchstens ein Tooltip-State-Update.

### Regression

Der neue Test `scripts/test-mobile-interaction-reliability-083314.mjs` schützt:

- Hooks vor dem bedingten Rücksprung,
- den direkten Detaildiagramm-Tap,
- den Pointer-down-Vorlauf aller Ensemble-Diagramme,
- die rAF-Bündelung der Flugmeteogramm-Tooltips,
- das Verbot von State-Updates aus `useMemo`,
- die Touch-/Scroll-CSS-Regeln,
- den Erhalt der Interaktivität während schneller Scrollphasen.
