# MID Release-Konzept: finaler Versions-Freeze und auflösbares KI-Review (QA-Draft)

**Status:** Der ursprüngliche #756-Baustein war isolierte, ausschließlich lesende QA. Im noch nicht veröffentlichten Sammel-PR #754 wird der Versions-Freeze mit dem Bot-/Installer-Kandidaten zusammen geprüft; die Produktivpfade bleiben bis zu einem erfolgreichen Release unverändert. Keine Ruleset-/Cubic-/Secret-Mutation. Kein neues Abo, kein neuer Workflow, keine neue Freigabeberechtigung.

## Herkunft und Konfliktgrenze

Am 11.11.2026 vor dieser Arbeit aktuell verifiziert: `main=mid-stable=7272a54ef9a9bd02fa1b6523f0cbf352b9412963`, `v0.9.85.455`. `AGENTS.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md`, `MID_CHATGPT_GITHUB_CONTRACT.md`, fünf aktive Rulesets und offene PRs geprüft. Live erneut verifizieren, bevor irgendetwas integriert wird.

- Spezial-PR [#753](https://github.com/MeteoMartini/MID/pull/753) belegt den isolierten Self-Heal-Timeout-Fix. Der Sammel-PR #754 hat dessen Änderungen einschließlich `scripts/test-release-train-plan-0985376.mjs` übernommen; nur der ursprüngliche #756-Draft blieb auf dem Testskript konfliktfrei.
- Leit-/Fach-PR [#754](https://github.com/MeteoMartini/MID/pull/754) prüft Release-Train-Diagnose, DWD-Pollen und Sicherheitsintegration; `tools/ci/release-train-plan.mjs` sowie beide `release-train-preflight.yml`-Spiegel sind im Sammel-PR tatsächlich geändert, nicht im damaligen isolierten #756-Draft.
- Review-Policy-PR [#749](https://github.com/MeteoMartini/MID/pull/749) prüft ausschließlich native GitHub-Merge-Zeitsicherung. Die lokale Daten-/KI-Evidenzprüfung in diesem QA-Draft wird nicht in #749, die produktiven Rulesets oder den Release-Bot eingefügt.
- Verbindliche Dokumentation: [#740](https://github.com/MeteoMartini/MID/issues/740) für vor Merge unbewertete Cubic-Findings. Alte Draft-#745-Findings sind nicht automatisch neue Release-Blocker; **bestätigte** P0/P1/sicherheits- oder wetterdatenrelevante Fehler bleiben aber fachlich offen.

## Release-Train: echte Umsetzung, nicht behauptete Vollautomatik

Die bereits veröffentlichte `release-train-preflight.yml` samt `tools/ci/release-train-plan.mjs` kann 1–5 PRs nach **GitHub-HEAD, Main-/Stable-Basis, allen Dateipfaden und Drift** vergleichen. Der zusätzliche `mid-release-version-proposal.mjs` berechnet arithmetisch W+1 bei Wartung oder Z+1/W=0 bei eigenständiger kompatibler Funktion. Er kann **weder semantischen Umfang noch die fachliche Korrektheit allein feststellen** und gibt immer `releaseAuthorized:false` aus. Der eigentliche Integrationsexecutor und die endgültige Versionswahl sind nicht automatisch angeschlossen.

**Release-Freeze unmittelbar vor Ready-for-review, niemals nach Source-PASS:**
1. Der Leit-Chat wählt auf dem gerade verifizierten Stable die tatsächlich kompatiblen Spezial-Drafts aus, schützt sämtliche Ausgangs-SHAs, vergleicht vollständige GitHub-Diffs einschließlich Renames und verhindert doppelte/überlappende Übernahmen.
2. Der echte, **bereits zusammengeführte Kandidaten-Diff** bestimmt die Klasse: W+1 bei Wartung, Z+1/W=0 nur bei qualifizierter eigener Funktionsfähigkeit; X/Y niemals automatisch. Entsprechende Produktentscheidung bleibt beim Nutzer. Falls sich der Umfang bis kurz vor Merge ändert: **neuer SHA, neuer Versions-Freeze, neue Bewertung und erneutes vollständiges Source-Gate**.
3. Genau **eine** Version in `package.json` setzen; aktuelles `npm run sync-version` zur Erzeugung der Spiegel nutzen. Nutzer-Release-Notes und technische Herkunft ergänzen; auf genaue Versionsgleichheit über Web, Lockfile, Baseline, Vertragsindex, Worker, Service-Worker, iOS-Shell, Changelogs und Source-of-Truth prüfen. Die eingeführte QA liest 19 echte Dateien und prüft daraus 20 separate Versionseinträge sowie beide iOS-Marketing-/Buildwerte. Missing Data/fehlende Datei ist niemals Version Null.
4. Den finalen Integrations-HEAD/SHA und die finale Version **vor** dem Übergang von Draft zu Ready festhalten. Danach normale vollständige `MID-Agent-Quellstand prüfen` → SHA-gebundener Bot → serverseitiges ZIP → `install-mid.yml` → Worker/Pages → Stable. Ein einmaliger Test dieses QA-Drafts ist keine Source-/Installer-Freigabe.
5. `0.9.85.455` zu `0.9.86.0` setzt die vorhandene iOS-Marketing-Version `0.9.86` und iOS-Buildnummer 1. Dies ist für die iOS-Marketing-Versionsfamilie zulässig und **kein künstlicher Standardblocker**; tatsächliche Distribution/Plattformanforderungen separat prüfen. Die QA erfindet keine globale iOS-/macOS-Buildnummernpflicht.

## Cubic: Qualitätsgewinn ohne unauflösbares KI-Abhängigkeitsgate

**Bewiesener Fehlerfall:** Im echten Release-PR #752 war `cubic · AI code reviewer` erfolgreich, obwohl 16 unaufgelöste Reviewfindings bestanden. Ein grüner Cubic-Check bedeutet nicht fachlich „alles grün“. Die produktiven MID-GitHub-Rulesets erfordern derzeit keinen expliziten Cubic-Check. Classic Branch Protection ist für die verbundene GitHub-Integration wegen HTTP 403 **unlesbar**, nicht nachweislich fehlend.

- **Nicht erforderlich:** Cubic-Antwort, Cubic-Pass-Check oder ein weiterer kostenpflichtiger AI-Reviewer. Bei `pending`/`unavailable` ersetzt eine unabhängige, aktuelle, SHA-gebundene Code-/Datenprüfung die KI-Beobachtung – **ohne** erneut automatisch eine Freigabe zu erteilen. Bereits bekannte Findings müssen weiter berücksichtigt werden.
- **Reale P0/P1, fachkritische P2:** Belegen, gezielt beheben (neuer SHA/Test) oder den Scope zurückstellen. Sie dürfen nicht als reine P3-Hinweise wegmarkiert werden. Bei false positive mit nachprüfbaren Fakten, Test und Erklärung disponieren. Eine dokumentierte, autorisierte Risikofreigabe kann nicht aus einer selbstgeschriebenen Zeichenfolge in einem JSON-Manifest abgeleitet werden.
- **P3/unkritische Hinweise:** Nach Prüfung nachvollziehbar dokumentieren und ggf. im bestehenden Issue behalten, ohne die Release-Automation dauerhaft festzuhalten.
- **GitHub-Threadauflösung:** Nur auf fachlicher Basis per regulärer Repository-UI/API durch dazu berechtigte Personen. Diese QA ersetzt keine native Review-/Threadschutzregel und darf keine Bot-Ausnahme schaffen.
- **Eine native Pflichtregel darf den etablierten Bot nicht blockieren:** MID erzeugt nach dem SHA-gebundenen Merge ein ZIP durch einen autorisierten direkten Commit auf `main`, und der geprüfte Installer schreibt noch einen Release-Commit auf `main`. Eine pauschale PR-Pflicht ohne kompatible, eng berechtigte Integration wäre ein Deadlock. Review-/Schutzkonzept #749 muss beide erlaubten Betriebsaktionen **und** den Schutz vor unautorisierten Merges zusammen testen.

## Tatsächlich implementierte QA

`tools/ci/mid-release-freeze-evidence.mjs` enthält drei bewusst nur lesende Funktionen:

- `assessMidVersionFreeze`: X/Y/Unterversionen, Wechseltyp W/Z, Stable-/Main-Drift und exakten finalen Integrations-HEAD prüfen – **nur arithmetisch**, ohne semantische Freigabe.
- `inspectMidReleaseMirrors`: 19 tatsächliche Repositorydateien und sämtliche erforderlichen Versionseinträge, Changelog-Anfänge, iOS-Marketing-/Buildnummern sowie Worker-/Service-Worker-Mirror lesen, fehlende/mangelhafte Einträge explizit melden.
- `assessMidReviewDispositions`: Cubic-Ausfall ist kein eigener Hardblock; fehlende unabhängige Reviewevidenz und unbehandelte kritische Findings hingegen bleiben zu qualifizieren. Die Funktion authentifiziert keine Menschen, stellt keine echte GitHub-Reviewabnahme dar und meldet stets `releaseAuthorized:false` sowie `mergeAuthorized:false`.

Die Negativ-/Positivfälle sind im **bereits bestehenden und registrierten** `scripts/test-versioning.mjs` untergebracht. Dadurch ändern sich weder `MID_BASELINE.json`, Inventar-/Shard-Zuordnung noch neue CI-/Release-Workflownamen. Getrennte Review- und Release-Gates bleiben erforderlich.

**Nicht umgesetzt:** Kein automatischer Merge/Release, kein autonomer Semantic-Impact-Entscheid, keine Produktionserzwingung von Cubic, kein neues GitHub-Required-Statuscheck, keine Änderung von Secrets/Permissions, keine Autorisierung zur Stable-Promotion. Der Leit-Chat muss für eine spätere produktive Einführung den exakten neuen Integrations-HEAD, reguläre Reviewer-Dispositionsbelege und die vollständigen Source-/Installer-/Worker-/Pages-Gates nachweisen.
