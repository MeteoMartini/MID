# MID LC 1.12 – QA-only WMS-Geometrie nicht im produktiven src-Orphan-Pfad

**NO READY / NO MERGE / NO RELEASE.** Ausgangs-Stable `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957` / v0.9.85.486, fünf aktive Rulesets.

## Warum eine neue kombinierte CI wirklich rot wurde

QA-Intake-Commit `c62b585fc5cc820d66d9f6b345a20e2f2ffce919` hatte sieben unveränderte Original-Git-Blobs aus dem Karten-Spezialdraft [#861](https://github.com/MeteoMartini/MID/pull/861) auf SHA `8fd3ae11285e315ecd493e7079377e088f8cc2b6` eingebracht. Die isolierte Spezial-CI war erfolgreich. Die neue **kombinierte** Targeted-Regression [GitHub #43956713690](https://github.com/MeteoMartini/MID/actions/runs/43956713690) scheiterte tatsächlich in `scripts/test-interaction-performance-cleanup-08155.mjs`: drei neue `src/surroundingsMercatorWmsPlan.ts`, `src/surroundingsProjectedWmsRequest.ts`, `src/surroundingsWmsPixelEvidence.ts` sind absichtlich noch nicht im App-Importgraph erreichbar. Produktivarchitektur verbietet solche ungenutzten Laufzeitdateien; Regression **nicht** abgeschwächt.

## Korrektur mit Erhalt der fachlichen Tests

Die drei **weiterhin nicht aktivierten** QA-Hilfen sind aus dem produktiven `src/` in `scripts/qa/` ausgelagert (inhaltsidentische Blobs für den geometrischen Planer und die Pixelalpha-Inspektion; beim Requestadapter nur der type-only Importpfad zur bestehenden `src/CompositeData.ts` korrekt relativ angepasst). Alle drei Original-Vitest-Suiten behalten ihre Testfälle und Assertions vollständig, nur ihre Importpfade wechseln entsprechend. Es gibt **keinen** Schein-Import aus `CurrentSurroundings.tsx`, keine Aufweichung der Dormant-Source-/Startup-/NoData-Verträge und keine unqualifizierte Umstellung der aktiven WMS-/OPERA-/RGB-/IR-Requests.

**Wichtig für Provenienz:** Die sieben Originalblobs wurden im vorherigen unveränderlichen Git-Commit `c62b585...` tatsächlich 7/7 bytegleich eingebracht. In diesem **nachfolgenden Korrekturcommit** heißen drei QA-Quelldateien anders; der Requestadapter und die drei Testblobs haben wegen der erforderlichen Importpfade neue SHA. Nicht als 7/7 Bytegleichheit des **neuen HEAD** ausgeben. Spezial-#861 ist weiterhin unberührt.

## Weiterhin nötig

Nach Umzug **neue** GitHub-Targeted-Regression inklusive `test-interaction-performance-cleanup-08155.mjs`, unveränderte Vitest-Suiten und WMS-/MapLibre-Browsernachweis am **neuen kombinierten SHA**. Die drei Hilfen sind QA-only. Für produktiven Einsatz braucht #853 später echte WMS-DWD/EUMETSAT-Originalbilder, CRS-/Zeit- und Eck-/Innenpixel-Geometrie, unabhängig verifizierte Abdeckung/NoData, Browser-/WebKit-/iOS-/VoiceOver-/Performance-Gates sowie vollständig versionierten Source-/Core-/Heavy-/Review-/ZIP-/Installer-/Worker-/Pages-/Stable-Releasepfad. Keine Änderung an #740/#839-Spezialsicherheitsarbeit.
