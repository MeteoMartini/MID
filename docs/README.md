# MID Dokumentationsstruktur

Dieses Verzeichnis enthält die aus dem Repository-Root migrierte MID-Dokumentation.
Die Migration erfolgte in v0.9.85.117, um den Root-Bereich von 1068 auf 412 Markdown-Dateien zu reduzieren.

## Verzeichnisstruktur

| Verzeichnis | Inhalt | Dateien |
|---|---|---|
| `implementation/` | Versionsbezogene Implementierungs- und Änderungsdokumentation | 475 |
| `test-reports/` | Testberichte pro Version | 95 |
| `quality/` | Qualitätssicherungs- und Audit-Dokumentation | 33 |
| `audits/` | UI- und Fachaudits | 10 |
| `misc/` | Handoffs, Verträge und sonstige Dokumentation | 28 |
| `design/` | Design- und Redesign-Dokumentation | 5 |
| `c14/` | C14-Kartenprojekt-Dokumentation | 8 |
| `validation/` | Validierungsberichte | 2 |

## Im Root verbleibende Dateien

Die folgenden Dateien verbleiben aus technischen Gründen im Repository-Root:

- **`MID_SOURCE_OF_TRUTH.md`** – Referenziert von CI-Workflows und `AGENTS.md`
- **`MID_BUILD_CHANGELOG.md`** – Referenziert von `scripts/prepare-release-repository.mjs`
- **`MID_BASELINE.json`** – Zentrales Baseline-Konfiguration, referenziert von 100+ Test-Skripten
- **`MID_BRANCH_RULESET.json`** – Branch-Schutzregeln, referenziert von CI-Workflows
- **`MID_RELEASE_NOTES_*.json`** – Release-Notizen, referenziert von `prepare-release-repository.mjs`
- **`MID_IMPLEMENTATION_*.md` (verbleibende)** – In `MID_BASELINE.json` als `requiredFiles` gelistet
- **`MID_TEST_REPORT_*.md` (verbleibende)** – In `MID_BASELINE.json` als `requiredFiles` gelistet
- **`MID_*_CONTRACT.md`** – Aktive Vertragsdateien, in Baseline-Arrays gelistet
- **`AGENTS.md`** – Agent-Anweisungen
- **`CHANGELOG.md`** – Benutzerfreundlicher Changelog
- **`README.md`** – Repository-README

## Migrationshinweis

Die migrierten Dateien wurden mit `git mv` verschoben, um die Git-Historie zu erhalten.
Dateien, die in `MID_BASELINE.json`-Arrays (`requiredFiles`, `protectedFiles`, `sourceFiles`,
`implementationProof`, `evidenceFiles`, `implementationFiles`) referenziert sind,
wurden bewusst im Root belassen, um CI-Regressionen zu vermeiden.

Eine schrittweise Migration der verbleibenden Dateien ist in späteren Releases geplant,
erfordert jedoch die Aktualisierung der entsprechenden Baseline-Array-Einträge und
Test-Skript-Referenzen im selben PR.

## Root-Policy ab v0.9.85.127

Neue versionsbezogene Implementierungs-, Audit-, Handoff- und Release-Artefakte werden direkt unter `docs/` angelegt. Bestehende Root-Dateien werden nur verschoben, wenn alle Baseline-/Test-/Workflow-Referenzen im selben PR atomar angepasst oder nachweislich nicht vorhanden sind. Ein automatisches nachträgliches Verschieben durch GitHub Actions findet bewusst nicht statt.
