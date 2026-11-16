## Performance-Build-Pilot auf aktuell veröffentlichtem .486-Stable

Verifizierte aktuelle Baseline `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957` / `v0.9.85.486`; alle fünf Rulesets aktiv. Die vier getesteten QA-Quellpfade aus PR #849 (HEAD `9862dba2148ade73e52d300ec9b8ee8a7db00eab`, Vitest Run #43882556759 SUCCESS) bleiben blob-identisch, abgesehen von dieser ergänzten Dokumentation.

Ein weiterer **rein lesender** Messpfad `scripts/measure-startup-assets-0985482.mjs` wird additiv um `staticJsGraph` erweitert. Er ist bereits Bestandteil des vorhandenen `MID Draft · unabhängiger CSS/JS-Diagnosebuild`, der nur für einen Draft auf `chatgpt/*-performance-*` via PR läuft. Der bestehende Workflow und sämtliche Limits bleiben unverändert. Das bereits archivierte `artifacts/startup-assets-0985482.json` erhält das neue Feld `staticJsGraph` mit vollständiger SHA-gebundener Closure und getrennten dynamischen Kanten. Bestehende JSON-Felder und Validierungssemantik bleiben erhalten; echte Build-/CI-Ergebnisse sind separat zu prüfen.

**Keine produktive CSS- oder JS-Änderung.** Das Werkzeug ist eine Voraussetzung für künftige, funktionswahrende Einsparungen, nicht bereits selbst ein gemessener Größen- oder RAM-Gewinn. Wenn der reale Build eine bislang übersehene Kante offenlegt, bleibt der Pilot fail-closed. Dynamische Module, Service Worker Offline-Precache, tatsächliche Netztransfers, CSS-Parse/Recalc, iOS-WebKit, GPU und Heap-Langzeitprofile sind bewusst getrennte Messdimensionen. Kein Release, kein Merge und keine Änderung am produktiven Hauptbranch aus diesem QA-Draft.

---

## Fortführung auf v0.9.85.486 (16.11.2026)

Live main=mid-stable `a78465b655d25cafc9ecc0390080694cb7aca957`; fünf GitHub-Rulesets aktiv. Die vier ursprünglichen QA-Dateien wurden unverändert als gesicherte Git-Blobs übernommen, bis auf die zwingende Parser-Korrektur im Helper. Frühere Kandidatenbasis .485 ist historisch und nicht länger maßgeblich. Keine Änderung des Produktcodes, Haupt-CSS, Budgets, Workflows, Release- oder Wettersemantik.

Die ersten zwei QA-Runs #43875599204 und #43876096384 waren RED (3 neue Unit-Tests wegen `ts.ScriptTarget` undefined); kein PASS. Root Cause: `typescript@7.0.2` statt des im Repository für die klassische Compiler-AST-API installierten Alias `typescript-strada@npm:typescript@6.0.3`. Bestehende Generatoren verwenden denselben Alias. Der neue QA-Code importiert deshalb `ts` ausschließlich aus `typescript-strada`, ohne Abhängigkeitsupdate. Neue Tests und echter SHA-gebundener dist-Bericht sind erst nach erfolgreichem neuen CI nachgewiesen.

---

# MID Design 1.5 – statischer JS-Startimportgraph (QA-Draft)

**Basis:** 16.11.2026, main=mid-stable ccd1c0f60d67925aa01dd8d946b490fde4142709, veröffentlichte Version 0.9.85.485 und fünf aktive Schutzrulesets. Nur neue additive Diagnose-, Test- und Dokumentationspfade. Kein App-/Worker-/Wetter-/CSS-/Budget-/Workflow-/Releaseeingriff.

## Gegenstand und Nicht-Duplizierung

Das vorhandene scripts/measure-startup-assets-0985482.mjs liefert korrekt SHA-gebundene HTML-Startreferenzen, deckt aber absichtlich NICHT die statische ES-Modul-Importtransitivität ab. Issue #344 verlangt einen vollständigen Startup-Graphen vor einer weitergehenden CSS-/JS-Optimierung. Bereits in Stable integrierte Arbeiten aus #831 und #834 und der laufende Leitchat-Release-Draft #847 werden nicht geändert.

## Additive Implementierung

- scripts/lib/startupTransitiveGraph.mjs verwendet den bestehenden TypeScript-Parser für JavaScript aus dem gebauten Vite-Dist. Es verfolgt rekursive statische import- und export-from-Kanten, dedupliziert HTML-Preloads, toleriert Zyklen und zählt dynamic import() NICHT als initialen Fetch. Nichtliterale Dynamic-Imports werden als unbekannt ausgewiesen, nicht als Null.
- SHA-256- und Byte-Readback aller betrachteten JS-Dateien, inklusive Herkunft und striktem statischem Pfadauflöser. Fehlende statische Kanten, externe oder Path-Traversal-Kanten, korrupte/duplizierte Dateien oder Parsefehler blockieren.
- scripts/measure-startup-transitive-graph-0985486.mjs verlangt einen vollständig verifizierten unveränderten Produktionsbuild über verifyStartupBuildIdentity.mjs und identische Versionsspiegel im gebauten dist. Danach entsteht artifacts/startup-transitive-js-0985486.json mit Version, Source-Git-SHA, Asset-Fingerprint und den statischen Closure-Bytes (roh/gzip-9) samt ausgeschlossenen dynamischen Imports.
- tests/unit/mid-startup-transitive-graph.test.ts prüft Zyklen, statische und dynamische Kanten, Re-Exports, SHA/Byte-Inkonsistenzen, Missing Dependencies, externen Pfad, Path Traversal und beschädigte Syntax.

## Ausführung / Grenzen

Erst einen vollständigen Produktionsbuild mit korrekter MID-Identität erstellen; anschließend:

    npm run verify:vite
    node scripts/measure-startup-transitive-graph-0985486.mjs dist

Werte sind nur eine statische ES-Modul-Kosteninventur. Die Summe von gzip-9-Dateigrößen ist weder realer Netztransfer noch Startzeit, und erkennt keine dynamischen JavaScript-/CSS-Requests, Service-Worker-Caches, Skriptausführungs-, DOM-Style-Recalc-, FCP/LCP/INP- oder Speicherzeiten. Reale Cold-/Warmcache-Messungen und Browser/iOS/VoiceOver-Parität bleiben getrennte offene Issue-#344-Prüfungen. Offene externen/unaufgelösten Module verhindern Aussagen über einen vollständigen Graphen. Eine unveränderte JS-Closure bedeutet NICHT automatisch gleiche UX/Performance.

**Status:** QA-DRAFT; noch keine GitHub-Vitest-/echte Dist-Build-/Browser-/Source-Core-/Heavy-/Review-/Installer-/Worker-/Pages-/Stable-Abnahme. Kein Merge, Release oder Deployment aus diesem Spezialchat. Spätere selektive Integration nur durch verifizierten Leitchat-Source-Train nach allen etablierten Gates.
