# MID RUC · 18.11.2026 · P1 Upstream-EPS-Verzögerung: sofortiger Fehlabbruch und dauerhafte Fast-Lane

## Quellenstand und Schutzgrenzen
Integrationsbasis v0.9.85.491 (`3f9c5e24dc55fa5154732a1ba73961ba76c29788`). Der frühere QA-Handoff ist in PR #924 auf `chatgpt/v0.9.85.492-ruc-eps-fastfail` integriert. Source-, Review-, Installer- und Stable-Freigaben sind für den aktuellen Kandidaten erforderlich.

## Originalbefunde, nicht aus Testfixtures abgeleitet
- `44273381285` (18.11.09:11 UTC): neuester gemeinsamer DWD-RUC/RUC-EPS-Lauf 17.11.22Z, letzter Pages-RUC 17.11.07Z; sämtliche vier Kandidaten 22/21/20/19Z vor GRIB-Download wegen Original-240-Minuten-Frischevertrag verworfen.
- `44276493707` scheiterte auch nach dem .490-Train im calculate-Schritt; ursprüngliche DWD-EPS-Verfügbarkeit ist unabhängig vom Release zu klären.
- `44276819896` Observer meldet `directoryObserved=true`, aber `eps20ValuesVerified=false`, `gribHeaderOrValuesVerified=false`, `workerObservedValid=false`, `publicationAuthorized=false`. Ein grüner Observer beweist keine Datenfreigabe.
- DWD Originalverzeichnisse: `https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc-eps/p/TOT_PREC/r/` und `https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/T_2M/r/`; Index-Zeitstempel beweisen nicht den Zeitpunkt der letzten Vollständigkeit, Bitmap- oder EPS20-Werte.

## Dieser eng begrenzte Quell-Handoff
In `tools/ruc/check_ruc_schedule_guard.py` prüft `joint_run_expired` ausschließlich, ob **der neueste** gemeinsam beworbene DWD/RUC-EPS-Lauf sicher außerhalb des unverändert höchstens 240 Minuten großen Veröffentlichungsfensters liegt. Bei gültigen Pages-Metadaten hat dann kein älterer gemeinsamer Kandidat eine Chance auf neue Produktfreigabe. Der Scheduler protokolliert `should_run=false`, strukturierten Frischebefund, GitHub-`::error::`, und beendet die Vorprüfung mit nonzero, **vor ecCodes/pip, 560 EPS-GRIB-Downloads und Builder**. Der calculate-Job bleibt dabei bewusst **FAILURE**, `prepare`/Pages bleiben inaktiv; keine vermeintlich grüne Leerpublikation. Unbekannte/fehlerhafte DWD-Daten, Zeiten, Uhren, fehlende Pages- oder DWD-Metadaten bleiben konservativ bei ursprünglichem fail-open Decoder. Die `force`-Entscheidung und `reuse_run_id` des bestehenden Workflows werden nicht verändert. Kein zusätzlicher Dienst, Rechte- oder Gate-Eingriff.

`tools/ruc/test_ruc_schedule_guard.py` schützt UTC-DST-unabhängige Zeitgrenzen, 240-Minuten-Cap auch bei `max_age_minutes=600`, unplausible Originaldaten und die echte, gemockte main-Ausgabekette einschließlich exit code 1/Workflow-Metriken. Validierung: eigene lokale Logik-Smoketests 11/11 PASS; **vollständiger bestehender Python-RUC-Testlauf und MID Source/Core/Heavy/Installer/Worker/Pages müssen noch auf authorisiertem PR-HEAD erfolgreich laufen**.

## Nachhaltige Reparatur außerhalb dieses Ref-freien P1-Kandidaten
Der inzwischen produktionsunabhängig implementierte `ruc_fast_run_selector.py` und `ruc_fast_lane_producer.py` qualifiziert einen deterministischen +0…+6h-Lauf **ohne** EPS. `ruc_fast_pointer_staging.py`, `ruc_fast_cas.mjs` und `ruc_fast_consumer_shadow.py` sind bewusst inaktiv (kein Live-Pointer). Nächster fachlicher P2-Release-Schritt: DWD-native GRIB-Headers/Bitmap/GRIB-values/Originalwerte, NoData, Akkumulation, 5-/15-min-Takt, UTC und Raster-SHA verifizieren; ursprüngliche 27h-/EPS20-Pipeline erhalten, eigene atomare `/ruc/fast/*`-Ablage und getrennte verified Consumer-Aktivierung im bestehenden SHA-/CAS-/Pages-/Worker-Budget. Ungültiger/fehlender EPS darf nie 0 %, 0 mm oder offizielle Warnung liefern. Ein Fast-Snapshot ist kein vollständiges EPS20- oder 27h-Produkt; kein unüberprüftes Verschmelzen verschiedener DWD-Initialisierungen.

## Abnahme
1. Eigenen QA-Handoff nicht direkt auf `main`/`mid-stable` übertragen; Ruleset-User/Admin-Bypass verboten. Exaktes Parent-SHA verifizieren, parallel laufende #541/#746-Arbeit abstimmen.
2. Quelle/Tests auf separatem autorisiertem Branch aufnehmen, Versionsspiegel und unveränderte Schutzregeln prüfen. Test: abgelaufener gemeinsamer Lauf gibt schnell nonzero und keine Publikation; frischer Lauf durchläuft den originalen Decoder; unknown fällt konservativ auf bisherigen Ablauf zurück.
3. Vollständiges Source-Gate → kontrollierter SHA-Merge → serverseitiges ZIP → `install-mid.yml` → betroffene Worker-/Pages-Gates → Stable. RUC-Originaldatenfreigabe und physische 900MB-Grenze bleiben separat.
