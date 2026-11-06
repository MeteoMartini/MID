# MID – GitHub Copilot: Rollen-, Auftrags- und Handoffkonzept

**Stand:** 2026-11-06; Dokumentations-/Governancekandidat auf verifizierter Stable-Basis v0.9.85.438. Kein eigener App-Build, kein neues Recht und keine Releasefreigabe.

## 1. Motivation und Ist-Zustand

Copilot wurde bereits für parallele MID-Aufgaben genutzt, jedoch ohne stabile Copilot-spezifische Vorbriefing-Datei. Der belegte Cloud-Lauf [42074340393](https://github.com/MeteoMartini/MID/actions/runs/42074340393) vom 05.11.2026 wurde nach etwa einer Stunde abgebrochen; keine eigenen Codeänderungen davon waren als verifizierter Remote-Commit vorhanden. Die fachliche Kurzfrist-Korrektur wurde daraufhin **unabhängig** über den kontrollierten MID-Integrationspfad in [PR #668](https://github.com/MeteoMartini/MID/pull/668) übernommen. Der historische Copilot-Branch `copilot/check-app-issues-and-improvements` zeigte zur Vorbereitung auf v0.9.85.432 und war bei dieser Prüfung 18 Commits hinter Stable v0.9.85.438, ohne zusätzliche Dateidifferenzen. Nicht auf diesen Branch zurücksetzen oder ihn als aktuelle Quelle benutzen. Zu weiteren Aufträgen nur belegte GitHub-Daten behaupten.

## 2. Zuständigkeit und Sicherheitsgrenze

| Akteur | Zulässige Rolle | Nicht zulässig |
|---|---|---|
| Nutzer | Ziel, Priorität, Produktentscheidungen und Freigaben | – |
| ChatGPT | Beauftragung, Koordination, fachliche Review, sichere Integration, Releasebegleitung | Direkte Schreib-/Gate-Umgehung |
| GitHub Copilot | Lesende Audits, eng beauftragte Implementierungs-/Testkandidaten und dokumentierte Handoffs | Eigene Aufgaben, Freigabe, Merge, Deploy, produktive Branches, Governance-/Secret-Änderungen |
| Replit | Eng beauftragte UI/UX-Werkbank über `replit/*` | Governance, Worker, Hauptbranches und Release |
| Codex/PR Completion | Autorisierte Integration und Qualitätssicherung nach verbindlichem MID-Vertrag | Generisches unkontrolliertes PR-Landing |

Die bestehende Source-Gate-Voraussetzung ist strikt: nicht als Draft gekennzeichneter Integrations-PR von `chatgpt/*` oder `codex/*` aus **demselben Repository**, vollständig bestanden. Der Copilot-Namensraum `copilot/*` ist **nicht** Teil dieser Vertrauenszone. Eine Copilot-Draft oder ein GitHub-Copilot-Standard-PR darf nicht als durchgeprüfter Source-PR umetikettiert werden. Kein Ruleset-Bypass, keine zusätzliche GitHub-App-Ausnahme, kein breiter Token.

## 3. Copilot ohne wiederholte Groß-Briefings nutzen

1. Repository auf `main` mit den aktiven [Copilot-Instruktionen](../../.github/copilot-instructions.md) öffnen. Die verpflichtende [AGENTS.md](../../AGENTS.md) bleibt maßgeblich. Prüfen, ob GitHub Copilot die Instruktionsdatei im Chat als Referenz anzeigt (Featureunterstützung variiert je Oberfläche).
2. **Zuerst lesend**: den Prompt [`mid-preflight.prompt.md`](../../.github/prompts/mid-preflight.prompt.md) mit der konkreten Aufgabe verwenden. Die automatische Aufgabeninitialisierung aus Repositoryanweisungen ersetzt **nicht** den Auftrag.
3. Ergebnisse auf current Stable, parallel zugeordnete PRs/Branches, konkreten Scope und Tests abgleichen. Bei identischem Problem in laufendem PR nicht parallel neu implementieren.
4. Erst nach explizit beauftragter Implementierung einen isolierten Kandidaten erarbeiten; eigene Schreibrechte/Transportwege live prüfen. Falls Copilot nur `copilot/*` anlegen kann, darf das Ergebnis nicht automatisch über Source-Gate oder produktiven PR fließen. **Abbruch vor nicht ausdrücklich erlaubtem Remote-Write**; stattdessen diffbasiertes Handoff.
5. [`mid-handoff.prompt.md`](../../.github/prompts/mid-handoff.prompt.md) für Commit-/Tree-/Blob-Provenienz, Negativfälle, Tests und unverifizierte Punkte verwenden; Import ausschließlich durch autorisierten Integrator. Draft-Zwischenprüfung ist keine Merge- oder Releasefreigabe.
6. Nach unabhängiger Integration: reguläres Source-PR-Gate, SHA-gebundener Bot-Merge, serverseitiges Release-ZIP, `install-mid.yml`, Worker/Pages, Stable-Promotion. Version/Changelog nur bei tatsächlich neuem App-Build synchronisieren.

## 4. Geeignete Einsatzarten und Pflichtqualität

**Sinnvoll:** unabhängige Quelltext- und Architektur-Reviews; RUC-/ICON-Originaldatenvertrag und Missing/UTC-Proben; gezielte Testfälle/Regressionen; UI-/Responsive-/A11y-Befunde; eng begrenzte Bugfix-Vorschläge; CodeQL/Dependency-Triage. **Nicht sinnvoll als unbeaufsichtigte Copilot-Aktion:** Releases, CI-/Ruleset-Governance, Produktionsdaten-Worker, Kostenentscheidungen, Secrets, unsichere automatische Branch-Updates oder Arbeiten ohne aktuelle Branchprovenienz.

Bei jeder Änderung sind die Ausgangsbasis, exakte Zulässigkeit des Dateiscopes, WMO/DWD-Konformität, Modelllauf/Gültigkeitszeit/Akkumulation, physikalische Plausibilität, Quellen-/Warnabgrenzung, Web/iOS/Widget/Export-Parität und unverändertes Pflichtregressionsinventar zu prüfen. Geforderte Tests nur als PASS melden, wenn sie wirklich auf dem relevanten SHA ausgeführt wurden; Browser/Simulator nicht als physische iOS-/VoiceOver-Abnahme ausgeben.

## 5. Spätere, eigenständige Qualifikationen (nicht Teil dieses Pakets)

- **Optionaler Copilot GitHub Actions Setup-Job:** Der spezielle `.github/workflows/copilot-setup-steps.yml` gilt laut GitHub nur für agentische Actions-Laufzeiten, nicht beliebige Cloud-Sandboxes. Falls benötigt, ausschließlich in einem separaten autorisierten CI-/Sicherheits-PR, mit kanonischer Workflowquelle unter `ci/github/workflows/`, vollem SHA-Pinning, least privilege, reproduzierbaren Node/Python/Playwright-Versionen und vollständiger Release-Gate-Prüfung. Nicht blind hinzufügen.
- **Automatischer Kandidatentransport:** erst nach einem separaten, adversarial getesteten Vertrag für Copilot-Identität, Scope, lokale und entfernte SHA-Linie, Handoff und sichere Draft-Intake-Automation. Bestehendes Kilo-/Replit-Handoff ist **keine** implizite Erlaubnis für Copilot.
- **Copilot-Nutzungsrechte und Kosten:** Plan-/Feature-Verfügbarkeit, Agent- und Organisationsrechte, GitHub App Scope und etwaige Mehrkosten werden je Auftrag kontrolliert; keine Premium- oder Abo-Aktivierung durch diese Dokumentation.

## 6. Nachweise und Referenzen

- MID-Verträge: `AGENTS.md`, `MID_CHATGPT_GITHUB_CONTRACT.md`, `MID_REPLIT_HANDOFF_CONTRACT.md`, `contracts/index.json`.
- GitHub-Dokumentation: [Repositoryanweisungen](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions), [Anweisungskompatibilität](https://docs.github.com/en/copilot/reference/custom-instructions-support), [Custom Agents](https://docs.github.com/en/copilot/concepts/customizations/custom-agents), [Setup-Umgebung](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/customize-the-agent-environment).
- Live-Basis bei Erstellung: `main=mid-stable=2c8c277b7aac53a71de0c4387d50e2da486f1db3`, v0.9.85.438, fünf aktive Rulesets und 1081 Pflichtregressionen im Baseline-Inventar.

## Integration .443

Unveränderte fachliche Regeln aus Original PR673 @99b4882edfb89fe7e23d2f999bc8f71b7e1a178f selektiv auf veröffentlichtem .442 @da169558948f8fe9d5073a1a60efd5eafbf01eea integriert. Historische Basisangaben oben dokumentieren ausschließlich die Erstellung. Keine Workflows, Tokens, Rulesets oder Rechte geändert. Copilot-Oberflächen-/Laufzeitpilot bleibt NOT VERIFIED; Dokumentationsprüfung ersetzt diesen nicht.
