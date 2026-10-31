# MID Repository-/Branch-Cleanup: SHA-gebundene Inventur (31.10.2026)

## Scope und Ausgangslage

Read-only geprüfter Source-of-Truth-Stand vor den Änderungen: `main = mid-stable = 1ade69f46b9bf77e9adaa360353ffacc7a0b967c`, Version `0.9.85.385`, fünf aktive GitHub-Branch-Rulesets. `AGENTS.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md` und die GitHub-Workflow-Source-Regel wurden gelesen. Die parallelen Draft-PRs #540/#538 (.386 Design), #513, #480, #449, #425 sowie der offene Dependabot-PR #474 bleiben ausdrücklich unberührt.

## Vollinventur, nicht mit Löschfreigabe verwechseln

- GitHub-Bäume: 3.381 versionierte Dateien, 22 aktive und 22 kanonisch gespiegelte GitHub-Workflow-Dateien (`ci/github/workflows/` → `.github/workflows/`). `scripts/sync-github-workflows.mjs` verwaltet die eindeutige Zuordnung.
- Branch-API, Seiten 1–6: 501 Branches, davon 490 als `protected=true` gemeldet. Dies schließt historische `chatgpt/*`, `codex/*` und `replit/*` Branches ein. Keine Schutzregel wurde verändert.
- Alle elf nicht geschützten Branches wurden einzeln mit `mid-stable` verglichen. Jeder Branch enthält `ahead_by > 0` eigene Commits. Entsprechend ist derzeit **kein einziger** dieser elf Branches mit dem strengen `git merge-base --is-ancestor`-Kriterium des bestehenden Cleanup-Workflows als vollständig integriert belegt. Keine Branchlöschung erfolgt.
- `.github/workflows/branch-cleanup.yml` (kanonisches Spiegelbild) läuft sonntags und kann nur alte, ungeschützte, ohne offenen PR vollständig in `main` oder `mid-stable` integrierte Branches löschen. Protected-, offene-PR- und Unique-Commits bleiben unangetastet. Das bestehende Issue #246 behandelt überlebende Unique-Commits. Eine Löschung geschützter Branches durch Ruleset-/Admin-Bypass ist unzulässig.
- Effizienzkorrektur im Cleanup (beide gespiegelt-identischen Workflowdateien): Branchname und `.protected` bereits aus der paginierten Listen-API als TSV lesen; geschützte Refs vor Einzelabfrage auslassen und unbekannte Schutzstatus strikt ablehnen. Auf dem 501-Branch-Inventar entfallen damit rechnerisch 490 unnötige Branch-Detailanfragen je Lauf. Löschkriterium, Mindestalter, Dry-Run und Rechte bleiben unverändert. Die bereits verpflichtende `scripts/test-branch-cleanup-safety-0985127.mjs` erhält Negativ-/Reihenfolgeprüfungen.
- Dokumente/Regressionsskripte sind Teil der versionierten Nachweisbasis. 1.165 Skriptdateien sowie historische Audit-/Implementierungsdateien sind keine pauschalen Löschkandidaten, da `MID_BASELINE.json` verpflichtende Tests referenziert. `dist/` (119 Dateien) und `workflow-patches/` bleiben wegen Release-/Deploy-Verträgen ebenfalls zunächst erhalten.

## Begründete Entfernung

Die alte `apply-private-analytics.yml` war ausschließlich manuell startbar und sollte MID `v0.7.90.5` erneut installieren. Sie erzeugte aus dem Workflow heraus neue Dateien einschließlich `scripts/test-private-analytics.mjs`, änderte `package.json` und führte anschließend direkt `git push origin HEAD:main` und GitHub Pages-Deployment aus. Der von ihr erst erzeugte Test `scripts/test-private-analytics.mjs` ist in der heutigen freigegebenen Basis nicht vorhanden. Das Verfahren ist gegenüber dem verbindlichen Source-PR-Gate → SHA-Bot → Installer → Worker/Pages → Stable-Pfad fachlich überholt und sicherheitlich unzulässig.

Entfernt wurden die kanonische Quelle `ci/github/workflows/apply-private-analytics.yml`, deren aktive Kopie `.github/workflows/apply-private-analytics.yml` und der obsolete Eintrag in `scripts/sync-github-workflows.mjs`. Die bereits verpflichtende Regression `scripts/test-github-workflow-bootstrap-08263.mjs` erhält eine Negativprüfung gegen spätere Reaktivierung. Es wurden **keine** produktiven Wetter-, RUC-, Worker-, iOS- oder User-Analytics-Funktionen gelöscht.

Der ebenfalls vertraglich als überholt benannte `task=install`-Altpfad in `mid-code-revision.yml` durfte früher ZIP-Overlays direkt nach `main` bzw. `mid-stable` schreiben. Der **vollständige 266-zeilige veraltete Installationsjob** wurde deshalb aus der kanonischen und aktiven Revisionsworkflowdatei entfernt, samt veraltetem Dispatch-Auswahlwert. `task=all` bleibt erhalten, um alle **weiterhin nur lesenden** CI-/Nightly-/Health-/Performance-/CodeQL-Prüfungen auszuführen. Die überflüssige `maintainHistoricalWorkflow`-Sondertransformation in `scripts/sync-github-workflows.mjs` entfällt. Der bereits verpflichtende `scripts/test-revision-parallel-matrix-0985385.mjs` schützt gegen Wiederaufnahme direkter `main`-/`mid-stable`-Pushes und des Installationsjobs. Reguläre Source-/Installer-/Worker-/Pages-/Stable-Gates bleiben unverändert.

## Noch gesondert zu qualifizieren, **nicht** in diesem Draft entfernt

1. Manuelle Diagnose-/Bootstrap-Workflows (ECMWF, KNMI, RUC-Cloudflare, Attestation/Build-Parity) bleiben trotz geringer Frequenz erhalten, solange eine ausstehende Fach-/Betriebsqualifikation oder ein Runbook auf sie verweisen könnte. Keine voreilige Entfernung wissenschaftlicher Nachweise.
2. Historische Root-Dokumente und 958 Dateien unter `docs/` vor einer optionalen Archivbereinigung einzeln auf Links, Source-of-Truth-Verträge und Release-ZIP-Referenzen prüfen. Der Versionsverlauf ist kein Beweis für Obsoleszenz.
3. Branch-Governance: Prüfen, ob das vorhandene 14-Tage-Cleanup für viele geschützte Altbranches durch einen **separat freigegebenen**, sicher dokumentierten Retention-Prozess ergänzt werden soll. Keine Schutzregel lockern und keine einzigartigen Commits verlieren.

## Validierung und Releasegrenze

Review: korrekte Gegenprobe der 22 Workflow-Namen, identischer Stable/Main-SHA und vorhandener fünf Rulesets. Die Entfernung ist absichtlich ein **Draft** und noch **nicht** nach `main`/`mid-stable` veröffentlicht. Bei einer späteren Integration sind ein frisch abgeglichener Stable-SHA, eine zugewiesene neue MID-Version inklusive Versionsspiegel/Changelog, die geänderten Workflow-Sync-/Bootstrap-Regressionen, alle Source-/Installer-/Worker-/Pages-/Stable-Gates und eine unabhängige Freigabe des kombinierten .386-Releasestands verbindlich. Keine CI- oder Deployment-Ergebnisse werden als erfolgreich behauptet, solange sie nicht tatsächlich vorliegen.
