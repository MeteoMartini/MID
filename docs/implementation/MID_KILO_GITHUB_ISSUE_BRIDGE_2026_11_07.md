# MID × Kilo for GitHub – verifizierter Issue-Rückkanal (07.11.2026)

## Ergebnis – vollständiger lesender Pilot erfolgreich

**ChatGPT → GitHub Issue → `@kilocode-bot` → Kilo Cloud Agent → GitHub-Kommentar → ChatGPT** funktioniert ohne manuelles Kopieren von Aufträgen, Quellcode oder Ergebnissen.

GitHub-Source-of-Truth zum Nachweis: `main=mid-stable=b6526e7c5c24035bd1a75b87b77e7bb8e821c334`, MID **v0.9.85.445**. Dieser SHA ist ein **historischer Pilotbeleg**, vor künftigen Aufgaben immer aktuell und vollständig neu vergleichen.

**Belege:**
1. ChatGPT eröffnete das eng begrenzte, ausschließlich lesende [Pilot-Issue #692](https://github.com/MeteoMartini/MID/issues/692) mit Version, Original-SHA, konkretem `AGENTS.md`-Lesescope und `NO MERGE / NO DEPLOY / NO STABLE PROMOTION`.
2. `@kilocode-bot` wurde im [ersten Issue-Kommentar](https://github.com/MeteoMartini/MID/issues/692#issuecomment-6711337165) angesprochen. Der authentifizierte GitHub-Actor `kilo-code-bot[bot]` (ID `240665456`) verlangte zunächst eine persönliche GitHub↔Kilo-Kontoverknüpfung. Der individuelle signierte Link wurde **nicht** in Repository- oder Chatinhalte kopiert.
3. Nach der vom Nutzer bestätigten Verknüpfung und erneuter voller SHA-/Issue-Prüfung wurde der Auftrag **genau einmal** über [Kommentar #6711390346](https://github.com/MeteoMartini/MID/issues/692#issuecomment-6711390346) erneut ausgelöst – kein automatischer Retry.
4. Kilo lieferte unter derselben authentifizierten GitHub-Bot-Identität seine [inhaltliche Auditantwort #6711417279](https://github.com/MeteoMartini/MID/issues/692#issuecomment-6711417279). Sie bestätigt den exakten Stable-SHA, `v0.9.85.445`, den benutzten Quellpfad `AGENTS.md`, den erlaubten einmaligen ref-freien Git-Objekt/Issue-Codehandoff und die Notwendigkeit der unabhängigen Source-/Installer-Gates. [Abschlusskommentar #6711420333](https://github.com/MeteoMartini/MID/issues/692#issuecomment-6711420333) bestätigt die erledigte Cloud-Agent-Leseaufgabe.
5. ChatGPT las beide Antworten unmittelbar aus GitHub, prüfte Bot-Login und numerische Identität sowie Übereinstimmung mit `AGENTS.md`. Bei der Prüfung blieben `main` und `mid-stable` identisch; **kein** neuer Kilo-PR oder Dateidiff wurde gefunden. Der Agent behauptet außerdem, nichts geschrieben zu haben. Dies ist eine **lesende Bridge-Abnahme**, kein Nachweis, dass jeder zukünftige Auftrag fehlerfrei startet.

| Abnahmepunkt | Belegzustand |
|---|---|
| ChatGPT erstellt enges GitHub-Issue | **PASS** |
| Kilo-Bot reagiert auf GitHub-Erwähnung | **PASS** |
| GitHub↔Kilo-Link durch den Nutzer | **Bestätigt**, tatsächlicher anschließender Agentenlauf belegt |
| Kilo bearbeitet echten Leseauftrag | **PASS**, vollständiger SHA und konkrete Datei |
| Antwort kommt ohne Kopieren zurück | **PASS**, GitHub-Kommentar und unabhängiges Readback |
| Kein Copilot-/Kilo-Produktions-PR als Nebeneffekt | **PASS** für diesen Pilot; keine neuen Kilo-PRs |
| Automatisierter GitHub-befeuerter Kilo-Codehandoff | **NICHT GETESTET**; separater ref-freier Prozess bleibt verpflichtend |
| Vollständige MID-Release-/Installer-/Pages-/Worker-Gates | **NOT VERIFIED**, kein Build/Release beauftragt |

## Verbindlicher Ablauf für zukünftige lesende Kilo-Aufträge

1. **Nur explizit vom Nutzer beauftragte, begrenzte Audits:** ChatGPT überprüft live aktuelle `main`-/`mid-stable`-SHAs, `package.json`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md`, `AGENTS.md`, Normverträge und parallele PRs/Branches. Drift, fehlende Rechte, unklarer Scope, unbekannte GitHub↔Kilo-Verbindung oder Kosten-/Kilo-Credit-Unsicherheit führen zum Abbruch.
2. **Auftrag ohne Copy/Paste:** ChatGPT erstellt über die verbundene GitHub-App ein Issue mit vollständiger Ausgangsbasis, ausschließlich lesenden Pfaden, prüfbaren Akzeptanzkriterien, Quellen-/Unsicherheits- und Nachweisvorgaben. Keine Codeänderung, keine Commits, Branches, PRs, CI-/Workflow-Änderung, Secrets, Pushes, neue Abos, Merge/Deploy/Release oder eigenmächtige Folgeaufträge.
3. **Einmaliges `@kilocode-bot`-Mention:** Nach Prüfung der vorhandenen Bot-/Kontoverknüpfung und der bereits existierenden Kommentare exakt eine gezielte Erwähnung mit `READ ONLY` und `reply in this issue`. Fehlende/mehrdeutige Rückmeldung nicht blind erneut auslösen. Bot-Interaktion nutzt das bestehende Kilo-Guthaben; keine neuen kostenpflichtigen Dienste ohne Nutzerfreigabe.
4. **Rückkanal und unabhängige QA:** GitHub-Kommentare selbst lesen, nur verifizierte `kilo-code-bot[bot]`-Antworten als tatsächlichen Kilo-Rückkanal einstufen. Vollständige SHAs, Dateipfade, Behauptungen, Tests und fehlende Evidenz unabhängig kontrollieren. Nur konkret bestätigte Nachweise **PASS**, anderenfalls **NOT VERIFIED**. Bei unerwartet erzeugtem PR/Branch oder Änderungen: keine Integration; dokumentieren und Sicherheitsprüfung.
5. **Abschluss und Übergabe:** Issue kann nach der belegten Auditantwort kontrolliert geschlossen werden. Dokumentation/Abnahme auf einem autorisierten `chatgpt/*`-/`codex/*`-Integrationsbranch sichern, nichts direkt auf `main`/`mid-stable` schreiben. Bereits geplante Kilo-Watcher sind unabhängig; keine zusätzliche Automation und kein automatischer Folgeauftrag.

## Strikte Trennung: Kilo-Codearbeit bleibt ref-frei

Der GitHub-Bot kann laut [Kilo for GitHub](https://kilo.ai/docs/code-with-ai/platforms/github) bei **Implementierungsaufträgen** selbst Branches und Pull Requests erstellen. Diese Fähigkeit wird bei MID **nicht** als Ersatz für den bestehenden Vertrag aktiviert. Keine `@kilocode-bot please fix`-/`/kilo fix`-Beauftragung und keine direkte Übernahme eines Kilo-Bot-PRs in den MID-Releasepfad.

Für **Kilo-Codeänderungen** gilt unverändert `.kilo/skills/mid-handoff/SKILL.md` plus `scripts/mid-kilo-handoff.mjs`: verifizierte aktuelle Stable-Basis, isolierter sauberer lokaler Commit, `--dry-run`, dann bei erfüllten Bedingungen exakt **ein** ref-freier Git-Blob/Tree/Commit/Issue-Transport. Frühere SHA-verifizierte Live-Belege [Kilo-Issue #662](https://github.com/MeteoMartini/MID/issues/662) → unabhängiger [ChatGPT-Draft #663](https://github.com/MeteoMartini/MID/pull/663) belegen ausschließlich diesen **separaten** Transport. Nie eigenständige Kilo-PRs/Refs, nie produktive Hauptbranch- oder Releasefreigabe.

Alle Copilot-/Kilo-Ausgaben gelten als **untrusted** und benötigen vor produktiver Integration vollständige Prüfung. Der einzige Veröffentlichungsweg bleibt:

`Source-PR-Gate → SHA-gebundener kontrollierter Merge → serverseitiges Release-ZIP → install-mid.yml → Worker-/Pages-Gates → mid-stable-Promotion`.

**Pilot-Erfolg ≠ Releasefreigabe.** Keine Kilo-App-/Ruleset-/Workflow-/Secret-/Adminrechte verändert, keine Version erhöht, kein Build ausgelöst.

## Referenzen

- [Kilo for GitHub – offizielle Dokumentation](https://kilo.ai/docs/code-with-ai/platforms/github)
- `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_BASELINE.json`
- `docs/implementation/MID_KILO_DEFAULT_HANDOFF_CONTRACT_2026_11_05.md`
- `docs/implementation/MID_COPILOT_CLOUD_BRIDGE_2026_11_07.md`
