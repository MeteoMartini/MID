# MID Design Evolution – CSS-Netto-Null-QA-Handoff (23.11.2026)

## Scope und provenance
- Parent: [#1003](https://github.com/MeteoMartini/MID/issues/1003), CSS-/Performance-Owner [#344](https://github.com/MeteoMartini/MID/issues/344), Design-Audit [#523](https://github.com/MeteoMartini/MID/issues/523).
- Ausgangspunkt: `mid-stable` v0.9.85.513 @ `331fffff081303e1c597badddfa4ae41c4b4e0f0`.
- Bei Erzeugung lag `main` auf `f6b4856ed1e2de8d659aa15383a2e06aac526bc0` mit vorbereiteter .514 zwei Commits vor Stable. Noch **kein .514 Stable-Release** nachgewiesen.
- Einziger Scope dieses Branches: **read-only QA-Werkzeug plus lokale Tests und Anleitung**. Keine Laufzeit-CSS-/UI-/Wetter-/Warn-/Version-/Build-/Workflow-/Releaseänderung.
- Versionskennung `0985515` ist nur die eindeutige Kandidaten-Namenskonvention; keine Freigabe oder tatsächlicher Build `v0.9.85.515`.

## Lokale Prüfung
```sh
node --test scripts/test-design-css-netzero-0985515.mjs
node scripts/compare-design-css-netzero-0985515.mjs ./evidence/stable/build-budget.json ./evidence/candidate/build-budget.json
```
Die Vergleichsdateien werden bereits von `scripts/check-build-budget.mjs` als `artifacts/build-budget.json` erzeugt. Sie müssen als **zwei getrennte reale MID-Produktionsbuilds** mit dokumentierten Original-SHAs erzeugt und vorab gegen GitHub geprüft sein. Sie dürfen nicht aus gleicher `dist`-Kopie oder synthetischen Zahlen bestehen. Node-, Lockfile-, OS-, Build-Flags und Projekt-Konfiguration müssen identisch bzw. verifiziert vergleichbar sein.

## Harte CSS-Gates
- `candidate <= stable`: initiale CSS-Bytes **raw / gzip / Brotli**.
- `candidate <= stable`: **sämtliche** CSS-Bytes **raw / gzip / Brotli**, einschließlich lazy CSS.
- `candidate <= stable`: Gesamt-/Initial-CSS-Assetanzahl und größte einzelne CSS-Datei raw/gzip.
- Ein ungültiger, fehlender, widersprüchlicher oder fehlgeschlagener Buildbericht führt zum Fehler, niemals zu `0`.
- Nur Strukturgültigkeit und gemeldete Buildartefakte werden verifiziert. Skript meldet ausdrücklich, dass SHAs, Toolchain, Css-Kaskade, Lazy-Navigation, Browser, Offline, iOS, LCP/INP nicht durch JSON allein bewiesen sind.

## Vor der Integration zusätzliche Pflichtnachweise
1. Neueste SHAs/Version/Rights/Rulesets/parallel PRs prüfen, insbesondere #1001, #937, #815 und Release-Train. Kein direkter Eingriff auf main/mid-stable.
2. Bestehende `scripts/audit-css-ownership-0985484.mjs`, `scripts/test-css-ownership-0985484.mjs`, `scripts/test-module-css-consolidation-0985170.mjs`, `scripts/test-c14-css-order-098534.mjs`, `scripts/test-initial-css-budget-contract-0985351.mjs` und `scripts/test-fourteen-css-lazy-0985339.mjs` ausführen. Das CSS-Ownership-Audit ist diagnostisch: **keine automatische Delete-/Move-Freigabe**.
3. Browser-Wirkungsprüfung für identische Testdaten, Ansichten/Aufklappzustände, Light/Dark/High Contrast, 320/390/430/768/834/1024/1440/1920 px, 200% Zoom/Text, Touch/Fokus/Popover/Overlays, iOS Safe Areas, NoData/Stale/Warnings und Export.
4. Initiale und dynamisch geladene CSS-Requests, CPU-Style-Recalc/Layout sowie LCP/INP/CLS unabhängig von reinen Dateigrößen messen; WKWebView/VoiceOver als native separate Abnahme.
5. Keine neuen globalen CSS-Dateien, keine thematischen `!important`-Overlays, keine geänderten Parameter-/DWD-Warnfarben, keine Verdünnung vorhandener Gate-Schwellen. Wenn der Vergleich wächst oder Provenienz nicht geprüft werden kann: **NO GREEN / NO MERGE / NO RELEASE**.

## Integration und Zuständigkeit
QA-only branch; Leit-Chat und #344 übernehmen die Prüfung und entscheiden über selektiven Source-Intake. Erst nach aktueller Stable-/Main-Neuzuordnung, registriertem Test, verifiziertem Buildvergleich und vollständigen Release-Gates kann daraus eine Integration werden. Kosten: nur vorhandene Node-Bordmittel, keine neue Runtime-Dependency, kein neuer externer Dienst.