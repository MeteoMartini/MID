# MID v0.9.85.255 – Unified-Map-Revision unter Software-GPU-Last

## Evidenz und verifizierter Ausgangspunkt
- `main = mid-stable = fa44b5c5704152509bbd7fd74c45415ddde47011`, Version v0.9.85.254, 14.10.2026.
- PR #359/.254 behebt den Live-Katalogfehler mit D2-Zusatzterminen +13/+14/+16/+17; keine Wiederherstellung älterer Client-Verträge.
- Source- und Installer-Heavy-Matrix auf .254 grün. Dagegen der nachgelagerte Stable-Push-Revisionslauf https://github.com/MeteoMartini/MID/actions/runs/38618839911: Build erfolgreich, 968/968 Testfälle gestartet, genau 1 Fehler `test-unified-map-layers-0985167.mjs`.
- Originalfehler aus Job 116040791211: `page.waitForFunction: Timeout 30000ms exceeded` bei der zwingenden Kontrolle des MapLibre-Layers `unified-wms-pressure-isobars-line-dashed` nach Wahl von ICON-EU und des echten +3-h-Termins (scripts/verify-unified-map-browser-0985167.mjs:89). Vier parallel ausgeführte Mobil-/Theme-/Designfälle meldeten dieselbe Isobaren-Layer-Wartezeit und leere bin-Anfragen. Kein belegter genereller Katalogfehler; Konkurrenz um den gemeinsamen Software-GPU-/Vite-Runner ist eine zu überprüfende plausible Ursache, keine als bewiesen behauptete Produktursache.

## Kontrollierter Eingriff in die Browserprüfumgebung
- Der bisherige Browser-Runner startete bei Breiten unter 1024 px **vier** simultane MapLibre-/SwiftShader-/Vite-Sessions innerhalb eines Child-Prozesses, bei großen Desktops eine. Die neue versionierte `mapBrowserCaseConcurrency(width)`-Regel verwendet maximal **zwei** unter 1024 px, sonst weiterhin eine. Keine Browser-/App-Produktdatei verändert.
- Alle 24 Viewport-/Theme-/Classic-/Next-Fälle bleiben **identisch** und vollständig über das vorhandene `mapBrowserRunPlan`-Sharding (1/3, 2/3, 3/3) erhalten; alle 24 werden weiterhin ausgeführt. 900000-ms-Grenze pro Shard und 30000-ms-Layer-Ready-Grenze bleiben bestehen.
- Das strikte Warten auf den tatsächlichen ICON-EU-Isobaren-Layer bleibt ohne Retry, Skip oder Scheinerfolg. Im Fehlerfall werden zusätzlich Breite/Theme/Design, Kartenstatus, tatsächlich vorhandene Drucklayer, Feld-Requests und Browserfehler geloggt.
- `test-unified-map-layers-0985167.mjs` schützt die beschränkte Konkurrenzzahl, Desktop-Budget, vollständige 24-Fall-Partition und zwingende Isobaren-Asserts.

## Freigabe und offene Punkte
- Erneute vollständige Source-PR- und Installer-Regressionen einschließlich 24-Browserfall-Matrix, Packaging, iOS-Webhülle, Worker/Pages und Stable-Fast-Forward sind **vor** Promotion erforderlich; CI-Erfolg ist keine echte physische iOS/WKWebView/VoiceOver-Abnahme.
- Nach der Veröffentlichung ist eine **separate Stable-Push-Revision** besonders auf den bisher fehlgeschlagenen Isobaren-Layer abzuwarten. Ist sie erneut rot, bleibt #348 offen und die Fehlerursache wird am neuen Log weiter analysiert, statt Timeouts oder Assertions zu schwächen.
- Getrennt offen: #344 CSS-Einstiegslast, #350 native RUC-Karten, #352 verlustfreier Codec (Publisher + Browser/Worker-Dekoder erst nach Roundtrip), #345 AbortSignal-Isolation, Daten-/NoData-/SLOs-Intensivaudit und echte iOS-Geräteprüfung. Diese Version erklärt keines davon als erledigt. PR #358 Sicherheitsstatus und PR #359 Synoptik-Live-Katalog bleiben bereits im Stable.
