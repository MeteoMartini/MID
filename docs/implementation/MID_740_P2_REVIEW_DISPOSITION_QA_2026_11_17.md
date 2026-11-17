# MID #740 / PR #839 · P2-Review-Dispositionsgate (QA-only, 17.11.2026)

**Status:** Sicherheits-Draft. Keine neue Produktivberechtigung, keine Änderung an `main`/`mid-stable`, Rulesets, Installer oder produktiven Release-Workflows. Ausgangsstand zur Entwicklung: `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957` / v0.9.85.486, fünf aktive GitHub-Rulesets; unabhängig laufender Karten-/Umfeld-Release-Train #868 bleibt außerhalb dieses Branch-Scope.

## Ursache / verifizierter fachlicher Handoff
Der [MID-Leitchat-Kommentar zu #740](https://github.com/MeteoMartini/MID/issues/740#issuecomment-6943252830) dokumentiert eine echte Auslassung in `tools/ci/mid-review-premerge-guard.mjs`: Der alte Scanner inventarisierte nur `P0/P1`, und ein ausschließlich in einem `COMMENTED`-Review-Body enthaltenes `P2: confirmed NoData-to-zero` konnte ohne Thread oder `CHANGES_REQUESTED` als `READBACK_CLEAN` erscheinen. Diese Aussage blieb ausdrücklich `mergeAuthorized:false`, ist also keine echte frühere Mergefreigabe. Außerdem wurde `[P1] Befund` ohne Doppelpunkt übersehen.

## Gezielte, konservative, fail-closed Regel
- Der vorhandene `criticalMidReviewItems`-Scanner inventarisiert nun **alle expliziten P0/P1/P2-Findings** in GitHub-Review-Bodies **und** Inline-Thread-Kommentaren, in Quellreihenfolge. Das umfasst Plain `P2:`, Markdown `[P1] Befund`, `**P2** Befund`, sowie die bisherigen Doppelpunkt-/Dash-Formen. Ein bloßes `P2 only` ohne Severity-/Finding-Trenner ist kein Marker.
- **Warum alle P2 statt nur auf untrusted Bot-`confirmed`-Labels zu vertrauen?** Die GitHub-Reviewdaten sind beweisbare *Äußerungen*, keine unabhängige fachliche Einstufung; ein Bot kann die Bedeutung von NoData, Lauf-/Gültigkeitszeiten, Warn-/Quellenprovenienz oder Security-Kategorien nicht selbst verbindlich herunterstufen. Daher muss jeder so markierte P2 durch einen authentischen, vom Source-Autor und Finder getrennten, schreibberechtigten menschlichen GitHub-Reviewer mit dem bisherigen **SHA-gebundenen** `MID-740-DISPOSITION v1` je Item und zulässiger GitHub-Evidenz bewertet werden. Die Disposition kann fachlich `fixed` oder `false-positive` lauten. Ein grüner Tool-Readback **ersetzt nie** native GitHub-Mergezeit-Approval-Regeln.
- Dies ist **bewusst strenger** als eine nur fachlich bestätigte P2-Auswahl. Es kann auch als kosmetisch deklarierte P2 dispositionpflichtig machen; diese konservative Mehrarbeit ist gegenüber stillem Übersehen eines echten Wetterdaten-Integritätsmangels zu bevorzugen, bis ein eigentümerbestätigter, unabhängiger Severity-/Fachklassifizierungsvertrag verfügbar ist.
- Die vorhandenen doppelten GitHub-REST/GraphQL-Readbacks, Thread-Vollständigkeits-, Reviewer-Unabhängigkeits-, HEAD-SHA-, Zeit-, Commit- und Evidence-URL-Prüfungen bleiben unverändert. Es gibt **keine neue Abkürzung**, keine zusätzliche `mergeAuthorized`-/`releaseAuthorized`-Berechtigung und keine automatische Blockade-/Ruleset-Umgehung.

## Geprüfte Regressionseigenschaften
Die bestehende `tests/unit/mid-review-premerge-guard.test.ts` verlangt zusätzlich:
- `P2: confirmed NoData-to-zero` und `[P1] validTime mismatch` aus einem **alleinstehenden COMMENTED-Review** werden unabhängig von Inline-Thread-Status vollständig inventarisiert.
- Ohne unabhängige Disposition ist `MID_REVIEW_CRITICAL_REVIEW_UNATTESTED` zu erwarten; eine von zwei Dispositionen reicht nicht.
- Zwei SHA-/Reviewer-/Evidenz-gebundene Dispositionen können den **QA-Readback**, aber nicht den tatsächlichen Merge oder Release zulassen.
- Veraltete oder selbst erteilte Reviews sowie ein Bot-`P2: noncritical; marked fixed` ohne Human-Evidence bleiben gesperrt.
- Vorbestehende `CHANGES_REQUESTED`-Regression testet ihren eigenen State-Vertrag ohne gleichzeitiges P2-Finding; die separate P2-Regressionsabdeckung bleibt eigenständig.
- Die alte gemischte XML-P0/P1/**P2**-Probe erfordert jetzt auch die dritte konkrete Disposition; Zahl und Reihenfolge dürfen nicht stillschweigend reduziert werden.

## Noch nicht erfüllt
Für #740 weiterhin P0: echter originärer Source-Producer→GitHub-Actions-Artifact-ID/Attestation/Originalbytes→SHA-/Attempt-gebundener Installer-Konsum mit unveränderlichem dist-/Manifest-/Widget-/RUC-/Pages-/Worker-Recovery; sichere Ablösung **beider** direkten `main`-Pushes; GitHub-native nicht umgehbare PR-/unabhängige Approval-/stale-dismiss-/Thread-Pflicht; qualifiziertes Immutable-Release-Verfahren. GitHub-Owner-Einstellungen **erst** nach erfolgreicher technischer E2E-/Recovery-Prüfung aktivieren. Der gemeinsame Branchschutz umfasst auch `mid-stable`: neue PR-Pflicht nur main-spezifisch nach Stable-Promotion-Kompatibilitätsabnahme, bestehende Stable-Rulesets nicht abschwächen.

**Evidenzpunkte:** [Issue #740](https://github.com/MeteoMartini/MID/issues/740) · [PR #839](https://github.com/MeteoMartini/MID/pull/839) · [GitHub Regeln / Reviews](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).
