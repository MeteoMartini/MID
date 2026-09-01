# MID Test Report v0.9.77.10

## GitHub-Referenz
Run #817 (`4da758fe154b90307b8288b562af42fdabccea35`) bestätigte vor dem Fehler:
- Release-ZIP sicher entpackt: grün
- `npm ci`: grün
- Dependency-Audit: grün / 0 Schwachstellen
- Abbruch erst im TypeScript-Gate durch fünf konkret identifizierte Compilerdiagnosen.

## Fokussierte Regressionen
- `scripts/test-trend14plus-09770.mjs`: grün
- `scripts/test-trend14plus-buildfix-09775.mjs`: grün
- `scripts/test-shortterm-selected-line-values-097710.mjs`: grün
- `scripts/test-parameter-colors-trend14plus-09771.mjs`: grün
- `scripts/test-extreme-outlook-spacing-09779.mjs`: grün

## Zusätzlicher Compiler-Gegencheck
Ein lokaler `tsc --noResolve --noUnusedLocals --noUnusedParameters`-Gegencheck gegen die geänderten Dateien zeigt keine der fünf #817-Fehlerklassen (`TS6133`, `TS2339`, `TS2352`). Der lokale vollständige Projekt-Typecheck bleibt wegen unvollständiger `@types`-Pakete in dieser Laufzeit nicht belastbar; GitHub #817 hat dagegen bereits bewiesen, dass der reproduzierbare `npm ci`-Pfad vollständig funktioniert.

## Automatisch erkannte Gesamtsuite
- `npm run test:regressions`: **515 von 621** Tests grün.
- Die verbleibenden **106** Ausfälle sind auf die lokale Testtoolchain beschränkt (`typescript-strada` fehlt bzw. globales TypeScript kennt `--ignoreConfig` nicht). Die zwei zunächst gefundenen alten Kurzfrist-Verträge für rechts stehende Druck-/Niederschlagswerte wurden auf die bewusst an die blaue Referenzlinie verlegte Darstellung aktualisiert und laufen danach grün.

## Geschützte Fachpunkte
- tatsächlicher Modellinitialisierungsstand getrennt vom Datenabruf;
- EC46 51 Member / GEFS 0,5° 31 Member;
- Werte direkt an der blauen Kurzfrist-Referenzlinie für alle Hauptparameter;
- Parameterfarben der Referenzwerte;
- bestehende v0.9.77.9-Verträge zu Klimamittel, P10–P90/P25–P75, Tmax/Tmin und appweitem Farbkonzept bleiben erhalten.

## GitHub-Hotfix #818
Run #818 (`0341caf90a6dfcbdb65abb21b0b855f9ec45bb2e`) bestätigte vor dem Fehler erneut:
- Release-ZIP sicher entpackt: grün
- `npm ci`: grün
- Dependency-Audit: grün / 0 Schwachstellen
- Abbruch ausschließlich im TypeScript-Gate mit `TS2322`: `priority: "low"` ist kein gültiger `OpenMeteoPriority`.

Der Hotfix setzt die Modellstand-Metadatenabfrage auf `priority: "background"`. Danach sind die fokussierten Verträge für Trend-14d+, Run-#817/#818-Buildfix, Kurzfrist-Referenzwerte, Parameterfarben, Versionierung, Release-Lineage und Worker-Syntax grün.

Der vollständige lokale `verify:types` ist in dieser Sandbox weiterhin nicht als Projektprüfung nutzbar, weil die vorhandene lokale `node_modules`-Installation zahlreiche `@types`-Pakete nicht vollständig enthält. GitHub #818 hat dagegen den reproduzierbaren `npm ci`-Pfad erfolgreich aufgebaut und vor dem einzigen oben genannten Quelltypfehler keine weiteren TypeScript-Diagnosen gemeldet.

## Run #819 Hotfix · 2026-09-01

GitHub Actions `Install MID release and deploy #819` bestätigte mit vollständiger CI-Toolchain:
- sichere ZIP-Entpackung: PASS
- `npm ci`: PASS
- Dependency-Audit: PASS
- TypeScript: PASS
- Vite-Produktionsbuild: PASS
- Regressionen: 619/621 PASS vor Hotfix

Die beiden verbleibenden Regressionen waren veraltete Quelltextverträge nach der bereits fachlich eingeführten Mehrparameter-/RUC-Integration für Berg- und Wassersport:
- `scripts/test-learning-scenarios-mountain-zones-071110.mjs`
- `scripts/test-location-thunder-water-tide-layout-09644.mjs`

Korrigierter Vertrag:
- `MountainZoneAnalysis` erhält `rapidMinutes15` und schützt damit den ICON-D2-RUC-Eingang in die Höhenzonenanalyse.
- CAPE allein darf keine eigenständige Gewitter-/Gefahrenaussage erzeugen.
- Höhenzonen verwenden die kombinierte Mehrparameteranalyse mit Modellrisiko + RUC, einschließlich konvektiver Bewertungsstrafe.
- Wassersport kombiniert die kanonische 6-h-Ortsanalyse mit der optionalen ICON-D2-RUC-Mehrparameterdiagnostik.

Beide zuvor roten Tests bestehen nach der Korrektur einzeln. Produktionscode, Worker und Releaseversion bleiben unverändert bei v0.9.77.10.
