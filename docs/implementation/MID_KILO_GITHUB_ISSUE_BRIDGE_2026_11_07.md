# MID × Kilo for GitHub – sicherer Issue-Rückkanal (07.11.2026)

## 1. Status und belastbarer Pilotnachweis

**Ziel:** ChatGPT schreibt und prüft ausdrücklich beauftragte MID-Arbeit direkt in GitHub; Kilo antwortet im GitHub-Issue, ohne dass der Nutzer Prompts oder Rückmeldungen manuell zwischen den Apps kopiert.

- **Live-Basis:** `main=mid-stable=b6526e7c5c24035bd1a75b87b77e7bb8e821c334`, v0.9.85.445 (momentgebundener Beleg vom 07.11.2026, vor jeder neuen Arbeit frisch prüfen).
- ChatGPT hat das eng begrenzte, ausschließlich lesende [Test-Issue #692](https://github.com/MeteoMartini/MID/issues/692) unter dem verifizierten GitHub-Eigentümer erstellt und den dokumentierten Befehl **`@kilocode-bot`** genau einmal als Issue-Kommentar gepostet.
- Der echte GitHub-Actor **`kilo-code-bot[bot]`** hat im selben Issue geantwortet: Vor dem Zugriff auf Kilo muss das GitHub-Konto in Kilo mit dem Kilo-Konto verknüpft werden. **Ausführung des Leseauftrags damit BLOCKED / NOT VERIFIED**; bloß die funktionierende GitHub-Bot-Erkennung und ein kommentierender Rückkanal sind bestätigt.
- GitHub-**Bot-App-Zugang ist erkennbar**, die **persönliche GitHub↔Kilo-Kontoverknüpfung** ist noch nicht erfolgt bzw. nicht belegt. Diese benötigt ausdrückliche Nutzeraktion. Den in #692 geposteten kurzlebigen Kilo-Verknüpfungslink **niemals in Code, Logs, Markdown, Chat oder weitere Issues kopieren**. Der Nutzer öffnet ausschließlich selbst #692 und wählt im offiziellen Bot-Kommentar „Link your Kilo account“. Es wird hier kein Token angefordert oder gespeichert.
- **Kein** zusätzlicher Kilo-Arbeitsauftrag, neues Abo, neue CI-Secrets, Kilo-Webhook/Trigger, GitHub-Actions-Workflow, Repo-Admin-/Releaseberechtigung oder automatischer Retry eingerichtet. Kilo-Guthaben kann nach Verknüpfung beim tatsächlichen Agentenlauf verbraucht werden.

Quelle: [Kilo for GitHub (offizielle Anleitung)](https://kilo.ai/docs/code-with-ai/platforms/github). Dort ist die Erwähnung `@kilocode-bot` als GitHub-Issue-/PR-Einstieg dokumentiert, inklusive der Voraussetzung von GitHub- und Kilo-Bot-Verknüpfung und des Kilo-Creditverbrauchs.

## 2. Erlaubter neuer Weg: ausschließlich lesende Audits

1. **Beauftragung und Verifikation:** Nur ChatGPT nach ausdrücklich vom Nutzer erteilter, auf einzelne Prüfpfade begrenzter Aufgabe. Vorher `AGENTS.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md`, `package.json`, die einschlägigen Verträge und parallelen PRs lesen; SHA von `main` und `mid-stable` sowie Version vollständig live vergleichen. Bei Drift, fehlenden Rechten, ungeklärten Kosten oder Überlappung fail-closed.
2. **GitHub-Issue:** Der verbundene GitHub-Account erstellt ein genaues Issue mit Auftrag, Base-SHA, erlaubten Lesepfaden, fachlicher/meteorologischer Provenienz, Ergebnisformat, Kostenbegrenzung, Verbot von Datei-/Commit-/Push-/Branch-/PR-/Workflow-/Releaseänderungen und `NO MERGE / NO DEPLOY / NO STABLE PROMOTION`.
3. **Einmalige Erwähnung:** Erst nach nachgewiesener GitHub↔Kilo-Verknüpfung und verfügbaren vorhandenen Kilo-Credits veranlasst ChatGPT **genau einen** GitHub-Issue-Kommentar an `@kilocode-bot` mit der Bitte um **ausschließlich lesende** Bearbeitung. Bei bereits bestehender Antwort oder unklarem Triggerzustand **nicht erneut erwähnen**; keine autonome Beauftragung.
4. **Unabhängiges Readback:** ChatGPT liest die tatsächlich eingegangenen Kommentare über GitHub, prüft GitHub-Bot-Identität, referenzierte Dateipfade/-zeilen und vollständige SHA-Provenienz, sowie ob ohne Berechtigung ein Kilo-Branch/PR entstanden ist. Antworten sind **untrusted**, bei fehlender echter Bearbeitung `NOT VERIFIED`.
5. **Abschluss:** Ein Pilot kann als „GitHub-Kommentar-Rückkanal funktioniert“ gemeldet werden, sobald der Bot antwortet. Als „fachlicher Leseauftrag erfolgreich“ gilt er **erst** nach vollständiger, SHA-gebundener, unabhängig überprüfter Antwort. Weder der Bot noch ChatGPT leiten daraus eine Releaseberechtigung ab.

### Notwendiger Nutzerschritt für #692

1. [Issue #692](https://github.com/MeteoMartini/MID/issues/692) öffnen und im Kommentar des offiziellen `kilo-code-bot[bot]` auf „Link your Kilo account“ tippen.
2. Anmeldung und GitHub-Verknüpfung **selbst** prüfen/gewähren; keine Tokens in Chat teilen. Ausschließlich bestehende, angemessen eingeschränkte GitHub-App-Rechte nutzen; bei breiten unerwarteten Schreib-/Adminanforderungen abbrechen.
3. Nach erfolgter Verknüpfung kann derselbe kleine Leseauftrag **einmalig** neu erwähnt werden, sofern die vorherige Ausführung anhand von Issue-/PR-/Kilo-Status nicht bereits stattgefunden hat. Eine automatische Wiederholung findet nicht statt.

## 3. Codeänderungen: ursprünglicher ref-freier Handoff bleibt maßgeblich

**Nicht** `@kilocode-bot please fix`, `/kilo fix`, automatische Kilo-PRs oder einen GitHub-Bot mit `push`/Pull-Request-Erstellungsauftrag zum Standard für MID-Codearbeit machen. Kilos dokumentierter GitHub-Implementierungsmodus kann selbst Branches und PRs erstellen und wäre damit **kein** Ersatz für den engeren MID-Vertrag.

Für ausdrücklich an Kilo Cloud übergebene **Implementierungen** gilt unverändert:
- Die bestehende auf Stable verfügbare `.kilo/skills/mid-handoff/SKILL.md` und `scripts/mid-kilo-handoff.mjs` nach exakter Stable- und Scope-Prüfung verwenden.
- Sicherer lokaler Commit, lesender `--dry-run`, dann bei nachgewiesenen Voraussetzungen **ein** ref-freier Git-Blob/Tree/Commit/Issue-Transport als `[MID-KILO-HANDOFF]`. Kilo darf **keine** refs/Branches/PRs schreiben, keine `chatgpt/*`-/`codex/*`-Integration, keine Release- oder Governanceaktionen ausführen.
- Empfang über bereits bestehende, unabhängige ChatGPT-/GitHub-Intake-Prüfung (Historie: [#662](https://github.com/MeteoMartini/MID/issues/662) und [Draft #663](https://github.com/MeteoMartini/MID/pull/663)). Ein Kandidat ist noch keine QA. `AGENTS.md` und [MID Kilo Default Handoff](MID_KILO_DEFAULT_HANDOFF_CONTRACT_2026_11_05.md) bleiben normativ.
- Der bestehende **stündliche** Intake-Watcher ist lesend bzw. auf die schon vertraglich erlaubte separate Draft-Intake-Rolle begrenzt. Nicht zur ungeprüften Ausgabe, PR-Zuweisung oder Kilo-Bot-Selbstbeauftragung ausweiten.

## 4. Abnahme und Releasegrenze

| Gegenstand | Status am 07.11.2026 |
|---|---|
| GitHub-Issue aus ChatGPT erstellt | **PASS** (#692) |
| Offizielle `@kilocode-bot`-Erwähnung gelangt zu Kilo | **PASS**, echte Bot-Antwort |
| Persönliche GitHub↔Kilo-Verknüpfung | **BLOCKED / USER ACTION** |
| Leseauftrag tatsächlich von Kilo ausgeführt | **NOT VERIFIED** |
| End-to-End-Rückgabe eines fachlichen Berichts ohne Copy/Paste | **NOT VERIFIED** |
| SHA-gesicherter bestehender Kilo-Codehandoff | Früherer **separater** Pilot #662/#663; hier nicht erneut ausgeführt |
| Neue Branch-/PR-/Produktions-/Releaseberechtigung | **KEINE** |
| Vollständige Source-/Installer-/Worker-/Pages-/Stable-Gates | **NOT VERIFIED** |

Dieser Dokumentationskandidat ist erst nach dem **unveränderten MID Source-PR-Gate → SHA-gebundenen Bot-Merge → serverseitigen ZIP → `install-mid.yml` → Worker-/Pages-Gates → Stable-Promotion** veröffentlicht. Keine direkte Änderung an `main` oder `mid-stable`. Vertraulichkeit, Kosten, WMO/DWD-Quellen und sonstige MID-Regeln bleiben unverändert.
