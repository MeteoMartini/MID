# MID v0.9.84.87 – Implementierungsbericht

## Anlass

GitHub Actions **#1040** (`MID-Release aus ZIP installieren und veröffentlichen`) lief mit dem v0.9.84.86-ZIP bis zum Regressionsgate. Dort scheiterte genau **1 von 779** automatisch erkannten Regressionstests: `scripts/test-viewport-textflow-098485.mjs`.

Der Fehler ließ sich lokal exakt reproduzieren. Der Test enthielt noch die feste Erwartung `pkg.version === "0.9.84.85"`, während der Release bereits korrekt `0.9.84.86` trug. Das war kein Fehler der produktiven MID-Anwendung, sondern ein versionsabhängiger Testvertrag.

## Korrektur

- Die fachlichen Assertions des Viewport-/Textflussvertrags bleiben unverändert erhalten.
- Die sachfremde feste Paketversionsprüfung wurde entfernt. Für die Konsistenz der Releaseversion existieren eigene Versions-, Baseline- und Lineage-Verträge.
- Die Erfolgsausgabe des Tests verwendet nun dynamisch `pkg.version`, damit derselbe UI-Vertrag auch bei folgenden Wartungsreleases gültig bleibt.
- Releaseversion und zugehörige Metadaten wurden auf **0.9.84.87** synchronisiert.

## Risikobegrenzung

Es wurde keine produktive Wetter-, Daten-, Karten-, Radar-, Satelliten-, Warn-, Modell-, Pegel- oder UI-Logik verändert. Die Viewport-Geometrie entspricht unverändert dem bereits geprüften Stand v0.9.84.85/v0.9.84.86. Der korrigierte Vertrag schützt weiterhin die dort eingeführten Regeln für Header, Bottom-Navigation, Prognose-Kompass, 24-h-Einzeldaten und Pegelzugang.

Die Worker-Fachlogik ist unverändert; ausschließlich `WORKER_VERSION` wurde mit dem Release synchronisiert.
