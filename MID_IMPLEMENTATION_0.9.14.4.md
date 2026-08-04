# MID v0.9.14.4 – Buildfix Kurzfrist-Windaggregation

## Ursache
Der neue 3-Stunden-Aggregator ruft `mean('wind')` auf. Der typisierte Schlüsselvertrag der lokalen `mean`-Hilfsfunktion enthielt `wind` jedoch noch nicht. Dadurch meldete TypeScript im GitHub-Produktionsbuild TS2345.

## Korrektur
- `wind` in die erlaubte Feldunion der Mittelwertfunktion aufgenommen.
- Bestehende fachliche 3-Stunden-Aggregation unverändert erhalten.
- Regressionstest `scripts/test-buildfix-shortterm-wind-09144.mjs` ergänzt.
- Veraltete Isolationslogik des Piktogramm-Ländertests an die zusätzlichen SVG-Hilfskomponenten angepasst.

## Prüfung
- 278 von 278 automatisch erkannten MID-Regressionstests bestanden.
- Worker-Syntaxprüfung und Release-ZIP-Regression werden vor Ausgabe erneut durchgeführt.
