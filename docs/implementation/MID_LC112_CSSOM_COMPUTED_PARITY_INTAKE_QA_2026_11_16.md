# MID LC 1.12 – CSSOM-/meteorologische Farbparitäts-QA aus Design #864

**QA-DRAFT, nicht bereit / nicht mergen / nicht veröffentlichen.** Referenz bei Source-Eingang: `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, v0.9.85.486; fünf aktive Rulesets. Gemeinsamer LC-PR #858 vorheriger HEAD `1f0929c533c9954c0dda9584df1743ac79b88480` mit Vitest 5/V8, targeted regression und RUC censored evidence **SUCCESS** auf genau diesem SHA. Spezial-Design-PR #864 exakter HEAD `d043a5f245dc01d584953fe0867b754b0eec3e9f` mit isolierter Vitest und targeted regression **SUCCESS** auf genau diesem SHA. Die beiden Releases sind nicht gleich und frühe Tests sind nicht als Abnahme eines neuen Integrationscommits gültig.

## Unveränderte Quelle
Vier ausschließlich neue, mit der bisherigen #858-Pfadsammlung nicht kollidierende Git-Originalblobs (alle exakt vom Spezial-HEAD):

- `docs/implementation/MID_DESIGN18_CSSOM_PARITY_QA_2026_11_16.md` · Originalblob `4718b66a7ae698aa81ea12fc1ec27cc65e9a7e70`
- `scripts/compare-design18-css-computed.mjs` · Originalblob `2ec218725422c7e7987492f7a8f1afa93889b21a`
- `scripts/lib/design18CssComputedEvidence.mjs` · Originalblob `035bf77e15f640a9a7cab98bf6388e1814dddd55`
- `tests/unit/mid-design18-css-computed-parity.test.ts` · Originalblob `e7b65f6b04237f8da01a12a89557dfda40175f43`

Kein Eingriff in `src/`, Produkt-CSS, JavaScript-Startup, vorhandenes JS-/CSS-Budget, Meteorologie, DWD-/WMO-Warnungen, RUC, Worker, CI-/Rulesets, signierte Release-Verträge, Quell-/Versionsspiegel und Browserhärtung. Keine Umgehung des #740-Release-Sicherheits-Spezialchats.

## Wozu die neue QA dient
Die bestehenden Diagnosepakete #859 (Selektor-/Kaskadenrisiko), #860 (statischer A/B-Evidenzprüfer) und #863 (vollständiger App-Browser-Start-Laborprobe) sind bereits in #858; es gibt keine doppelte Implementierung. #864 ergänzt einen streng beschränkten **realen Computed-Style- und DOM-Geometrie-Snapshot-Vergleich** für ausgewählte, sichtbare Elemente in einem zuvor unabhängig SHA-verifizierten Vollprodukt-Browserlauf. Geprüft werden festgelegte Properties, Light/Dark-Thema, 9 meteorologische Farbvariablen, View-/Font-/Stylesheet-Readiness und vollständige Browser-/Fixture-/Szenario-Identitäten. Fehlende Eigenschaften, NoData, zweifelhafte Geräte-/Browsergleichheit und unvollständige Responsivfälle werden abgelehnt.

Normative CSSOM-Unterscheidung: `getComputedStyle()` liefert CSS **resolved values**, bei layoutabhängigen Properties können das benutzte Werte sein; die Werte sind kein Render-Pixelsnapshot und kein vollständiger CSS-Prioritäten- oder Async-Chunk-Ladenachweis. Siehe https://www.w3.org/TR/cssom-1/ und https://developer.mozilla.org/de/docs/Web/API/Window/getComputedStyle.

**Keine echten CSS-Auslagerungen oder messbaren Einsparungen in diesem Commit.** Auch bei erfüllten 4 QA-Blob-Suites bleibt `releaseAuthorized:false`, `cssSplitSafeProven:false` und `wholeAppParityProven:false`. Für eine wirkliche Optimierung sind Original-Stable-vs.-Kandidat Builds mit identischem Wetter-/Quellzeit-Snapshot, responsive 320/390/430/834/1024/1440, Light/Dark, Dynamik-/CSS-Chunk-Readback, Browser-/WebKit-/iOS-/VoiceOver- und CSS-/JS-/Speichervergleiche plus vollständiger Source-/Core-/Heavy-/Review-/ZIP-/Installer-/Worker-/Pages-/Stable-Prozess Pflicht.

## Offene Integrationsgates
Nach diesem selektiven Handoff neue **kombinierte** targeted/Vitest/RUC-Gates auf dem **neuen** gemeinsamen HEAD ausführen und CI-Ergebnis abwarten. Ein Playwright-Dummy mit synthetischer Page ist kein realer Chromium-/WebKit-Pass. Ohne echte Quell-/Geräte-/Screenshot-Evidenz niemals CSSOM-Gleichheit zur vollständigen visuellen Wetterparität erheben. Release-Sicherheits-PR #839 bleibt beim Spezialchat.
