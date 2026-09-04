# MID Test Report 0.9.78.50

## Durchgeführt
- `node scripts/test-warning-hybrid-probabilistic-097850.mjs` ✅

## Inhalt des Regressionstests
- Prüft die Bevorzugung direkter DWD-Einheitenwerte im Warnuntertitel.
- Prüft das Entfernen der Prompt-/Hilfstext-Artefakte in der MID-Hinweissektion.
- Prüft die probabilistische Validitätsfenster-Logik und Kennzeichnung als Wahrscheinlichkeitsbereich.

## Hinweise
- Ein vollständiger `npm run build` war in der bereitgestellten Container-Umgebung nicht möglich, weil das Projekt ohne installierte Frontend-Abhängigkeiten vorlag (`vite: not found`).
- Die fachlich relevante Regression für den geänderten Warnungsbereich wurde mit dem oben genannten Node-Test direkt gegen den Quellstand validiert.
