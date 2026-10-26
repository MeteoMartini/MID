# MID-C51 · CSS-Browser-Release-Diagnose .341 (Source-Kandidat)

Kanonischer veröffentlichter Ursprung: .338 Stable SHA `ed934fb0e755e54e0e4a553b8c47d44f7a59c262`. Nachgewiesene Quelllineage: .339 PR #482, .340 PR #483 (SHA `740cef46e07037ec8ee2c7fa0f3b7b7629bc435a`). Unveröffentlichtes Main-Release-ZIP .340: `02b88500e31f55e10c50c9097e7a47a572608d42`; bei der Integration wird dessen Quellen-Commit ancestry-geprüft, das alte ZIP **nicht** transportiert. Der MID-Bot erstellt ein neues serverseitiges ZIP erst nach dem regulären Source-Gate.

## Verifizierter Befund

Installer [#40392851592](https://github.com/MeteoMartini/MID/actions/runs/40392851592): Release-Core inklusive 1.019+ Regressionen grün, Heavy Native/Unified (3 Shards)/Mountain grün. Allein `heavy-browser-state` überschritt das unveränderte **15-Minuten-Stepbudget**. Favoriten 24/24 und Persistenz 12/12 bestanden. Das Pflichtskript `test-fourteen-css-lazy-0985339.mjs` wurde anschließend aufgerufen, aber dessen `stdout/stderr` wird im Regression-Runner bis zum Ende des Tests gepuffert. Ein einzelner Browser-/Cache-Fall, Vite-Build, Playwright-Setup oder Wrapper-Watchdog wurde dadurch nicht zeitlich identifizierbar; Flakiness ist *nicht belegt*. Source-Gate [#40390937877](https://github.com/MeteoMartini/MID/actions/runs/40390937877) bestand denselben Browser-Shard in ~268 s (CSS-Test ~210 s). Die RUC-Frische-Regression aus .339 ist im .340 Installer grün; sie bleibt unangetastet.

## Einziger funktionaler Eingriff

`scripts/run-regressions.mjs` streamt **nur** während `MID_REGRESSION_VERBOSE=1` die vorhandenen `stdout/stderr`-Chunks von `test-fourteen-css-lazy-0985339.mjs` live nach GitHub Actions; die unveränderte, 16-MiB-begrenzte Ergebniserfassung, Exit-Codes, Fehlerliste, Vollständigkeits-/Sicherheitsgate und vollständige Browser-/Pixel-/Computed-/SVG-/Tastatur-/Overflow-/Cache-Parität bleiben identisch. Doppelte Erfolgsausgabe dieses einen Tests wird vermieden. Keine Änderung an `MID_REGRESSION_SHARD`, Workflow-Time-outs, Playwright-Engines, Testzahlen, Meteo-, Worker- oder CSS-Produktdaten. Wird die CSS-Diagnose später erneut blockiert, liefert der CI-Log jetzt den letzten erreichten Schritt als harte Evidenz; erst dann ist eine isolierte Ursache anhand des tatsächlichen Logverlaufs abzuleiten.

## Verbindliche nächste Gates

1. PR-Source-Gate samt Core und allen sechs Heavy-Shards für den exakten .341 HEAD, Reviews und Security.
2. SHA-gebundener MID Agent Source Release Merge; neues ZIP ausschließlich serverseitig, keine alte .339/.340 Zip-Kopie.
3. `install-mid.yml` inklusive **erneuter** Heavy-Browser-State-Prüfung, Worker/Pages, finaler Stable-Promotion mit `force=false`.
4. Nur tatsächliche, belegte Checks als grün werten; bei erneutem Timeout keine Freigabe und erst dann gezielte weitere Reparatur.

Die aparte 7-Tage-Skybar-Astronomiebehebung und ICON-D2-RUC-Vollgebietsdarstellung bleiben gesonderte Aufträge ohne ungeprüfte Mitnahme.
