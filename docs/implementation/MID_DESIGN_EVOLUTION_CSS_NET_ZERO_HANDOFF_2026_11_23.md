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

## Zusätzlicher P0-Nachweis: echte CSS-Dateien gegen Build-Bericht (17:09 MEZ, 23.11.2026)
Der bisherige reine JSON-Größenvergleich ist weiterhin ein **Budget-Comparator**, aber **kein** Beleg echter `dist`-Artefakte. Neu sind deshalb `scripts/verify-design-css-artifacts-0985515.mjs` und `scripts/test-design-css-artifacts-0985515.mjs`, auf demselben isolierten Branch.

**Verbindliche qualifizierte Eingangsprüfung für Leit-Integration:**
```sh
node --test scripts/test-design-css-netzero-0985515.mjs scripts/test-design-css-artifacts-0985515.mjs
node scripts/verify-design-css-artifacts-0985515.mjs \
  /separate/stable/build-budget.json /separate/stable/dist \
  /separate/candidate/build-budget.json /separate/candidate/dist
```

Der Verifier liest für Stable und Kandidat die **physischen** CSS-Dateien in zwei gesonderten `dist`-Verzeichnissen, verwirft ungemeldete/fehlende CSS-Dateien sowie Symlinks und unsichere Pfade, und prüft jedes vorhandene CSS-Asset gegen den im bekannten `scripts/check-build-budget.mjs` erzeugten Originalbericht: rohe Bytes, SHA-256, Node `gzipSync(level=9)`, `brotliCompressSync(quality=6)`. Zusätzlich liest er `dist/index.html` mit dem bereits bestehenden `scripts/lib/initialCssBudget.mjs` und gleicht **tatsächlich eager referenziertes CSS** mit den Berichtseinträgen ab. Erst nach erfolgreicher Vollprüfung beider Builds wird `compareCssNetZero` ausgeführt. Jeder Fehler oder unerklärtes Wachstum beendet das Kommando mit Code 1.

**Lokaler, reproduzierbarer Testlauf:** Der Originalvergleich wurde bytegenau aus GitHub anhand der Original-Blob-SHAs `194bdccf65443adeb99ff9325f96498b9833006b` (Werkzeug) und `01f9317236945a99a33a9200ce5c04733515f834` (12 Tests) rekonstruiert, zusammen mit der unveränderten Stable-Hilfsfunktion `scripts/lib/initialCssBudget.mjs` (Blob `f7477bf697735ed1474f0529ce7ac31eec045851`). **23/23 lokale Node-Tests PASS** (12 bestehende plus 11 neue Echtdaten-Datei-/Negativtests); die neu erstellten Verifier- und Testdateien wurden GitHub-Blob-genau zurückgelesen (`ea06a32ed0b8a6df6f46dfd42d81172e84faf484`, `5cb61229191cea4390a64f3e370a5b6162b69b0e`).

**Nicht als grün interpretieren:** Dies sind lokale Node-Tests mit generierten echten Test-`dist`-Dateien, **keine** zwei aktuellen MID-Produktionsbuilds. SHA-Pinning der MID-Quellen/Buildumgebung, CI-Registrierung, Vollregression, bestehende CSS-Kaskadenparität, reale Browser-Interaktionen, Netzwerk-/Renderzeiten und native iOS-/VoiceOver-Tests bleiben extern notwendig. Keine Änderung an den bestehenden Release- oder CSS-Budgets, keine automatische Release-Freigabe. Der Leit-Chat darf diesen Code nur nach aktueller Stable/Version/PR-/Ruleset-Evidenz selektiv integrieren.


## P0c – Kaskaden-Delta und konkrete Aktuell-CSS-Rückbaukandidaten (23.11.2026)
**Neuer read-only QA-Baustein:** `scripts/compare-design-css-ownership-0985515.mjs` und `scripts/test-design-css-ownership-0985515.mjs`. Verwendet ausschließlich die **bestehende** `scripts/audit-css-ownership-0985484.mjs`-Ausgabe (`mid.css.ownership.diagnostic.v1`), führt keine CSS-Modifikation aus und akzeptiert keine Missing-/Null-Berichte als Nullwachstum.

**Ausführung auf zwei echten, vollständigen, SHA-gepinnten MID-Checkouts:**
```sh
node scripts/audit-css-ownership-0985484.mjs /absolute/stable-checkout > /evidence/stable-ownership.json
node scripts/audit-css-ownership-0985484.mjs /absolute/candidate-checkout > /evidence/candidate-ownership.json
node scripts/compare-design-css-ownership-0985515.mjs \
  /evidence/stable-ownership.json /evidence/candidate-ownership.json
node --test scripts/test-design-css-netzero-0985515.mjs \
  scripts/test-design-css-artifacts-0985515.mjs scripts/test-design-css-ownership-0985515.mjs
```

**Gemessene Source-Delta-Signale (candidate ≤ stable):** Eager-CSS-Quellenanzahl, CSS-Quellbytes, CSS-Regelanzahl, `!important`-Deklarationen, exakte `selector/property/at-rule-context`-Überschneidungen über Quellgrenzen, abweichende Werte und Wichtigkeits-Unterschiede. Jeder wachsende Wert erzeugt ein non-zero Exit-Signal zur **manuellen Klärung** vor Designfreigabe. Eine solche Überschneidung kann fachlich und responsiv legitim sein; diese Signale stellen **keine errechnete CSS-Spezifität, DOM-Owner-Beweiskraft oder Löschfreigabe** dar. Reale Browser-Parität und differenzierte Ausnahmeprüfung sind weiter Pflicht.

**Konkrete Priorisierung aus lesender Quelltext-Heuristik**, keine sichere Kollisionsauflösung (Quelle: Stable .513, mehrere CSS-Dateien, gleiche Selektorstrings; media/state-Kontext noch nicht verglichen):
- `html[data-mid-design='next'] .hero.current-compact .current-weather-facts` findet sich in **5** voneinander getrennten Quellen: `src/styles-src/30-modern.css`, `src/midDesign201Current.css`, `src/midC18B2CurrentAtmosphere.css`, `src/midDesign201MobilePolish.css`, `src/midDesign201MobileQa.css`.
- `html[data-mid-design='next'] .hero.current-compact .current-weather-icon` in **4** Quellen (`midDesign201Current`, `midC18B2CurrentAtmosphere`, `midDesign201MobilePolish`, `midDesign201MobileQa`).
- `html[data-mid-design='next'] .hero.current-compact` in **3** Quellen (`midDesign201Current`, `midC18B2CurrentAtmosphere`, `midDesign201MobilePolish`).
- `src/midDesign201Current.css` 24.181 Zeichen mit 414 textuellen `!important`-Vorkommen, `src/midDesign201CurrentCritical.css` 15.374 Zeichen mit 234, `src/midDesign201MobilePolish.css` 20.450 Zeichen mit 330; dies sind **Dateitextzählungen, keine bereits geprüften redundanten Deklarationen**.

**Optimierter Pilot:** Für obige drei Selektorfamilien `ComputedStyle`-/CSSOM-Owner und Kaskadenreihenfolge in allen echten Zuständen (mobiles Hoch-/Querformat, Dark/Light, 200% Text, High-Contrast, Keyboards, Safe Area) feststellen; dann nur sachlich belegte spätere Overrides im selben PR wie die entsprechende vorhandene Ownerregel entfernen. Zahlen/Fachfarben/Warnings/NoData unverändert. Ziel nach dem Pilot: weniger überschneidende Deklarationen, nicht bloß weniger erzeugte CSS-Chunks. Erst nach selektiver Browser- und Build-Regression auf andere Bereiche ausrollen.

**Verifizierte Tests:** 34/34 lokale Node-Tests erfolgreich (12 originaler Budget-Comparator, 11 physische Dateiverifikation, 11 Ownership-Delta) mit unveränderten originalen Git-Blob-SHAs der Altmodule und byteidentischem GitHub-Readback der vier neuen Dateien. **Keine** realen MID-Stable-/Kandidaten-Buildberichte, keine browserseitige Sicht-/A11y-/Performanceabnahme und keine vollständigen CI-Gates in diesem Handoff. Der neue Status `PASS_NO_CASCADE_SIGNAL_GROWTH` ist **keine** Produkt-/Release-Freigabe.
