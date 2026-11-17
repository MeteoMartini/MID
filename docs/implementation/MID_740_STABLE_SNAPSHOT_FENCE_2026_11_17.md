# MID #740 / PR #839 · SHA-gebundener Stable-Readback nach .487-Promotion

Stand 17.11.2026 · Security-Draft, **KEIN** Release/Cutover. Verifizierter Stable `main=mid-stable=ee70a92ae6ed83d3fa46445f4941e3db8b8675d4` / v0.9.85.487 (alle drei Version-Mirrors). Beim regulären Release .487 gingen die drei originalen Git-Commits Source-Merge `c29d8d031a39fa1881a619c0b8e02abd85f3c345` → ZIP `10b4e21e8800c444e0e296b627a648efc30b00bb` → Installer `ee70a92ae6ed83d3fa46445f4941e3db8b8675d4` voraus. Exakte Referenz: https://github.com/MeteoMartini/MID/actions/runs/44107815367 (Installer SUCCESS).

## Verlusterhaltende Synchronisation

#839 hatte davor den HEAD `c5f991e62208dd4cd932dc06a00df952571a8c53`, dessen Ursprung auf Stable .486 lag. GitHub-Original-Compare zeigte 118 durch .487 geänderte Pfade und 71 Security-Pfade mit **0 Überschneidungen**. Der neue zweielterige Security-HEAD `60ff85bb38bdea613ddbc104258cf69a34f1340c` hat den alten HEAD und den neuen Stable als Eltern; er bewahrt byte-/modegenau alle 71 Security-Git-Blobs sowie 3.973 nicht betroffene Stable-Git-Blobs. Branch-Update nur erwartungs-SHA-gebunden fast-forward; kein Force, keine direkte main-/Stable-Veränderung. Prüfe nach jeder weiteren Stable-Promotion erneut.

## Veraltete hartcodierte Stable-Abfrage korrigieren

`tools/ci/mid-740-native-review-cutover-readback.mjs` hatte v0.9.85.486 fest einkompiliert. Diese read-only QA hätte bei jeder späteren validen Stable-Promotion ohne Sicherheitsgrund blockiert. Stattdessen muss sie **zwingend** `expectedStableSha` aus dem authentifizierten GitHub-`pull_request.base.sha`-Webhook-Event verlangen. Ohne syntaktisch exakt 40-hex SHA kein GitHub-REST-Lesen. Die originalen GitHub-REST-Refs `main` und `mid-stable` und alle sha1-geprüften Produktionsworkflow-Blobs werden gegen exakt diesen SHA verglichen und nach der Ruleset-/Branchschutz-Inspektion erneut abgerufen. Der Workflow darf keine SHA aus untrusted PR-Code, PR-Body oder einem frei geratenen HEAD verwenden. Der zweite, exakt gespiegelt versionierte Workflow übergibt GitHubs base SHA über `MID_EXPECTED_STABLE_SHA` und bindet `jq` den Response-`stableSha` zusätzlich an diesen Wert.

**Unverändert historische QA:** Die Original-.486-Fallstudie `mid-740-historical-chain-readback.mjs` bleibt absichtlich an den historischen SHA gebunden; niemals dessen Original-Läufe umdeuten. Neue adversariale Unit-Tests: kein oder ungültiger erwarteter SHA → sofort BLOCKED ohne REST; abweichender SHA → BLOCKED; verifizierbarer künftiger Stable-SHA mit denselben vertrauenswürdig originalen Legacy-Pfaden → nur QA-Befund, **niemals Autorisierung**.

Noch **P0**: authentifizierter abgeschlossener Originalproducer→Actions-Artifakt→separater Pre-Installer-Verbrauch exakt dieser geprüften Bytes, unabhängige menschenfreie GitHub-native P0/P1/P2-Review-Dispositions-Gates, Ersetzung beider direkten main-Writes *zusammen*, immutable ZIP/dist/Widget/PWA/RUC/Pages-Recovery, vollständig neuer Source/Core/Heavy/Installer/Worker/Pages/Stable-Test und sicherer Rollback. `nativeReviewEnforcementVerified:false`, `installerAuthorized:false`, `cutoverAuthorized:false`, `releaseAuthorized:false` bleiben QA-garantiert.

Quellen: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows und https://docs.github.com/en/actions/reference/security/secure-use .
