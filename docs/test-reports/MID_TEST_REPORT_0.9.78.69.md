# MID Test Report 0.9.78.69

## GitHub-Run #903

Run #903 (`bdd1d23`) hat erfolgreich abgeschlossen:

- sichere ZIP-Prüfung und -Übernahme,
- `npm ci`,
- Dependency-Audit ohne HIGH/CRITICAL-Befund,
- TypeScript 7 (`tsc --noEmit`) vollständig,
- Vite 6.4.3 Produktionsbuild vollständig.

Anschließend liefen 686 von 687 Regressionen erfolgreich. Einzig `scripts/test-ensemble-multiparameter-097865.mjs` brach bei einer veralteten Erwartung ab (`actual: high`, `expected: medium`).

## Korrektur

Der Test wurde an den aktuellen fachlichen Vertrag angepasst: meteorologische Konfidenz und Datenqualität werden getrennt dargestellt. Schlechte Abdeckung darf eine stark übereinstimmende meteorologische Lösung nicht mehr künstlich als `mittel` einfärben; die Einschränkung bleibt separat als Datenqualität sichtbar.

## Lokale Zusatzprüfung nach dem Fix

Ohne externe Buildpakete bestanden:

- `test-ensemble-data-quality-separation-097869.mjs`,
- `test-forecast-confidence-layout-090505.mjs`,
- `test-ensemble-confidence-calibration-097867.mjs`.

Zusätzlich wurde der Laufzeitkern des Mehrparametertests direkt mit Node 22 `--experimental-strip-types` gegen `src/ensembleAssessment.ts` ausgeführt. Erfolgreich geprüft wurden unter anderem:

- Basisfall `hoch / Datenbasis gut`,
- fehlender Sonnenschein: `hoch / eingeschränkt`,
- fehlender Niederschlags-Kernparameter: `hoch / schwach`,
- unbekannte Lauf-Frische: `hoch / schwach`,
- unvollständige Member-Abdeckung: `hoch / schwach`,
- weniger als zwei Kernparameter: `nicht bewertbar`,
- 50:50-Niederschlagsereignis ohne Konfidenzstrafe,
- Vorlaufnormalisierung und Fernbereich-Cap,
- lokale Skill-Kalibrierung nur im Kurzfristbereich,
- Kalenderfenster-/Agreement-Logik.

Ein erneutes lokales `npm ci` wurde versucht, scheiterte jedoch am Container-Transporttimeout. Daher wird kein zusätzlicher lokaler Vollbuild behauptet. Für die Produktionsquellen ist entscheidend, dass genau dieser Produktionsstand in #903 TypeScript 7 und Vite bereits erfolgreich bestanden hat; 0.9.78.69 ändert danach keine Produktionsquelle außer normaler Versionssynchronisierung.

## Releaseprüfung

Vor ZIP-Ausgabe werden zusätzlich Versions-, Baseline-, Release-Lineage-, Aggregat-, Worker-Syntax- und ZIP-Integritätsverträge geprüft.
