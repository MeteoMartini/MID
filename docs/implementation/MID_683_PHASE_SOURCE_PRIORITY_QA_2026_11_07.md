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


## 3b. 247-Zell-Kaltcache-Parallelitäts-Regression (2026-11-07)

Der Native-RUC-Decoder erhielt in Draft #685 einen konservativen, auf **8 gleichzeitig aktive Original-Pages-Leseoperationen** begrenzten Datenweg. Er dedupliziert Original-Lookup-Indizes und hält die Positionen sämtlicher Rasterzellen stabil, statt bis zu 247 Lookup- und 247 Phasen-Record-Lesevorgänge strikt nacheinander abzuarbeiten. Ein deterministischer **13×19-/247-Zell-Test** mit künstlicher Latenz und jeweils separaten Original-Record-URLs prüft 493 native Datenabrufe, die 8er-Grenze, eindeutige Indizes, echten 0-Schnee, einen Missing-Lookup-Sentinel und dass außerhalb des veröffentlichten Phasenhorizonts **keine** weiteren Record-Abrufe erfolgen. Der Test prüft fachliche Invarianten und I/O-Verhalten, nicht die tatsächliche Cloudflare-P95-Laufzeit.

**Produktiv-Livebefund der öffentlichen Pages-Publikation:** Der inzwischen veröffentlichte **15Z-Lauf** (`generatedAt=2026-11-07T16:24:31.631100Z`) nutzt `pages-lossless-v1`, `productionEnabled=true`, `rapid.phase15` mit **265 komprimierten Blöcken**, 542040 Punkten, 25 gültigen Viertelstundenterminen 15:00–21:00 UTC. **Erweiterung: echte Pages-Originaldaten durch GitHub-Runner unabhängig gelesen, aber keine vollständige DWD-GRIB-Quellabnahme.** Der ausschließlich lesende Live-Readback [GitHub #42393897337](https://github.com/MeteoMartini/MID/actions/runs/42393897337) hat den originalen MID-Pages-15Z-Phase15-Blob anhand des öffentlich veröffentlichten `latest.json` und der unveränderlichen Run-Objekte entschlüsselt. Feldgültigkeit **16:45 UTC**, **9/9 native Innenzellen**, ergänzend **3 gültige Innenzellen und 6 NoData-Zellen außerhalb des echten Originalgitter-BBOX**, **kein** Phase15-Wert und **kein zusätzlicher Record-Read** nach Ablauf des sechsstündigen Phase15-Fensters. 9 tatsächliche Pages-Objektabrufe; GitHub-Runner-Walltime **1240 ms** einschließlich Metadaten, nicht Cloudflare Worker. Testcode `scripts/qa-ruc-native-phase-public-readback-0985446.mjs` unterliegt URI-Allowlist, 48-Objekt-/12MB-/40s-Grenzen und beachtet auch Source-HTTP-Deadlines. Die SHA-gebundene CI-Kette prüfte zusätzlich 247 synthetische native Zellen (493 gecappte Record-Reads) und komplette Typ-/OPERA-/Phasenregression. Es wurde **kein** Test aus `requiredRegressionTests` gelöscht, ergänzt oder abgeschwächt.

**NOT VERIFIED:** Die Vergleichsrechnung jedes Pages-Zellwerts gegen originalen DWD-GRIB2-Rohdatenlauf, tatsächliche vollständige 247-Zell-/Mehrregionen-/P95-Abnahme unter Cloudflare, 429-/Providerrealbetrieb und Nutzer-Endgeräte. Die hier gemessene 1240-ms-GitHub-Runner-Teilprobe ist ausdrücklich keine produktive P95-Laufzeit.

## 3c. Live-Originaldaten: vollständige 13×19-Karte (2026-11-07)

Der auf ausschließlich öffentliche MID-Pages-Daten begrenzte GitHub-Runner-Pilot [#42394324262](https://github.com/MeteoMartini/MID/actions/runs/42394324262) ist **SUCCESS auf Code-HEAD `615a4673ef3fc11ed4b8df5cdf46531d8c61b877`**. Er benutzt `scripts/qa-ruc-native-phase-public-readback-0985446.mjs` mit 40 s Gesamt-, 48 Objekt- und 12 MB pro Response begrenztem Readback und den kleineren, im Worker vorgesehenen HTTP-Abbruchsignalen. `main` und `mid-stable` werden nicht berührt; die Liveprüfung ist ausdrücklich keine Source-PR-/Installer-/Produktionsfreigabe.

Öffentliches `pages-lossless-v1`, Original-Lauf **2026-11-07T15:00Z**, Feld `2026-11-07T17:00Z`:

| Nachweis | Echter GitHub-Runner-Readback |
| --- | ---: |
| 13×19 = 247 reale Kartenrasterzellen in Westdeutschland | **247/247** gültige RUC-Phase-Original-Lookup-Zellen |
| Zusätzliche unveränderliche Objektabrufe für die reale Vollkarte | **21** |
| Reale 247-Zell-Lesephase nach zuvor gelesenen 9 Einheiten (teilweise aufgewärmter Cache) | **1015 ms** |
| Kompletter Live-Lesepilot inklusive Metadaten/Innen- und Außenränder und Vollkarte | **1864 ms**, **30** Objektabrufe |
| Abdeckungsrand | 3 Innenzellen gültig / 6 Koordinaten außerhalb der nativen Gittergrenze **NoData** |
| Ende der veröffentlichten Phase15-Zeitachse (25 Viertelstundentermine bis +6h) | Kein Phasenwert, keine weiteren Record-Requests |
| Bestehende adversariale 247-Zell-Kaltcache-Mocks | 493 Records, 8 gleichzeitig, Null und Missing getrennt |

**Interpretation:** Der 247-Zell-Abgleich weist für genau diesen veröffentlichten Pages-Lauf, dieses Gebiet und diesen Feldzeitpunkt die tatsächliche Verlustfrei-Decoder-/Lookup-/Feldwert-Kette nach. Dies ist eine **GitHub-Runner-Teilcache-Messung**, keine Cloudflare Worker-P95 unter realer Last, keine Messung echter Endgeräte, keine DWD-Original-GRIB2-Wert-für-Wert-Gegenprobe und keine formale Freigabe beliebiger anderer Regionen oder Laufwechsel. Werte dürfen nicht aus dieser Einzelprobe auf P95, ganz Europa oder weitere Läufe extrapoliert werden.

## 3d. P0 – Graupel nur bei eigenständigem Hydrometeor-Beleg

Im Review vom 07.11.2026 wurde eine meteorologisch unzureichend abgesicherte Inferenz entfernt: (1) `phaseFor` klassifizierte sehr kaltes, feuchtes Wetter mit hohem Niederschlag und tiefer Schneefallgrenze als „Graupel möglich“, auch ohne Graupel-/Hydrometeorfeld; (2) `radarBackedThermalPhase` wandelte einen unbekannten Phasentyp allein bei Feuchtkugeltemperatur bis −0,7 °C und Echo mindestens 17 dBZ in „Graupel“ um. Das ist **keine** belastbare Hydrometeor-Klassifikation.

**Quellen:** DWD, *PROMET 107 – Radarmeteorologie* (https://www.dwd.de/DE/leistungen/pbfb_verlag_promet/pdf_promethefte/107_pdf.pdf), Abschnitt zur Fuzzylogik und Schwierigkeit, Graupel und Schneeflocken anhand Radarstreuung zu trennen; NOAA NSSL, *Dual Polarized Radar* (https://www.nssl.noaa.gov/tools/radar/dualpol/), erläutert, weshalb alleinige Reflektivität keine Niederschlagsart eindeutig erfasst. Auch Polarimetrie verwendet zusätzliche Variablen/Algorithmen. **MID verwendet OPERA-Echo als getrennte Beobachtungsbedingung, nicht als autoritativen Graupeltyp.**

Der QA-Kandidat inferiert daher aus Thermik, Schneefallgrenze und Echointensität allenfalls vorsichtigen Schnee oder belässt die Phase **unbestimmt**. Ein tatsächlicher positiver originaler RUC-`graupel_water_equivalent`-Wert oder ein expliziter, gültiger Modell-Wettercode für Graupel/Hagel bleibt erlaubt. Neue adversariale Assertions prüfen 35 dBZ bei −2 °C ohne Graupelcode, den unveränderten echten RUC-Graupelpfad und explizite WMO-87-/89-Codes.

**Status:** wissenschaftlich begründete Korrektur mit deterministischen Regressionen; kein amtliches Radar-Hydrometeorklassifikationsverfahren, keine Warnung und kein neuer Produktivbuild.

## 3e. Echte D2-/EU-/Global-Provider-Randfälle (07.11.2026)

**GitHub-Runner [#42395439805](https://github.com/MeteoMartini/MID/actions/runs/42395439805) · Source-HEAD `07e217b4f2710e96845cc6005b6c0f5af16c120f` · SUCCESS.** Der kontrollierte, nur auf Draft-PR #685 aktive Live-Smoke-Test `scripts/qa-phase-provider-native-fallback-0985447.mjs` nutzte **fünf sequenzielle** öffentliche Open-Meteo-API-Abfragen mit pro Request 8 Sekunden, insgesamt 30 Sekunden Limit. Laufzeit der fünf reinen Providerabfragen auf dem Runner **666 ms**. Ein gebührenpflichtiger Dienst wurde nicht hinzugefügt.

| Anfragestandort | Modell-ID | Originaler Provider-Response | Phasen-Zeitsemantik |
| --- | --- | --- | --- |
| 50,8 N / 7,1 O (D2-intern) | `dwd_icon_d2_15min` | HTTP 200; Niederschlag 0 mm, Regen 0 mm, Schnee 0 cm; `weather_code=null` | 15-min-Achse, 17:00 UTC |
| 58,05 N / 7,1 O (innerhalb statischer D2-WKT-BBOX, außerhalb echter Datenmaske) | `dwd_icon_d2_15min` | **HTTP 400**, `No data is available for this location` | **NoData**, nicht Null und kein originaler D2-Phasenbeleg |
| 50,8 N / −4,5 O (westlich D2) | `dwd_icon_eu` | HTTP 200; 0 mm, WMO-Code 2 | Stundenachse 17:00 UTC, keine erfundene 15-min-Akkumulation |
| 40 N / −30 O (westlich EU) | `dwd_icon_eu` | **HTTP 400**, `No data is available for this location` | **NoData**, darf ICON Global nicht verhindern |
| 40 N / −30 O | `dwd_icon` | HTTP 200; 0,7 mm Niederschlag und Regen, 0 cm Schnee, WMO-Code 61 | Stundenachse 17:00 UTC |

Der reale Test prüft strikt die tatsächlichen Einheiten **Niederschlag/Regen mm, Schneefall cm**, Gültigkeitszeitachsen und 200-/400-Zellgrenzen. Der Fallback **D2 → EU → Global** und die Verlustfreiheit der RUC-Originalzellen werden zusätzlich durch deterministische Workerintegration und Original-Pages-Readbacks geprüft; ein **echter vollständiger 247-Zell-Open-Meteo-Worker-Cloudflare-E2E-Durchlauf** wurde noch nicht durchgeführt. Die API-Zeilen werden nicht als originäre DWD-GRIB-Läufe oder amtliche Warnungen bezeichnet.

Die ergänzende fachliche Korrektur gegen unbewiesene Graupel-Inferenz (Abschnitt 3d) und die adversarialen WMO-87-/89- sowie RUC-Graupelbelege bestanden auf exakt `07e217b4f2710e96845cc6005b6c0f5af16c120f` ebenfalls. Dieses grüne Pilotresultat bedeutet **keine** vollständige Source-/Heavy-/Browser-/Installer-/Stable-Freigabe.

## 3f. Unabhängiges Copilot-P0-Review und 1083er-Vollregressions-Vorabprüfung

Ein einmalig begrenztes lesendes Copilot-Review wurde über [Issue #693](https://github.com/MeteoMartini/MID/issues/693) gestartet. Der automatisch eröffnete [Copilot-Draft #694](https://github.com/MeteoMartini/MID/pull/694) ist **UNTRUSTED** und enthält keinerlei freizugebenden Code. Sein Befund wurde durch den autorisierten Source-Review unabhängig bestätigt: `midRucPhaseEnough` hatte positive, reale Original-RUC-Regen-/Schneephasen fälschlich abgelehnt, wenn das andere Hydrometeorfeld Missing war. Die neue Zulassungsregel akzeptiert **jede unabhängige positive Original-Hydrometeorphase** aus genau dieser Zelle und gültigen Zeit; ein einzelnes Nullfeld mit Missing-Geschwistern bedeutet dagegen keine bewiesene Trockenheit. Physikalisch negative Niederschlagsmengen werden als Missing behandelt, nie als 0. Vollständige Original-Nullfelder bleiben gültige echte Nullen.

Copilot bestätigte außerdem die offene operative Schranke: Bis zu 48 serielle D2-/EU-/Global-400-NoData-Provider-Untergruppen mit je 18 Sekunden Einzelzeitbudget vertragen sich nicht mit dem 28-Sekunden-Browserlimit. Der Kandidat führt daher zusätzlich eine **24-Sekunden-Gesamtschranke** für den Phasen-Workerrequest ein und begrenzt die Einzelanfragen dynamisch auf die verbleibende Zeit minus Reserve, bei unveränderten 48 Gesamt-/28 je Modellversuch. Das verhindert unbegrenzte weitere Provider-Abrufe; eine bereits laufende sehr langsame **native RUC-Leseprobe**, das endgültige Cloudflare-Worker-P95 und echte Browser-/Cache-/Rate-Last bleiben ausdrücklich **NOT VERIFIED**.

Der zunächst rein lesende vollständige Core-/Heavy-/Responsive-Vorabprüflauf [#42401861274](https://github.com/MeteoMartini/MID/actions/runs/42401861274) ergab auf dem vorherigen unveränderten Kandidaten bereits **Responsive/Web-Build SUCCESS**, während Core 1/4 und Core 4/4 **FAIL** meldeten: Die alten Source-String-Assertions verlangten einen ungerundeten RUC-Aufruf, pauschale `valid<90%`-Verwerfung, globale Batch-Größe und veraltete Modelllabels. Diese Annahmen sind mit der bereits verifizierten zellgenauen RUC/D2/EU/Global-Logik fachlich nicht vereinbar. Die bestehenden Regressionen wurden **nicht** entfernt, ausgeschlossen oder gelockert. Stattdessen prüfen sie die neue exakte 15-Minuten-Gültigkeitszeit, Original-Run-/ValidTime-Belege, nicht gefüllte `showers=NaN`, gültige Einzelzellen trotz anderer NoData-Zellen sowie die neue globale Zeit-/Aufrufschranke. Im Commit gelten diese Änderungen zunächst **UNVERIFIED bis zum erneuten exakt SHA-gebundenen vollständigen Lauf**.

## 3g. P0 – Stunden-Intervall-Ende der EU-/Global-Fallbacks statt vergangenem Fenster

Die [verbindliche Niederschlags-Intervallvereinbarung](../../MID_PRECIPITATION_INTERVAL_CONTRACT.md) trennt Roh-Endzeitstempel und sichtbaren Slotbeginn: `precipitation`, `rain`, `snowfall` von Open-Meteo zur Zeit `T` sind Mengen **im vorangehenden Quellenintervall**. Im bisherigen `midPhaseIndex` verwendete die Rasterphase für OPERA-Zeit **17:15** die vorangegangene Modellstunde **17:00**, deren Niederschlagsintervall **16:00–17:00** vollständig vor der Beobachtungszeit liegt. Dadurch konnte eine alte Niederschlagsphase im aktuellen Raster erscheinen.

**Korrektur:** Der Stundenfallback wählt streng den endgestempelten Modellwert mit `T−60min <= target < T` (z. B. Ziel **17:15 → Open-Meteo 18:00** mit Quellintervall 17:00–18:00). Am exakten Stundenübergang gilt der neue Slot: Ziel **17:00 → Quellende 18:00**. Fehlt der zugehörige Endstempel, bleibt die Zelle **NoData** und darf keinen abgelaufenen Stundenwert oder künstlichen Viertelstundenwert verwenden. Die RUC-/D2-15min-Quellen akzeptieren weiterhin ausschließlich `±90 s` native Feldgültigkeitszeit und bleiben strikt vorrangig. Je Zelle wird die tatsächliche **Intervall-Endzeit**, Quellen-ID und `phaseIntervalMinutesByCell=60` übergeben, nicht fälschlich ein 15-min-Originalzeitpunkt. Der Karten-Symbolrenderer prüft das maximale 60-min-Zeitfenster weiter.

**Deterministische Regression:** Endstempel 17:00/18:00/19:00 gegen Zielzeiten 16:45, 17:00, 17:15, 17:45, 18:00 sowie negative Fälle bei fehlenden Intervallen. Der bestehende echte D2-/EU-/Global-HTTP400-Fallbacktest benutzt denselben Zeitvertrag. **Offene fachliche Grenze:** Wettercode/Temperatur sind teils punktuelle Werte am Endstempel, während Niederschlag Stundenakkumulation ist; ein echter, feldspezifischer Lauf-/Thermik-Abgleich und Cloudflare-E2E bleiben vor Freigabe nötig. Keine amtliche Warnklassifikation.

## 4. Verbindliche Rest-Gates – NICHT ERFÜLLT

1. Nach bestandenem echtem 247-Zell-Pages-Readback für **ein** RUC-Gebiet/17Z weiterhin unabhängige DWD-GRIB2-Rohdaten-/Wert-Gegenprobe und echte Multi-Regionen-/Mehrlauf-/Rand-/ValidTime-Provider-Cross-Checks: D2 Nord/West/Süd, EU-only, Global-only, 15min-/hourly-Akkumulation, fehlende vs 0 und Schnee/Regen/Graupel, OPERA-Echo.
2. **Run-Lineage:** Provider-Metadaten vs konkrete Open-Meteo-Forecast-Row unabhängig vergleichen oder nicht belegbare Run-Behauptung im UI explizit entschärfen; niemals einen pauschalen Metadatenlauf als originalen per-Zell-Forecast-Run zertifizieren.
3. Praktische Cloudflare-Worker-Laufzeit, Backend-/Provider-Ratekosten, `28s` Client-Timeout, worst-case 400-Bisection und Cache/Stale-Path mit echten Messdaten; die deterministische Testumgebung ist kein produktiver P95-Nachweis.
4. Vollständige 1083+ Regressionen, Source/Kern/Heavy/Browser und Touch/Responsive 320/390/430/834/1024/1440, Light/Dark, Worker/Pages-Readback, Widgets/PNG/SVG. Keine physische iOS-/VoiceOver-Abnahme behaupten.
5. Parallel-PR-Konflikte: #480 berührt den Phasenrenderer, #636 die `unit-coverage`-Workflows; #684/#686 sind getrennte nicht freigegebene Original-RUC-/D2-Vollgebietsprüfungen.
6. Erst auf neuer vollständig verifizierter Basis synchronisierte Version/Changelogs für **tatsächlichen Build**; Source-PR-Gate → kontrollierter Bot-Merge → serverseitiges ZIP → `install-mid.yml` → Worker/Pages → Stable-Promotion. **Nicht** automatisch Ready, Mergen oder Publizieren, solange Abnahme fehlt.

**Freigabe:** BLOCKED. Kein Source-/Installer-/Worker-/Pages-Green, kein neuer produktiver Build und keine Stable-Promotion durch diese Dokumentation.


## 5c. NoData-Zellzulassung trotz abgeleitetem WW-Code (MID 18.2.78)

Auf QA-HEAD `cc80d44484798c0ea0b661c1d55c8eab4bd3e6ec` zeigte der Review, dass `weather_code=0` oder `71` bei gleichzeitig fehlenden `precipitation`, `rain` und `snowfall` eine D2/EU-Zelle als abgedeckt markieren konnte. Der Code kann ein abgeleitetes Open-Meteo-Signal sein und ist bei diesen fehlenden Mengen **kein** Nachweis einer nutzbaren Niederschlagsphase. Die zellbezogene Zulassung fordert daher mindestens einen numerisch endlichen, nichtnegativen Mengenwert. `null`/Missing bleibt Missing; echte `0` bleibt eine gültige trockene Mengenaussage. Eine Code-only-Zelle wird nicht als Modellabdeckung gezählt und kann im nächsten ICON-Fallback auf belastbare Phasenwerte treffen.

Die bestehende Baseline-Pflichtregression `scripts/test-radar-model-phase-reliability-09395.mjs` enthält dafür einen neuen funktionalen 13×19-Negativtest: D2 `weather_code=0/71` ohne jede Menge → EU-Evidenz, daneben D2 mit echten Mengen-Nullen bleibt D2; `sourceCounts`, Intervalle und phasenbezogene Werte werden geprüft. **Ergebnisse erst nach GitHub-CI auf endgültigem Kandidaten-HEAD ausweisen.** Keine Freigabe der Single-Runs-API, keine originale Open-Meteo-GRIB-Zellbehauptung und keine Source-/Installer-/Stable-Gates durch diesen gezielten Fix.


## 5d. RUC-Trockenbeweis benötigt vollständige native Phasenfelder (MID 18.2.78)

Unabhängiger Review auf dem vorigen QA-HEAD `7db0bc6ac5379b3cb215c8d063542d27e063bd2d`: Eine originale RUC-Zelle `rain=0, snow=0, graupel=Missing` erfüllte zuvor `liquid&&solid` und blockierte zellgenaue ICON-D2-/EU-/Global-Fallbacks. Der korrigierte sichere Vertrag trennt (a) eine beliebige eigenständig **positive originale** Regen-/Schnee-/Graupelphase als hinreichenden positiven Phasenbeleg und (b) eine nachgewiesen trockene **Gesamt**-Phase erst bei **allen drei unverfälschten Original-Nullwerten**. Teilweise trockene Phasenfelder mit einem fehlenden Geschwisterfeld bedeuten NoData; selbst echte Null anderer Felder darf Missing nicht auffüllen.

Die vorhandene obligatorische `scripts/test-ruc-native-phase-radar-098491.mjs`-Regression prüft alle partiellen Kombinationen einschließlich `[0,0,NaN]`, `[NaN,0,0]`, `[0,NaN,0]`, vollständiges `[0,0,0]` und positive Einzelphasen. Zusätzlich prüft ein deterministischer voller 247-Zellen-Worker-Integrationsfall den **wirklichen zellbezogenen Quellenentscheid**: vier RUC-Zellen mit positiver Originalphase oder vollständigen echten Nullen, alle 243 übrigen RUC-Teilnullen mit fehlendem Graupel → D2-Provider, unveränderte 15-min-Zeitintervalle, RUC-/D2-Provenienz und unterdrückte unnötige EU-/Global-Anfragen. Das ist eine programmatisch kontrollierte Schnittstellenprobe mit explizit **simulierten** Providerantworten, kein realer DWD-/Cloudflare-P95- oder überregionaler Live-Nachweis.

**Der vollständige GitHub-Pflichtlauf auf dem endgültigen SHA ist erneut erforderlich; ältere 4/4+6/6-Ergebnisse sind nicht übertragbar.** Keine produktive Veröffentlichung, keine synthetische Trockenheit, kein Hochstufen unbestimmter WMO-Phasen.
