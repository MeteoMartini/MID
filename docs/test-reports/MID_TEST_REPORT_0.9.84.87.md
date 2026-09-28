# MID v0.9.84.87 – Testbericht

## GitHub-Ausgangslage

Der zuletzt hochgeladene Stand startete GitHub Actions **#1040** auf `main` und scheiterte im Schritt Produktionsbuild/Regressionen an genau `test-viewport-textflow-098485.mjs` (1 von 779). Nachfolgende Release-/iOS-/Commit-Schritte wurden deshalb erwartungsgemäß nicht ausgeführt.

## Reproduktion und Korrekturprüfung

Der Fehler wurde lokal mit Node.js 22 exakt reproduziert: tatsächliche Paketversion `0.9.84.86`, im Test fest erwartete Version `0.9.84.85`. Nach der Korrektur und Versionssynchronisation auf **0.9.84.87** besteht der betroffene Viewport-/Textflussvertrag.

Zusätzlich bestanden lokal:
- `scripts/test-versioning.mjs`
- `scripts/test-baseline-079526-contract.mjs`
- die angrenzenden Release-/UI-Verträge, soweit sie ohne das im Transport-ZIP absichtlich nicht enthaltene `node_modules` ausführbar sind
- Worker-Syntaxprüfung (`worker.js` und `worker/metar-proxy.js`)

Ein vollständiger lokaler Lauf aller 779 Tests wurde nicht als bestanden deklariert: das Transport-ZIP enthält kein `node_modules`; einzelne Tests benötigen `typescript-strada` und weitere installierte Build-Abhängigkeiten. Der Versuch der Gesamtsuite erreichte diese bekannten Dependency-Grenzen. Entscheidend für die Änderung ist, dass GitHub #1040 mit installierten Abhängigkeiten bereits 778/779 Verträge erfolgreich durchlaufen hatte und der einzige verbleibende Fehler exakt reproduziert und korrigiert wurde.

## Viewport-/UI-Risiko

Produktiver UI-Code wurde in v0.9.84.87 nicht verändert. Deshalb ändern sich die zuvor geprüften iPhone-/iPad-/Desktop-Geometrien nicht. Der spezifische Viewport-/Textflussvertrag ist nach der Korrektur grün und schützt die bestehenden mobilen Regeln weiter.

## Worker

Keine fachliche Worker-Änderung. Nur die Versionskennung wurde synchronisiert; ein separater manueller Worker-Upload ist für diesen Hotfix nicht erforderlich.
