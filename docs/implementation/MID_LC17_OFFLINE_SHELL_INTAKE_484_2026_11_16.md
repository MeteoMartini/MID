# MID LC 1.7 – Intake Offline-Shell-Messnachweise aus Spezial-PR #836

**16.11.2026 · QA DRAFT · NO RELEASE**

## Source of Truth / Quelltransport
- Verifiziert `main=mid-stable=c9fadfcd0969e949a92f414b321627dd3d4fb0cc`, `v0.9.85.483`, fünf aktive GitHub-Rulesets, `AGENTS.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md`, `MID_CHATGPT_GITHUB_CONTRACT.md`.
- Integrations-PR [#833](https://github.com/MeteoMartini/MID/pull/833) hatte vor Transport HEAD `4f876c6a6ff78249d4d3f86dadb0d78f2d78a620`, mit v0.9.85.484 synchronisierten Paket-/Baseline-/Contractspiegeln, fünf grünen Draft-Jobs und ausstehenden vollständigen Source-/Releasegates.
- Live-Quellprüfung [#836](https://github.com/MeteoMartini/MID/pull/836) gegen neuestes HEAD `e69b6831ab775e6cb9792b73f232a28ce5f77791` (früheres `7cc15cd4bbb436de7a6394479963fe73e743519e` ist überholt). Der parallele Nachtrag korrigiert nicht nur Dokutext, sondern härtet die Parsersemantik und ergänzt einen synthetischen SHA-/Dist-End-to-End-Test. **Beide aktuellen Spezial-Draft-Jobs SUCCESS**. Kein Source-/Releasegate dadurch ersetzt.
- Vier übernommene Pfade wurden vor Merge mit dem Integrations-PR differenziert: **0 überlappende Pfadänderungen**, keine geänderten Workflows, Paketabhängigkeiten, Worker, Wetterkerne, Native-Decoder, Warnungen, Nutzerpräferenzen oder Berechtigungen.

## SHA-genaue neue Quellblobs
- `scripts/lib/offlineShellAssetEvidence.mjs`: `d829d401cdf61575175e7afa94dc875a77c806af`.
- `scripts/measure-startup-assets-0985482.mjs`: `e85ff87288a9f9fbbb4dce690f97317e07e50ff0`.
- `tests/unit/mid-offline-shell-asset-evidence.test.ts`: `e1c40eb056c70994f090ac2df2a336a92005d10f`.
- `docs/implementation/MID_DESIGN13_OFFLINE_START_ASSET_EVIDENCE_QA_2026_11_15.md`: `e0391ea815a7aed007aa68ffe071bb7860a0ec3c`.

## Mess- und Prüfnachweis
- `rel=mid-offline` ist ein MID-interner **Installations-/Offline-Shell-Hinweis**, **kein** Browser-`modulepreload`; gemessen werden ausschließlich deklarierte, bereits mit vollständiger Assetinventar- und SHA-Identität verbundene `dist/index.html`-Referenzen. Kein Nachweis von real übertragenen Bytes, initialer JS-Ausführung, Cache-Vollständigkeit, FCP/INP oder iOS-Offlineverfügbarkeit.
- Der Bericht ergänzt `offlineShell` mit `total`, `sharedWithHtmlStartup` und `offlineOnly`. JS/CSS sind dedupliziert; raw/gzip und CSS-Brotli existieren ausschließlich bei vollständigen echten Zahlen. Fehlen Asset, Metrik, Integritätsdaten, zulässige lokale Quelle oder `rel=mid-offline`-Deklaration, **Fail-Closed**.
- Zusätzliche Absicherung am **neuen HEAD**: `mid-offline` zusammen mit `preload`, `modulepreload`, `prefetch` oder `stylesheet` wird ausdrücklich als mehrdeutige Browser-Netzwerkanforderung abgelehnt, nicht versehentlich als rein deferred kategorisiert. Existierende %2e-Dot-Traversal-/Encoded-Slash-/Backslash-/Absolute-/External-Guards bleiben verbindlich.
- Neue synthetische vollständige `dist`-Testumgebung mit versioniertem SHA-Fingerprint testet den realen Entry-Point `scripts/measure-startup-assets-0985482.mjs`, nicht nur den reinen Helfer; alter Testbestand mit gültigen lokalen Query-URLs, Deduplizierung und Missing-/Corruption-/NoData-Negativfällen bleibt bestehen. **Echte Produktionsgrößen sind nicht gemessen.**
- Keine Veränderung an `verifyStartupBuildIdentity`, bisherigen `js`-/`css`-/`provenance`-Properties oder bestehenden Budgetgrenzen. Der zuvor integrierte URL-Guard aus [#835](https://github.com/MeteoMartini/MID/pull/835) bleibt aktiv.

## Security / Release-Handoff
- Automatischer Dependabot-Workflow-Update-[PR #837](https://github.com/MeteoMartini/MID/pull/837) betrifft 30 GitHub-Actions-Pfade und hat Vitest-V8 und D2-Physik/NoData **FAILURE**. Ohne kompatible Runner- und Workflowspiegelqualifikation nicht in #833 aufnehmen. Breites npm-Update #720 ebenfalls getrennt.
- [Issue #740](https://github.com/MeteoMartini/MID/issues/740): produktives Branch-Ruleset erzwingt weiterhin keine native PR-Review-/TOCTOU-Absicherung; Review-Readback allein keine Mergezeitgarantie. Anpassung erfordert funktionierende SHA-gebundene Bot-/ZIP-/Installertransportparität unter unveränderten Sicherheitsregeln.
- [#446](https://github.com/MeteoMartini/MID/issues/446): Original-TOT_PREC bei +48h mit winzigen ungleichnulligen CCSDS-Referenzwerten weiterhin ohne fachlichen positiven Monotonie-/Accumulationsnachweis. [#832](https://github.com/MeteoMartini/MID/pull/832) IR10.8/GSP-15min ist weiter Shadow ohne nachgewiesene zeitgleiche Originaldaten für produktives SigWx. Kein Data-Fabrication-/NoData-Override.
- Noch nachzuweisen: vollständige Main-Source/Core/Heavy-Suite, echter Vite-Produktionsbuild und SHA-gebundener Stable-Größenvergleich, responsive Browser-/Offline-/iOS-Abnahme, Rechts-/Reviews-/Releasegates. Bis zum belegten Abschluss gilt **NO MERGE / NO ZIP / NO INSTALLER / NO PROMOTION**.
