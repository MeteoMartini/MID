# MID v0.9.85.224 · wissenschaftlicher Audit: Inventar und Referenzbaseline

Verifizierter Ausgangspunkt: main = mid-stable = `391ed9334c0335fb9678884f6b67354e53d24dc3`. Der neue Audit ist ein artefaktunabhängiger Referenzrahmen. Seine potenziellen Befunde sind keine bestätigten MID-Fehler. Keine fachliche Gesamtfreigabe wird behauptet.

## Erste Umsetzung

`python3 tools/ruc/scientific_baseline.py > baseline.json` erzeugt ein maschinenlesbares Inventar: Quellcommit, Worktree-Status, Releaseversion, SHA256 der Dependency-/Daten-/Projektverträge, tatsächlich installierte Python-Pakete sowie deterministische wissenschaftliche Referenzwerte. Die kleine synthetische Fixture prüft vorhandene Kernfeld-/Missing-/Mitgliedergates und Niederschlagsintegrale. Fehlende Pakete bleiben null. Messwerte umfassen Laufzeit, CPU und Prozess-Peak-RSS mit expliziten Grenzen. Unbekannte I/O-Zähler bleiben null. Keine Live-Daten, Reprojektion oder GRIB-Dekodierung wird dadurch abgenommen.

Zwei aufeinanderfolgende Referenzläufe lieferten identische semantische Ergebnisse und SHA256 `0b566974aab590973ea11e30254f0901384afc035be1e0ab43d6443651ab011f`. Laufzeit und Environment gehen bewusst nicht in den semantischen Hash ein. Synthetische Fixture und vollständiger Produktlauf dürfen nicht als dieselbe Baseline dargestellt werden.

## Geordnete Folgearbeiten und Abnahme

1. Inventar vervollständigen: reale DWD-Inputs mit Hash, Decoder-/Tabellenversion, native Bibliotheken und Environment; vollständigen deterministischen Produktlauf mit Output-Manifest und RAM/I/O-Baseline archivieren.
2. P0: Einheiten/Größenart, Initialisierung/Lead/Valid Time/Intervallgrenzen, Missing/QC, Grid/CRS, Leakage und Beobachtungshistorie pro Schnittstelle bestätigen, widerlegen oder begründet als nicht anwendbar einstufen. Keine willkürliche Missing-Quote setzen.
3. Meteorologisches Fachaudit: Sampling, Vergleichbarkeit, konservatives bzw. kategoriales Remapping und Beobachtungsqualität prüfen.
4. Verifikation: zeitlich/räumlich blockierte Splits; Bias/MAE/RMSE, Brier/CRPS und geeignete räumliche Scores mit Baselines und blockbasierter Unsicherheit.
5. Regressionsfundament: wissenschaftliche Golden-/Conservation-/E2E-Tests im bestehenden Gate, keine Lockerung der Tests.
6. Dependencies einzeln nach Upstream-Verifizierung aktualisieren. Versionsbehauptungen im Referenzaudit sind keine Freigabe für ungeprüfte Upgrades.
7. I/O/Chunking, dann gemessene CPU-/RAM-Hotspots; Skalierung nur bei nachgewiesenem Nutzen und wissenschaftlicher Äquivalenz.
8. Visual-/API-Verträge: Units, Valid Times, Missing und Unsicherheit konsistent sichtbar machen; responsive und reale Geräteabnahme.
9. Release-Audit über Source-PR-Gate, SHA-gebundenen Release-Bot, serverseitiges ZIP, Installer, Worker/Pages und Stable. Gesamtabschluss erst mit Evidenz für alle anwendbaren P0/P1-Prüffelder.

## Bestehender Integrationsstand

PR #319 (.225) ersetzt RUC-Einheitenheuristiken. Am 10.10.2026 war er offen; Kern/GRIB/Build und andere Heavy-Shards erfolgreich, Bergwetter-Shard scheiterte am Chromium-CDP-Start. Unveränderte Wiederholung gestartet. Die erste neue Baseline wird separat vorbereitet, ohne .225 zu überschreiben oder vorzeitig Stable zu verändern.

Echte iOS/WKWebView/VoiceOver-Abnahme und Cloudflare-Konto-/Cron-Nachweis bleiben externe Evidenzlücken; dieser Referenzlauf schließt sie nicht.

Audit-PDF SHA256: `baee0aa3fbb6db7233d22805956a51af49ff38293e51010ae0df3f1e7642338a`.

## Bestätigter P0-Missing-Befund und Korrektur in Vorbereitung .226

Auf .224 reproduziert: `_max_rolling_sum` liefert für eine vollständig fehlende Zelle 0. `rapid_extreme_eps_period_summary` zählt vollständig fehlende und zeitlich unvollständige Mitgliedsperioden durch `nansum` als gültige trockene Mitglieder. Das ist ein bestätigter Codebefund, kein Nachweis eines bestimmten falschen veröffentlichten Produkts.

Korrektur: Niederschlagssummen propagieren Missing statt übersprungene Intervalle als vollständig zu behandeln; rollierende Maxima berücksichtigen vollständige Fenster und erhalten deren Werte trotz später fehlender Fenster. EPS-Periodenscores und Quantile schließen unvollständige Mitglieder gemeinsam aus. Fehlende Phasenfelder werden nicht mehr mit Nullarrays ersetzt. Echte trockene Nullen bleiben Daten.

33 verpflichtende Fetch-/GRIB-/Bitmap-/Integritätstests inklusive neuer Missing-Negativfälle lokal erfolgreich. Isoliertes Testenvironment: Python 3.12, NumPy 2.5.3, SciPy 1.18.1, ecCodes-Python 2.49.0 mit eigener nativer Library. Keine produktiven Dependency-Ranges oder Interpreter geändert. Die Baseline erfasst native ecCodes-API, NumPy/BLAS-Konfiguration und relevante Threadzahlen; dies ist noch kein validierter Lockfile.
