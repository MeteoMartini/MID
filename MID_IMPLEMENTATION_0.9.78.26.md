# MID 0.9.78.26

## Tagesansicht / Skybar

Die Tagesansicht der 7-Tage-Kacheln erhält die Skybar wieder verbindlich zurück.

- Jede Tageskachel zeigt wieder einen zusammenhängenden Skybar-Verlauf für den Tag.
- Die Segmente sind erneut **gerundet** statt eckig.
- Niederschlag wird als eigene Überlagerung auf dem Grundband gezeichnet; die Farben werden **nicht mehr gemischt**.
- Sonnige Phasen bleiben gelb, bewölkte Phasen grau, Niederschlag liegt farblich separat darüber.

Damit entspricht die Darstellung wieder dem gewünschten Prinzip eines verbundenen Wetterstreifens ohne grüne Mischfarben.

## 7-Tage-Kurvenübersicht

Die 7-Tage-Kurvenübersicht wurde vereinheitlicht:

- **Nachtstunden** werden wieder klar hinterlegt und sind auch im dunklen Design sichtbar.
- Das bisherige **P25–P75-Band** wurde aus der Darstellung und Legende ersatzlos entfernt.
- Der Wetterstreifen verwendet ebenfalls gerundete Segmente und dieselbe nicht-mischende Farblogik wie die Tagesansicht.

## Skybar-Logik

Die gemeinsame Skybar-Logik in `src/detailSkyBar.ts` wurde angepasst:

- separates Grundband für Sonne/Bewölkung
- separate Niederschlagsüberlagerung
- keine Farbvermischung zwischen Sonnen- und Niederschlagsfarben
- korrekte flächenbezogene Verteilung auch in der 24-h-Detailansicht ohne explizite X-Positionsliste

## Plattformvertrag

Die Änderungen liegen vollständig im gemeinsamen React-/Vite-Fachkern und gelten identisch für Browser, PWA und die Capacitor-iOS-Hülle. Es wurde keine neue fachliche Worker-Logik eingeführt.
