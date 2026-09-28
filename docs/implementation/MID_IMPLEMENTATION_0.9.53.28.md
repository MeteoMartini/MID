# MID v0.9.53.28 – kompakte Event-Wetterampel

## Ziel

Die vorhandene Eventbewertung wird in allen relevanten Eventdarstellungen auf einen Blick sichtbar, ohne Karten oder Zeilen zu vergrößern.

## Umsetzung

- Neue gemeinsame Komponente `EventFeasibilityDot`.
- Fachliche Quelle ist ausschließlich `EventPlan.advice.status`; es existiert kein paralleler Ampel- oder Schwellenwertalgorithmus.
- Grün: gut umsetzbar / keine markanten wetterbedingten Einschränkungen.
- Gelb/Amber: einzelne Beeinträchtigungen möglich, Wetterlage beachten.
- Rot: deutliche bzw. kritische wetterbedingte Beeinträchtigung, Durchführung prüfen.
- Neutral grau/hollow: noch keine Wetteranalyse.
- Im Event-Center unter der Glocke sitzt der Punkt platzneutral am vorhandenen Wetterpiktogramm.
- In der kompakten Eventübersicht sitzt derselbe Punkt ebenfalls als Overlay am Wetterpiktogramm.
- In der Detailansicht wird dieselbe Komponente in die vorhandene Statusplakette integriert.
- `aria-label` und Tooltip erklären die Bedeutung; kritischer und neutraler Zustand besitzen zusätzlich zur Farbe eine visuelle Musterunterscheidung.

## Nachhaltigkeit

Der Vertrag ist in `MID_UI_ARCHITECTURE_CONTRACT.md` festgeschrieben. `scripts/test-event-feasibility-indicator-095328.mjs` ist Required Regression und verhindert künftig:

- einen zweiten, von `EventAdvice` abweichenden Wetterscore,
- fehlende Ampeln in einer der Eventdarstellungen,
- eine vergrößernde statt überlagernde Darstellung,
- eine rein farbcodierte, unbeschriftete Zustandsanzeige.


## Prüfung

- 442 automatisch erkannte Regressionstests im Professional-Quellstand.
- 440/440 im gelieferten Professional-Archiv ausführbare Regressionen bestanden.
- `test-code-revision-automation-09190.mjs` und `test-radar.mjs` bleiben ausschließlich wegen der bereits im Ausgangsarchiv fehlenden `.github/workflows/mid-code-revision.yml` bzw. `.github/workflows/deploy.yml` nicht ausführbar.
- Geänderte TSX-Dateien mit TypeScript `transpileModule` syntaxgeprüft.
- Worker und beide Service Worker mit `node --check` geprüft.
- `npm ci` konnte in der isolierten Containerumgebung wegen eines Container-Clientfehlers nicht abgeschlossen werden; ein vollständiger Vite-Build war daher hier nicht möglich.
