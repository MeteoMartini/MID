# MID LC 1.12 – .487 selektiver QA-Intake aus #859, #860 und #862

**Nicht zur Veröffentlichung freigegeben.** Live geprüfter Ausgangsstand: `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, v0.9.85.486, fünf aktive Branch-Rulesets. Versionierter gemeinsamer Source-Draft #858 HEAD vor dieser Integration: `fa06a8b6055834ef357234d7e8a4644357e6a941`, ursprünglicher Git-Tree `7dbac3b6c088d6a9d24edfa426a19d54f2efff19`. Keine Änderung an geschützten Branches, Sicherheits-#740/#839, Release-Workflows, originalen WMO-/DWD-Warnungen, Modellrun, Wetterquellen oder RUC.

## Eingefrorene disjunkte Originalquellen

- CSS-Design-QA #859: `d960dad3308fb13aecb2bdd1afc1adf508a4cbeb`; vier **additive** QA-Dateien (Risikoerkennung für unterschiedliche Selektoren/`!important`/Shorthand ohne automatische CSS-Freigabe).
- Performance-A/B-QA #860: `67d036c4d9a2fda66c95dcede28689e498aa8185`; fünf **additive** QA-Dateien (Dist-/SHA-Vergleich, keine unbelegte Einsparung).
- Nutzerzustand/NoData #862: `cfea392f7a2e3e0c3f44c8c138f1f3b0a4861f4a`; drei **additive** Dateien und genau `src/ClimatePanel.tsx` als modifizierter Codepfad (gespeicherte Böenwahl erhalten, fehlende meteorologische Werte nicht als Windstille/Nord deuten).

Jeweils GitHub-Originalblobs vom exakten HEAD nach unabhängiger Diff-/Pfadprüfung; 13/13 Eingangsblobs bleiben byteidentisch. PR #858 änderte bisher **keinen** der 13 Pfade; der Originalcode der Klimaansicht entsprach auf Stable dem Elternblob `38a8dce8720109869906ba01fdc13c92e5a6bc94`. Keine pauschalen Cherry-Picks, Rebase/Reset oder Spezialchat-Branchwrites.

## Byteidentische selektierte Git-Blob-SHAs

| Pfad | Original-Git-Blob |
|---|---|
| `docs/implementation/MID_DESIGN17_CSS_SELECTOR_CASCADE_QA_2026_11_16.md` | `b49bb228d6b62c8ea8e170484268bbcd383d4922` |
| `scripts/audit-css-selector-risk-design17.mjs` | `e9cc5ba7e188b17139aee6160da76efd3fc049bd` |
| `scripts/lib/cssSelectorRiskEvidence.mjs` | `2cd4a2473e158ad1a73579a209de61013de3598f` |
| `tests/unit/mid-css-selector-risk-design17.test.ts` | `a988a419e06589460cbfbdb525cec8be6b248ea6` |
| `docs/implementation/MID_DESIGN16_SHA_BOUND_AB_EVIDENCE_QA_2026_11_16.md` | `de3777d38c61c63582239cd24536aded15cfffa4` |
| `scripts/compare-design16-ab-evidence.mjs` | `cabcbcdbd3d05c009c57d41f5d3ce53733ca441b` |
| `scripts/lib/design16AbEvidence.mjs` | `e820927864acf98f8c1a42390ca004042a5488e6` |
| `tests/unit/mid-design16-ab-cli.test.ts` | `976579322ed060af8c14d640d34fb7022822d3d0` |
| `tests/unit/mid-design16-ab-evidence.test.ts` | `ab2c88e4a3aff2dba20f9d470c0c24a170ad431e` |
| `docs/implementation/MID_LC112_CLIMATE_WINDROSE_PREFERENCE_NODATA_QA_2026_11_16.md` | `fa501efdda75736495afcfb4bd73f29203b9aefa` |
| `src/ClimatePanel.tsx` | `c960fe9b9bf2bb3ffd0376f31ab01175022139fb` |
| `src/climateWindRosePresentation.ts` | `2a7be51d921ad475bc92fa9b5f20484fa9c9500a` |
| `tests/unit/mid-climate-windrose-preference-nodata-qa.test.ts` | `ff10d8123666a82c8b38a159fd7610a1f737ac77` |

## Verifikation und Grenzen

Die isolierten GitHub-Draft-Checks (gezielte Regression + Vitest 5/Coverage) der #859/#860/#862 waren auf den obigen Original-HEADs erfolgreich. Sie **ersetzen keine kombinierte** Ausführung. Der Integrationscommit erfordert neue SHA-genaue Targeted-/Vitest-, reale Produkt-/Browser-/Performance-, vollständige Source-/Core-/Heavy-/Review-/Budget- und gesamte ZIP-/Installer-/Worker-/Pages-/Stable-Gates.

**Parallelisierungsgrenze:** #861 (EPSG:3857 WMS, Karten-Spezialchat) entwickelt sich aktuell weiter und ist hier ausdrücklich **nicht** integriert. Sein exakter QA-/Originaldaten-/Pixelstatus und die reale WMS-Anbindung an `CurrentSurroundings.tsx` bleiben vor jeder weiteren Kartenintegration getrennt zu prüfen. #740 und die speziellen Release-Sicherheitsarbeiten bleiben aus diesem Auftrag ausgeschlossen; ohne notwendige Releasefreigaben kein Merge/Deployment.
