# MID – bedarfsgerechte Agenten- und Plugin-Nutzung (07.11.2026)

**Verbindlicher ergänzender Arbeitsvertrag zu `AGENTS.md`.** Dieser Text begründet keine zusätzlichen Zugriffsrechte und gilt erst nach dem regulären MID-Source-/Release-Gate auf Stable. Historische Vorbereitungsbasis: `main=mid-stable=b6526e7c5c24035bd1a75b87b77e7bb8e821c334`, v0.9.85.445; **vor jedem Auftrag live neu verifizieren**. Nutzerentscheidungen und die versionierten Verträge bleiben vorrangig.

## 1. Grundsatz: ChatGPT wählt die kleinste sichere, belegbar wirksame Unterstützung

**Automatisch nach Bedarf** bedeutet: Innerhalb eines **konkret vom Nutzer autorisierten MID-Auftrags** darf ChatGPT selbstständig geeignete bereits verbundene Plugins/Agenten als Werkzeuge auswählen, lesende Abfragen und freigegebene begrenzte Handoffs initiieren, Ergebnisse selbst in GitHub abholen, unabhängig prüfen und den nächsten sicheren Teilschritt ausführen. Der Nutzer muss weder Prompts noch Patches zwischen GitHub/Copilot/Kilo/ChatGPT kopieren noch reine technische Routineentscheidungen erneut bestätigen.

Das ist **keine** Ermächtigung zu autonomen neuen Produktentscheidungen, unbestellten Folgeaufträgen, unspezifischem Creditverbrauch, neuen Abonnements/Anbietern/Schlüsseln, Rechteausweitungen, Sicherheits- und Branchschutzänderungen, Releases oder Gateumgehungen. Benutzerpflichtige Anmeldung/OAuth- und privilegierte Zustimmung verbleiben beim Nutzer; vorhandene Runtime-Freigaben sind zu beachten.

### Obligatorisches Preflight je Auftrag

- GitHub `MeteoMartini/MID` ist alleinige Code-Source-of-Truth. `main`/`mid-stable` vollständige SHAs vergleichen; released Version und Spiegel in `package.json`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md`, `contracts/index.json` und betroffene Verträge abgleichen.
- `AGENTS.md`, `.github/copilot-instructions.md`, `.kilo/skills/mid-handoff/SKILL.md` (falls Kilo relevant), Rechte/Rulesets, parallele Issues/PRs/Branches/Works und noch nicht veröffentlichte Kandidaten prüfen. Bei Drift, unklarer Provenienz, ungeklärtem Überschneidungs-/Kosten-/Rechterisiko: **fail-closed**.
- Ziel, konkreten Teilauftrag, erlaubte Dateipfade, Ausschlüsse, Fach-/meteorologische Quellen und Akzeptanztests festlegen. Einen verantwortlichen Integrationsträger bestimmen, unnötige parallele Agentenaufträge und doppelte Arbeit vermeiden.
- Vor Verwendung: prüfen, ob benötigtes Plugin **tatsächlich verbunden, verfügbar, berechtigt und für den Daten-/Arbeitsbereich geeignet** ist. Bei fehlendem Werkzeug nichts vortäuschen; auf einen nachweisbar verfügbaren sicheren Weg wechseln oder konkreten Blocker nennen.

## 2. Bedarfsgerechtes Tool-Routing

| Art der Arbeit | Bevorzugter Dienst / Modus | Beschränkung und Abnahme |
|---|---|---|
| Stabile SHAs, Code/Diffs, Issues, PRs, CI/Gates, Releases | **GitHub** direkt durch ChatGPT | Quellwahrheit und Belege aus GitHub; keine manuellen Hauptbranchschreibaktionen |
| Kleine Analyse, Priorisierung, Review, Integrationsentscheidung | **ChatGPT** unmittelbar; GitHub lesen | Externe Agenten nur bei messbarem Mehrwert, nicht reflexartig |
| Eng begrenzte technische Prüfung oder Implementierung | **GitHub Copilot** via ChatGPT→GitHub-Issue→`copilot-swe-agent[bot]` | Nur ausdrücklich beauftragte Aufgaben; GitHub erstellt untrusted `copilot/*` Draft; Rückgabe per GitHub, unabhängige QA, keine Releaseberechtigung; Credits beachten |
| Eng begrenztes **lesendes** Code-/Fachaudit | **Kilo for GitHub** via ChatGPT-Issue und genau einem `@kilocode-bot`-Kommentar | Nur nach verifizierter Kontoverknüpfung und Credit-/Rechteprüfung; Antwort als GitHub-Issue-Kommentar; **keine** Dateien, Branches oder PRs erzeugen |
| **Kilo-Implementierung** auf userbeauftragtem Kilo-Cloud-Arbeitsstand | **Kilo Cloud** und bestehender `scripts/mid-kilo-handoff.mjs` | Ausschließlich SHA-geprüfter lokaler Commit → Dry-run → **einmaliger ref-freier Git-Objekt/Issue-Transport**; unabhängig verifizierter Draft-Intake; nicht via Kilo-GitHub-Fix-PR |
| UI/UX, responsive Quellarbeit | **Replit** nur nach ChatGPT-Auftrag und SHA-/Workspace-/Identitätsprüfung | Nur `replit/*`-Handoff; niemals Worker, Governance, Hauptbranches, Produktion oder eigenständige Produktentscheidungen |
| UX-Flow-Audit, Varianten- und Ergonomiebewertung | **Product Design** bei geeigneter, tatsächlich verfügbarer Fähigkeit | Reale Screenshots/Interaktionen zuerst; Prototyp ≠ implementierter oder real-iOS-abgenommener Code |
| Neue/aktuelle Frameworks, SDKs, Breaking Changes und API-Kompatibilität | **Context7** | Dokumentation/Versionsevidenz, **niemals** Code- oder Release-Source-of-Truth |
| Wetter-/Modell-/Daten-APIs, amtliche Quellen, Lizenz-/Wettbewerbsrecherche | **Firecrawl** und amtliche Primärquellen | Kosten/Credits, Quoten, Quellenrecht, Datenprovenienz; keine Wetterwerte ohne Einheiten/Lauf-/Gültigkeitszeit-/Coverage-Prüfung |
| Nutzungs-, Performance- und Fehlerdaten | **PostHog** nur wenn datenschutzkonform und freigegeben/verbunden | Nur notwendige aggregierte Telemetrie; Einwilligung/Opt-in und Qualität der Instrumentierung prüfen; Rohereignisse ≠ wissenschaftliche Nachweise |
| PR Review, CI-Konflikttriage, Regressionsevidenz | **PR Completion**, sofern verfügbar/autorisiert | Hilfsprüfung; **niemals** dessen generisches Mergeverfahren statt des MID-SHA-Release-Bots |
| Editierbare Designs / Design-System-Layer | **Figma**, wenn angefordert und Zugriffsrechte passen | Nur Designartefakte, keine ungesicherte Code-/Releaseintegration |

**Weitere Apps:** Nur wenn die konkrete Aufgabe einen fachlichen Mehrwert verspricht und Verfügbarkeit, Rechte, Datenschutz und Kosten geprüft sind. Nicht benötigte Plugins **nicht** nur der Vollständigkeit halber aufrufen; Firecrawl/Context7 nicht für statische Repo-Fakten, PostHog nicht für Bugfix-Tests ohne verwertbare Telemetrie.

## 3. Entscheidungshierarchie: Ergebnisqualität je Aufwand

1. **Direkter Repo-Readback oder vorhandener Test** genügt? Dann keinen externen Agenten beauftragen.
2. **Eine** klar abgegrenzte, delegierbare Aufgabe, deren Ergebnis durch GitHub unabhängig prüfbar ist? Dann geeigneten Copilot- oder ausschließlich lesenden Kilo-GitHub-Agent mit engstem Scope verwenden; bei Benutzerauftrag ist der technische Handoff bereits enthalten, **keine Copy/Paste- oder wiederholte Routinezustimmung** nötig.
3. **Implementierung in einer bestehenden Kilo-Session**? Dort die schon freigegebene ref-freie Transportfunktion verwenden; nicht gleichzeitig Copilot mit denselben Dateien beauftragen. Für neues Kilo-Codearbeitsscope gelten die bereits vorgegebenen Kilo-Regeln, nicht der lesende GitHub-Trigger.
4. **UX-/Produktziel**? Erst gemeinsam mit dem Nutzer festgelegten Scope sichern; Replit/Product Design nur für definierte Design-/Responsive-Teile einsetzen. Ohne Rechte oder geklärte Ausgangs-Shas kein Schreibauftrag.
5. **Mehrere unabhängige, überwiegend lesende Prüfungen** dürfen parallel und kostenbewusst erfolgen; schreibende/überlappende Aufgaben nach Fachabhängigkeit und SHA-Reihenfolge serialisieren. Keine doppelten Tickets, kein automatisches Retry nach unklarer API-Antwort und keine Credit-intensive Auditschleife ohne neue Evidenz.
6. Nach jeder Rückgabe untrusted Artefakte (Issue, Draft, Git Objects, Tests, Screenshots, Rohdaten) gegen Originalquelle, exakte SHAs, Scope, Einheiten/Zeit/Feld-/Coverage-Semantik, WMO/DWD-Verträge und aktuelle Stable-Basis unabhängig kontrollieren. Bei unzureichender Evidenz **NOT VERIFIED**.

## 4. Rechte-, Kosten- und Release-Trennung

- Alle Copilot-/Kilo-/Replit-Kandidaten bleiben **untrusted**. Nur ChatGPT/autorisiertes Integrationswerkzeug kann ausgewählte, unabhängig geprüfte Teile auf `chatgpt/*`/`codex/*` übernehmen.
- Nutzerentscheidungen zu Features, Abo/zusätzlichen Kosten, Rechteausweitungen und privilegierten Freigaben bleiben beim Nutzer. Bereits vorhandene Credits gezielt und nur für klaren Nutzen einsetzen; keinen neuen bezahlten Dienst ohne ausdrückliche Zustimmung einschalten.
- Nie Secrets ausgeben, breit berechtigte PATs erstellen, Authentifizierung umgehen, Regeln lockern, signierte Verträge manipulieren, Tests „grün“ behaupten ohne Lauf, Phantom-Release melden oder Produktionswarnungen aus eigenen Heuristiken erzeugen.
- **Release ausschließlich:** unabhängige vollständige SHA-/Diff-/Test-/Vertragsprüfung → autorisierter Source-PR → Source-PR-Gate → kontrollierter SHA-gebundener Merge → serverseitiges ZIP → `install-mid.yml` → betroffene Worker/Pages/Browser/iOS-Abnahmen → Stable-Promotion. Von Agenten erstellte Drafts dürfen nicht selbst diesen Prozess auslösen.

## 5. Monitoring / Automations – geprüft am 07.11.2026

Ein einmaliger Agentenaufruf ersetzt **keine periodische Fremddaten-/Betriebs-/Freigabeüberwachung**. Prüfen, nicht einfach alle Wachen deaktivieren.

| Aktive Aufgabe | Bisheriger Rhythmus | Aufgabe, weshalb weiterhin nötig |
|---|---|---|
| MID Kilo-Handoff-Integration | stündlich | Entdeckung/Identitäts-/Tree-/Blob-/Replay-Prüfung neuer ref-freier Kilo-Code-Issues; der neue Kilo-GitHub-Bot deckt **nur lesende Audits** ab |
| MID RUC & Karten – Freigabewache | alle 4 Stunden | Echte Produktionsdaten-/RUC-Frische, EPS20, native FullDomain, PR-/CI-/Installer-Gates |
| Open-Meteo MID Watch | alle 3 Tage | Breaking Changes/Quoten/Parameter/Modell-Endpunkte; nicht identisch mit allgemeiner Wetterdatenquellen-Recherche |
| MID – Vollständiger Qualitätsaudit | alle 10 Tage | Systemweite, versions-/ansichtsübergreifende QA; nicht durch einen Einzel-Copilot-/Kilo-Auftrag ersetzt |
| MID – neue Wetterdatenquellen | wöchentlich | Neu verfügbare Modelle/amtliche Quellen/Lizenzen außerhalb etablierter Quellen, nicht nur API-Breaking-Changes |

**Entscheidung: 5/5 vorerst beibehalten; 0 sicher ersetzbare Wachen.** Wiederholungen bei unverändertem SHA/Runs sollten keine Benachrichtigungen erzeugen. Nur neue belegte Ereignisse/Blocker melden; nicht pro Tool eine weitere parallele Wache hinzufügen. Einen Watch erst deaktivieren, wenn die funktional äquivalente Alternative incl. Zeitplan, Latenz, Rechte/Verfügbarkeit, Fehlersignalen, End-to-End-Readback und Verantwortlichkeit geprüft und dokumentiert ist. Alte bereits pausierte historische Release-Wachen bleiben pausiert.

**Automationsbereinigung am 07.11.2026 durchgeführt:** Der Open-Meteo-Watcher hatte noch eine ältere Formulierung zur automatischen Codeübernahme; dieser Prompt wurde auf lesende SHA-/Quellenevidenz und Umsetzungsreife ohne eigene Commits/Agenten-/Releaseaktionen geändert. Im 10-tägigen Qualitätsaudit wurde die widersprüchliche eigenständige P0/P1-Reparaturanweisung präzisiert: vollständige lesende Diagnose/Abnahmekriterien, aber keine autonomen Quelländerungen. Die Aufgabenverwaltung bestätigte **beide Prompt-Updates** mit erhaltenem **aktivem Status und unveränderten Zeitplänen**. Die anderen drei Wachen blieben unverändert. Kein Watch deaktiviert, keine neue Automation erstellt.

## 6. Handoff-Dokumentation / historische Tests

- [Copilot Issue→Draft-Bridge](MID_COPILOT_CLOUD_BRIDGE_2026_11_07.md): erfolgreicher Pilot [#688](https://github.com/MeteoMartini/MID/issues/688) → [#689](https://github.com/MeteoMartini/MID/pull/689), Code-Draft ohne Releaseberechtigung.
- [Kilo read-only Issue→Kommentar-Bridge](MID_KILO_GITHUB_ISSUE_BRIDGE_2026_11_07.md): verifizierter Pilot [#692](https://github.com/MeteoMartini/MID/issues/692) mit `kilo-code-bot[bot]` (GitHub-ID `240665456`) und SHA-gebundener Antwort.
- [Kilo ref-free Coding Handoff](MID_KILO_DEFAULT_HANDOFF_CONTRACT_2026_11_05.md): separater früherer Pilot [#662](https://github.com/MeteoMartini/MID/issues/662) → [Draft #663](https://github.com/MeteoMartini/MID/pull/663).
- Etwaige technische Änderungen an Freigaben, GitHub-Rulesets, CI, OAuth oder Cloud-Abrechnung sind **nicht** Bestandteil dieses Dokuments.

**Dieser Governance-Kandidat ist erst mit regulärem MID-Release auf `mid-stable` maßgeblich; ein Draft-Pilot ist nicht veröffentlicht.**