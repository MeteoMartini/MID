# MID LC · v0.9.85.489 · Integrations- und Datenprovenienz (2026-11-17)

- Verifizierter Ausgangs-Stable `main=mid-stable=9fe4dfbcdfd5a1f8fec55efa868e22110a612953` v0.9.85.488, fünf Rulesets. Release-Installer .488 #44121560818 komplett SUCCESS, finaler Stable-SHA `9fe4dfbcdfd5a1f8fec55efa868e22110a612953`.
- #899 HEAD `115012fce035b4d7dfc6eb937654bcda93ce8fb5`: sechs unveränderte Git-Blobs, darunter reine ISO-Ausgabezeit-/Vorlauf-/Lokalmittag-/DST-Provenienz-Guards. Einzel-CI #44135776780 targeted + Vitest SUCCESS, keine Full-Gate-Freigabe.
- #868 HEAD `dd9a9cc6eaca641785b095bf79862a4b1ba051cd`: **nur** drei disjunkte Original-Git-Blobs `scripts/lib/changelogCurrentRelease.mjs`, `scripts/sync-version.mjs`, `tests/unit/mid-changelog-release-section-qa.test.ts`; keine älteren 213 unqualifizierten Karten-Arbeiten übernommen. Aus bestehendem Stable-`scripts/sync-version.mjs` ist das Delta byteidentisch zum Original-Spezialblob belegt.
- 19 Versionsspiegel erhalten und auf .489 aktualisiert; `RELEASE_NOTES.md` und historischer `CHANGELOG.md`/`public/CHANGELOG.md` erhalten neue .489-Metadaten ohne vorherige Changelog-Historie zu beschädigen; `scripts/sync-version.mjs` dupliziert künftig keine alten Rolling-Notizen.
- README verweist transparent auf Issue #901 für fehlende versionierte GitHub-Releases; **kein** ungesicherter GitHub-Release-/Tag-/Asset-Backfill und keine neue privilegierte Autorität, #839/#740 weiterhin separat.
- Keine Änderung an WMO/DWD-Warnungen, RUC-Daten, Cloudflare, Prognosewerten, Akkumulation, Offline-Service-Worker-Logik außerhalb Versionscache oder der Source-Release-/Review-Policy oder den verpflichtenden Installer-Gates. Alte/no-data Beobachtungen bleiben fehlend, echte Extreme ungekürzt.
- Freigabe ist nicht in diesem Memo enthalten: kombinierte Vitest/Regression und danach exaktes Source-PR-/Review-/Core-/Heavy-Gate → Bot-Merge → serverseitiges Original-ZIP → Installer → Worker/Pages → Stable-Promotion und finaler Readback.

## Isolierter Installer-Recovery-Shadow aus #839

Zwölf SHA-/Blob-identische Pfade aus #839 HEAD
`be4e8eb46f6f1cda6fec2591ee16190a7f182fef` ergänzen ausschließlich den
optionalen lesenden Job `dist_recovery_shadow`, drei Python-Helper mit ihren
Tests, die drei synchronen Installer-Spiegel, Checkout-/Sharding-Regression
und den technischen Handoff. Keine Überschneidung mit den bisherigen 35
LC-Pfaden. Der verpflichtende Installer-Sammeljob bleibt bytegleich zum Stable.
Der neue Job bindet ZIP/Manifest an den nach Core/Heavy erfolgreichen originalen
Build-Snapshot und speichert sie sieben Tage. Er enthält keine App-Token-/
Secret-Schritte und hat nur contents: read. Alle vier Pflichtdownloads und
alle acht Checkout-Sicherungen bleiben regressionsgeprüft.

Die Guard-/Review-/Policy-/Cutover-Änderungen aus #839 bleiben separat.
Der optionale Source-Producer-Shadow wird im unten dokumentierten Folgeschritt übernommen. Der Gesamtabschluss #740 ist weiter offen. Ein
erfolgreicher kombinierter Draft ist Voraussetzung der fachlichen Bewertung,
die vollständigen bestehenden Source-/Installer-/Worker-/Pages-/Stable-Gates
bleiben für diesen Integrationsstand erforderlich. Erst ein tatsächlicher
Installer-Lauf kann den neuen Shadow positiv oder negativ belegen. Er
erzeugt keine Attestierung und kein dauerhaftes Recovery-Release.

## Review-Triage der fünf Cubic-P2-Fundstellen

Auf dem kombinierten Stand waren alle fünf ursprünglichen Threads ungelöst.
Vier Gegenbeispiele bestätigten vermischte Überschriften-Grenzen, ignorierte
Doppelüberschriften, veraltete aktuelle Abschnittstexte und die abweichende
Suffix-Unterstützung. Die Schreibschleife bestätigte den fünften Befund.
Der Helper verwendet jetzt historische Überschriften als Abschnittsgrenzen,
verlangt eine eindeutige aktuelle Version, vergleicht aktuelle Abschnittskörper
und unterstützt dieselben Paketsuffixe wie sync-version. Beide Changelog-
Ergebnisse werden vor dem ersten Spiegel-Schreibvorgang vollständig validiert.
Zusätzliche Tests reproduzieren die Fälle einschließlich Ausführung des
Originalsyncers in einer Fixture mit ungültigem zweitem Spiegel.
Vorhandene .489-Abschnittskörper stimmen mit RELEASE_NOTES überein.


## Originalen Source-Producer-Shadow in denselben Train übernehmen

Elf weitere SHA-identische Pfade aus #839 HEAD
`be4e8eb46f6f1cda6fec2591ee16190a7f182fef` ergänzen den bereits vorbereiteten
Installer-Shadow: zwei Workflowspiegel, vier vorhandene read-only Helper, deren
vier Regressionen und der ursprüngliche technische Bericht. Kein neuer
Prototyp und keine neue Berechtigung. Der originale Premerge-Event-/Run-/PR-/
SHA-Readback läuft optional vor dem unveränderten Merge. Nach dem bisherigen
Paket-Commit werden dessen originale ZIP-Blob-Bytes samt Provenienz und ggf.
Receipt vor dem unveränderten Installer-Dispatch als kurzlebiges Artefakt
gesichert. Alle drei zusätzlichen Schritte haben continue-on-error; ihre
internen Prüfungen bleiben fail-closed. Sie ersetzen keine Pflichtentscheidung.

Der Workflow läuft aus dem vor Merge vertrauenswürdigen main-Commit. Deshalb
kann der erste reguläre Release nach Aufnahme dieser Dateien nur die
Bereitstellung qualifizieren; erst ein späterer regulärer Source-Producer
kann die neue Ausführung belegen. Der Installer-Shadow kann dagegen bereits
das neu installierte Skript verarbeiten. Keine Behauptung eines echten
Producer-Originaluploads, einer Attestierung oder eines vollständigen Cutovers.

Der abgeschlossene volle Source-Gate 44183104251 am Vorgänger-HEAD
1db4b91bd4c950b6bddfda0725084c2be5011a1c hatte vier grüne Core-Shards und
sechs grüne Heavy-Jobs, scheiterte aber in Source-Kern am vollständigen npm
Audit. Die erneute Prüfung am 17.11.2026 bestätigt 11 Befunde, davon 5 high.
GHSA-fc5q-39xc-vjpf betrifft picomatch <=4.0.7; der offizielle Advisory führt
keine behobene Version. Kein Audit-Fix-Force, kein Gate-Bypass. #902 bleibt
Draft, Stable bleibt .488. Für den neuen HEAD ist neue Draft-QA erforderlich.

Lokale Vorprüfung dieses Folgeschritts: 493 Vitest-Tests PASS, 5 bestehende
Tests SKIP (Node 24.22.1); TypeScript PASS; Workflow-Synchronisierung PASS;
Installer-Sharding-/Snapshot-Negativtests PASS. Zusätzlich wurde der gesamte
Source-Workflow nach Entfernung exakt der drei optionalen Shadow-Schritte
und der inerten Installer-Step-ID byteidentisch zum bisherigen Stable-Workflow
verglichen. GitHub Node-22-/Governance-/Draft-QA und Code-Review sind separat
am veröffentlichten HEAD nachzulesen. Kein neuer Source-Vollgate gestartet,
solange der unveränderte Dependency-Audit-Blocker besteht.


## MID #903 – Security-Fix auf dem v0.9.85.489 Release-Train (18.11.2026)

Parent des ref-freien SHA-Fixes `34560bd791072e65672f3af69a2e2f3d77c772f2` ist der PR-HEAD `c094a97126ce755e4917a1051e462bbd5b6b8039`; das neue Regressionstests-Kind ist `771b6a5a772f63c6ef328e53d149de423d66a5a4`. Unveränderte Vite-8-Kette mit npm Overrides auf `@ryotsu/picomatch@4.0.7-a`, Registry SHA512 `sha512-JroBFEmaejC7szGSfqOhF1QZHLKvX2wTA1+fWyfkpy3BjzdQKNPLKa2FtgeKVUDy5/UPUNkXEeCHJ5ZRBMLTVA==`; 270 Paketeinträge, nur `node_modules/picomatch` verändert. Externe isolierte Original-NPM-10-QA: normales `npm ci`, `npm run audit:all`, `npm run audit:dependencies` (83 Produktionsversionen, npm Advisory erreichbar), `npm audit signatures`, 42 ReDoS-Proben und Vite-8/React-19-Smoke erfolgreich. Offener Community-Fork-/Supply-Chain-Restbefund; diese Tests ersetzen keinen einzigen Source-/Core-/Heavy-/Review-/Installer-/iOS-/Worker-/Pages-/Stable-Gate. Die Sicherheitswartung ist in aktuellen Version-Notizen und historischem Changelog mit identischem aktuellem Absatz dokumentiert, ältere Changelog-Bytes unverändert. #839/#740 sind keine pauschalen Blocker für den unabhängigen Produktrelease.
