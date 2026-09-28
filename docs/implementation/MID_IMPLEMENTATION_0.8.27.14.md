# MID v0.8.27.14

## Fehlerbehebung
- Die GitHub-Veröffentlichung scheiterte nach erfolgreichem Build an veralteten Regressionstests.
- Alle betroffenen Tests wurden auf die aktuelle, vereinheitlichte Ensemble-Geometrie umgestellt: gemeinsame Tagesachsen, zusammenhängendes Sonne-/Wolkenband, gemeinsame Diagrammhöhen, kompakter Tooltip und aktuelle Touch-Reaktion.
- Versions- und Baseline-Verträge wurden synchronisiert.

## Prognose-Kompass
- Zeigt weiterhin dynamisch, wie viele Tage die Prognose weitgehend gesichert ist und bis zu welchem Datum.
- Keine starre Drei-Tage-Aussage mehr.

## Prüfung
- 212 automatisch erkannte Regressionstests vollständig in Teil-Läufen bestanden.
- Zusätzliche dedizierte Regression für die dynamische Prognosesicherheitsdauer.
