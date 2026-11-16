# MID Design 1.5 – nutzerintentionsgebundene Vorladung großer UI-Module (QA-Draft)

## Ausgangsbasis und Rollen
16.11.2026, main=mid-stable `a78465b655d25cafc9ecc0390080694cb7aca957`, veröffentlichte Version `0.9.85.486`, fünf aktive Schutz-Rulesets. Die Karten-Spezialarbeiten #850/#852 überschneiden sich nicht mit diesen App-/Startup-Pfaden. Performance-Diagnose #851 bleibt separat. **Keine Versionserhöhung oder Release in diesem Draft.**

## Identifizierter unnötiger Vorladepfad
`src/startupPreload.ts` nutzt `wantsStartupEnsemble()` für fachliche Ensemble-Datenanforderungen und bisher für den EnsemblePanel-Import. Der standardmäßig aktivierte Wetterzwilling kann dadurch den über 100 KB großen, deferred EnsemblePanel-Chunk ohne explizite Ansicht vorladen. `src/App.tsx` kann nach 2,5 Sekunden im Leerlauf `MapWorkspacePanel`, `RadarPanel` und `UnifiedWeatherMap` auch ohne früheren Kartenbesuch importieren. Die Vorladung bei Pointer/Focus/Down und einem tatsächlich sichtbaren Karten-Viewport bleibt bestehen.

## Begrenzte Codekorrektur
- Ensemble-Datenregel `wantsStartupEnsemble()`, sämtliche `forecast`/`station`/`radar`/`ensembles`-Requests und Abbruch-/Timeoutsemantik bleiben byte-identisch. Der schwere visuelle Chunk-Import wird durch `shouldPreloadEnsembleVisual` für dokumentierte Cockpit-, 14-Tage- und aktivierte Ensemble-Ansichten gesteuert. Beim tatsächlichen Öffnen lädt React.lazy den Renderer unverändert.
- Der Map-Idle-Timer, seine Netzwerk-/Daten-/Visibility-Gates und sämtliche Intent-Handler bleiben unverändert. Nur bei nachgewiesenem früheren Kartenbereich im bestehenden lokalen `mid:last-dashboard-section:v1` (composite/weather-maps) darf Leerlaufvorladung stattfinden. Kein neuer Storage-Key, kein Schreiben, kein Tracking.
- Keine CSS-Regel, Cascade-Quelle, PWA-Precache-Definition, Offlinefunktion, Worker, Wetterquelle, amtliche Warnung oder Buildbudget geändert.

## Qualität / Grenzen
`tests/unit/mid-visual-prefetch-intent.test.ts` und `scripts/test-c14-map-workspace-098534.mjs` prüfen erlaubte und fehlende Präferenzen, Kartenintent, negative Kontexte und Erhalt vorhandener UI-Intentpfade. Echter Vite-Produktionsbuild, Budgetvergleich, vollständige Regression, Netzwerk-/Heap-Kalt-/Warmcache-A/B und Desktop/iOS-Sichtparität sind eigene Freigabekriterien. Nur tatsächlich ausgeführte Gates gelten als grün. Statische Chunkgrenzen sind kein RAM-Nachweis.

## Abnahmefolge
Draft-CI einschließlich echtem Diagnosebuild → Vergleich exakt gegen .486-Stable unter gleicher NODE_ENV/VITE-Konfiguration → 390/430/834/1440 CSS-Pixel, Light/Dark, gespeicherte Karten-/Ensemble-Präferenzen, Ersttipper/Focus, Offline-Reopen, 20x Navigationswechsel/Post-GC → Leitchat-Source-PR-Gate, SHA-Merge, ZIP, Installer, Worker/Pages, Stable. Kein Ready/Merge/Release ohne diese Prüfungen.
