# MID 18.2.44 – RUC-Kartenpilot (nicht veröffentlicht)

## Identität und Scope
- Ausgangs-SHA: `438bfb7838a727ad8753940872c8b8ab140bb7c2`, Version `v0.9.85.304`; `main=mid-stable`.
- Issues: #350 (native Karten), #352 (Codec/Budget), #405 (+27-h-Provider). Parallel-Draft-PR #425 bleibt unabhängig und unverändert.
- Diese Arbeit ist ein isolierter **Entwicklungs-/Testpilot**, **kein MID-App-Build**, keine produktive RUC-Modellkarte und keine Erweiterung der 0–14-h-Prognose. Deshalb bewusst **keine Änderung der Versionenspiegel**. Vor einem tatsächlichen App-Build gelten alle bestehenden Versions-/Release-Gates.

## Implementierung
`tools/ruc/build_native_map_pilot.py` arbeitet offline auf einem zuvor vollständigen DWD-RUC-Bundle (unkomprimierte Quellassets `deterministic.bin`, `lookup.bin`, `latest.json`). Ausschließlich neue, separate Ausgabeverzeichnisse zulässig. Keine Änderung an Original-/Rollback-Snapshot, Forecast-Fusion, Scheduler, Worker, Pages, Produktionsmodellkatalog oder Produktanzeige.

Erste Felder: **T2m (°C)** und **MSL-Druck (hPa)**. Das DWD-RUC-Gitter bleibt als unstrukturiertes Quellgitter benannt; die Anzeige basiert auf dem existierenden verifizierten geographischen Lookup mit **Nearest-Neighbor-Sampling** (max. 5 km), **nicht** auf einem neu berechneten nativen DWD-Raster. Keine bilineare Glättung. Der Pilot konserviert `null` aus `int16=-32768` und ungültigem `uint32=0xffffffff`; eine echte numerische 0 bleibt 0. Quantisierte Kernextrema und gesampelte Extrema werden getrennt ausgewiesen; ungesampelte oder bereits vor dem Pilot quantisierte Original-GRIB-Extreme können fehlen und dürfen nicht als wiedergegeben behauptet werden.

Ausgabe: eigenständiges `mid.ruc.native-map-pilot.v1`-Manifest mit `productionApproved:false`, Run/UTC-Gültigkeit/Lead, Units/Scale, Originalquell- und Lookup-SHA256, pro Frame Wire- und Decoded-SHA256, Byte-/Pixel-/Geometrieschranken, Maskierung und klarer DWD-/Sampling-Provenienz. Eingabe-`objects`-Hashes und Byte-Längen werden vor Ausgabe verifiziert; bei Verstoß fail closed. Keine amtlichen Warnungen und keine Wetterbeobachtung daraus ableiten.

## Prüfnachweise und Einschränkungen
- Lokal: `python -m unittest discover -s tools/ruc -p test_native_map_pilot.py -v` → **3/3 Tests erfolgreich**, einschließlich Testfälle für Missing≠0, Zeit-Lücken, falsche Units, beschädigte Geometrie und native Objekt-Hashes. Verzeichnis nicht überschreibbar.
- Synthetischer Performance-Pilot 542.040 native Punkte, 15 Stunden, 12 Core-Felder, 132.840 Zielpixel: 30 gzip-Frames, 7.724.018 Byte in 3,32 s. **Keine reale DWD-/Pages-/Browser-Budget-Validierung**.
- Source-Gate: neue Pflichtprüfung zu `test_fetch_resilience.py` in kanonischem `ci/github/workflows/chatgpt-pr-gate.yml`, synchroner .github-Mirror; `npm run sync:github-workflows` lokal: kein Drift.
- Bereits produktive **verlustfreie Vollkompression** in RUC-Run #39481092660 bestätigt; 2.252 Quellbestandteile, ~319,9 MB RUC, ~379,8 MB inklusive Pages-Site, Worker-Health erfolgreich. Nicht doppelt neu implementieren.
- Isolierter DWD +27-h-Canary (#425, Run #39387938882): drei komplette DWD-Laufverzeichnislisten, einzelne GRIB-/Numerikstichproben positiv; Open-Meteo-ID `dwd_icon_d2_ruc_native` HTTP400 und somit nicht frei. DWD +27 h ist **kein** freigegebener neuer Prognosehorizont.

## Offene Gates vor einer echten RUC-Karte oder +27-h-Aktivierung
1. Vollständige reale DWD-GRIB-Lauf-/Zeit-/Einheiten-/Bitmap-/Extremwert- und Land/Wasser-/Gitterkanten-QC über alle Felder und +15…+27 h; EPS separat behandeln, bleibt bisher +14 h.
2. Native Geometrie/CRS/Reprojektion fachlich prüfen, Nearest-Neighbor-Abdeckung und Extreme gegen GRIB verifizieren, originalen DWD-Lauf im Artefakt sicher belegen.
3. Frontend/Worker-Dekoder, sichere komprimierte Übertragung, Karten-/Modellauswahl, PNG/SVG, Widgets, Light/Dark, Mobile/Tablet/Desktop, WCAG 2.2 AA und echte iOS-Geräteprüfung soweit verfügbar.
4. Byte-/Quota-/Latenz-/Frische-/Fallback-/Abbruch- und Browser-/WKWebView-Tests am vollen Produktionsinventar. Keine Verlust-/Datenlücken-/Nullwert-Auffüllung.
5. Bei erstem **wirklichen Release** synchronen Versionssprung, Changelog, vollständiges Source-PR-Gate, kontrollierten Bot-Merge, serverseitiges ZIP, Installer, Worker-/Pages- und Stable-Promotion durchführen.

**Dieser Pilot ist nicht produktionsreif.** Ohne obige Evidenz nicht in den MID-Kartenkatalog einhängen und Draft-PR nicht zur Freigabe setzen.
