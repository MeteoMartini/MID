# MID v0.9.84.12 – Testbericht

## Ursache Release-Run #966

Der GitHub-Installer entpackte die v0.9.84.11-ZIP fehlerfrei, installierte 202 Pakete reproduzierbar und absolvierte TypeScript-7- sowie Vite-8-Produktionsbuild erfolgreich. Erst die Regressionssuite stoppte bei genau einem Test:

- `scripts/test-audit-science-097864.mjs`, zunächst Zeile 23
- Erwartung: `sunVisualShare(0,0) === 0`
- Ist in v0.9.84.11: `1`

Die übrigen 725 der 726 Regressionen liefen im GitHub-Runner durch. Ursache war eine Vermischung des eigenständigen Sonnenscheindauer-Helfers mit der neuen visuellen Wolkenpriorität der Skybar. Zusätzlich enthielt der wissenschaftliche Audit noch ältere Erwartungen an die vor v0.9.84.11 geltende Skybar- und Niederschlagsstufenlogik; diese wurden an den verbindlichen neuen Vertrag angepasst.

## Korrektur

- `sunVisualShare()` schützt wieder den eigenständigen Sonnenscheindauervertrag: ein vorhandener direkter Wert wird nicht durch Bewölkung ersetzt.
- `baseSkyVisual()` behält die Wolkenpriorität: bei bekannter Gesamtbewölkung bestimmt diese das gelbe bzw. graue Grundband; Sonnenscheindauer ist dort nur bei fehlender Bewölkung Fallback.
- Die statischen Skybar-Regressionen prüfen die Priorität jetzt am tatsächlichen Grundband-Helfer statt am fachlich getrennten Sonnenscheindauer-Helfer.
- Der wissenschaftliche Audit prüft die seit v0.9.84.11 gültigen vier Niederschlagsdicken korrekt mit 0,1 / 0,8 / 5 / 15 mm/h.
- Niederschlagslayer und sonnige Schauer bleiben unverändert erhalten.

## Verifikation v0.9.84.12

Erfolgreich ausgeführt:

- `test-audit-science-097864.mjs`
- `test-weather-profile-skybar-pills-097723.mjs`
- `test-skybar-sun-cloud-exclusive-097863.mjs`
- `test-skybar-sunshine-time-alignment-097881.mjs`
- `test-skybar-four-thickness-appwide-09799.mjs`
- `test-skybar-daylight-no-gaps-097913.mjs`
- `test-parallel-merge-skybar-phase-097839.mjs`
- `test-skybar-shower-overlay-cloud-priority-098411.mjs`
- Versionsschema, Baseline, Release-Lineage und Uploadbudget
- Syntaxprüfung `detailSkyBar.ts`, `worker.js` und `worker/metar-proxy.js`
- Worker-Semantikvergleich zu v0.9.84.11 nach ausschließlicher Versionsnormalisierung: unverändert

Ein erneutes vollständiges lokales `npm ci` war in der isolierten Arbeitsumgebung wegen eines Transport-Timeouts nicht möglich. Das ist vom eigentlichen Releasefehler getrennt: Derselbe Lockfile-/Buildpfad war im GitHub-Runner von Run #966 bereits erfolgreich; dort scheiterte ausschließlich die nun korrigierte Regression. Ein lokal angestoßener breiter Regressionslauf lief bis zu paketabhängigen Tests und konnte ohne lokal installiertes `esbuild` nicht vollständig fortgesetzt werden.
