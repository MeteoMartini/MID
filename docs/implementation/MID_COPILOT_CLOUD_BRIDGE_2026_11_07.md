# MID × GitHub Copilot: direkter Issue-/Draft-Handoff (07.11.2026)

## Ziel und erfolgreich nachgewiesener Weg

**ChatGPT → GitHub Issue → Copilot Cloud Agent → untrusted Draft PR → ChatGPT Review.** Kein manueller Text-/Patchtransfer mehr. Die bereits verbundene GitHub-App genügt zur **Issue-Zuweisung**; der separate Copilot-Agent-Tasks-API-Start und zusätzliche Tokens werden nicht benötigt.

**Live-Pilot auf** `main=mid-stable=b6526e7c5c24035bd1a75b87b77e7bb8e821c334`, **v0.9.85.445:**
- ChatGPT erstellte [Issue #688](https://github.com/MeteoMartini/MID/issues/688) mit klarer lesender QA-Aufgabe und SHA-/Pfad-/Rechte-/Kostenbegrenzung.
- Das verbundene GitHub-Plugin wies `copilot-swe-agent[bot]` als Bearbeiter zu; GitHub lieferte `Copilot` als bestätigten Assignee.
- GitHub eröffnete **automatisch** [Draft-PR #689](https://github.com/MeteoMartini/MID/pull/689), Autor `Copilot`, untrusted Branch `copilot/mid-copilot-pilot-review-draft-pr-687`, Basis `main` auf genau dem Stable-SHA, initialer HEAD `e6e37b77a409ffd21950ecb3138c79d0fbec1ca8`.
- Der Copilot-Agent lieferte im PR-Text einen **rein lesenden, spezifischen Befund** zu früherem optionalem CLI-Code: Doppelstart-Race, sensitive Dateipfade und eine nicht atomar fixierte Stable-Basis. Der PR blieb **Draft ohne Dateiveränderungen**. Dieser Befund wurde unabhängig geprüft, nicht blind als PASS übernommen.
- Der als optional vorbereitete **Business/Enterprise-REST-Dispatcher** `scripts/mid-copilot-task.mjs` samt `scripts/test-mid-copilot-task.mjs` wurde wegen dieser Risiken **aus dem Veröffentlichungsumfang entfernt**. Die unveränderlichen früheren Integrationscommits (vor der Entfernung: `14c001ea08e6411e55636e31b2b10685d23f69ec`) sichern seinen Code und 19 lokale adversariale Tests historisch. Keine produktive Verwendung und keine Behauptung vollständig gelöster API-Races.
- Keine zusätzlichen GitHub-Berechtigungen, Token, Secrets, Abos, Workflowänderungen, automatischen Merges, Deployments oder Stable-Promotion. Die Copilot-Ausführung kann vorhandene **Copilot-AI-Credits** verbrauchen.

## Verbindlicher MID-Ablauf für künftige Beauftragungen

1. **Auftrag und Verträge:** Nur der Nutzer entscheidet über Produktziel und konkrete Copilot-Aufgabe. ChatGPT liest vorher GitHub `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_BASELINE.json`, `contracts/index.json`, `.github/copilot-instructions.md` und relevante Pfadverträge; verifiziert `main`/`mid-stable` als vollständige SHAs, Version, aktuelle PRs/Branches, Rechte und Kosten. Bei Drift oder Überschneidung: fail-closed.
2. **Issue statt Copy/Paste:** ChatGPT schreibt den vollständigen Nutzerauftrag als GitHub-Issue mit versionierter Ausgangsbasis, Scope, Test-/Abnahmekriterien, Provenienz, ausdrücklichen Ausschlüssen sowie `NO MERGE / NO DEPLOY / NO STABLE PROMOTION`. Bei Audit strikt **read-only**, bei Codearbeit nur eng begrenzter `copilot/*`-Kandidat.
3. **Start:** ChatGPT verwendet die bestehende GitHub-`add_issue_assignees`-Aktion mit `copilot-swe-agent[bot]`, nicht eine neu erstellte API-Berechtigung. Pro explizitem Auftrag **höchstens eine** bewusste Zuweisung; bei unklarem Ergebnis niemals blind erneut starten. **Assignee-Anzeige allein beweist keinen gestarteten Task.**
4. **Start-Readback:** GitHub-Issue/Timestamp, tatsächlich eröffneter **Draft PR**, `Copilot`-Autor, Branch `copilot/*`, exakter Base-/Head-SHA, Issue-Verknüpfung und zulässige Dateiumfang kontrollieren. Wenn der Copilot-PR nicht Draft ist, die Quellen-/Berechtigungsherkunft unklar bleibt oder der Start nicht nachgewiesen ist, **nicht** integrieren. Ein Draft wird niemals automatisch auf Ready gestellt.
5. **Rückgabe ohne Kopieren:** ChatGPT holt den aktuellen Copilot-Draft, Kommentare, Diffs, Tests, Lauf-/Gültigkeitszeit und Fehlstellen selbst über GitHub ab. Fremdinhalte als **untrusted** behandeln; kein fremder Test-PASS oder wissenschaftlicher Nachweis ohne eigene Kontrolle.
6. **Integration ausschließlich separat:** Erst nach unabhängiger SHA-/Tree-/Blob-/Diff-/Vertrags-/QA-Prüfung können geeignete Teiländerungen auf einem neuen autorisierten `chatgpt/*`- oder `codex/*`-Integrationsbranch aufgenommen werden. Danach unverändert Source-PR-Gate → SHA-gebundener Bot-Merge → serverseitiges ZIP → `install-mid.yml` → Worker/Pages-Gates → Stable-Promotion. Ein `copilot/*`-Draft ist **kein** Source-PR-Gate-Kandidat.
7. **Abschluss:** Nur belegte Erfolgszustände als grün ausgeben; aktuelle Stable-Version/SHA, Draft-/Integrationsheads, Tests, Kosten-/Rechteblocker und offene Aufgaben sichern. Keine weiteren Agent-Aufträge ohne Nutzerbeauftragung.

## Laufzeit, Pläne und Berechtigungen

- **Issue-Zuweisung:** GitHub dokumentiert die REST-Assignment-Route mit `copilot-swe-agent[bot]` für bezahlte Copilot-Pläne; sie erstellt einen Draft-PR. **Dieser Weg ist in MID live bestätigt.** Ein zukünftiger App-/Plan-/Policy-Wechsel kann ihn einschränken; immer erneut readback prüfen. Ohne neue Secrets/Scopes operieren.
- **Separate Agent-Tasks-REST-API:** Nach offizieller GitHub-Dokumentation derzeit auf **Copilot Business/Enterprise** eingeschränkt und nur mit geeigneten **User-Tokens** (nicht App-Installationstokens) nutzbar. Diese API und ein optionaler lokaler `gh`-Dispatcher sind **nicht Teil des veröffentlichten MID-Standardwegs**; der Proof-of-Concept wurde bewusst de-scoped. Nie deswegen breite Tokens oder neue Bezahlpläne beschaffen.
- **Copilot CLI:** Lokale, getrennte Sitzungen können `/permissions assisted` oder als persönliche Standardeinstellung `defaultPermissionMode: "assisted"` nutzen, ohne pauschale `--allow-all`/`--yolo`-Freigaben. Dies ist keine Cloud-Session-Erlaubnis und ändert MID-Berechtigungen nicht.
- **iPhone/iPad:** Ein neuer konkreter Auftrag kann vollständig in ChatGPT formuliert werden; die native GitHub-Issue-Zuweisung ist vom Assistenten durchführbar. Copilot-Drafts lassen sich bei Bedarf in GitHub Mobile prüfen. Bei fehlendem Pluginzugriff ist die manuelle GitHub-Agents-Ansicht ein Fallback, nicht ein Ersatz für die Schutzprüfungen.
- **Monitoring:** GitHub-PR-/Issue-Status ist auf Nachfrage hier direkt lesbar. Ein unabhängiges automatisches Stundensignal erfordert eine verfügbare Automation; die bestehenden fünf MID-Automationen wurden nicht verändert.

## Abnahmegrenzen

Verifiziert sind der **komplette Auftragsstart** #688 → #689 und eine **tatsächlich eingegangene Copilot-Review-Rückmeldung**, samt Draft-/GitHub-Readback. **Nicht** verifiziert sind eine durch Copilot erstellte neue Codeänderung mit unabhängiger Integration, Source-/Heavy-/Installer-/Browser-/iOS-/Worker-/Pages-/Stable-Gates und die Fertigstellung eines MID-App-Builds. Diese werden nicht als erfolgreich dargestellt.

**NO MERGE / NO DEPLOY / NO STABLE PROMOTION bis zu den unveränderten gates.**

Offizielle Quellen:
- https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api
- https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/troubleshoot-cloud-agent
- https://docs.github.com/en/rest/agent-tasks/agent-tasks
- https://docs.github.com/en/copilot/concepts/customizations/allowing-safe-commands
