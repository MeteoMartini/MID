# MID Test Report 0.9.78.53

## Ziel
Absicherung der neuen EPS- und Umfeldunterstützung für MID-Warnhinweise sowie Schutz der Warnverträge aus v0.9.78.49 bis v0.9.78.52.

## Neue Regression
- `scripts/test-warning-eps-neighborhood-097853.mjs`
  - prüft 12-km-Umfeld und fünf Punkte auf gemeinsamer GMT-Zeitachse,
  - prüft bei EPS-gestütztem Wind ein Vorfeld von bis zu vier Stunden vor dem deterministischen Kernfenster,
  - prüft räumliche Extrema **pro Ensemblemitglied vor** der Quantilbildung,
  - prüft Modellfamilien-Deduplizierung über `independenceGroup`,
  - prüft die Verwendung der Umfeld-P90/P10-Signale,
  - schützt `bis zu …` bei Wind und das sichtbare `kt`,
  - prüft die App-Anbindung inklusive Reset bei Ortswechsel.

## Bereinigter Altvertrag
- `scripts/test-current-warning-compact-responsive-09654.mjs` wurde an die bereits verbindlich entfernten Hilfs-/Prompttexte angepasst: die responsive Warnkarte bleibt geschützt, die entfernten Texte müssen nun ausdrücklich **abwesend** bleiben.

## Kompatibilitätsregressionen
- `scripts/test-warning-hybrid-uncertainty-097849.mjs`
- `scripts/test-warning-hybrid-probabilistic-097850.mjs`
- `scripts/test-wind-kt-display-contract-097851.mjs`
- `scripts/test-warning-probabilistic-hour-fields-buildfix-097852.mjs`

## Build-/Parserstatus
Der vollständige lokale `npm ci`/Vite-Build war in der isolierten Ausführungsumgebung zunächst nicht belastbar verfügbar, weil die Paketinstallation mit einem Container-Transport-Timeout abbrach. Die Releaseprüfung dokumentiert daher zusätzlich die separat ausführbaren Regressionen, Syntaxprüfungen und den finalen ZIP-Recheck.

## Ergebnis
- 9 gezielte Warn-/Baseline-/Versionsregressionen bestanden, darunter der neue EPS-Umfeldtest sowie die Verträge aus v0.9.78.49–.52.
- `worker.js`, `worker/metar-proxy.js` und der neue Test sind syntaktisch geprüft; relevante JSON-Verträge sind parsebar.
- Der alte Responsive-Warnkartentest besteht nach seiner Anpassung an den neueren Textentfernungsvertrag.
- Die vollständige historische Gesamtsuite wurde angestoßen, konnte in der isolierten Umgebung jedoch nicht abgeschlossen werden: mehrere ältere Parsertests benötigen das in der unvollständigen lokalen Installation fehlende Alias-Paket `typescript-strada`; ein erneutes `npm ci` brach mit Container-Transport-Timeout ab. Dies ist ein Umgebungs-/Installationsblocker, kein festgestellter Fehler der neuen Warnlogik.
- Der eigenständige TypeScript-7-Kompatibilitätstest ist aus demselben Grund lokal nicht ausführbar.

Die finale unversionierte Professional-ZIP wurde separat auf Archivintegrität und Versionskonsistenz geprüft; die neun gezielten Release-Regressionen wurden zusätzlich direkt aus einem erneuten Entpacken des Transportarchivs erfolgreich ausgeführt. Die Worker-ZIP enthält ausschließlich `worker.js` und stimmt bytegleich mit dem Worker im Professional-Release überein.
