# MID RUC P1–P5 · Shadow-Gates, Fast-Lane-Qualifikation und offene Produktionsabnahme

**Status:** ausschließlich Draft / read-only, **keine** RUC-Fast-Lane-Publikation und kein Release. Bei der Erstellung verifiziert: \`main=mid-stable\` v0.9.85.385, SHA \`1ade69f46b9bf77e9adaa360353ffacc7a0b967c\`, fünf aktive GitHub-Rulesets. Issue #541, Draft-PR #542. Parallele #540 (.386) und #543 (Cleanup) bleiben erhalten. Vor jeder weiteren Änderung erneut live prüfen.

## P1 · Erste Sichtbarkeit ≠ reale Datenverfügbarkeit

\`dwd_availability_observer.py\` erfasst nur DWD-Verzeichnisindizes. \`dwd_availability_report.py\` liefert sieben Tage / 168 Run-Slots mit P50/P90/P95 ausschließlich für die **obere Erstbeobachtungsgrenze**, mit fehlenden/noch nicht gesehenen Runs. Neu: \`ruc_freshness_shadow_gate.first_availability_interval\` unterscheidet linkszensierte und durch negative/positive Samples intervallzensierte Sichtbarkeit. Nicht beobachtete Samples bleiben unbekannt. Bis zur unabhängigen ecCodes-Prüfung aller erforderlichen Run-/Lead-/Feld-/EPS-Header sowie NoData-/Bitmap-/Werte-/Rasterdaten darf dies weder als exakte DWD-Veröffentlichungszeit noch als vollständige 0–6/14/27h-Versorgung oder EPS-P95 gelten.

**Pflicht:** kontinuierliche reale Messung ≥7 Tage; Indexsichtbarkeit, gültige Header, vollständig dekodierbare Werte und abgeschlossene 20-EPS-Mitglieder getrennt erfassen. Poll-Gaps, Outages, Quellenfehler und Rechts-/Intervallzensierung ausweisen; P50/P90/P95 getrennt und keine Null-Ersatzwerte.

## P2 · Fast Lane weiterhin gesperrt

\`inspect_fast_metadata\` lässt ausschließlich genau 0–6h oder 0–14h metadatenstrukturell prüfen: zwölf Pflichtfelder, exakte Gültigkeitsachsen, native Gitteridentität, Byte-SHA sowie explizite EPS-Status. Ein behauptetes 20er-Mitgliederinventar ersetzt **nie** echten EPS-GRIB- und Wertnachweis. \`publicationAuthorized=false\` bleibt invariant. Eigener versionierter Fast-Namespace, echte Publisher-Bytes, SHA-signierte Provenienz und Worker-/UI-/Widget-/Export-Dual-Read samt atomarem Pointer und Rollback fehlen. Die bestehende 27h-/20-EPS-Pipeline mit \`ruc/latest.json\` bleibt in Betrieb und wird nicht abgekürzt.

## P3 · GRIB-Cache-Provenienz

\`grib_cache_identity\` bindet unveränderlich Modelllauf/Feld/Lead/native Gitter-SHA/GRIB-Byte-SHA/Codec. \`verify_cached_grib\` liest die Bytes erneut vollständig und blockiert manipulierte Bytes, Traversal und Symlinks. **Noch keine Laufzeitoptimierung**: erst echte identische Downloads, ecCodes-Prozesse und Ressourcen unter vergleichbarem CPU-/RAM-/Netz-Szenario A/B messen. SHA-Identität ersetzt keinen GRIB-/Bitmap-/NoData-Decoder-Test.

## P4 · Shadow-Trigger, keine Dispatch-Aktion

\`dispatch_shadow\` bewertet den Kandidaten nur relativ zum exakt geprüften Source-SHA, bereits veröffentlichtem Run und laufenden Runs. Fehlende Metadaten, unbekannte Published-Referenz, Drift und Doppelbuild blockieren. Selbst bei einem vermeintlich neueren Kandidaten bleibt \`dispatch=false\`, bis eine vertrauenswürdige upstream Admission und deduplizierter Single-Flight-Mechanismus in GitHub **und** Cloudflare mit Race-Tests existiert. Keine neuen Secrets, Rechte oder Kosten.

## P5 · End-to-End und Frische-SLO

\`evaluate_client_freshness\` kann aus 168 lückenlosen Stundenläufen eine **indikative** P95 über echten Modelllauf → Pages-Readback → Worker-Readback → App-Adoption berechnen; fehlende App-Belege werden nicht als Null oder als erfolgreich gezählt. \`productionSloAuthorized=false\` bleibt unabhängig vom Ergebnis, bis externe Provenienz, tatsächliche DWD-/EPS-Aufnahme, Pixel-/RUC-Daten, Worker/Pages, App/Widgets/Exporte und reale mindestens 7-Tage-Samples durch unabhängige Gates belegt sind. Das 0–6h-Ziel ≤60 Minuten ist **Ziel, kein bestätigter SLO**.

## Testevidenz und Releasegrenze

Lokal auf Python 3.13: 22 neue adversarielle Tests in \`tools/ruc/test_ruc_freshness_shadow_gate.py\` sowie die bisherigen 13 Verzeichnis-/Berichtstests bestanden. Die kanonische und die aktive \`mid-ruc-availability-observer.yml\` sind byteidentisch und würden die Tests mit Python 3.12 ausführen; der Draft-Workflow ist auf \`main\`/Stable noch nicht aktiviert. **Kein** realer DWD-Netz-, GRIB-, vollständiger MID-Build-/CI-, RUC-Production- oder iOS/VoiceOver-Nachweis aus diesen Offline-Tests.

Vor Release: Stable/Main erneut verifizieren; vollständige Versions-/Baseline-/Changelog-Spiegel und Tests; nicht-Draft Source-PR-Gate → SHA-gebundener Bot-Merge → Server-ZIP → \`install-mid.yml\` → Worker/Pages → Stable-Promotion. Keine direkte \`main\`/\`mid-stable\`-Mutation und keine generische PR-Completion-Mergeaktion.

## Fortsetzung P2/P5 · kontrollierte Werkzeuge, Stand 31.10.2026

Der read-only Entwicklungsstand wurde auf dem autorisierten Draft PR #542 gesichert. Weiterhin **keine** Aktivierung der Fast-Lane-Produktion, keine Modifikation von `ruc/latest.json`, keine neuen Secrets und keine Releasefreigabe.

**P2 – echte getrennte 0–6h-GRIB-Kandidatenqualifikation:** `tools/ruc/ruc_fast_lane_producer.py` erstellt ausschließlich einen eigenständigen, zunächst nicht existierenden lokalen Kandidaten aus authentisch eingelesenen ICON-D2-RUC-GRIBs. Die bisherigen meteorologischen Herkunfts-/Bitmaps-/Werte-/Akkumulationsprüfungen der Produktionsreader werden wiederverwendet. Zusätzliche Zulassungsprüfungen: 12 fachlich geordnete Wire-Felder, 7 vollständige native Stunden, 73 tatsächliche 5-min-Termine, 25 tatsächliche 15-min-Termine, explizites Native-Grid (pointCount/nx/ny), jeder Termin mit mindestens einer endlichen Zelle, echte trockene Null nicht Missing, keine +/-Inf oder still geklippten Extreme, vier unveränderliche Objekte mit SHA256 **und exakten erwarteten Binärlängen**. Der lokale Manifest-Readback bestätigt lediglich Bytes und Struktur; `publicationAuthorized=false` ist invariant und EPS ist `unavailable`, **nie EPS=0**.

Der neue **nur manuell** auslösbare Workflow `mid-ruc-fast-lane-qualification.yml` (kanonisch und aktiv als identischer SHA-Blob) prüft nach striktem Stable/Main-Lineagevergleich erst die Offline-Gates, dann einen ausdrücklich vorgegebenen echten DWD-Lauf mit denselben MID-Readern und begrenzten Downloads. Er archiviert maximal zwei Tage einen lokalen Kandidaten, schreibt **keinen** Produktionspointer und führt keinen Worker-/App-Deploy aus. Workflow-Quelldateien existieren aktuell nur im **Draft-Branch** und sind nicht aktiv auf Stable. Eine spätere erfolgreiche Ausführung wäre ausschließlich GRIB-/Lokalnachweis, kein Fast-Produktions-Release.

**P5 – echte zeitgestempelte Beobachtungen vorbereiten:** Der gespiegelte `mid-ruc-availability-observer.yml` umfasst die vorhandenen 15-Minuten-Verzeichnis-Samples sowie einen gesonderten öffentlichen Pages-/Worker-Readback mit derselben Worker-URL-Fallbackfolge wie der veröffentlichte Installer (`MID_RUC_WORKER_HEALTH_URL`, `MID_WORKER_HEALTH_URL`, `VITE_METAR_PROXY_URL`). Er archiviert beide Messprodukte mit eindeutiger GitHub Run-/Attempt-ID für 14 Tage. `ruc_weekly_e2e_observations.py` wertet diese Beobachtungen offline pro tatsächlichem Modelllauf aus und verwechselt niemals Poll-Obergrenzen mit Publikationszeit oder App-Adoption. Worker-Ausfälle und unbekannte Daten bleiben unbekannt. Eine tatsächlich beobachtete 168h-Reihe und App-/Widget-/Export-Adoption **liegen noch nicht vor**.

**Lokale Tests:** 82 relevante Offline-Unittests bestanden, inklusive vier zusätzlicher P2-Dimensionierungs-/Byte-Tamper-Negativtests und P5-Achsen-/Readbacktests. Beide Workflow-Paare wurden zusätzlich als YAML geparst, auf ausschließlich `contents:read` geprüft und byteidentisch gespiegelt. GitHub-Vitest-, vollständige Source-/Installer-, DWD-/GRIB-Live-, Worker-/Pages-/iOS-Gates gelten erst als bestanden, wenn sie am exakten neuen PR-/Release-SHA nachgewiesen sind.

**P4 – noch gesperrt:** Die separate P4-Testdatei wurde durch Sicherheitschecks blockiert und wird weder durch einen neuen Dateiweg noch durch geschwächte Tests ersetzt. Die vorhandene qualifizierende read-only Entscheidung ermächtigt keine produktiven GitHub-/Cloudflare-Dispatches. Cross-Provider-Race-/Single-Flight-Beweise und legitime Freigabe der unabhängigen P4-Tests fehlen.

**Releasegrenze:** Parallel-PRs #538/#540/#543 unverändert; kein `.387`-Release-Spiegel vorhanden; die Source-PR-Gates und kontrollierte SHA-Bot→Server-ZIP→Installer→Worker/Pages→Stable-Kette wurden für diese Fassung nicht durchlaufen. Ein Draft darf nicht veröffentlicht werden.
