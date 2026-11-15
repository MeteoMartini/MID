# MID Design 1.0 · Performance Paket A – reproduzierbare Startup-Evidenz

**Status: QA-DRAFT / kein Release, keine vollständige Performance-Baseline.**

## Provenienz und Abgrenzung

- Geprüfte Ausgangsbasis: `main=mid-stable=19a8af8f5d0c47784acde7628746fa9020ef4f62`, v0.9.85.481, fünf aktive Rulesets (15.11.2026).
- Zugehörige Arbeiten: Issue #344, Auditbacklog #422 und historischer CSS-Dokumentations-Draft #651. Kein konkurrierender CSS-Eingriff.
- Der bestehende CSS-HTML-Messpfad aus `scripts/lib/initialCssBudget.mjs` bleibt maßgeblich. Diese Ergänzung erfasst initiale HTML-`type=module`- und `rel=modulepreload`-JS-Referenzen; `rel=mid-offline` wird ausdrücklich nicht als Startdownload gezählt.
- Vorhandene Budgets, Kaskaden, Module, Versionen, CI- und Release-Gates sind unverändert.

## Ausführung

Nur an einem vollständigen, einheitlichen, SHA-gebundenen Produktionsbuild:

```sh
node scripts/test-startup-asset-evidence-0985482.mjs
node scripts/measure-startup-assets-0985482.mjs dist
```

Erforderlich: `dist/index.html`, `dist/version.json`, `dist/mid-build-identity.json`, `dist/assets`. Das Ergebnis `artifacts/startup-assets-0985482.json` enthält Quell-SHA, Version sowie rohe/gzip-9-Start-JS- und Start-CSS-Bytes (CSS zusätzlich Brotli-6). Fehlende JavaScript-/Stylesheetdateien und unvollständige Herkunftsangaben führen zum Fehler. Deduplizierte Startreferenzen werden jeweils einmal gezählt.

**Grenzen:** Dies ist eine statische HTML-Referenzinventur, **kein** kompletter transitiver JS-Importgraph, kein Netztransfer und keine Browser-/Heap-/GPU-Messung. Ein fehlender Messwert ist UNVERIFIED, niemals null oder bestanden. Ein echter .481-Produktionsbuild wurde mit dem neuen Skript noch **nicht** vermessen.

## Vorgesehene Paket-Reihenfolge und Akzeptanz

1. **A:** Statische SHA-gebundene Baseline und echte Chrome-CDP-/Kalt-/Warmcache-Messungen pro Hauptview (Coverage, Parse, Recalc, FCP/LCP/INP/CLS), einschließlich vollständigem JS-Startimportgraph und realer Gerätedifferenzen. Vorhandene Karten-Memory-Probe `scripts/lib/mapMemoryProfile.mjs` wiederverwenden.
2. **B:** Erst nach reproduzierbaren A-Messungen eine kaskadentreue und messbar wirksame CSS-/JS-Modulgruppe auslagern. `presentation-order.json`, `cssCascade`, Lazy-Pollen, Offline-Shell und UI-Verträge prüfen, keine globale `@layer`-/`!important`-Migration.
3. **C:** Nach erfolgreicher B-Abnahme CI-Berichte, wiederholbare Speicherkontrollen und kalibrierte Performance-Budgets hinzufügen, ohne bestehende Release- oder Fachgates zu lockern.

**Keine Freigabebehauptung:** Dieser Draft belegt keine Nettoeinsparung, keine Browser-/iOS-/VoiceOver-Abnahme und keinen veröffentlichten Build. Künftige produktive Integration ausschließlich über MID Source-PR-Gate → SHA-Bot → serverseitiges ZIP → Installer → Worker/Pages → Stable.