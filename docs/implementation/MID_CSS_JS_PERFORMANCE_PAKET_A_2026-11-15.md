# MID Design 1.0 · Performance Paket A – reproduzierbare Startup-Evidenz

**Status: QA-DRAFT / kein Release. Statische Baseline verifiziert, vollständige Browser-/Memory-Abnahme noch offen.**

## Provenienz und Abgrenzung

- Geprüfte Ausgangsbasis: `main=mid-stable=19a8af8f5d0c47784acde7628746fa9020ef4f62`, v0.9.85.481, fünf aktive Rulesets (15.11.2026).
- Zugehörige Arbeiten: Issue #344, Auditbacklog #422 und historischer CSS-Dokumentations-Draft #651. Kein konkurrierender CSS-Eingriff.
- Der bestehende CSS-HTML-Messpfad aus `scripts/lib/initialCssBudget.mjs` bleibt maßgeblich. Diese Ergänzung erfasst initiale HTML-`type=module`- und `rel=modulepreload`-JS-Referenzen; `rel=mid-offline` wird ausdrücklich nicht als Startdownload gezählt.
- Vorhandene Budgets, Kaskaden, App-Module, Versionsspiegel und Release-Gates bleiben unverändert. Der neue Negativtest ist in beiden verbindlichen Regressionsinventaren von `MID_BASELINE.json` ergänzt, ohne einen bestehenden Test zu entfernen.

## Ausführung

Nur an einem vollständigen, einheitlichen, SHA-gebundenen Produktionsbuild:

```sh
node scripts/test-startup-asset-evidence-0985482.mjs
node scripts/measure-startup-assets-0985482.mjs dist
```

Erforderlich: `dist/index.html`, `dist/version.json`, `dist/mid-build-identity.json`, `dist/assets`. Vor der Messung prüft `verifyStartupBuildIdentity.mjs` den vollständigen unveränderten Asset-Fingerprint des Produktionsbuilds; fehlende oder geänderte Dateien blockieren. Das Ergebnis `artifacts/startup-assets-0985482.json` enthält Quell-SHA, Version sowie rohe/gzip-9-Start-JS- und Start-CSS-Bytes (CSS zusätzlich Brotli-6). Fehlende JavaScript-/Stylesheetdateien und unvollständige Herkunftsangaben führen zum Fehler. Deduplizierte Startreferenzen werden jeweils einmal gezählt.

**Grenzen:** Dies ist eine statische HTML-Referenzinventur, **kein** kompletter transitiver JS-Importgraph, kein Netztransfer und keine Browser-/Heap-/GPU-Messung. Ein fehlender Messwert ist UNVERIFIED, niemals null oder bestanden. Das original SHA-verifizierte `.481`-Installer-Artefakt wurde mit dem neuen Skript **erfolgreich** vermessen. Zahlen, Original-SHAs, CDP-Einzelprofile, NoData- und Browsergrenzen: `docs/implementation/MID_PERFORMANCE_PAKET_A_RELEASE481_EVIDENCE_2026-11-15.md`. Kein vollständiger transitive JS-Importgraph/Memory-Leak-Nachweis.

## Vorgesehene Paket-Reihenfolge und Akzeptanz

1. **A:** Statische SHA-gebundene Baseline und echte Chrome-CDP-/Kalt-/Warmcache-Messungen pro Hauptview (Coverage, Parse, Recalc, FCP/LCP/INP/CLS), einschließlich vollständigem JS-Startimportgraph und realer Gerätedifferenzen. Vorhandene Karten-Memory-Probe `scripts/lib/mapMemoryProfile.mjs` wiederverwenden.
2. **B:** Erst nach reproduzierbaren A-Messungen eine kaskadentreue und messbar wirksame CSS-/JS-Modulgruppe auslagern. `presentation-order.json`, `cssCascade`, Lazy-Pollen, Offline-Shell und UI-Verträge prüfen, keine globale `@layer`-/`!important`-Migration.
3. **C:** Nach erfolgreicher B-Abnahme CI-Berichte, wiederholbare Speicherkontrollen und kalibrierte Performance-Budgets hinzufügen, ohne bestehende Release- oder Fachgates zu lockern.

**Keine Freigabebehauptung:** Dieser Draft belegt keine Nettoeinsparung, keine Browser-/iOS-/VoiceOver-Abnahme und keinen veröffentlichten Build. Künftige produktive Integration ausschließlich über MID Source-PR-Gate → SHA-Bot → serverseitiges ZIP → Installer → Worker/Pages → Stable.

## Erweiterung: Paket B (ein sicher abgegrenzter JS-Pilot)

- Nur der **UI-Renderer** `PushSettingsPanel` ist in `src/App.tsx` von statischem Import auf React.lazy umgestellt. Der gemeinsame Push-Daten-/Benachrichtigungspfad, `src/pushNotifications.ts`, Service Worker, Worker und alle gespeicherten Einstellungen sind unverändert.
- Der weiterhin identische Aufruf ist auf `contentReady && section==='notifications'` beschränkt; Props werden über eine typisierte Wrapper-Komponente unverändert weitergereicht. Die asynchrone Ladegrenze zeigt `role=status` und `aria-live=polite`; keine neue Nutzerentscheidung oder Änderung an Warnungen.
- Neue Pflichtregression: `scripts/test-lazy-notifications-settings-0985482.mjs`, zusätzlich zu bestehenden Push-Tests. Ein sichtbarer Größen-/Ladezeitgewinn ist erst nach einem identisch konfigurierten neuen Vite-Produktionsbuild nachzuweisen; die syntaktische Lazy-Grenze ist **noch kein gemessener Nettoeffekt**.
- Keine globale CSS-Verschiebung: die vorhandenen Kaskadenkollisionen bleiben ungeklärt. Daher bleiben `presentation-order.json` und `midPresentation.css` unverändert.

## Erweiterung: Paket C (dauerhaftes zusätzliches Start-JS-Gate)

- `scripts/check-build-budget.mjs` verwendet den vorhandenen SHA-verifizierbaren HTML-Startpfad als zusätzliche Kennzahl. Im regulären Build-Budgetbericht erscheinen `initialJsBytes`, `initialJsGzipBytes`, `initialJsFileCount` und `initialJsAssets`, neben allen bisherigen CSS-/Gesamtbudgets.
- Neue zusätzliche, **nicht gelockerte** Obergrenzen in `MID_PERFORMANCE_BASELINE.json`: **2.400.000 B Rohbytes** und **750.000 B gzip-9** für deduplizierte `script[type=module]`- und `modulepreload`-JS-Dateien aus dem Produktions-HTML. .481-Baseline: 2.277.626 B roh und 688.085 B gzip; die neuen Limits lassen dokumentierte Reserve, sind aber deutlich unter der bestehenden Gesamt-JS-Grenze.
- Neu: `scripts/test-startup-js-gate-0985482.mjs` mit Positivtest und Negativfällen für übergroße Roh- und gzip-Startdateien, doppelte Preloads und abseits des Startpfads liegende Lazy-Chunks. Ebenfalls im vollständigen Regressionsinventar.
- **Kein behaupteter Heap-Gate:** wiederholte, kontrollierte Post-GC-/GPU-Tests, Browserparität, reales iOS und etwaige Freigabe einer Größeinsparung bleiben offen. Keine erfundenen Speicherlimits.

## Isolierte Prüfbarkeit

- Lokale syntaxbasierte TypeScript-TSX-Prüfung des auf dem exakten Stable-Quellblob aufgebauten Lazy-Imports: **PASS** (keine AST-Parsefehler); statischer Push-Panel-Import fehlt, vorhandener Benachrichtigungsbereich und Status-Ladeanzeige bleiben erhalten.
- Der bereits veröffentlichte SHA-verifizierte .481-Produktionsbuild wurde mit dem **erweiterten** `check-build-budget.mjs` und den Zusatzgrenzen erneut ausgewertet: **PASS**, CSS roh/gzip/Brotli und HTML-Start-JS roh/gzip wie dokumentiert. Dies prüft das Limit gegen .481, **nicht** die noch unverifizierte Ausgabe eines neuen App-Builds.
- Vollständige neue CI-Tests und unabhängiger Source-/Installerpfad sind für den aktuellen PR-HEAD getrennt nachzuweisen. Draft bleibt Draft.
