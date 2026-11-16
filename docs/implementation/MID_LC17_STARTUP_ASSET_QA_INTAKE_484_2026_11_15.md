# MID LC 1.7 – Startup-URL-Normalisierungsintegrität / QA-Intake #835 (15.11.2026)

**STATUS: QA-DRAFT, KEIN RELEASE.** Vor Quelltransport gecheckt: Stable/Main `c9fadfcd0969e949a92f414b321627dd3d4fb0cc` / `v0.9.85.483`, fünf aktive Rulesets, verbindliche `AGENTS.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md` und `MID_CHATGPT_GITHUB_CONTRACT.md`; bestehender [Integrations-PR #833](https://github.com/MeteoMartini/MID/pull/833) / Quell-HEAD `c6e9d4f8aa112594058af455eff76ca9307e5dae`.

## Sachlicher Defekt und Reparatur

Die WHATWG-URL-Auflösung entfernt (auch kodierte) Dot-Segmente, bevor ein normalisierter URL-Pfad sichtbar geprüft werden kann. Ein ursprünglicher dynamischer HTML-Startpfad wie `./%2e%2e/assets/index.js` hätte früher budgetrechnerisch dasselbe Ergebnis wie `./assets/index.js` erhalten. Der Quellcode von [#835](https://github.com/MeteoMartini/MID/pull/835) auf HEAD `a82440de4ef2e4f88f281c9a6d5f0622ca8993f2` prüft daher die **roh übergebene, einmal percent-dekodierte URL-Pfadkomponente VOR `new URL()`**, lehnt `..` und innere `.`-Segmente und fehlerhafte Kodierungen ab und belässt die bestehenden Regeln für externe URLs, Backslashes, Missing-Data und Asset-Hashes unverändert.

## Exakte Git-Blob-Übernahme ohne Überschneidung

- `scripts/lib/startupAssetEvidence.mjs` (Git-Blob `101d758d8b1e0eb7a8497b9a52e63098d921828b`).
- `scripts/lib/initialCssBudget.mjs` (Git-Blob `f7477bf697735ed1474f0529ce7ac31eec045851`).
- `scripts/test-startup-asset-evidence-0985482.mjs` (Git-Blob `d405f073bc2798d4a9c499f32365308c62043971`).
- `scripts/test-initial-css-budget-contract-0985351.mjs` (Git-Blob `72ed91d3566de8885dc2377744aa1d682419b61d`).
- `docs/implementation/MID_DESIGN13_STARTUP_ASSET_URL_INTEGRITY_QA_2026_11_15.md` (Git-Blob `12f6d8a03d1537922414cae6d1ea06accbac8359`).

Alle fünf Pfade wurden gegen die Integrationsbranch-Git-Blobs geprüft; **0 überlappende Patchpfade**, die vier alten Quell- und Testblobs waren dort unverändert, das neue Dokument fehlte. Kein Workflow, `main`, `mid-stable`, Secret, Worker, iOS-Code oder Datenprodukt wird verändert. Echte Quelle #835: Draft-Regression und Vitest 5 + V8-Coverage am Spezial-SHA SUCCESS; dies ist nicht die komplette Prüfung des Integrations-HEAD.

## Paralleler Kartenstrang #832

Die separate 15-Minuten-DWD-Phase-Originalzulassung bleibt bewusst **nicht** Bestandteil dieses UI-/Asset-Intakes. Sein Vorgänger `b96d8d96ed6b5cf6544d68328e8646404e4dd6eb` hatte `MID Draft · gezielte Regressionen` FAILURE in [Run 43767302273](https://github.com/MeteoMartini/MID/actions/runs/43767302273): `test_original_15min_phase_gate.Native15MinGspPhaseTests.test_sha_bound_30_frame_same_run_co_admission_stays_shadown_only` erwartete `SHA256`, erhielt aber bereits `unsafe original GRIB file`. Späteres Quell-Fix-Head `6f80ebb037013e2f2f69e4911feb09898e64459a` ist separat zu verifizieren; keine vorzeitige Datengenehmigung. Bereits in #833 vorhandene Rad/Sat-/Cloud-/OPERA-Timeline und Zeit-/Ort-Guards bleiben erhalten.

## Fachliche und formale Grenzen

- Vor Production: SHA-gebundene vollständige Source-Core-/Core4-/Heavy6-, TypeScript-/Vite-Build- und Origin-/NoData-/Wetter-/Kartentests mit echten Daten, Browser-/Mobile-/Offline-/iOS-Abnahme. Startup-Budget-Versandqualität ist nicht identisch mit gemessener FCP, INP, JS-Startup oder Boot-Zeit.
- [Issue #740](https://github.com/MeteoMartini/MID/issues/740): Native GitHub-Mergezeit-Review-Absicherung ist unter den aktuellen Produktionsrulesets **nicht** nachgewiesen; bestehender Readback allein schließt TOCTOU nicht und der ZIP-/Installerbot-Transport muss kompatibel bleiben. Keine Rule-/Bypass-/Bot-Änderung auf Verdacht.
- [Issue #829](https://github.com/MeteoMartini/MID/issues/829): Open-Meteo-Pflicht-HTTP-429 weiterhin gesondert fachlich revalidieren. DWD-Originaldataset-Gate [43749744387](https://github.com/MeteoMartini/MID/actions/runs/43749744387): ungeklärte `TOT_PREC`-Negativzellen, keine Native-/15min-Freigabe.
- Nur kanonischer Ablauf: Source PR Gate -> SHAgeprüfter kontrollierter Merge -> serverseitiges ZIP -> `install-mid.yml` -> Worker/Pages -> Stable-Promotion. KEIN DIREKTER RELEASE.
