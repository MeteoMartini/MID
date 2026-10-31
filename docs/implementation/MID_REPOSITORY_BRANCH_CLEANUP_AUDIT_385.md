# MID Repository-/Branch-Cleanup: SHA-gebundene Inventur (31.10.2026)

## Scope und Ausgangslage

Read-only geprüfter Source-of-Truth-Stand vor den Änderungen: `main = mid-stable = 1ade69f46b9bf77e9adaa360353ffacc7a0b967c`, Version `0.9.85.385`, fünf aktive GitHub-Branch-Rulesets. `AGENTS.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md` und die GitHub-Workflow-Source-Regel wurden gelesen. Die parallelen Draft-PRs #540/#538 (.386 Design), #513, #480, #449, #425 sowie der offene Dependabot-PR #474 bleiben ausdrücklich unberührt.

## Vollinventur, nicht mit Löschfreigabe verwechseln

- GitHub-Bäume: 3.381 versionierte Dateien, 22 aktive und 22 kanonisch gespiegelte GitHub-Workflow-Dateien (`ci/github/workflows/` → `.github/workflows/`). `scripts/sync-github-workflows.mjs` verwaltet die eindeutige Zuordnung.
- Branch-API, Seiten 1–6: 501 Branches, davon 490 als `protected=true` gemeldet. Dies schließt historische `chatgpt/*`, `codex/*` und `replit/*` Branches ein. Keine Schutzregel wurde verändert.
- Alle elf nicht geschützten Branches wurden einzeln mit `mid-stable` verglichen. Jeder Branch enthält `ahead_by > 0` eigene Commits. Entsprechend ist derzeit **kein einziger** dieser elf Branches mit dem strengen `git merge-base --is-ancestor`-Kriterium des bestehenden Cleanup-Workflows als vollständig integriert belegt. Keine Branchlöschung erfolgt.
- `.github/workflows/branch-cleanup.yml` (kanonisches Spiegelbild) läuft sonntags und kann nur alte, ungeschützte, ohne offenen PR vollständig in `main` oder `mid-stable` integrierte Branches löschen. Protected-, offene-PR- und Unique-Commits bleiben unangetastet. Das bestehende Issue #246 behandelt überlebende Unique-Commits. Eine Löschung geschützter Branches durch Ruleset-/Admin-Bypass ist unzulässig.
- Dokumente/Regressionsskripte sind Teil der versionierten Nachweisbasis. 1.165 Skriptdateien sowie historische Audit-/Implementierungsdateien sind keine pauschalen Löschkandidaten, da `MID_BASELINE.json` verpflichtende Tests referenziert. `dist/` (119 Dateien) und `workflow-patches/` bleiben wegen Release-/Deploy-Verträgen ebenfalls zunächst erhalten.

## Begründete Entfernung

Die alte `apply-private-analytics.yml` war ausschließlich manuell startbar und sollte MID `v0.7.90.5` erneut installieren. Sie erzeugte aus dem Workflow heraus neue Dateien einschließlich `scripts/test-private-analytics.mjs`, änderte `package.json` und führte anschließend direkt `git push origin HEAD:main` und GitHub Pages-Deployment aus. Der von ihr erst erzeugte Test `scripts/test-private-analytics.mjs` ist in der heutigen freigegebenen Basis nicht vorhanden. Das Verfahren ist gegenüber dem verbindlichen Source-PR-Gate → SHA-Bot → Installer → Worker/Pages → Stable-Pfad fachlich überholt und sicherheitlich unzulässig.

Entfernt wurden daher nur die kanonische Quelle `ci/github/workflows/apply-private-analytics.yml`, deren aktive Kopie `.github/workflows/apply-private-analytics.yml` und der obsolete Eintrag in `scripts/sync-github-workflows.mjs`. Die bestehende verpflichtende Regression `scripts/test-github-workflow-bootstrap-08263.mjs` erhält eine Negativprüfung gegen spätere Reaktivierung. Es wurden **keine** produktiven Wetter-, RUC-, Worker-, iOS- oder User-Analytics-Funktionen gelöscht.

## Noch gesondert zu qualifizieren, **nicht** in diesem Draft entfernt

1. `mid-code-revision.yml` enthält einen historischen `task=install/all`-Recovery-Pfad mit direktem `git push origin HEAD:mid-stable` und `git push origin HEAD:main`. `MID_SOURCE_OF_TRUTH.md` v0.9.85.385 benennt diesen ausdrücklich als Altpfad, der gesondert zu bereinigen ist. Vor der Änderung sämtliche Aufruf-/Recovery-Tests und die kanonische sowie aktive Datei prüfen.
2. Manuelle Diagnose-/Bootstrap-Workflows (ECMWF, KNMI, RUC-Cloudflare, Attestation/Build-Parity) bleiben trotz geringer Frequenz erhalten, solange eine ausstehende Fach-/Betriebsqualifikation oder ein Runbook auf sie verweisen könnte. Keine voreilige Entfernung wissenschaftlicher Nachweise.
3. Historische Root-Dokumente und 958 Dateien unter `docs/` vor einer optionalen Archivbereinigung einzeln auf Links, Source-of-Truth-Verträge und Release-ZIP-Referenzen prüfen. Der Versionsverlauf ist kein Beweis für Obsoleszenz.
4. Branch-Governance: Prüfen, ob das vorhandene 14-Tage-Cleanup für viele geschützte Altbranches durch einen **separat freigegebenen**, sicher dokumentierten Retention-Prozess ergänzt werden soll. Keine Schutzregel lockern und keine einzigartigen Commits verlieren.

## Validierung und Releasegrenze

Review: korrekte Gegenprobe der 22 Workflow-Namen, identischer Stable/Main-SHA und vorhandener fünf Rulesets. Die Entfernung ist absichtlich ein **Draft** und noch **nicht** nach `main`/`mid-stable` veröffentlicht. Bei einer späteren Integration sind ein frisch abgeglichener Stable-SHA, eine zugewiesene neue MID-Version inklusive Versionsspiegel/Changelog, die geänderten Workflow-Sync-/Bootstrap-Regressionen, alle Source-/Installer-/Worker-/Pages-/Stable-Gates und eine unabhängige Freigabe des kombinierten .386-Releasestands verbindlich. Keine CI- oder Deployment-Ergebnisse werden als erfolgreich behauptet, solange sie nicht tatsächlich vorliegen.
