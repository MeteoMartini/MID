# MID-PR/I-CLEANER 1.1 – automatisierte, rein lesende Eingangskontrolle

**QA-only; Stand 18.11.2026.** Verifizierte ursprüngliche Basis: main = mid-stable = 8382ff3461ae21a385636e8261104b99bb8fccd0, MID v0.9.85.495, fünf aktive Rulesets. Kein Produkt- oder Release-Build, kein privilegierter Merge und kein Deploy.

## Verbindliche Prozessrollen

1. **Spezialchats:** nur einen aktiven Intake-Draft pro zusammengehörendem Thema. Originalblobs, HEAD-SHAs, Tests und offene Unsicherheiten dokumentieren; zusätzliche Ergebnisse an den bestehenden Issue-/PR-Handoff statt parallele neue Release-PRs hängen. Historische Draft-Branches und ungemergte Arbeit nicht verlieren.
2. **Cleaner:** der neue Workflow reagiert auf eröffnete/geänderte PRs und bietet einen eng begrenzten manuellen Workflow-Dispatch. Er prüft SHA-identische main-/mid-stable-Refs, drei Versionsspiegel, alle GitHub-Dateilisten samt Original-Blob-SHA, die veröffentlichten Stable-Blob-SHAs und Überschneidungen der anderen offenen PRs. Einen echten Leit-Chat-Kandidaten niemals allein aus Titel oder Datum erfinden: wenn seine explizite PR-Nummer fehlt, lautet das Ergebnis LEAD_NOT_EXPLICITLY_BOUND. Ergebnisse sind immer lesend, nie Schließ-/Mergefreigabe.
3. **Leit-Chat:** bereits vorhandene tools/ci/mid-pr-backlog.mjs und tools/ci/release-train-plan.mjs sowie release-train-preflight.yml weiterverwenden. Bevorzugt 2–4 fachlich passende, disjunkte Originaländerungen in einem autorisierten, frisch vom verifizierten Stable abgeleiteten Integrationsbranch. Vollständige Kombinations-Regressionen und vollständiges normales Source-Gate auf genau dem finalen HEAD; keine Übernahme historischer Gesamtbäume.
4. **GitHub:** vorhandener SHA-Bot-Source-Merge, serverseitiges ZIP, install-mid.yml, bedarfsabhängige Worker-/Pages-Gates und Stable-Promotion bleiben exklusiv. Native Review-Sperre und Original-Artefakt-/Recovery-Provenienz aus #740/#839 sind separate P1-Abnahmepunkte; weder Cleaner noch PR Completion noch ein grünes Draft-Signal ersetzen sie.

## Sicherheits- und Vollständigkeitsgrenzen

- Der privilegierte GitHub Event-Typ pull_request_target erhält ausschließlich contents:read und pull-requests:read. Er lädt und führt **nur den explizit benannten mid-stable-Branch** aus, niemals untrusted PR- oder PR-Merge-Code; keine PR-Secrets, Shell-Interpolation von Titeln, fremde Tools, zusätzlichen Schreibrechte oder npm-Cache.
- Vollständige PR-Dateipaginierung, genau übereinstimmende geänderte Dateizahl und HEAD-Readbacks sind Pflicht. Unvollständiges Peer-Inventar, fehlendes Stable-Blob, falscher Dateityp, GitHub-Fehler, Main-/Stable-/Checkout-Drift oder Versionsdifferenzen blockieren. Nach dem Peer-Snapshot bleibt immer eine erneute SHA-/Reviewprüfung vor Integration nötig.
- Renames, gelöschte Dateien und nichtkanonische Pfade sind nicht automatisch als bereits integriert erklärbar. Exakt identische Original-Dateiblobs im veröffentlichten Stable führen maximal zu historicalIntegrationCandidate=true mit closureAuthorized=false.
- Workflow-Ergebnis und JSON-Artefakt sind Diagnosebelege, keine Pflichtgates und keine fachliche WMO-/DWD-Prüfung. Der Cleaner schließt **nie automatisch** und kann weder Tests noch Rulesets ändern.
- Alte PRs erst nach unabhängiger exakter Blob-/Stable-/Installer-Readback und Nachweis vollständiger tatsächlicher Übernahme kommentiert schließen; keine Branch-Löschung ohne Git-Commit-Sicherung. QA-Drafts, die nur in einem noch unveröffentlichten Sammel-Draft enthalten sind, ausdrücklich offen lassen.

## QS und Release

Lokale 15 deterministische Tests, darunter Versions-/HEAD-Drift, Peer-/Pfadkollisionen, unvollständige Paginierung, fehlende Dateien, Renames/Deletes, kein Lead und Untrusted-Checkout-Sperre. Das Workflowpaar muss bei jeder Synchronisation byteidentisch sein. Dieser Kandidat benötigt nach separater Sicherheitsprüfung und vollständiger Integration einen zum tatsächlich neuen Build passenden Versionssprung, Release-Notizen, vollen Source-Core/Heavy-/Review-/Installer-/Worker-/Pages-/Stable-Gates. **Keine Veröffentlichung durch diesen Draft.**

Originaldokumentation zum sicheren Event-Trigger: https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target ; GitHub Secure Use: https://docs.github.com/en/actions/reference/security/secure-use ; GitHub PR REST: https://docs.github.com/en/rest/pulls/pulls .
