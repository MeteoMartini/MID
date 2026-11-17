# MID #740 / PR #839 · Originärer Upload-Schrittnachweis im verified artifact intake

Datum: 17.11.2026. **Nur QA/Shadow, kein Installer-Cutover, kein Release.**

## Originalbefund (Live-GitHub-Quellstand)

Authoritative Stable: `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, Version v0.9.85.486. Der bisherige #839-Source-Producer `.github/workflows/agent-source-release.yml` besitzt zwei Schritte nach dem ZIP-only-Main-Push:

1. `SHA-gebundenes Original-ZIP für #740 bereitstellen` — `continue-on-error: true`.
2. `Original-ZIP und Zuordnung kurzlebig als Nachweis hochladen` — `continue-on-error: true` mit `actions/upload-artifact`.

Damit beweist `job.status=completed && job.conclusion=success` gerade **nicht**, dass beide optionalen Schritte tatsächlich erfolgreich waren. Die erste Version von `tools/ci/mid-740-verified-artifact-intake.mjs` akzeptierte einen positiven Jobstatus ohne explizite Kontrolle der Upload- und Staging-Schritte und verglich beim zweiten GitHub-Readback nicht deren Einzelergebnisse. Ein fehlender oder gescheiterter Upload kann für eine spätere privilegierte Consumer-Kette kritisch sein.

## Implementierter fail-closed Schutz

Der **bestehende** Intake-Entrypoint `tools/ci/mid-740-verified-artifact-intake.mjs` verlangt jetzt bei beiden originalen REST-Jobreadbacks:

- Genau eine originale GitHub-Jobliste für den exakten Producer-Run, **Attempt 1**, Source-Workflow-SHA, erfolgreichen tatsächlichen Job; keine Duplikate der Job-Schrittnummern.
- Genau je einen Source-Staging- und Actions-Artifact-Upload-Schritt mit tatsächlich `status=completed` **und** `conclusion=success`. Übersprungene oder als optional tolerierte Fehler sind niemals positive Upload-Belege.
- Strikt monotonen realen Zeitablauf `Jobbeginn → Staging → Upload → Jobende`; die originalen GitHub-Artifact-`created_at`/`updated_at`-Werte müssen **innerhalb** des Upload-Schritts liegen. Fehlende/ungültige Zeitwerte, umgeordnete Schritte und Artefakterstellung außerhalb der Uploadzeit sperren.
- Vollständigen Schritt-Fingerprint aus Nummer, Name, Status, Ergebnis und Zeitwerten sowie Run-/Job-/Attempt-/HEAD-Identität vor und nach dem bereits bestehenden **echten ZIP-Envelope- und Git-Tree-Bytevergleich**. Geänderte optionale Uploads können nicht durch einen weiterhin erfolgreichen Gesamtjob verdeckt werden.

Die vorhandenen Rechte und Schutzregeln werden **nicht** verändert. Es erfolgt weder ein GitHub-Release, noch ein Installer-Dispatch oder ein Merge. Der alleinige Output bleibt `mid.740.end-to-end-intake-qa.v1` und `installerAuthorized:false`, `releaseAuthorized:false`. Der Nachweis ist erst dann live positiv, wenn **ein echter neuer originärer GitHub-Producer-Upload** vorhanden ist; die Unit-Tests allein erzeugen keinen solchen.

## Regressionen

Die bestehende `tests/unit/mid-740-verified-artifact-intake.test.ts` verwendet **echte lokal erstellte binäre ZIP-Bytes aus einem Git-Fixture**, während die GitHub-REST-Objekte kontrolliert simuliert werden. Zehn zusätzliche fail-closed Fälle erproben fremden Attempt, übersprungenen/fehlgeschlagenen Upload trotz erfolgreichem Job, fehlendes/dupliziertes Upload-Stepergebnis, identische/umgestellte Schrittnummern, zeitlich zu frühe Artefakterstellung und eine erst nach erfolgreicher ZIP-/Git-Prüfung eintretende Upload-Failure-Race. Vollständige native GitHub-Vitest-, Shadow- und CI-Ergebnisse müssen auf dem **endgültigen PR-HEAD** neu ausgelesen werden.

## Verbindliche Grenzen und Reihenfolge

1. Ein originaler, unprivilegiert vorbereiteter Producer→Actions-Artifact→Installer-**Shadow-Consumer** bleibt nötig. Producer-Job-/Step-Provenienz und Paket-Binärbytes dürfen keinen fremden Reviewer-/ChatGPT-Input vertrauen.
2. Die künftig dauerhaft erforderliche Source-/Dist-/RUC-/PWA-/Widget-/Worker-/Pages-Recovery und zwei heute noch vorhandenen direkten ZIP-/`dist`-`main`-Pushes nicht isoliert abschalten.
3. Die **menschenfreie** GitHub-native PR-Pflicht mit strikten, vertrauenswürdigen Statuschecks, 0 human approvals und ohne neue Bypass-Pfade bleibt die vom Nutzer vorgegebene spätere Zielpolicy. Kein weiteres Screenshot-/Human-Reviewer-Anfordern.
4. Erst Original-E2E, Core/Heavy, Installer, Worker/Pages, Stable und Restore auf dem endgültigen Commit → kontrollierter Release-Train. Bis dahin **NO READY, NO MERGE, NO RELEASE**.

**Handoff:** [#740](https://github.com/MeteoMartini/MID/issues/740) / [#839](https://github.com/MeteoMartini/MID/pull/839) für Leitchat/-work. Parallel-Karten-/UI-PRs bleiben unberührt.
