# MID .380 – Independent Protected Source Observation Verification

## Verifizierte Ausgangslage

Vor dem Codebranch: `main=mid-stable` v0.9.85.379 @ `c4fd1c79d0b7272b7998c79cd88d445b5681e81d` nach vollständigem Installer 41118131439, fünf aktive GitHub-Rulesets. Änderung ausschließlich auf `chatgpt/v0.9.85.380-protected-attestation-verification`; Source-PR #533. Original-Draft #530 bleibt separat und darf nicht direkt released werden.

## Konkrete Sicherheitsgrenze

Im schon vorhandenen, nur manuell auf GitHub `main` gestarteten Workflow `attested-source-qualification.yml` folgt auf den erfolgreichen attested Source-Observer ein **anderer** Job ohne Signatur- oder Release-Schreibrechte. Die beiden kanonischen und aktiven Workflow-Dateien müssen bytegleich sein. Der Verifier lädt nur den signereigenen `mid-protected-observation-RUN-ATTEMPT`-Anhang, fordert genau eine kanonische Datei ohne Symlink an und verifiziert ausschließlich online über `gh attestation verify` mit festem Repo, Signer-Workflow, Signer-Digest, Hauptbranch-Ref, Source-Digest und `--deny-self-hosted-runners`, ohne fremdes `--bundle`.

Validiert werden zertifizierter Repository-Identifier und Repository-Name, exakte Protected-Signer-SHA/Ref, SLSA-Aussage und SHA256-Subject. Der unterschriebene Bericht muss mit einem **erneut unabhängig authentifiziert** abgerufenen Source-PR, Source-Run/Attempt, Main-/Stable-SHA und vollständig eindeutigen elf Source-Core/Core-/Heavy-Pflichtjobs zuzüglich Aggregator übereinstimmen. Frische, Run-Herkunft und Zeitgrenzen sind Pflicht. Nicht passende Zertifikate, fehlende/duplizierte Jobs, veränderte PR-Quelle, unvollständige Antworten, unbekannte Dateieinträge, fremde Repo-/Actor-Claims, falsche SHA, abgelaufene Berichte sowie `releaseAuthorized`/`reuseAuthorized` ungleich `false` führen fail-closed zum Fehler.

## Reproduzierbare Prüfungen

Adversarielle Tests in `tools/ci/verify-protected-source-pilot.test.mjs`, fest im bestehenden obligatorischen `scripts/test-build-parity-0985377.mjs` importiert. Der synthetische Erfolgsfixture zeigt **nur** Schema-/Vertragserfüllung und meldet selbst bei Erfolg `releaseAuthorized:false` / `reuseAuthorized:false`. Eine simulierte Sigstore-Antwort ist keine reale kryptografische Abnahme. Die Workflow-Prüfung sichert Signer-/Verifier-Rechtetrennung, gepinnte Action, unveränderten Pflichtfreigabepfad und kanonischen Workflow-Mirror.

## Offen, bevor Issue #526 geschlossen werden darf

1. Nach vollständiger Stable-Promotion einen tatsächlichen **manuellen** geschützten Signatur-Workflowlauf für eine bereits erfolgreich und kontrolliert gemergte Source-PR mit korrekter Source-Run-ID starten. Signierjob und separater Verifier müssen mit identischer gültiger Protected-SHA erfolgreich laufen; tatsächliche Sigstore-Verifikation und signierten Subject-Digest dokumentieren.
2. Eigenständig A/B für identische vollständige Source-/Tree-/Lock-/VITE-/Umgebungseingaben und alle Pflicht-Source-/Core-/Heavy-/Installer-/Worker-/Pages-/Stable-Gates messen. Signierte Observation ≠ Build-/Testartefakt-Korrektheit. Keine produktive Wiederverwendung, bis eine gesonderte Version, Angriffs-/Ablaufprüfung und Vertragsfreigabe alle geforderten Nachweise haben.
3. Die in #526 beschriebene gemischte historische Laufzeitkohorte nicht als neues optimiertes P50/P95 ausgeben; echte natürliche neue Releases und Retry-/Queue-/Kostenbezug weiterhin getrennt erfassen.

## Unveränderter Releasepfad

Regulärer MID Source-PR-Gate → SHA-bound Merge-Bot → serverseitiges Release-ZIP → `install-mid.yml` → Worker-/Pages-Checks → Stable. Kein direktes Schreiben in `main`/`mid-stable`, keine Testsprünge, keine neuen kostenpflichtigen Dienste, keine echten iOS-/VoiceOver-Prüfbehauptungen ohne Gerät.
