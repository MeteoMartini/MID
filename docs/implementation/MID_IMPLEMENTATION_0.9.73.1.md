# MID v0.9.73.1 – DWD RUC run-directory hotfix

## Anlass
Der erstmals aktivierte kostenfreie DWD-RUC-Preprocessing-Workflow lief bis zur DWD-Laufdiscovery und brach dort mit `No common DWD RUC/RUC-EPS run directories found` ab.

## Ursache
Die DWD-Open-Data-Indexseiten URL-kodieren den Doppelpunkt in Laufverzeichnis-Links (z. B. `2026-08-29T14%3A00/`). `fetch_and_build_ruc.py` verglich die rohen `href`-Werte dagegen mit einem Regex für die dekodierte Form `2026-08-29T14:00/`. Dadurch wurden gültige Laufverzeichnisse vollständig verworfen.

## Korrektur
`tools/ruc/fetch_and_build_ruc.py` dekodiert jeden Index-Link nun mit `urllib.parse.unquote()` vor der Laufzeitprüfung. Die bestehende Fail-safe-Logik bleibt unverändert: Pflichtparameter werden weiterhin auf einen gemeinsamen deterministischen RUC-Lauf geschnitten, RUC-EPS muss denselben Lauf bereitstellen, mehrere jüngste Kandidaten werden vollständig geladen/dekodiert und nur ein vollständiger Build darf publiziert werden.

## Regression
`scripts/test-ruc-dwd-pipeline-09690.mjs` schützt nun zusätzlich die URL-Dekodierung kodierter DWD-Laufverzeichnisse. Ein isolierter Parser-Test mit `%3A` bestätigt die Dekodierung auf kanonische `T14:00`-Laufnamen.

## Architektur/Kosten
Keine Änderung: DWD Open Data → GitHub Actions/ecCodes → GitHub Pages `/ruc/` → Cloudflare Worker → MID. R2 bleibt optional und deaktiviert. Kein kostenpflichtiger Dienst wurde aktiviert.
