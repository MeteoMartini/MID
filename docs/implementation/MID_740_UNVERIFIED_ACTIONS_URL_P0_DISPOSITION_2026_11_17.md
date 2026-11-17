# MID #740: Actions-Run-URL ist kein authentifizierter P0/P1/P2-Beleg (QA only)

Stand 17.11.2026. Security-PR #839, **NO READY / MERGE / RELEASE**.

Der bisherige `tools/ci/mid-review-premerge-guard.mjs` wertete die reine URL-Syntax `https://github.com/MeteoMartini/MID/actions/runs/<run>/job/<job>` oder `.../runs/<run>` als mögliche Quelle einer sonst unabhängigen `MID-740-DISPOSITION`. Ein GitHub-Run-Link selbst enthält jedoch **keine** Bindung an Source-HEAD, Workflow-ID, Attempt, Job/Step, Originalartefakt, unveränderte Bytes oder Review. Es fand an dieser Stelle kein authentifizierter GitHub-REST-Readback für diese IDs statt. Auch ein völlig fremder erfolgreicher Run wäre syntaktisch akzeptiert worden.

**Minimaler fail-closed-Fix:** Solange kein unabhängiger originaler GitHub-REST-Run-/Job-/Artifact-Readback mit exakter SHA-/Attempt-Provenienz implementiert ist, werden alle generischen `actions/runs/`-Verweise als individuelle P0/P1/P2-Disposition abgelehnt. Zulässige explizit source-SHA-gebundene Blob- und PR-Kommentar-Permalinks behalten ihre bisherige *nur syntaktische* QA-Semantik. Auch eine syntaktisch zulässige Referenz beweist weder fachliche Richtigkeit noch Datei-Existenz; alle Ausgaben halten `mergeAuthorized:false`, `releaseAuthorized:false` und `nativeEnforcementRequired:true` bei. Keine bestehenden GitHub-Rulesets, Secrets, Token, Actions-Berechtigungen oder produktive Workflows geändert.

Die neuen adversarialen Vitestfälle versuchen den historischen Installer-Run #44121560818 mit beliebiger Job-ID sowie fremde erfundene Run-/Job-IDs als Abnahme einer echten Cubic-P1 auszugeben: alle müssen `MID_REVIEW_CRITICAL_REVIEW_UNATTESTED` ergeben. Ein korrekt SHA-tethered Blob-Link bleibt lediglich ein nicht-autorisierender Beleg-Verweis.

**Nicht mit Freigabe verwechseln:** Der bisherige Guard verlangt weiterhin menschliche GitHub-`APPROVED`-Dispositionsreviews. Der Owner fordert **0 menschliche Code-Approvals**; keinesfalls bloß auf KI-Text oder `Bot`-Login lockern. Ersatz braucht GitHub-native bypassfreie main-only PR-/0-Approval-/Pflichtcheck-Regeln und unabhängige, originale automatische P0/P1/P2-Reviewer-/Run-/Job-/SHA-/Artifact-Belege. Der Leitchat-Train #902 hat 23 eigene #839-Dateiübernahmen; dieser eng begrenzte Reviewguard-Patch überschreibt keinen seiner Pfade. Der separate Source-Gate-Blocker #903 (offiziell bislang ungepatchtes picomatch) bleibt unberührt.

GitHub Primärquellen: https://docs.github.com/en/actions/reference/security/secure-use ; https://docs.github.com/en/rest/actions/workflow-jobs .
