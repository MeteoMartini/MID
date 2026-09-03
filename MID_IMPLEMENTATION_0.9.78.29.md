# MID 0.9.78.29

## 14-Tage-Cockpit: sofortiger Best-Match-Fallback

Die 14-Tage-Übersicht ist nicht mehr hart an einen bereits abgeschlossenen Ensembleabruf gekoppelt.

- Sind die 14 Best-Match-Tage vorhanden, öffnet die 14-Tage-Übersicht sofort.
- Relative Sonnenscheindauer wird weiterhin aus Best-Match-Sonnenscheindauer und astronomisch möglicher Tageslänge berechnet.
- Ensemble-Konsistenz, Mitglieder-/Modellzahl und P10–P90-Spannen werden unabhängig ergänzt, sobald der Ensembleabruf abgeschlossen ist.
- Währenddessen wird transparent „Ensemble lädt“ beziehungsweise „Ensemble wird ergänzt“ angezeigt; es werden keine künstlichen Ensemble-Spannen ausgegeben.
- Das 14-Tage-Miniribbon erhält denselben Best-Match-Fallback und bleibt daher beim Ensemble-Nachladen sichtbar.

## Ensembleabruf beim Öffnen

Das Antippen des Horizonts „14 Tage“ fordert den Ensembleabruf nun zusätzlich explizit über den App-State an. Damit ist das Cockpit nicht mehr davon abhängig, ob ein vorheriger Viewport-/Modulzustand den Ensembleabruf bereits aktiviert hatte.

## Plattformvertrag

Die Korrektur liegt vollständig im gemeinsamen React-/Vite-Fachkern und gilt identisch für Browser, PWA und Capacitor-iOS. Es gibt keine fachliche Workeränderung.
