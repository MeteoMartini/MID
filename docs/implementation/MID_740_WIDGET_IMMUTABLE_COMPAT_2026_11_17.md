# MID #740 · Laufendes Widget-Release und globale Unveränderlichkeit (QA)

**17.11.2026. DRAFT / KEIN POLICY-CUTOVER / KEIN MERGE / KEIN RELEASE.**

Live verifiziert: main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957, Stable v0.9.85.486, fünf aktive Rulesets. Sicherheits-Draft #839: aktueller Ausgangs-HEAD c0b61e0bbed82993a45bc4181e61331a5545aae4, 52 Pfade, 57 Commits vor Stable, sechs ausgeführte Green-QA-Jobs. Vollständige Source-/Core-/Heavy-/Installer-/Pages-/Stable- und native Review-/Cutover-Gates nicht nachgewiesen.

## Echte GitHub-Originale und Folgerung

1. Aktuell vorhandenes Release widget-latest: ID 404735658, immutable=false, draft=false, prerelease=true. Vier hochgeladene Assets: mid-widget-export-latest.zip, mid-widget-export-latest.zip.sha256, manifest.json, SHA256SUMS.txt. Metadaten sind kein vollständiger Artefakt-Byte-Nachweis.
2. Die installierte .github/workflows/widget-export.yml und kanonische ci/github/workflows/widget-export.yml tragen denselben Git-Blob c276854a449ebe711e5e99eb7e69f1923a6de42e. Sie pflegen die feste Intranet-Downloadadresse /releases/download/widget-latest/mid-widget-export-latest.zip; wenn vorhanden, bearbeiten sie das bestehende Prerelease mit gh release edit und gh release upload --clobber. Wenn es fehlt, verwenden sie den Fallback gh release create.
3. GitHub sagt: Globale Immutable-Releases schützen neue veröffentlichte Releases und lassen bestehende zunächst veränderbar, sofern sie nicht neu publiziert werden. Der aktuelle Widget-Export würde deshalb nicht automatisch scheitern. Nach Löschen/Verlust oder Re-Publish des vorhandenen rollierenden Releases könnte allerdings dessen Neu-Anlage zu einem künftig unveränderbaren Release führen; ein erneutes --clobber wäre dann nicht möglich. Das Recovery-Verhalten ist nicht qualifiziert. Keinen globalen Policywechsel durchführen, bis dessen Folgen und eine sichere Wiederherstellung geprüft wurden.
4. Der neue rein lesende Helper tools/ci/mid-740-widget-immutable-compat.mjs schützt die Spiegel-/URL-/Asset-/Source-Metadatenannahmen; Vitest prüft positive und sechs negative Assetvarianten sowie immutable/fehlend/extern. Ein positives Ergebnis ist ausschließlich EXISTING_ROLLING_RELEASE_METADATA_QA_ONLY. globalImmutabilityCutoverAuthorized=false, rollingRecoveryVerified=false, releaseAuthorized=false. Weder Administratorrechte noch GH-Tokens, Runtime-/Widget-Workflow-Änderungen oder zusätzliche Kosten.
5. Nach vollständig nachgewiesenem Producer→Installer→Worker/Pages→Stable-/Recovery-Transport ist Owner-Administration für die native unabhängige No-Bypass-Review-Policy und gegebenenfalls Immutable-Releases nötig. Die vorhandene ChatGPT-GitHub-App kann die klassische Branchschutz-API nicht lesen (HTTP 403) oder Regeln ändern. Keine Bypass-Neuanlage oder Freigabe vor einem unabhängigen GitHub-E2E-Nachweis.

GitHub-Originaldokumentation:
- https://github.blog/changelog/2025-10-28-immutable-releases-are-now-generally-available/
- https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases
- https://github.com/MeteoMartini/MID/blob/a78465b655d25cafc9ecc0390080694cb7aca957/.github/workflows/widget-export.yml

## Nicht gelöste Hauptblocker

Die Release-Workflows besitzen weiterhin zwei direkte git push origin HEAD:main, im Produktion-Ruleset existiert Integration 5059236/always-Bypass und keine nachgewiesene native unabhängige PR-Reviewpflicht. Historisch PR #729 mit 21 ungelösten Reviewthreads beim Merge. Die QA hier ändert keines dieser Probleme und autorisiert weder Deployment noch Cutover.
