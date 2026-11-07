# MID #683 – Niederschlagsart: Quellenpriorität und SHA-gebundene Vorab-Qualifikation

**Stand:** 2026-11-07, **QA-DRAFT / NOT RELEASED / NO MERGE**. Unveränderte produktive Source of Truth `main=mid-stable`, Version `v0.9.85.445`, vollständiger SHA `b6526e7c5c24035bd1a75b87b77e7bb8e821c334`. Candidate des Draft-PR #685 bei dieser fachlichen Prüfung: `c5f909df0949a463e824b3d0f47218cb31469d0e`. Die Bezeichnung `.446` im Branch ist **keine** veröffentlichte Version. Der zusätzliche Dokumentationscommit ändert keine Runtime-Quelle und ersetzt keine erneuten Gates auf dem endgültigen HEAD.

## 1. Fachlicher Vertrag und Quellen

Im Kartenlayer `Niederschlagsart` entscheidet **jede gültige Rasterzelle zum gewählten Zeitpunkt** getrennt: (1) originale MID-Pages/DWD ICON-D2-RUC-Phase15 samt nativer Lookup-Maske, (2) Open-Meteo-ICON-D2-15min, (3) Open-Meteo-ICON-EU hourly, (4) Open-Meteo-ICON Global hourly. Die Open-Meteo-Adapter sind *keine originalen DWD-GRIB-Zellwerte*. Ein geografisches BBOX dient nur der **Vorauswahl**, nicht als Originalzellen- oder Phasenbeleg. OPERA-Radarreflektivität ist ein eigenständiger Beobachtungsbeleg; Symbole benötigen zusätzlich belastbare modellbasierte Phasenevidenz. Keine Gleichsetzung mit amtlichen Warnungen und kein Erfinden von Hagel, Graupel oder gefrierender Phase aus Missing.

Die 15-Minuten-Werte für `precipitation`/`rain` sind in **mm** für die vorangegangenen 15 Minuten. `snowfall` ist **cm**, kein mm-Schneewasseräquivalent; die Größe darf nicht unmittelbar mit `rain` verglichen werden. Vorangegangene stündliche EU-/Global-Summen sind weder native Viertelstundenwerte noch Beleg für den exakten 15-Minuten-Zeitschritt. Missing/NaN ist nie echte Null.

## 2. Originaldaten- und Anbieterbelege, Stichprobe vom 2026-11-07

### MID Pages / echte RUC (öffentliches `https://www.midwx.app/ruc/latest.json`)

Geprüfter Snapshot: `run=2026-11-07T14:00Z`, `generatedAt=2026-11-07T15:38:39.609487Z`, `pointCount=542040`, `schema=mid.dwd.ruc.grid.v2`, `storageProfile=pages-lossless-v1`. **Deterministische stündliche Daten:** 28 Zeitpunkte über +27h; **separates `rapid.phase15`:** 25 Zeitpunkte von 14:00 bis 20:00 UTC, also 6h. Die Phase darf **nicht** bis +27h fortgeschrieben werden. Feldvertrag: `rain`, `snowfall_water_equivalent`, `graupel_water_equivalent`, alle mm mit Skala 0,001. Nur Original-Lookup-Index und gültige Feld-/Run-/Validzeit erlauben nativen RUC-Status; der öffentliche Metadatensatz ist **kein** Beweis, dass jede angefragte Originalzelle einen gültigen Wert hat. Die drei originalen GRIB-RUC-Probezyklen aus PR #684 betreffen andere Läufe; sie sind kein Zellreadback dieses 14Z-Snapshots.

### Open-Meteo ICON (Provider-Daten, **nicht** DWD-Originalzellen)

Getestete öffentlichen, kostenlosen API-Single-Point-Readbacks auf 50,8° N / 7,1° E mit denselben `models`- und `start_*`/`end_*`-Parametern wie der Worker:

| Modell | Provider-ID | Live-Rückgabe | WGS84-Modellgitter-BBOX aus `static/meta.json` (lat/lon) | Beleg |
| --- | --- | --- | --- | --- |
| D2 15min | `dwd_icon_d2_15min` | HTTP 200, 16:00–17:00 UTC, 15-min, `precipitation/rain=0`, `snowfall=0`, `weather_code=null` | S 43,18; W −3,94; N 58,08; O 20,34 | `/data/dwd_icon_d2_15min/static/meta.json` |
| ICON-EU | `dwd_icon_eu` | HTTP 200, 16:00–18:00 UTC, hourly, Wettercode 3 | S 29,5; W −23,5; N 70,5; O 62,5 | `/data/dwd_icon_eu/static/meta.json` |
| ICON Global | `dwd_icon` | HTTP 200, hourly, Wettercode 3 | S −90; W −180; N 90; O 179,75 | `/data/dwd_icon/static/meta.json` |

Die gesampelten Provider-Metadaten-Initialisierungen laut `last_run_initialisation_time`: **D2 15Z, EU 09Z, Global 06Z** am 07.11.2026. Dies sind **Metadatenstände zum Abrufzeitpunkt**, keine verbindliche SHA-Bindung jedes zurückgelieferten API-Werts an denselben ursprünglichen Modelllauf. Der Forecast-Endpunkt kann aktuell fortlaufend aktualisiert werden; eine echte per-Zelle-Run-Zuordnung ist **NOT VERIFIED** und vor Release unabhängig zu beurteilen.

Die D2-API antwortete für die außerhalb der BBOX liegende Einzelkoordinate 50,8° N / −4,5° E mit **HTTP 400 `No data is available for this location`**. Eine gemischte Multi-Koordinatenabfrage kann vollständig scheitern; eine gültige Abfrage mit Koordinaten innerhalb der BBOX lieferte dagegen einen JSON-Array-Readback. Daher isoliert der Kandidat ausschließlich den expliziten Coverage-400-Fehler durch begrenzte, sequentielle Teilgruppen; 429/5xx werden nicht blind erneut abgefragt. Der dynamisch geparste echte WKT-BBOX schließt auch die D2-Nordrandzelle bei **58,05° N** ein. Das Raster und die nativen Originallookups bleiben von dieser Vorauswahl logisch getrennt.

Quellendokumentation: https://open-meteo.com/en/docs/dwd-api (Datenquellen, räumliche/zeitliche Auflösung, Modellvariablen und abgeleitete WW-Felder), https://open-meteo.com/en/docs (15-Minuten-Akkumulation).

## 3. Kandidatenkorrekturen und QA-Status

- `dbcc681f199b1cb6f84481f3f95776c1569aa8a4`: D2-Regen/Schnee/Mischphase bei fehlendem Wettercode und fehlender Thermik; 11 zusätzliche adversariale Assertions, keine unbelegte gefrierende Phase.
- `c04f3e92781b3a5934d5a545292dbb81606c376a`: Original-Provider-HTTP-400-Randlöcher sequenziell isolieren; maximal 28 Requests je Modellversuch, 48 insgesamt; gültige Zellen und Fallbacks erhalten.
- `c5f909df0949a463e824b3d0f47218cb31469d0e`: WGS84-Anbieter-BBOX nur zur Request-Vorauswahl, echte D2-Nordzellen bei 58,05° N nicht künstlich ausschließen; ergänzter dynamischer D2/EU-Randtest. Generierte `worker.js` und `worker/metar-proxy.js` bleiben byteidentisch.

GitHub [Pilot-CI #42391594135](https://github.com/MeteoMartini/MID/actions/runs/42391594135) auf exakt `c5f909df0949a463e824b3d0f47218cb31469d0e`: **SUCCESS**. Die bestehende `unit-coverage`-Kette prüft Vitest, Native-RUC-Phasenregression, per-cell-RAPID/D2/EU/Global-Zustände samt 400-Isolierung, OPERA-Kombinationsgrenzen, TypeScript und CI-/Workflow-Integrität. **Skips in anderen Workflows sind keine grünen Freigabegates**. Für den jetzigen Dokumentationscommit ist erneut der neue SHA zu prüfen.

## 3a. Zusätzlicher Run-Pinning-Readback (nur Forschung, kein Produktivpfad)

Die offizielle Open-Meteo-Dokumentation https://open-meteo.com/en/docs/single-runs-api bestätigt: Der reguläre Forecast-Endpunkt ist eine kontinuierlich aktualisierte Zeitreihe; eine exakte Modellinitialisierung ist über **`single-runs-api.open-meteo.com/v1/forecast?run=YYYY-MM-DDTHH:mm`** separat abrufbar. Die verifizierten Nur-Lese-Einzelabfragen ergaben am 07.11.2026 jeweils **HTTP 200** für **D2 15Z** (8 Viertelstundentermine 15:00–16:45 UTC), **ICON-EU 09Z** (10 Stunden 09:00–18:00 UTC) und **ICON Global 06Z** (14 Stunden 06:00–19:00 UTC). Beim ersten D2-Zeitpunkt war die Niederschlagsmenge **Missing**, nicht Null; darauf folgten echte Nullen. Das erlaubt eine unabhängige, präzise Referenz auf Archivläufe für künftige wissenschaftliche Vergleiche.

**Nicht gleichwertig zum bestehenden Live-Request:** Die Single-Runs-API lehnte `start_minutely_15` mit HTTP 400 ab, `forecast_minutely_15=8` wurde akzeptiert. Antworten/Leistung, individuelle Run-Verfügbarkeit, Kosten-/Nutzungsrechte, Rate-Limits und zeitlicher Zuschnitt müssten für 247 Zellen, Modellwechsel und Browser getrennt geprüft werden. Es fand **keine** produktive Umschaltung, kein neuer Dienstvertrag und keine pauschale Run-Bestätigung statt.

Der Karten-Popup-Text unterscheidet im QA-Kandidaten nun ausdrücklich **RUC-Originallauf** von **Open-Meteo-Metadatenlauf (Feldlauf nicht zellverifiziert)**. Weder der Metadatenzeitpunkt noch ein punktueller Archivreadback werden zur unbelegten originalen Quelle hochgestuft.

## 4. Verbindliche Rest-Gates – NICHT ERFÜLLT

1. Vollständige, echte räumlich-zeitliche Originaldaten-/Provider-Zellmatrix: RUC innerhalb/außerhalb originaler Masken, 15min-Endgrenze, D2 Nord/West/Süd, EU-only, Global-only, gültige 0 vs fehlend, Schnee/Regen/Graupel, Runwechsel, Zeitintervalle, Radar-OPERA-Echo.
2. **Run-Lineage:** Provider-Metadaten vs konkrete Open-Meteo-Forecast-Row unabhängig vergleichen oder nicht belegbare Run-Behauptung im UI explizit entschärfen; niemals einen pauschalen Metadatenlauf als originalen per-Zell-Forecast-Run zertifizieren.
3. Praktische Cloudflare-Worker-Laufzeit, Backend-/Provider-Ratekosten, `28s` Client-Timeout, worst-case 400-Bisection und Cache/Stale-Path mit echten Messdaten; die deterministische Testumgebung ist kein produktiver P95-Nachweis.
4. Vollständige 1083+ Regressionen, Source/Kern/Heavy/Browser und Touch/Responsive 320/390/430/834/1024/1440, Light/Dark, Worker/Pages-Readback, Widgets/PNG/SVG. Keine physische iOS-/VoiceOver-Abnahme behaupten.
5. Parallel-PR-Konflikte: #480 berührt den Phasenrenderer, #636 die `unit-coverage`-Workflows; #684/#686 sind getrennte nicht freigegebene Original-RUC-/D2-Vollgebietsprüfungen.
6. Erst auf neuer vollständig verifizierter Basis synchronisierte Version/Changelogs für **tatsächlichen Build**; Source-PR-Gate → kontrollierter Bot-Merge → serverseitiges ZIP → `install-mid.yml` → Worker/Pages → Stable-Promotion. **Nicht** automatisch Ready, Mergen oder Publizieren, solange Abnahme fehlt.

**Freigabe:** BLOCKED. Kein Source-/Installer-/Worker-/Pages-Green, kein neuer produktiver Build und keine Stable-Promotion durch diese Dokumentation.
