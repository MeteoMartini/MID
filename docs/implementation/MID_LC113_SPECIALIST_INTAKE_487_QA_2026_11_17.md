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

## LC 1.13 · Provenienz-Negativtest zum integrierten CSS-Helfer

Auf dem aktuellen alleinigen Leitchat-Draft wurde der bestehende, aus #865 selektiv übernommene Helfer eng abgesichert: `verifyCssManifestAgainstDist()` vergleicht jetzt das vom Aufrufer angeforderte Identitätsobjekt mit der **tatsächlich im unveränderten Produktions-dist enthaltenen** `mid-build-identity.json` (`schema`, `version`, `sourceGitSha`, `assetsSha256`, `assetCount`) **vor** der bisherigen vollständigen Asset-Fingerprintprüfung. Hintergrund: Die Fingerprint-Routine schließt ihre eigene Metadatei bestimmungsgemäß vom Hash aus; andernfalls könnte bei exakt gleichen Assets ein abweichendes eingebettetes Quell-SHA nicht erkannt werden. Zwei neue negative Testschritte verweigern eine fremde eingebettete Source-SHA und die fehlende Identitätsdatei. Die Originaltests und der unveränderte positive Kontrollpfad bleiben erhalten. Das ist **nur ein QA-Provenienzschutz**, keine Release-Sicherheitsworkflow-Änderung, keine CSS-Splitting-Freigabe und kein Beleg realer Browser-/iOS-Messung. Bis zum SHA-genauen CI-Erfolg sind die neuen Tests nicht bestanden zu melden.

## LC 1.13 · native Radar-/Satelliten-Zeitachsen- und Bildpuffer-Gates (17.11.2026)

**QA DRAFT / NO READY / NO MERGE / NO RELEASE.** Fünf aktive Rulesets, veröffentlichtes `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, `v0.9.85.486`. Selektiver, unveränderter Import auf den vorhandenen LC-1.13-Draft mit Basis-HEAD `d8ef67807cc74d3c6b120db5d340cda4e4d90327`. Kein produktiver Radar-5-Minuten-/GPU-Fertigstellungsanspruch.

| Spezial-PR/HEAD | Exakter Quellpfad | Git-Blob-SHA |
|---|---|---|
| #869 / `6ceca22c1704f76cadf5b9b6979490fbfa855c3b` | `docs/implementation/MID_KARTEN_113_5MIN_RAD_SAT_BUFFER_QA_2026_11_17.md` | `a656e8c43eda4c3d4f46a20307039abef16efb85` |
| #869 | `tests/helpers/surroundingsRadSat5MinuteBuffer.ts` | `21380b5b0d18d518704b98a388cfea9db9e680c9` |
| #869 | `tests/unit/surroundings-radsat-5min-buffer-qa.test.ts` | `7ac761b015ace357b4876332c06c14f1a9e2184f` |
| #870 / `52ec1d084e3734fafad8fee048657c6db2b6968d` | `docs/implementation/MID_KARTEN_113_UNIFIED_RAD_SAT_FRAME_RETENTION_2026_11_17.md` | `47efa70416d9125a91657b703a4c844845c5a893` |
| #870 | `src/CompositeTimeline.ts` | `4e9b2635a338b9a52caa5d8a7c08c94e0ad4a5a5` |
| #870 | `tests/unit/map-radsat-shared-original-continuity.test.ts` | `f0de267977a32241abf6a50a8daec15a02a51cf7` |

Vor Übernahme: beide Spezial-PRs offen und Draft, HEADs live identisch; je 3 Pfade **ohne** Hunk-/Pfadüberschneidung mit dem bisherigen LC-Integrationsdiff und untereinander; je aktuelle gezielte Draft- und Vitest-V8-CI **success**. Das #870-`src/CompositeTimeline.ts` ist eine reale, vom vorhandenen `RadarPanel.tsx` genutzte Funktion: gültige Original-5-Minuten-Radar-Frames werden nicht mehr über die Beobachtung/Nowcast-Phasengrenze hinaus als alter Bildstand beibehalten; separate begrenzte Nowcast-Kontinuität von 15 Minuten bleibt ausdrücklich markiert. #869 enthält **nur unabhängige QA-Helfer/Tests**, keine produktive Änderung am Umfeldwetter. Die vorhandene `MapLibreCore.tsx`-Crossfade/MapLibre-ImageSource-Methode wird nicht geändert.

Fachliche und visuelle Restgates: (1) produktives 5-min-UTC-Cursor-/Originalkatalog-Mapping in `CurrentSurroundings` und `RadarPanel`, (2) persistenter MapLibre-`ImageQuadLayer` mit bestätigtem GPU-/Textur-Ready-Ereignis statt Unmount/Leerblitz, (3) Satelliten-Originalbilder getrennt mit tatsächlichen 5-/10-/15-min-Laufzeiten und Quellzeit-Label statt synthetischer Bilder, (4) reale 320/390/430/834/1024/1440-Pixel/Light/Dark-/Tablet-Hoch-/Quer-Browsermatrix, verlorene Netzantworten, langsame Tiles, CORS und alte Callback-Races, (5) Quellen-/UTC-/NoData-/Warnabgrenzung und fachliche Originaldaten-Wahrheit; (6) unverkürzte Source/Core/Heavy/Browser/iOS-/Installer-/Worker-/Pages-/Stable-Gates. Cloud/SigWx dürfen weiterhin nur bei **tatsächlichen** originalen 15-min-Frames als belegt gelten.

**Wichtig:** Die vorhandenen Draft-Jobs sind Vorqualifikation der getrennten Input-HEADs, nicht des kombinierten Integrations-HEADs. Kein Schein-5-Minuten-Satellitenprodukt, kein interpolierter amtlicher Wettercode, keine Umdeutung von Missing=0. Eigentümer der Release-Sicherheit #740/#839 bleibt ausschließlich der Spezialchat; keine Änderungen, Ausnahme oder Freigabebehauptung in diesem Intake.
