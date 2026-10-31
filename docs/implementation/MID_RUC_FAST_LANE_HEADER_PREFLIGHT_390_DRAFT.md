# MID #541 · RUC 0–6h/0–14h – echtes GRIB-Header-Preflight (Draft)

**Stand:** 31.10.2026 · **Arbeitsbasis** `main=mid-stable` v0.9.85.389 @ `6e449be3baf13e9c33ec206864189dd4b580d482`. **Nicht veröffentlicht.**

## Bereits produktiv

- v0.9.85.388: schreibgeschützter 15-min-DWD-Verzeichnisbeobachter und Pages-/Worker-Readback, ohne Erstpublikations- oder GRIB-Zulassungsbehauptung.
- Vollständiger DWD RUC 0..27h / EPS20 / 900-MB-Pages-Codec / Worker-/Pages-Readback bleibt unangetastet.
- Zwei Scheduler-Slots, GitHub- und Cloudflare-Watchdog und atomarer RUC-Releasepfad existieren bereits; nicht als echte datengetriebene P4-Single-Flight implementiert.

## Neuer, unabhängiger P1/P2-Qualifikationsbaustein

`tools/ruc/fast_lane_grib_preflight.py` prüft *bereits lokal gestagte, echte* DWD-GRIB2-Header für exakt 0..+6h oder 0..+14h. Die Standard-CLI ruft den bestehenden ecCodes-Headervertrag auf: GRIB2, DWD-Zentrum 78, Initialisierung, Gültigkeit, nativer RUC-Gitter-Fingerprint, feste GRIB-Flächen-/Parametertypen, Akkumulationssemantik. Zwölf deterministische Felder müssen alle stündlichen ValidTimes erfüllen. EPS TOT_PREC wird **separat** auf alle 20 nummerierten Mitglieder zu jeder ValidTime geprüft; CLAT/CLON-Header bilden einen dritten unabhängigen Status. Nachweisdateien erhalten GRIB-Bytes und SHA256 je Quelldatei. Alle Fehlerfälle einschließlich fehlender Stunden und EPS-Mitglieder bleiben Missing statt 0. Das Werkzeug lädt nichts aus dem Netz, sendet keine Dispatches und publiziert nichts.

Auf bereits geprüftem originalem DWD-Staging:
```bash
python tools/ruc/fast_lane_grib_preflight.py \
  --staging /secure/read-only/staged-run \
  --run 2026-10-31T18:00 --hours 6 \
  --output /secure/new/fast-lane-headers.json
```
Den letzten Laufzeitstempel und Pfad **nicht** blind übernehmen. Der Input muss tatsächlich aus diesem Run stammen. In der neuen Datenpipeline vor produktiver Verwendung zusätzliche SHA-gebundene, authentifizierte Producer-Lineage und unveränderliche Objekt-Identität prüfen; eine nachträgliche Selbstdeklaration reicht nicht. Der Output wurde absichtlich nicht in den produktiven Pointervertrag integriert.

`tools/ruc/test_fast_lane_grib_preflight.py` enthält adversarielle Offline-Fälle (6h/14h, einzelne fehlende Stunden/Felder, 20-EPS-Fehlstellen, Duplikate, unerlaubte Member, Lauf-/Koordinatenmischung, Symlink, falsche Feldliste, Header-Beweis ohne Publikationsrecht). In kanonischer und aktiver Telemetrie-PR-Qualifikation aufgenommen; ein grüner Unit-Test ist **keine** reale GRIB-Wert-/Bitmap-/EPS-Abnahme.

## Verbindlich offene P1–P5-Gates

1. **P1** echte, wiederholte DWD GRIB-Datei-/Header-/Wert-/Bitmap-Verfügbarkeit über mindestens 168 aufeinanderfolgende Initialisierungen und Beobachtungsfenster; zensierte Stichproben korrekt ausweisen. Der neue Header-Preflight ersetzt dies nicht.
2. **P2** separat versionierter RUC-Fast-Lane-Producer, SHA-gebundene atomare Veröffentlichung, unabhängiger Namespace/Pointer und vollständige kompatible Web-/iOS-/Widget-/Export-Fusion. Kein EPS-Pseudovollstand, keine gemischten gültigen Intervalle.
3. **P3** GRIB-Cache und native Koordinaten nur nach echtem Fingerprint und vollständigem CPU-/RAM-/RUC-Bytebudget-A/B; keine Wegnahme bestehender Daten oder Tests.
4. **P4** GitHub/Cloudflare Single-Flight gegen *authentisch* vollständig geprüfte neuere Quellen; Cancel-/Queue-/Watchdog-/Race-/Quota-/Recoverytests. Alle bestehenden externen Rechte und Secrets unverändert.
5. **P5** reale 168h-Serien über DWD→Build→SHA→Pages→Worker→Client einschließlich Widgets/Export, keine aus synthetischen oder beobachteten Upper Bounds abgeleiteten 60-min-SLO-Zusagen.

**Fail-closed:** Es gibt keinen Fast-Lane-Deploy, keinen neuen kostenpflichtigen Dienst, keine Änderungen am 27h-Kern, keine RUC-Datenveröffentlichung und keine erteilte Freigabe zum Stable-Promotion. Draft bleibt isoliert. Späterer Live-Release verlangt neue Version/Spiegel/Baseline sowie vollständigen MID Source-PR→SHA-Bot→Server-ZIP→Installer→Worker/Pages→Stable-Pfad.
