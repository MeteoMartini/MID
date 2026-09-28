# MID v0.9.36.0

## 14-Tage-Ensemble · kumulierter Niederschlag
- Das bisherige tägliche Niederschlagsdiagramm bleibt Standard.
- Neuer kompakter Umschalter `kumuliert`.
- Im kumulierten Modus:
  - Best-Match-Niederschlag wird ab Tag 1 fortlaufend aufsummiert.
  - P10- und P90-Grenzen werden fortlaufend aufsummiert und als Unsicherheitsband dargestellt.
  - ENS-Mittel wird im Erweiterten Modus als gestrichelte kumulierte Linie ergänzt.
  - Die Kurven und Bandgrenzen sind monoton nicht fallend.
  - Niederschlagswahrscheinlichkeit bleibt Bestandteil der bisherigen Tagesansicht und wird im kumulierten Modus ausgeblendet.
  - Tooltip und Export-Metadaten passen sich an den Darstellungsmodus an.
- Bestehende Tagesansicht, Fehlerbalken, Wahrscheinlichkeitslinie, Achsgeometrie und mobile Interaktionen bleiben erhalten.

## Navigationskonzept
- Zusätzliches Konzept `MID_NAVIGATION_CONCEPT_0.9.36.0.md` erstellt.
- Empfehlung: Dashboard beibehalten und um ein globales Sektionen-Menü/Drawer ergänzen, das die bestehende Modulkonfiguration spiegelt.

## Prüfung
- Neue Regression `test-ensemble-cumulative-rain-09360.mjs`.
- Bestehende Ensemble-Achsen-/Tooltip-/Interaktionsregressionen auf den neuen optionalen Darstellungsmodus synchronisiert.
- 351/351 automatisch erkannte Regressionstests bestanden.
- `EnsemblePanel.tsx` mit TypeScript-Parser/Transpile geprüft.

## Worker
Keine funktionale Workeränderung; nur Versionssynchronisierung.
