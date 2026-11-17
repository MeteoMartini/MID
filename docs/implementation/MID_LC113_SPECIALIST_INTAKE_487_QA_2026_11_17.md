# MID LC 1.13 · selektiver Spezialchat-Intake auf .487-Integrationskandidat

**17.11.2026 · QA DRAFT / NO READY / NO MERGE / NO RELEASE.**

## Autoritative Basis und Einordnung
- GitHub `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`; veröffentlichter Stand `v0.9.85.486`, fünf aktive Rulesets.
- Übernommener, vollständig erhaltener LC-1.12-Kandidat: PR #858, HEAD `01c126c54f36aa764e694a7a4b7610f02adf336a`, 17 Commits vor Stable, 0 Commits hinter Stable, 121 Dateipfade. Nur bestehender QA-DRAFT, kein freigegebenes Source-/Installer-/Stable-Gate.
- Ziel: eigene kurzlebige `chatgpt/v0.9.85.487-lc113-specialist-intake-qa`-Integration, Haupt- und Stable-Branches unverändert. Keine Änderung am Quellbranch #858.
- Gefilterte offene Spezialarbeiten: #865 und #866. Keine Änderung an #740/#839 oder Release-Security-Governance. AI Router #867 bleibt isoliert; #720/#837 erhalten getrennte Compatibility-/Mirror-Abnahme.

## Sechs exakt übernommene Original-Git-Blobs
Alle sechs Pfade waren im PR #858 am oben genannten HEAD nicht als Änderung vorhanden; die Spezial-PRs sind Draft und beide vom Stable-SHA a78465b655d25cafc9ecc0390080694cb7aca957 abgeleitet.

| Herkunft | Original-HEAD | Pfad | Git-Blob-SHA |
|---|---|---|---|
| Design #865 | `87df5751ddffa67118ad11672b5d9440e7ef9a51` | `docs/implementation/MID_DESIGN18_CSS_ASSET_READINESS_QA_2026_11_16.md` | `c706a2a5089855321e611eba81606bef5132e837` |
| Design #865 | `87df5751ddffa67118ad11672b5d9440e7ef9a51` | `scripts/lib/design18CssAssetReadiness.mjs` | `4a9c860879f06d12fc8058e46ddcca4473316350` |
| Design #865 | `87df5751ddffa67118ad11672b5d9440e7ef9a51` | `tests/unit/mid-design18-css-asset-readiness.test.ts` | `4ad6cc9aa6379ce44fbbcf1b3331f97229f2947e` |
| Karten #866 | `3108f98003332ae566f624386cfaa758288d1e3d` | `docs/implementation/MID_KARTEN_113_15MIN_SOURCE_COVERAGE_QA_2026_11_16.md` | `4a9145e27c98ed113cb648aaa1688d2a51cc3673` |
| Karten #866 | `3108f98003332ae566f624386cfaa758288d1e3d` | `tests/helpers/surroundings15minShadowCoverage.ts` | `b59efb3c03d2c4ffe97af09ff7bf417fc210264d` |
| Karten #866 | `3108f98003332ae566f624386cfaa758288d1e3d` | `tests/unit/surroundings-15min-shadow-coverage-qa.test.ts` | `bfbe8e7ea685cdc92b617dac267c4c42ff75249e` |

## Wissenschaftliche und technische Grenzen
- #865 kontrolliert originale HTTP-CSS-Bytes, Inline-SHA und angewendete CSSOM-Regeln. Ohne reale Browser-/A-B-Evidenz weder Lazy-CSS-Freigabe noch Performancegewinn.
- #866 kontrolliert deklarierte, quellgebundene 15-Minuten-IR10.8-/GSP-Schattenbilder und Zeitachsen. **Keine** eigene Original-GRIB-/Pixel-/CRC-Verifikation oder produktive Viertelstunden-SigWx-Lieferung. `NoData=255` ist vom fehlenden GSP-Signal `0` strikt getrennt. IR/GSP nicht als offizieller WMO-Wettercode und fehlende Slots niemals als trocken ausgeben.
- Keine Anpassung an Wetter-, Warn-, Worker-, CI-/Release-, Lockfile-/Version- oder Produktivpfaden durch diesen zusätzlichen Intake.

## Abnahme und Release-Blocker
- Für #865 und #866 liegen jeweils gezielte Draft-Regressions- und Vitest-Erfolge auf den angegebenen Original-HEADs vor. Source/Core/Heavy/Browser/iOS und Release-Gates wurden dort überwiegend **skipped**.
- Die kombinierte Ziel-SHA muss neu mit GitHub-Readback, exakt byteidentischem Original-Blobsatz, gezielter Draft-Regression, Core/Heavy, erforderlichen originalmeteorologischen Prüfungen, echten Browser-/Responsive-/CSS-Szenarien und SHA-gebundenen Security-/Review-Gates qualifiziert werden.
- Ungeklärte P1-Befunde sowie der separate Release-Sicherheitsstrang #740/#839 dürfen nicht als abgeschlossen gelten. Bis zum vollständigen Gate-Nachweis **Draft behalten**, nicht Ready/merge/deploy/promote.
