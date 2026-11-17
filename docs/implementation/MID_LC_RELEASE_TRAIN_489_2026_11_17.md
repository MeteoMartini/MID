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

Die übrigen Guard-/Source-Bot-/Review-/Policy-/Cutover-Änderungen aus #839
werden nicht übernommen. Der Gesamtabschluss #740 ist weiter offen. Ein
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
