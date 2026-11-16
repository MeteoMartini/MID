# MID LC 1.12 · Selektive Originalblob-Übernahme der Karten-P1-WMS-QA #861

**QA-ONLY / NO READY / NO MERGE / NO RELEASE.**

Source of truth: `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, v0.9.85.486, fünf aktive Rulesets. Leitchat-Ziel: [Draft #858](https://github.com/MeteoMartini/MID/pull/858) mit bisherigem vollständigem HEAD `466dabe3aa636b940fc6e12144183f7266af922c` und Originaltree `9ab5dea5a19da59f70ec4df5ad2ac9aebcc0c444`. Spezialchat: [Draft #861](https://github.com/MeteoMartini/MID/pull/861) mit **eingefrorenem** HEAD `8fd3ae11285e315ecd493e7079377e088f8cc2b6`, genau sieben ausschließlich hinzugefügten Dateien. PR-Diff durch Live-GitHub gegen Stable geprüft, kein Pfad mit #858 überlappend.

Die sieben Dateiinhalte wurden als unveränderte Original-Git-Blobs übernommen; **kein** blindes Cherry-Pick/Rebase, kein Ersetzen des bestehenden `CurrentSurroundings.tsx` oder einer Browserfixture.

| Originaldatei | Git-Blob-SHA |
|---|---|
| `docs/implementation/MID_SURROUNDINGS_WMS3857_EXACT_LAYERS_2026_11_16.md` | `4a22c388cdbe6fd4a5833cec96e66dd20b5a5f60` |
| `src/surroundingsMercatorWmsPlan.ts` | `21db91d55db31bd7a081be345b6e7d0d4edbf275` |
| `src/surroundingsProjectedWmsRequest.ts` | `9dadfc7ff85f178bc60624e96f6bcc41b70dc382` |
| `src/surroundingsWmsPixelEvidence.ts` | `510f100c690dd876b146058d5b798adf839b8b93` |
| `tests/unit/surroundings-mercator-wms-plan-qa.test.ts` | `b517d22222a42537203c9fbad8ef9c1b58e2c93a` |
| `tests/unit/surroundings-projected-wms-request-qa.test.ts` | `5e739a307e87eaadf90bfed3c3d7a96eeab8ea7c` |
| `tests/unit/surroundings-wms-pixel-evidence-qa.test.ts` | `de612bc049fbb2b5c85ddbd0613ab4fd82c9a076` |

**Fachlicher Zweck:** getrennte rein deterministische EPSG:3857-Meter-BBOX-/WMS-Version-/`srs`/ `crs`-Planung, korrekte geographische ImageQuad-Ecken, zeit-/provider- und dimensionsgebundene Identität, sowie ein **rein visuelles** Alpha-Prüfmodul, das niemals NoData, trockene Wetterlage, echte Abdeckung oder gültige Quellzeit aus PNG-Pixeln behauptet. Keine Runtime-Imports aus der produktiven Karte, kein Worker-Write, keine Produktionsaktivierung. Aktive `CurrentSurroundings.tsx`-Anfragen nutzen weiterhin den bestehenden WMS-Pfad; **#853 ist deswegen nicht erledigt.**

**Isolierte Herkunfts-Gates:** GitHub `Vitest 5 + V8 Coverage` und `MID Draft · gezielte Regressionen` auf exaktem Spezial-HEAD `8fd3ae11285e315ecd493e7079377e088f8cc2b6` beide SUCCESS, andere / große Gates SKIPPED; der bisherige Integrations-HEAD `466dabe3aa636b940fc6e12144183f7266af922c` hatte ebenfalls beide Draft-Checks SUCCESS. Frühere isolierte Erfolgsbelege dürfen **nicht** als kombinierte Abnahme des neuen Tree/Commit ausgegeben werden. Nach Einbringung am neuen HEAD: Vitest, targeted browser/map, Source-/Core-/Heavy-/Review-/Performance-/WMO-/DWD-/NoData-Verträge, echte DWD/EUMETSAT Bildoriginale und reale 320–1440px/Light-Dark-/WebKit-iOS-Gates noch getrennt nachweisen. Der etablierte SHA-/ZIP-/Installer-/Worker-/Pages-/Stable-Releasepfad ist unberührt; #740/#839 bleibt ausschließlich beim Release-Sicherheits-Spezialchat.

**Offener Aktivierungsblocker:** tatsächliche WMS-Bildpixel an Ecken **und innen** auf der MapLibre-WebMercator-Quadgeometrie bei bestätigten Originalzeiten/Layern und transparenter NoData prüfen; WMS-Antwort HTTP 200/PNG beweist für sich weder Abdeckung noch korrekte meteorologische Semantik. Weder neues Modellmaterial noch interpolierte Pixel erfunden.
