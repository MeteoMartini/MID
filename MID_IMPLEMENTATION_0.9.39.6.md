# MID v0.9.39.6 – Installer-Bootstrap gegen versioniertes `node_modules`

Ausgangsbasis: MID v0.9.39.5.

## Ursache

Der GitHub-Installationslauf für v0.9.39.5 scheiterte im Schritt „Alte MID-Version vollständig ersetzen“, obwohl der Release-Inhalt selbst vollständig kopiert war. Auf `main` lag noch ein versehentlich versioniertes `node_modules/` aus einem früheren Installationslauf. Der anschließende `diff -qr` wertete dieses lokale Installationsverzeichnis als fehlenden Release-Inhalt.

## Korrektur

- `node_modules/` ist jetzt über `.gitignore` dauerhaft ausgeschlossen.
- Der Installationsworkflow entfernt ein vorhandenes `node_modules` vor dem Release-Spiegelvergleich und schließt es bei `rsync` und `diff` ausdrücklich aus.
- Der Prebuild synchronisiert die verwalteten GitHub-Workflowkopien und entfernt in GitHub Actions ein früher versioniertes `node_modules` per `git rm --cached` aus dem Index, ohne die frisch installierten Pakete aus dem Arbeitsverzeichnis zu löschen.
- Dadurch wird die Altlast beim ersten erfolgreichen v0.9.39.6-Lauf dauerhaft aus dem Repository entfernt und danach nicht erneut committed.
- Für den einmaligen Bootstrap enthält das Replacement-ZIP zusätzlich einen regulären Platzhalter namens `node_modules`. Der noch auf `main` aktive alte Installer ersetzt damit das vorhandene versionierte Verzeichnis bereits vor seinem strengen `diff`; `npm ci` entfernt diesen regulären Platzhalter anschließend automatisch und legt sein normales lokales Verzeichnis an. Die neue `.gitignore` plus der Prebuild-Hygieneschritt verhindern dessen erneute Versionierung.

## Regression

`scripts/test-install-node-modules-bootstrap-09396.mjs` schützt Workflow-Ausschluss, `.gitignore`, Indexbereinigung und den reproduzierten Vergleichsfall.
