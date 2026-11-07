# MID Copilot Cloud Bridge – 07.11.2026

## Ziel und Vertrauensmodell

ChatGPT erstellt und liest GitHub-Issues mit dem vorhandenen GitHub-Plugin. Der begrenzte Dispatcher scripts/mid-copilot-task.mjs liest einen ausdrücklich beauftragten Task aus dem Issue, prüft die aktuelle Stable-Provenienz und startet **genau eine** Cloud-Agent-Aufgabe über die offizielle Agent-Tasks-API. Eine Task-ID-Quittung wird ins Issue geschrieben. Task und Codekandidat sind unvertrauenswürdig; **keine** PR-, Merge-, Release- oder Stable-Autorisierung.

Der bisherige AP1b-spezifische Handoff, bestehende Kilo-/Replit-Verträge und MID-Release-Gates werden nicht verändert. Keine neuen CI-Secrets, GitHub-Ruleset-Ausnahmen, Token oder Dienste.

## Voraussetzungen

- main und mid-stable müssen beide exakt dem SHA im Task-Manifest entsprechen; package.json und MID_BASELINE.json müssen die angegebene Version bestätigen. AGENTS.md, MID_SOURCE_OF_TRUTH.md, .github/copilot-instructions.md, contracts/index.json und parallele PRs bleiben verbindlich.
- Ein Benutzer beauftragt explizit ein begrenztes Ziel. ChatGPT legt ein GitHub-Issue unter dem verifizierten Repo-Eigentümer mit dem Präfix [MID-COPILOT-TASK] an.
- Die Copilot-Agent-Tasks-API braucht eine **nutzergebundene** GitHub-Anmeldung mit Agent-tasks-Zugriffsrechten. GitHub-Actions-GITHUB_TOKEN bzw. App-Installationstokens genügen dafür nicht. Der Dispatcher nutzt die bereits genehmigte lokale gh-Anmeldung des Repo-Eigentümers. Bei fehlender Berechtigung: fail-closed; keine Schlüssel, Secrets oder erweiterten Berechtigungen beschaffen.
- Die Cloud-Aufgabe wird mit base_ref=mid-stable und create_pull_request=false übergeben. Der Prompt verbietet eigenständige PRs, Merge, Deploy, Release, Governance- und Workflowänderungen. Ein copilot/*-Kandidat bleibt außerhalb der vertrauenswürdigen Integrationszone.

## Issue-Manifest

Ein Issue enthält genau einen solchen HTML-Kommentar:

~~~markdown
<!-- MID-COPILOT-TASK-V1
{"schema":"mid.copilot-task.v1","repository":"MeteoMartini/MID","baseSha":"b6526e7c5c24035bd1a75b87b77e7bb8e821c334","version":"0.9.85.445","mode":"audit","goal":"Conduct a read-only source review of the focused test fixture.","paths":["scripts/test-example.mjs"],"acceptance":["Return reproducible file and line evidence, without changing code."],"approvedByUser":true}
-->
~~~

SHA und Version sind **nur ein Beispiel für die geprüfte .445-Basis**; nach jeder Stable-Promotion neu verifizieren. Der Modus lautet audit oder implementation; erlaubte Pfade sind auf src/, worker-src/, scripts/, tools/ oder tests/ begrenzt. Governance-, Secrets-, Workflow- und Vertragspfade werden abgewiesen.

## Ausführung ohne Kopieren von Aufgaben und Antworten

Auf einer lokalen Umgebung mit berechtigter nutzergebundener GitHub-CLI-Anmeldung:

~~~sh
node scripts/mid-copilot-task.mjs --dry-run 123
node scripts/mid-copilot-task.mjs --submit 123
node scripts/mid-copilot-task.mjs --status 123
~~~

123 steht für die Issue-Nummer. Dry-run ist vollständig lesend. Submit prüft erneut Stable und Issue-Digest, startet genau eine Cloud-Aufgabe und schreibt eine eindeutige Quittung mit Task-ID ins Issue. Falls die Quittung nach dem Start scheitert, darf **nicht blind erneut gestartet** werden. Status liest den Task-Zustand über die gleiche nutzergebundene Agent-Tasks-API. ChatGPT kann zumindest Issue und Quittung über das bereits verbundene GitHub-Plugin lesen.

Das Ergebnis ist niemals automatisch eine autorisierte MID-Integration oder Veröffentlichung. Vor Übernahme vollständige SHA-/Diff-/Blob-/Tree-/QA-Prüfung und der unveränderte Source-PR-Gate → Bot-Merge → ZIP → Installer → Worker/Pages → Stable-Promotion-Pfad.

## Weniger Freigabedialoge

In der lokalen Copilot CLI /permissions assisted aktivieren. Für eine dauerhafte lokale Standardeinstellung kann auf dem eigenen Gerät defaultPermissionMode = assisted in ~/.copilot/settings.json verwendet werden. Nichtinteraktive CLI unterstützt --assisted-approval. Das gilt **nicht** als generelle Cloud-Session-Freigabe. Keine allow-all/yolo-Freigaben, keine breiten Tool-/Pfad-/URL-Regeln und keine Änderungen an der lokalen Konfiguration durch MID.

## Bekannte Lücke und Abnahme

Der in diesem Chat verbundene GitHub-Connector bietet aktuell keine Agent-Task-Start-/Status-Aktion. Damit ist **unbeaufsichtigtes direktes Starten aus diesem Chat** ohne einen zusätzlich autorisierten Nutzer-OAuth-/Agent-Tasks-Connector nicht erreichbar; der lokale Dispatcher reduziert den Medienbruch auf einen CLI-Aufruf. Für öffentliche MID-Repositories eignen sich GitHubs Copilot-Automations laut aktueller Dokumentation nicht.

Lokale Sicherheits-/Negativtests des Entwurfs existieren unter scripts/test-mid-copilot-task.mjs. Tests auf dem exakten GitHub-Kandidaten-SHA, Live-Cloud-Start, automatische Ergebnis-Übernahme, vollständiges MID-Source-/Heavy-/Installer-/Worker-/Pages-/Stable-Gate sind **NOT VERIFIED**. Kein neuer kostenpflichtiger Task, kein Merge, kein Deployment.

Offizielle Dokumentation:
- https://docs.github.com/en/rest/agent-tasks/agent-tasks
- https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api
- https://docs.github.com/en/copilot/concepts/customizations/allowing-safe-commands
