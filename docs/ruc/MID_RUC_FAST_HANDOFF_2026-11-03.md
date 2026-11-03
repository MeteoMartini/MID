# RUC Fast: aktueller Umsetzungsblocker und korrigierter Nachweisstand

Stand 03.11.2026. **Keine Implementierung gestartet; die produktive ICON-D2-RUC/Fast-Lane-Problematik ist mit diesem Draft nicht gelöst.** Der Auftrag untersagt den Beginn bei konkurrierenden Änderungen. Dieser reine Dokumentations-Draft sichert den konkreten Übergabestand und korrigiert einen inzwischen veralteten Blocker. Keine App-Versionierung für eine redaktionelle Dokumentation, keine Code-/Workflow-/Produktionsänderung.

## Verifizierte Basis

`main = mid-stable = 16c975aab66ed858f0add9628f78b5b87b7e2a34`, installierte Version 0.9.85.417. Package und beide Baseline-Versionen stimmen überein. [Installer 41701615535](https://github.com/MeteoMartini/MID/actions/runs/41701615535) auf Quell-SHA `26a8621ebe4911e3e19f9d78240490737049c0b8` erfolgreich einschließlich Core/Heavy, Worker, Pages und Finalize. AGENTS, Source of Truth, Baseline, RUC-Pipeline-, GitHub-Schreib-, State- und Offline-Verträge sind mit SHA-256 im nebenliegenden JSON gebunden. Der vorhandene Karten-Draft #645 bleibt unverändert und wurde nicht als Stable verwendet.

## Direkte Überschneidung: keine zweite Fast-Implementierung

- [#642](https://github.com/MeteoMartini/MID/pull/642) @ `9ea9552e6243b6133a40b207d70b8dc69beb8ae1`: auf .416 konsolidierte DWD-Batch- und Fast-Zulassungsarbeit.
- [#640](https://github.com/MeteoMartini/MID/pull/640) @ `e470b747182ee74aa810697ed3b9823abb85284d`: .415-basierte CAS-/Readback-Arbeit, bereits als Input in #642 enthalten.
- Betroffene gemeinsame Dateien: `tools/ruc/ruc_fast_cas.mjs`, `ruc_fast_public_site_admission.mjs`, `test_ruc_fast_cas.mjs`, `test_ruc_fast_paged_point_shadow.mjs`. Neuer Umbau in diesen Pfaden würde parallel dieselbe Fast-Aktivierung und Zulassung bearbeiten.
- Weitere abgegrenzte Kandidaten: #638 DWD-Regular-Batching, #636 abgeleitete Open-Meteo-Shadow-Qualifikation, #612 Original-GRIB/EPS20, #554 P3-A/B, #551 Header-Fast-Preflight. Open-Meteo-Nachweise sind kein Ersatz für die DWD-Originalzulassung. Keine dieser Arbeiten übernommen, überschrieben oder geschlossen.

## Ein alter Blocker ist bereits überholt

Der Gate-Checkpoint im Text von #642 meldet [41673755584](https://github.com/MeteoMartini/MID/actions/runs/41673755584) noch als fehlgeschlagen wegen eines fehlenden versiegelten .416-Artefakts. **Die aktuell gelesenen GitHub-Metadaten zeigen auf demselben exakten PR-Head success**, ebenso der Check „Original full and Fast binary end-to-end offline site; no release rights“. Der alte Text darf nicht als aktueller Fehlstatus wiederverwendet werden. Historische Fehlversuche werden dadurch nicht nachträglich zu Erfolgen; die Aussage betrifft den aktuell gelieferten Run-/Checkstatus. Kein neuer kostspieliger Originaldatenlauf wurde ausgelöst.

Zusätzlich ist [41703938171](https://github.com/MeteoMartini/MID/actions/runs/41703938171) auf dem aktuellen .417-Stable erfolgreich: calculate, prepare, reguläre Pages-Veröffentlichung und diagnostics. Das belegt die reguläre RUC-Pipeline, **keine produktive Fast-Lane-Aktivierung**. Ein weiterer regulärer Lauf 41711711447 war bei Abfrage queued; auch dieser wurde nicht von dieser Aufgabe gestartet.

## Was für die vollständige Lösung noch getrennt nachzuweisen ist

Die folgenden Punkte werden in #640/#642 und den offenen Issues [#541](https://github.com/MeteoMartini/MID/issues/541) / [#446](https://github.com/MeteoMartini/MID/issues/446) als offen geführt; sie wurden hier nicht unabhängig als produktiv erfüllt nachgewiesen:

1. Den bestehenden konsolidierten Kandidaten gegen den aktuellen Stable selektiv prüfen und seine Zuständigkeit klären, bevor weitere Implementierung beginnt. .415-/ .416-Artefakte benötigen echte Provenienz-/Kompatibilitäts-/Frischezulassung; bloße Versionsähnlichkeit reicht nicht.
2. Geschützte D2-Original-Signatur und vollständige native Karten-/Objektzulassung (#446); reguläre Nine-Lead-Batch-Beweise ersetzen das nicht.
3. Gemeinsames Pages/R2-Single-Writer-Fencing, authentifizierter Freigabeanker sowie CAS/Rollback. Der Kandidat bindet shadow→active an dieselben unveränderlichen Quellen; ein Offline-CAS-Test beweist keine reale Produktionskoordination.
4. Echter öffentlicher HTTPS-Readback der zulässigen Quellen und deren Adoption durch Clients. Der Readback-Kandidat belegt nach eigenem Vertrag nur eine Ortsstichprobe, nicht sämtliche 4.300 nativen Fast-Chunks oder die vollständige Site.
5. Mehrtägige tatsächliche DWD→Web/iOS/Widget/Export-Frische, einschließlich zensierter Ausfälle und NoData, gemäß #541. Ohne 168h-Endclient-Messung keine Behauptung eines produktiven P95≤60min.

27h/EPS20, unabhängige Fast-Achsen, native Bitmap/NoData, Lauf-/Intervallsemantik, Budget, Nutzerzustände und letzter gültiger veröffentlichter Stand bleiben geschützt. Geschützte Signer, Daten-/Veröffentlichungsworkflows und Release-/Promotionwege wurden nicht ausgelöst.

## Prüfung dieses Drafts

Nur GitHub-Leseabfragen, Basis-/Versions-/Vertrags-Hashes und Prüfung des reinen Dokumentationsdiffs. **Keine lokalen Funktions-/Browser-/Responsive-Tests ausgeführt**, da die Implementierung vor Änderungen an App/Client/Pipeline blockiert wurde. 320/390/430 px, Tablet, Desktop und Light/Dark sind für eine spätere tatsächliche Implementierung weiterhin offen; frühere Karten-Draft-Tests werden nicht als RUC-Fast-Abnahme umgedeutet. Keine vollständige Repository-Regression, kein Build, keine Veröffentlichung, keine Promotion.

Die beigefügte JSON-Datei enthält den maschinenlesbaren Beobachtungsstand. Dieser Draft schafft einen belastbaren Ausgangspunkt für die koordinierte Fortsetzung der vorhandenen RUC-Arbeit; er erteilt keine Fast-Freigabe.
