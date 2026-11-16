# MID #740 · PR-only echter GitHub-Artifact-Handoff-Shadow (16.11.2026)

**Status: QA / NO RELEASE / NO MERGE / NO DEPLOY.** Dieser temporäre Pilot gehört ausschließlich zum bereits offenen Sicherheits-Draft [#839](https://github.com/MeteoMartini/MID/pull/839). Er ersetzt keine Source-/Installer-/Pages-/Worker-/Stable-Gates und darf niemals als Nachweis eines produktiven `workflow_run`-Source-Producers ausgegeben werden.

## Live verifizierter Ausgangspunkt

- `main=mid-stable=ccd1c0f60d67925aa01dd8d946b490fde4142709`, `v0.9.85.485` in `package.json`, `MID_BASELINE.json` und `contracts/index.json`. Aktive GitHub-Rulesets und bestehende Branch- und Release-Verträge bleiben unverändert.
- Der echte Source-Bot [Run #43866850451](https://github.com/MeteoMartini/MID/actions/runs/43866850451) besitzt weiterhin **0** hochgeladene Actions-Artefakte und transportiert seine ZIP-Nutzlast als Git-Commit nach `main`. Der Installer erzeugte im normalen .485-Release echte temporäre Source- und Build-Artefakte, deren Hüllen/Digests/Manifest bereits geprüft sind.
- Der vorhandene unabhängige `.github/workflows/attested-source-qualification.yml` signiert ausschließlich die geprüfte **Source-Gate-Beobachtung**, nicht das neue ZIP und ist von diesem PR-Shadow unabhängig. Kein zweiter Signierer / keine neue Attestationsberechtigung.

## Minimaler echter Cloud-Pilot mit dem vorhandenen Unit-Coverage-Workflow

Die beiden **kanonisch gespiegelten** Dateien `ci/github/workflows/unit-coverage.yml` und `.github/workflows/unit-coverage.yml` erhalten zwei zusätzliche, ausschließlich auf das **erste Repository** und **Draft-PR #839** beschränkte Jobs:

1. **PR-Shadow-Producer:** `pull_request`, exakter `github.event.pull_request.head.sha`-Checkout ohne gespeicherte Credentials; `tools/ci/mid-740-build-source-zip.py` erzeugt das ZIP ausschließlich aus Git-Blobs, nicht aus Arbeitsverzeichnisdateien. `verify-source-release-zip.py` prüft die gesamte ZIP/Git-Tree-Identität vor Upload. `actions/upload-artifact` wird SHA256-pinned und erzeugt echte Run-/Attempt-spezifische Original-Artifact-ID und -Digest; `retention-days: 1`, `if-no-files-found: error`, ZIP-auf-ZIP-Kompression abgeschaltet. Berechtigungen ausschließlich `contents: read`.
2. **PR-Shadow-Consumer:** Eigenes Job-/Checkout-Environment, exakter PR-HEAD. Das neue Hilfsprogramm `tools/ci/mid-740-pr-artifact-shadow.mjs` liest über `gh api` die echten GitHub-Run-/PR-/main-/stable-/Artifact-/Inventory-Objekte und prüft Repo-ID `1305110795`, Workflow-ID `370984997`, Workflowpfad, Branch, Run/Attempt, PR-Status, eindeutige Artifact-ID, Upload-Digest, URL und Zeitachse. SHA256-pinned `actions/download-artifact@v8.0.2` lädt mit `skip-decompress: true` die **originale GitHub-ZIP-Hülle**. Deren Original-SHA256 muss mit dem gesondert aus GitHub bestätigten Artifact-Digest übereinstimmen. Anschließend prüft der schon vorhandene Python-Verifier die ZIP-Hülle, das innere `MID-professional-replacement.zip`, alle Git-Blobs und die Dateimodi gegen den exakten unabhängig ausgecheckten Commit. Berechtigungen ausschließlich `contents: read` + `actions: read`; keine Verbindungen zu Secrets, Releases oder Produktionsendpunkten.

Das Hilfsprogramm gibt immer `actualSourceProducerVerified:false`, `nativeGitHubReviewVerified:false`, `installerAuthorized:false`, `recoveryAuthorized:false`, `releaseAuthorized:false` zurück. 26 manipulierte Szenarien plus Positiv- und Eingabevalidierung als Vitest-Regression testen vor allem falsches PR/Base/Stable-SHA, fremde Repos und Run-Pfade, Rerun-IDs, Artefakt-Tamper/Expiry, falsche Digest-/URL-/Zeit-Angaben und unvollständiges/dupliziertes Inventar.

**Keine Verwechslung:** Dies ist eine **PR-HEAD-gesteuerte, authentifizierte GitHub-Artefaktübergabe zwischen zwei QA-Jobs**. Der produktive Bot ist ein privilegierter `workflow_run` nach kontrolliertem Merge. Seine Event-SHA-/Merge-SHA-Semantik, native unabhängige Reviewer-Sperre, 0-€-Langzeitarchiv, Pages-/Worker-/Stable-/RUC-Rollback und Race-/Rerun-Negativtests unter realen Produktions-Identitäten werden **nicht** durch den PR-Shadow bewiesen.

## Dokumentation der externen GitHub-Schnittstellen

- GitHub offizielle Actions-Artefakte: https://docs.github.com/en/rest/actions/artifacts
- Original-Artefakt-IDs und `artifact-digest` über SHA256-pinned Action: https://github.com/actions/upload-artifact
- `artifact-ids` / `skip-decompress` / `digest-mismatch: error`: https://github.com/actions/download-artifact/blob/main/action.yml
- `pull_request`-Merge-SHA vs. expliziter PR-HEAD-Checkout: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- Unveränderliche Releases sind noch nicht freigegeben und erst nach allen Assets zu veröffentlichen: https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases

## Akzeptanz und Abbruchkriterien

Erst nach einem **genau für den aktuellen PR-HEAD** nachgewiesenen, vollständigen GitHub-Actions-Lauf mit SUCCESS in beiden Shadow-Jobs ist eine **PR-spezifische Transportqualifikation** belegbar. Sonstige bestehende Unit-/Coverage- und Sicherheitsjobs bleiben unverändert und dürfen nicht übersprungen/geschwächt werden. Fehlende Artefakte, anderer Head, geänderte main/stable SHA während des Laufs oder eine unpassende GitHub-Digest-/Artifact-ID führen strikt zum Abbruch. Ein Versuch darf keine Installs, Releases oder native Ruleset-Schalter betätigen; keine neue kostenpflichtige Ressource oder Secret wird angelegt. Ein PR-Merge ist weiterhin ausgeschlossen.
