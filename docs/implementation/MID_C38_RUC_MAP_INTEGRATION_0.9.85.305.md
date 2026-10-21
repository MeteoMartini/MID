# MID-C38 · native RUC map integration · 0.9.85.305 candidate

Verified released base: main=mid-stable=438bfb7838a727ad8753940872c8b8ab140bb7c2 (.304). Parent pilot: af75157ee858d6c5e45e1bd213dfc46f73cc0d49 (#431), including parallel source-immutability and lookup contract hardening. #425/#431/#432/#433 are left unchanged. Source branch: chatgpt/v0.9.85.305-ruc-map-integration.

## Behavior

Six native RUC products in the common Karten model selector: temperature, pressure, wind, gust, cloud, hourly precipitation. Catalog-driven only; no synthetic Open-Meteo ID, ICON-D2 substitution, extra forecast family vote or map-only data entering fusion. UTC hourly source terms0…27; gust/precipitation start+1h. The original deterministic/EPS/fusion0…14h contract is preserved. +27h source is optional and bounded to180s; complete core source remains usable if the tail fails. Grid/GRIB/unit/interval/NoData validation is inherited from the native preprocessor; int16 overflow is rejected rather than clipped.

The entire original compressed core must decode bit-exactly to the source prefix. Lookup SHA and contract, all old inventory objects and actual file inventory must agree. Map generation repeats source manifest/file checks at handoff (parallel #431 correction retained). Admission converts explicitly inactive candidate schemas into distinct published schemas only after complete checks. Pressure contours and centers use the same RUC pressure raster. Immutable namespace, all new SHA/bytes verified, final pointer atomic. Existing codec proof, old objects and previously archived raw rollback unchanged. Total snapshot budget stays strictly below900000000bytes including latest.json. Partial writes clean up; rejected budget/source leaves old pointer untouched.

Browser verifies root/index/frame schema, byte count, SHA, source model, absolute UTC axis, complete identical horizons, interval/units, four-hour freshness and safe immutable paths. RUC NoData becomes internal NaN and stays transparent/null in point queries; authentic dry zero is preserved. Same color/value formatter, legend, favorite table, SVG/PNG renderer. RUC source captions and export filenames are explicit. Nearest raster resampling preserves displayed cell boundaries. Pressure auxiliary layers require the same source, run and valid time; no ICON-D2/RUC mixing.

## Checks and remaining release gates

- Reproducible npm ci --ignore-scripts; existing dependency/lockfile versions retained.
- Focused RUC candidate/archive/horizon/source/admission Python tests passed, including corruption, old-core drift, budget rejection and partial-write rollback.
- Dynamic JS tests passed: UTC across four timezones,14/27h completeness, freshness, index SHA, units, NoData versus zero, six-product capability, selection persistence, export source.
- Existing adaptive native map, presentation/point and workflow mirror/coordination checks passed.
- TypeScript and production build passed locally. Build identity refers to current committed pilot parent plus worktree; not a release artifact.
- Actual .304 artifact replay/admission passed: all397parts, final379704626bytes, old objects/source/codec proof unchanged (MID_C38_RUC_REAL_ADMISSION_0.9.85.305.json). Core1007/1007 passed in190s, production dependency audit0vulnerabilities. Browser matrix and enhanced native27h admission canary remain in progress. One tablet WMS resource-timing assertion timed out after the new RUC/reload cycle; resource timing buffer cleared at the existing verification boundary and extra diagnostics added, assertion retained; rerun pending.
- Source-PR Gate, SHA-bound MID bot, server ZIP, installer, Worker/Pages and exact stable promotion remain required. This document does not claim publication or physical iOS/WKWebView/VoiceOver acceptance.

## Prior real-data evidence

Read-only native horizon run39502837253 (head37380f65b4f290a4708d14ef577c031e3795ce63): artifact12303036848 SHA e325301081908643010b3c7e627765e1d751f07166f139efdd998a9eae3e9e51. Three native runs19/20/21UTC20October2026,28terms,12fields,542040points; map candidates22157660–22181296bytes. This proves bounded native hourly availability and numerical validation, not EPS+27h or complete production readiness. Later parallel hardening is recorded in #431, including independently inspected498frames. Do not treat old runs as current freshness evidence.

Released .304 RUC archive run39495600947 artifact12299022607 SHA83da6240488a315ca7d85aeea728a7272845f3a00ebca6ce972f558be5cbef21 is re-downloaded and SHA-verified for integration replay.

Open separate work: #428 provider DST/cache/daily migration; #374 live/device acceptance; #350/#352/#405 retain EPS/full rapid/science/SLO scope. No blanket issue closure.

## Independent production JS replay

`MID_C38_RUC_JS_REAL_REPLAY_0.9.85.305.json` records all88published frames and11661056cells from the actual .304 archive, loaded by `loadNativeField` (production SHA/byte/gzip/schema/physical-bound validators), independently compared cell-by-cell against original native int16 values and lookup. Maximum display quantization error0.00500000000001 in converted wind units; no source-value rewrite. Controlled historical clock only for catalog validation, not a live freshness claim.

Admission now streams a second full SHA/size verification of every old inventory object immediately before atomic pointer replacement. A negative regression mutates an existing compressed core object during map generation and proves rejection without manifest replacement or new namespace leakage. Source files and manifest are also rechecked at handoff.

The native horizon step in the existing Source-PR Gate exercises full27hmap admission against a real14hcore prefix in a temporary codec fixture on each of three native runs. Its fixture explicitly excludes production EPS/rapid/rollback coverage; the separate .304 actual full-snapshot replay proves preservation/admission with those production products present. Gate remains contents:read and PR-only, with the exact PR merge snapshot and no secrets/deployment/schedule.

PR Completion's canonical watcher returned blocked because `gh` is absent; observation continues through the connected GitHub API. No generic landing action is invoked. Source PR435 head aeacfaf9d781404c650da1e0b472d86860ba3062 was created draft and verified. Publication remains unclaimed.

## Completed local browser checks

All24assigned common-map Chromium cases passed: widths320/390/412/844/1024/1440 × light/dark × next/classic, including the added RUC source/catalog/horizon/persistence/pressure checks. RUC-specific landscape verification resizes844×390 and1024×768, then restores the existing general harness viewport. Earlier WMS timing timeout was removed by clearing the browser resource-timing buffer before the existing WMS-request assertion (assertion unchanged); all three final groups passed10/8/6cases. This is browser fixture evidence, not physical devices or live provider performance.

Separate390pxlight-next actual interaction passed the stricter+27h rendered-valid-time assertion, favorite23.5°C, source-labelled SVG and PNG downloads, and no horizontal overflow. SVG34420bytes, PNG130886bytes at1200×1130; SHA d43b4c33e2693a3a9e59e2068dc004687bea543dfff672851ca5ccb409cec21e / 4a03f08761061ae928ae6e909ba061b4acbf5a4d1676edb4d273e4a1c844c322 (time-dependent synthetic fixture). These export/actual-render checks are now included in the mandatory common-map harness. New output uses the same production field/renderer/formatter.

The second full real .304 admission replay with the final inventory-handoff hardening produced the exact same proof and manifest SHA053988212b2b00d5a44ebd509c1f9aa1f622e0996b65fa94324d8d6f87d29c03. Focused tests rerun after hardening passed. No production source changes after the green build; only backend inventory recheck and test/evidence additions followed. Source/installer full gates and current-head native canary still pending.

## Optionalitätskorrektur aus Issue350

Optionale Karten dürfen die eigentliche RUC-Punktprognose nicht blockieren. `admit_optional` verifiziert deshalb den bestehenden aktiven Snapshot einschließlich vollständigem Inventar und0…14h-Kernvertrag vorab. Bestehende Korruption/Pointerdrift bleibt fatal (`SnapshotIntegrityError`). Nur fehlende/ungültige Kartenquelle, Kartenbudget- oder Karten-Schreibfehler werden nach erneuter Bestands-/Pointerprüfung als `admitted=false,coreRetained=true` protokolliert. Ein Fehler kann keine Bestandskorruption verschlucken. Negative Tests decken Quellen-/Budget-/Schreibfehler, korrupte Altobjekte und fehlerhafte Kernzeitachse bei fehlender Kartenquelle ab. Positive `admit`-Ausgabe bleibt unverändert. Workflow protokolliert zusätzlich die gemessenen `mapPreparationSeconds`;180s-Deadline für den separaten+27h-Download bleibt.

ECMWF-Prüfung und Verwendung der vorhandenen Actions: MID_C38_ECMWF_INTEGRATION_REVIEW_0.9.85.305.md. Bestehendes IFS0p25 ist direkt angebunden; der0p1-Pilot ist anhand seines SHA-geprüften Artefakts bewertet, aber noch kein freigegebener Ersatz des vollständigen Synoptikprodukts.

Vollständiger echter Native27h-Integrationscanary auf d65b8efaedb14c21dc310ed886781a5ec058d4bb: Run39549581777 grün; Artefakt12322369998 SHA8f35dccd8a8d5f058de28c76a8c30bceac503830c4df691983c99d1bbf1ce6ee unabhängig geprüft. Drei vollständige Läufe21.10.2026 02/03/04UTC, jeweils542040Punkte/28Termine/12Felder; separate27h-Maps gegen bitgleichen14h-Core zugelassen. Vollständiger Bericht und unabhängige498Frame-Prüfung dauerhaft unter MID_C38_RUC_NATIVE_27H_0.9.85.305.json. Pro Lauf158.29–164.67s inklusive Download, nativer Aufbereitung, Kandidat und temporärer Codec-/Karten-Zulassung; keine Produktions-SLO-Gleichsetzung. Erneuter voller .304-Archivtest mit dem Optionalitätsguard lieferte exakt denselben positiven Manifest-/Budgetnachweis. Folgender Head enthält Optionalitätskorrektur und deren Negative-Tests; dessen eigene Gates bleiben erforderlich.

Die abschließende Browsergruppe mit persistenten tatsächlichen+27h-/SVG-/PNG-Prüfungen bestand8/8. Zusätzlich wird im390px-next-Fall jeweils auf430×932 (Light/Dark) umgeschaltet und der explizite430px-iPhone-/Overflow-Vertrag aus Issue350 geprüft; die vorhandene24-Fälle-Partition bleibt unverändert.

## Bestehende Workflow-Kette beibehalten

Der zusätzliche PR-Diagnoseworkflow `mid-ruc-horizon-readonly.yml` ist aus dem Release-PR entfernt, einschließlich kanonischer Quelle und Sync-Registrierung. Seine Drei-Läufe-/27h-Prüfung samt Artefakt liegt nun im vorhandenen Source-PR Gate; sie wird bei Änderungen unter tools/ruc ausgeführt und muss dort erfolgreich sein. Bestehende Core-/Heavy-/Release-/Installer-Prüfungen bleiben bestehen. Der letzte separate Diagnose-Lauf39550957591 auf d9cf4bbc ist erfolgreich; nach Konsolidierung ist der neue Source-Gate maßgeblich. Der PR wird nach dieser Korrektur aus dem Entwurf genommen, damit die vorhandenen Source-/Release-Jobs tatsächlich laufen.

Der vom Nutzer benannte Chat „MID-RUC Integrationsreife“ war über die Kontextsuche nicht vollständig abrufbar. Die ECMWF-Bewertung beansprucht daher keinen vollständigen Abgleich mit diesem Chat; sie dokumentiert die direkt geprüften Repository-/PR-/Artefaktquellen.
