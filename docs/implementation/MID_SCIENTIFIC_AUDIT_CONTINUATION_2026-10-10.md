# MID v0.9.85.226 · wissenschaftlicher Audit: verifizierter Fortsetzungsstand

Am 10.10.2026 Source-Gate 38031626313 und Installer 38032074847 erfolgreich, Pages im ersten Versuch. main=mid-stable=6c7d493c65cf1046fc1a5ed2f89bf10b0ea3ffca. PR #320 (Quellhead95890bbc0cc7676f2dc10b8782c524e0ebc09c79) zusammengeführt. .225 war zuvor wegen Messung während Update-Animation nicht installiert; .226 übernimmt alle .225-Quelländerungen und löst den reproduzierten Gatefehler ohne Lockerung.

Erledigt: Offline-Inventar/semantische Referenzbaseline; native Environment-Diagnose; RUC-Missing-Summen, rollierende Fenster, EPS-Mitgliedervoten/Quantile, optionale Phasen und JSON-Kompatibilitätsfelder korrigiert. Lokal955 App-Regressionen,36 GRIB/Fetch/Bitmap/Integritätstests,3 Temperaturtests,14 Browserfälle, Produktionsbuild/Types, Worker/SW-Syntax und Produktionsaudit0 Vulnerabilities. CI-Core/Heavy/iOS-Webasset-Kontrolle erfolgreich. Dies ist keine reale iOS/WKWebView-/VoiceOver-Abnahme oder vollständige wissenschaftliche Abnahme.

Das nächste Paket ist nur vorbereitet. Branch codex/v0.9.85.227-audit-header-evidence wird verlustfrei auf diesem verifizierten Stable geführt; bislang enthält es nur Header-Evidenz und diesen Fortsetzungsstand, keine neue produktive Logik und keinen neuen Release.

## Nächster konkreter Schritt

Feste RUC-Produktverträge auf Basis docs/implementation/MID_SCIENTIFIC_AUDIT_HEADER_EVIDENCE_2026-10-10.json: zwölf deterministische Kernparameter des gemeinsamen DWD-Laufs06:00 UTC bei +1h, zusätzliche Viertelstunden-/Böenfenster und CLAT/CLON-/Level-/Grid-Belege. Dekodiert mit ecCodes2.49.0, URLs und SHA256 archiviert. Es sind Header-Stichproben, kein vollständiger deterministischer/Ensemble-Referenzlauf und kein vollständiger Werte-/Grid-Benchmark.

Zeitsemantik explizit prüfen: instant start=end; TOT_PREC accum ab Modellstart; VMAX max über vorangegangenes Stundenfenster. ecCodes liefert Viertelstunden startStep/endStep als '0m'/'15m'/'75m', stepUnits0; Stunden als numerische Werte, stepUnits1. Strings nicht blind in float/int umdeuten. forecast_reference_time, lead, valid_time und bounds getrennt; valid=init+lead prüfen. Unbekannte Einheiten/Größenarten vor Packing abweisen. Windkomponenten/Gust/CAPE/CIN/Niederschlag um explizite Units ergänzen. Koordinaten aus deklarierten Einheiten statt Werteheuristik; tatsächliche Samples CLAT='Degree N', CLON='Degree E'.

Raw Level-/Grid-Verträge prüfen: typeOfLevel kann bei echten DWD-Layern 'unknown' sein; rohe First-/Second-Fixed-Surface-Codes und skalierte Werte verwenden statt Labels zu erraten. Stichproben gemeinsames Gitter47, reference1, UUID c6b12daa91ad64045b26c1b6452a2a20,542040 Zellen. Datenfelder/CLAT/CLON und EPS auf identisches Gitter prüfen; keine generische CF-Konformität behaupten. Vollständige Folge-/Member-/Grid-Validierung und negative echte GRIB-Fixtures vor Veröffentlichung.

## Weiter offen

Vollständiger realer DWD-Referenzlauf und Input/Output-/Decoder-/Environment-Manifest; übrige anwendbare P0/P1-Prüffelder einschließlich Beobachtungs-QC/Provenienz, Zeit-/Raum-/Regriddingnähte, Leakage-freie statistische Verifikation/Baselines/Proper Scores/blockbasierte Unsicherheit, wissenschaftliche Golden/Conservation/E2E-Abnahme, kontrollierte Dependency-Modernisierung nur nach Upstream-Verifikation, Profiling vor I/O/CPU/RAM-Optimierung, Visual Contracts und reale Geräteprüfung. Zusätzlich bestehende SLO-Historie/Alarmierung und direkte Cloudflare-Konto-/Cron-Evidenz offen. Kein Overall-Auditabschluss behaupten. Keine neuen Sprach-/HPC-Frameworks allein wegen Erwähnung im Referenzaudit einführen.

Veröffentlichung ausschließlich über bestehendes Source-Gate → SHA-gebundenen Release-Bot → serverseitiges ZIP → Installer → Worker/Pages → Stable. Nach jedem weiteren Paket jüngste Branches/Verträge/Versionen erneut prüfen.
