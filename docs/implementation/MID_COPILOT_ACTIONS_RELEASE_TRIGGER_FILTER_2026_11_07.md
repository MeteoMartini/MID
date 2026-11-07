# MID – Copilot-Workflow-Approval-Rauschen eingrenzen (07.11.2026)

**QA-DRAFT / no merge / no deployment / no Stable-Promotion.** Source-of-Truth-Preflight: `main=mid-stable=b6526e7c5c24035bd1a75b87b77e7bb8e821c334`, MID v0.9.85.445. Historischer Prüfstand; jede folgende Integration muss SHAs, Verträge, Branchschutz und parallele PRs erneut prüfen.

## Tatsächliche Ursache und begrenzter Optimierungsumfang

Der Copilot-Agent hat auf dem untrusted `copilot/mid-ruc-healthgate-sichere-diagnoseklassen`-Branch den Draft [PR #691](https://github.com/MeteoMartini/MID/pull/691) erstellt. GitHub hat am 07.11. für diesen **Draft und Agenten-Actor** vier `pull_request`-CI-Läufe angelegt, u. a.:

| Workflow | Beleg | Status |
|---|---|---|
| MID Unit Coverage #1731 | [42404930674](https://github.com/MeteoMartini/MID/actions/runs/42404930674) | `action_required`, **0 Jobs** |
| MID P0-P4 integration QA #298 | [42404930433](https://github.com/MeteoMartini/MID/actions/runs/42404930433) | `action_required`, **0 Jobs** |
| MID Replit Handoff Gate #2031 | [42404930384](https://github.com/MeteoMartini/MID/actions/runs/42404930384) | `action_required`, **0 Jobs** |
| MID ChatGPT/Codex Source-PR Gate #2448 | [42404930349](https://github.com/MeteoMartini/MID/actions/runs/42404930349) | `action_required`, **0 Jobs** |

Ein weiterer [MID Agent Source Release #2469](https://github.com/MeteoMartini/MID/actions/runs/42403224671) wurde als Copilot-ausgelöster `workflow_run`-Folgelauf mit `action_required` angelegt, ebenfalls **0 Jobs**. Sein UI-HEAD `b6526e7…` zeigt lediglich den GitHub-Default-Branch-Kontext des *Folgeworkflows*, **nicht** eine Freigabe des Copilot-PRs. Der auslösende `MID ChatGPT/Codex Source-PR Gate`-Lauf enthält den echten `head_branch`, etwa `copilot/mid-ruc-healthgate-sichere-diagnoseklassen`.

**Warum nicht global abschalten?** GitHubs native Freigabe erfolgt vor Job-`if`-Bedingungen. Das globale Repository-Setting „Require approval for workflow runs“ zu deaktivieren würde Copilot-Code ungeprüft mit den Workflow-Berechtigungen und potentiell Secrets laufen lassen. Das ist für MID unzulässig und bleibt **eingeschaltet/unverändert**. `pull_request_target`, generischer Approval-Bot, Secrets-/Token-/Rulesetänderung, automatisches `Approve and run` und nachlassende Pflicht-Checks sind ausdrücklich ausgeschlossen.

## Implementierte eng begrenzte Änderung

In zwei stets **bytegleichen** Workflow-Dateien:

- Kanonisch: `ci/github/workflows/agent-source-release.yml`.
- Generierter GitHub-Spiegel: `.github/workflows/agent-source-release.yml`.

Nur am existierenden `on.workflow_run`-Event die **GitHub-native** Branch-Vorauswahl ergänzt:

```yaml
on:
  workflow_run:
    workflows:
      - MID ChatGPT/Codex Source-PR Gate
    types:
      - completed
    branches:
      - 'chatgpt/**'
      - 'codex/**'
```

Diese Filter beziehen sich auf den **Head-Branch des auslösenden Source-Gate-Laufs**, nicht auf `GITHUB_REF=main` des Release-Folgeworkflows. Ergänzend lehnt die bestehende release-job-`if`-Bedingung jeden Head außerhalb der beiden autorisierten Prefixe ab, **bevor** ein Job geplant wird. Die nachfolgende Branch-`case`-Validierung, Draft- und exakte PR-HEAD-Verifikation, `workflow_run.conclusion == success`, `pull_request`-Eventprüfung, tokengebundene Berechtigung, SHA-gebundener Merge, serverseitige ZIP-Erstellung, `install-mid.yml` und Stable-Abnahme bleiben erhalten.

**Beabsichtigte Wirkung nach einer regulären Stable-Veröffentlichung:** Copilot-, Replit-, Main- und beliebige fremde Source-Gate-Läufe lösen **keinen zusätzlichen MID Agent Source Release** mehr aus. Echte erfolgreiche, zulässige `chatgpt/*`-/`codex/*`-Source-Gates werden weiterhin automatisch zum unveränderten Release-Gate weitergereicht. Das verändert **nicht** die vier ursprünglichen `pull_request`-`action_required`-Meldungen von Copilot: GitHubs vorgelagerte Approval-Sperre bleibt ausdrücklich bestehen. Bereits angelegte historische Runs werden nicht entfernt.

## Prüfmatrix und Abnahme

| Fall / Eigenschaft | Erwartet und lokal/readback-geprüft |
|---|---|
| `chatgpt/v0.9.85.446-a` | release-folgetrigger zulässig |
| `chatgpt/v0.9.85.446/subtask` | zulässig, auch geschachtelte Namen |
| `codex/v0.9.85.446-a` | zulässig |
| `copilot/mid-ruc-healthgate-sichere-diagnoseklassen` | **kein** release-folgetrigger |
| `replit/v0.9.85.446-test` | **kein** release-folgetrigger |
| `main`, `mid-stable`, leerer/unbekannter Branch | **kein** release-folgetrigger |
| `workflow_run` completed / parent `Source-PR Gate` | Name und Typ unverändert |
| Source Gate nicht `success` oder nicht durch Pull Request ausgelöst | bestehendes Job-Gate verweigert Release |
| Beide Workflow-Spiegel | GitHub-Blob-SHA **identisch** |
| Unveränderte sicherheitskritische Schritte | Branch-`case`, PR/HEAD SHA, Release-Bot, ZIP, Installer existieren unverändert |
| GitHub Workflow YAML | YAML-`BaseLoader`-Smoke-Test für Trigger + gefaltete `if`-Expression **PASS** |
| Branch- und Berechtigungsregeln | GitHub-Readback: fünf bestehende Rulesets, unverändert |
| Echte End-to-End-Releasequalifikation | **NOT VERIFIED**: in Draft sind Source-/Installer-/Worker-/Pages-/Stable-Gates nicht durchgelaufen |

Der verwendete statische Mirror-/Trigger-/Branch-/Release-Step-Vertrag wurde direkt gegen die **tatsächlich gespeicherten GitHub-Blob-Inhalte** validiert (7 unabhängige Bedingungen PASS). Der Parser-Smoke-Test wurde im lokalen Node-22/Python-Umfeld auf dem geänderten Trigger-/Job-Ausschnitt ausgeführt. **Keine** echte Actions-Ausführung des geänderten Folgeworkflows behaupten; das ist vor Promotion durch GitHub zu bestätigen.

## Fachliche und organisatorische Grenzen

- **Keine** Veränderung am `MID ChatGPT/Codex Source-PR Gate` selbst, `MID Unit Coverage`, `MID P0-P4`, Replit-Handoff, der Installer-/Worker-/Pages-Workflows, Triggern anderer Releasegates, WMO-/DWD-Fachcode oder vorgeschriebenen Regressionen.
- Source-PR-Gate, geschützte Branches/Signaturen, Benutzerentscheidungen und alle MID-Verträge bleiben vorrangig. `Copilot/*`-Draft darf **niemals** direkt MID-Release-PR sein.
- Sollte GitHub bei einem legitimen Source-Gate einen unerwarteten/fehlenden `workflow_run.head_branch` liefern, wird dessen Release **sicher nicht gestartet**. Das muss dann als Blocker fachlich geprüft werden, nicht mit einer Approval-/Branchschutz-Ausnahme umgangen werden.
- Die beiden Workflow-Dateien sind SHA-verifizierte Spiegel. Bei künftigen Änderungen erst die kanonische Quelle aktualisieren, anschließend den vorhandenen `scripts/sync-github-workflows.mjs`-Spiegelmechanismus verwenden und wieder bytegleich prüfen.
- Separat offene [Dokumentations-Draft #687](https://github.com/MeteoMartini/MID/pull/687), [CI-Draft #675](https://github.com/MeteoMartini/MID/pull/675) und andere parallele Branches nicht ungeprüft integrieren; vor Release neu auf aktuelle Stable-SHA abgleichen.

**Kein Code-Push/PR-Merge/Release auf `main` oder `mid-stable`; Veröffentlichung ausschließlich über das bestehende MID-Source-Gate → SHA-gebundener Merge → Server-ZIP → `install-mid.yml` → Worker/Pages → Stable.**
