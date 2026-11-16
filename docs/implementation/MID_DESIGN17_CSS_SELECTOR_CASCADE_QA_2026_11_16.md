# MID Design 1.7 – Cross-Selector-Cascade-QA (Draft, kein Release)

Stand: 16.11.2026. Verifizierte Ausgangsbasis main = mid-stable = a78465b655d25cafc9ecc0390080694cb7aca957; veröffentlichte Version 0.9.85.486, fünf aktive Rulesets. Der parallele Leitchat-PR #858 entwickelt die eigentliche Version .487 und bleibt für Source-Integration/Release verantwortlich. #856, die Karten-/Umfeld-Arbeit, und #740/#839, die Release-Sicherheit, werden nicht geändert. Der neue QA-Branch enthält nur additive Diagnostikdateien.

## Anlass und Abgrenzung

Der bestehende read-only Audit scripts/audit-css-move-candidates-0985482.mjs erkennt identische nachgelagerte Selector/Property-Kollisionen und ergänzt den Owner-Guard. Eine CSS-Regel kann jedoch auch durch einen anderen Selektor mit derselben Klasse und CSS-Eigenschaft betroffen sein. Werden früher global geladene Styles in einen React.lazy-Chunk verschoben, kommt deren CSS möglicherweise erst NACH den bisher späteren Eager-Regeln und ändert so die Kaskadenpriorität.

Die neue reine Hilfsfunktion cssSelectorRiskEvidence verwendet die unveränderte kanonische PostCSS-Kaskade aus scripts/lib/cssCascade.mjs. Sie bildet über alle späteren Quellen einen Klassen-/Eigenschaftsindex, dokumentiert abweichende Selektoren, Dateinamen, Zeilen, @media-/@supports-Kontexte und !important-Markierungen. Identische Selektorpaare bleiben Gegenstand des bestehenden Audits. Ein separates CLI erzeugt artifacts/css-selector-risk-design17.json für die drei bestehenden Kandidaten: 25-extreme-outlook.css, midC14MapWorkspace.css und midC18FourteenReplitFluidGrid.css.


## MID Design 1.7 – gezielte Selektorlexik-Härtung

Die erste Regex-basierte Klassenerkennung konnte Punkte in quotierten Attributwerten (beispielsweise `[data-hint=".card"]`) versehentlich als echte Klassenanker melden und Escape-Sequenzen in CSS-Klassennamen zu falschen Teilklassen kürzen. Diese Arbeit ergänzt einen bewusst konservativen Scanner ohne zusätzliche npm-Abhängigkeit: Quotes und Attributklammern werden übersprungen, funktionale Selektoren wie `:is(.card,.tile)` bleiben erfassbar, Escape-/nicht-ASCII-Namen werden **nicht** stillschweigend als verkürzte Klassen übernommen. Die Felder `ambiguousCandidateSelectors` und `ambiguousLaterSelectors` machen diese Ungewissheit im JSON-Bericht und in der CLI-Zusammenfassung sichtbar.

Damit wird der statische Bericht genauer, aber ausdrücklich nicht vollständig: CSS-Identifier-Lexik, Selektorlisten, Shadow DOM, Spezifität, `@layer`, `@scope`, CSS-Variablen, verschachtelte Regeln und der reale Browser-DOM-Kaskadenzustand werden nicht abschließend bewiesen. Ein Nulltreffer oder unbekannter Klassenausdruck bedeutet weiterhin **nicht sicher auslagerbar**. Keine Änderung an CSS-Quellen, Benutzeroberfläche, Netzwerkpfad oder Produktionsbuild. Regressionsfälle für quotierte Punktwerte, gültige funktionale Klassen, Escapes und Nicht-ASCII-Klassen werden ergänzt; ihre echte CI-Bewertung ist jeweils auf den finalen Branch-HEAD zu beziehen.


## Wissenschaftlich-technische Aussagegrenzen

Gleiche CSS-Klasse und Eigenschaft beweisen nicht identische DOM-Zielknoten, weshalb Fehlalarme möglich sind. Umgekehrt deckt der Heuristikindex weder klassenlose/komplexe bzw. escaped Selektoren noch shorthand-/Custom-Property-Abhängigkeiten, @layer-Reihenfolgen und den realen DOM-/CSSOM-/Browserzustand vollständig ab. Er ist eine untere Schranke der statisch gefundenen Risikomuster, KEIN vollständiger Konformitätsbeweis. Deshalb liefert die API safeToDefer=false auch bei null Treffern. Keine produktive CSS-Verschiebung oder behauptete Netzwerk-/RAM-/Startzeitverbesserung.

## Reproduzierbare Tests

- node --check scripts/lib/cssSelectorRiskEvidence.mjs
- node --check scripts/audit-css-selector-risk-design17.mjs
- npx vitest run tests/unit/mid-css-selector-risk-design17.test.ts
- node scripts/audit-css-selector-risk-design17.mjs

Die Unit-Tests erfassen unterschiedliche Selektoren mit gemeinsamer Klasse/Eigenschaft, Media-Kontext, Ausschluss identischer Selektoren aus dem Zusatzreport, Keyframes, unbekannte Elementselektoren, doppelte/mangelhafte Eingaben und echte kanonische CSS-Einträge. Der Befehl schreibt nur ein lokales Diagnoseartefakt, keine Quell-CSS-Dateien.

## Weitere Freigabepflichten

Nach unabhängigen QA-/CI-Checks des exakten Draft-HEADs ist eine selektive, SHA-verifizierte Integration durch den Leitchat nötig. Danach erst Browser-A/B mit 320/390/430/834/1024/1440px, Light/Dark, Computed Styles, Overflow, Touch/Fokus, 200%-Textzoom, PWA-Offline/Service Worker und separat WebKit/iOS/VoiceOver; kalt/warm und wiederholte Modulwechsel Post-GC gegen identische Stable-Builds messen. Keine neuen Kosten/Telemetrie, keine WMO-/DWD-/NoData-Änderung, kein Merge, Installer, Worker/Pages oder Stable-Promotion aus diesem Spezialchat.

Offizielle Quellen: https://vite.dev/guide/features und https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots/.
