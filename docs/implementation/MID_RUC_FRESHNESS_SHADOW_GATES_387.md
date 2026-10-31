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
