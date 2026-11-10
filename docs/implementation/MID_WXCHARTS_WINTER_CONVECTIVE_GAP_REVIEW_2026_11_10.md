# MID – fachlicher WXCharts-Abgleich: Winter Overview und Convective Overview

**Datum:** 10.11.2026 · **Referenz:** publizierte MID-Stable `v0.9.85.454`, `main=mid-stable=ee7a55b5ece4d3d3687202a95caeb6c5ff615055` · **Koordination:** MID-Karten Issue #724, Sammel-PR #745 · **Unveröffentlichter QA-Draft:** #748.  Dieses Dokument ist eine **unabhängige Quellen- und Funktionsprüfung**, keine Freigabe, Produktänderung oder Reproduktion fremder WXCharts-Darstellungen.

## Tatsächlich belegter Vergleich

WXCharts listet aktuell die Kartenfamilien **Winter Overview**, **Convective Overview**, **Snow Depth**, **CAPE** und **Bulk Shear** sowie Modellwahl von ECMWF, GFS, UKMO, GDPS, ICON-EU u. a. als unterschiedliche Produkte. Die öffentlich dokumentierte (ältere) WXCharts-Chartbeschreibung kennzeichnet beim Winter-Überblick Regen, Schnee, Graupel, gefrierenden Regen und Schneehöhe; bei Convective Overview CAPE und vertikale Bulk Shear für kleinere Räume bzw. 500-hPa-Geopotential in größeren Regionen. Allein aus dem Menü folgt **nicht**, dass jedes Modell jede dieser Felder/Zeiten/Regionen abdeckt. Nachweise:

- Aktuelle Produktauswahl: <https://www.wxcharts.com/>
- Historische ausführlichere Produktbeschreibung v1.0.25 (nicht als neue Laufzeit-Messung ausgeben): <https://wxcharts.com/?chart=overview%2C850temp%2Cwind10mkph%2Csnowdepth&lat=51.500&lon=-0.250&model=gfs%2Cgfs%2Cgfs%2Cgfs&panel=default&plottype=10&region=europe&run=00&skewtstep=0&step=003>
- Rechte: <https://cdn-eu.metdesk.com/wxcharts/terms-of-use.html>. **Keine Übernahme/automatisierte Einbettung von WXCharts-Bildern, Daten, Kacheln, Code oder Logos.** Eigene Wetterprodukte ausschließlich aus separat qualifizierten Originaldaten aufbauen.

| Aussage | WXCharts Winter/Convective | Tatsächlicher MID-Saisonstand im geprüften Code auf Sammel-PR #745 | Lücke und Zulassungsbedingung |
| --- | --- | --- | --- |
| Winter-Niederschlagsarten | Regen / Schnee / Graupel / gefrierender Regen (modellabhängig) | 1-h **Gesamt**niederschlag ohne Phasentrennung | `WW` bzw. unabhängig validierte originale Regen-/Schnee-/Graupel- und Gefrierregenfelder; WMO-Codes und Phasen nur nach Originalsemantik, keine Ableitung aus T2M allein |
| Schneelage | Snow Depth | Nicht enthalten; 2-m-Isothermen sind **keine** Schneefallgrenze | `H_SNOW` in m nach Einheit/Provenienz prüfen und in cm umrechnen; Schneehöhe ≠ Neuschnee ≠ SWE |
| Modellierter Neuschnee | Schneefall-/Schneehöhenprodukte | Nicht enthalten | `SNOW_GSP` + `SNOW_CON` nur mit nachgewiesenem stepType / SWE- vs. Tiefensemantik und Modellintervall; keine pauschale 10:1-Umrechnung |
| Konvektive Umgebung | CAPE in J/kg und Bulk Shear in kt (regionabhängig) | 1-h Niederschlag + 10-m-Böenisolinen | `CAPE_ML` in J/kg sowie eigenständig geometrisch/zeitlich qualifizierte 0–6-km-AGL-Vektorscherung; 10-m-Böen **ersetzen keine** Windscherung |
| Konvektive Hemmung und LPI | Gesondert modellabhängige Konvektionsfelder | Nicht enthalten | `CIN_ML`, `LPI`/`LPI_CON_MAX` als **Potenzialdiagnostik**, nicht Blitzanzahl, Gewitterhäufigkeit oder amtliche Warnung |
| Wetterkartenstatus | Quelle/Modell/Region/Termin auswählbar; Ensemble und deterministische Produkte getrennt | MID D2-Saisonpaare, modellseitige Erweiterung noch unqualifiziert | Pro Parameter und Modell nur genaue gemeinsame `model/run/validTime/grid/statistic` anzeigen; fehlend sichtbar und nie durch anderes Modell still ersetzen |
| Bedienelemente | Auswahl-/Timeline-/Regions-/Einheiten- und Favoritenkonzept | MID-Karte/Timeline/Persistenz/Export bereits vorhanden | Bestehende MID-Bedienung weiterverwenden, keine Layoutkopie; Qualitäts-, Warn- und Quellenstatus appweit konsistent halten |

**Produktbezeichnung:** Solange diese meteorologischen Bestandteile fehlen, sind die erklärenden MID-Texte **„1-h-Gesamtniederschlag + 2-m-Isothermen“** bzw. **„1-h-Gesamtniederschlag + Böenmaximum“** richtig. Die Labels „Winter & Berge“ / „Sommer & Gewitter“ allein dürfen **nicht** vollständige Schneewetter-/Gewitterdiagnostik suggerieren. Eigene Potenzialkarten sind ausdrücklich von DWD-Warnungen zu trennen.

## Live belegtes DWD-Originaldateninventar (kein GRIB-Header-/Pixelnachweis)

Auf den offiziellen DWD-Open-Data-Verzeichnissen <https://opendata.dwd.de/weather/nwp/icon-d2/grib/00/> und <https://opendata.dwd.de/weather/nwp/icon-eu/grib/00/> wurden am 10.11.2026 für Lauf `2026111000` die folgenden **Dateinamen und Verzeichnislisten** überprüft:

- ICON-D2: `h_snow` und `cape_ml` je **98 Dateinamen**, jeweils **49 auf `germany_icosahedral` und 49 auf `germany_regular-lat-lon`**, T+0..T+48 h. `ww` **96** (je 48 pro Gitter, T+1..T+48). `grau_gsp` ebenfalls im Verzeichnis, aber ohne dekodierte Datenvalidierung.
- ICON-EU: `h_snow`, `cape_ml`, `ww` und `snow_gsp` je **93 Dateien** im veröffentlichten `europe_regular-lat-lon`-Dateisatz, T+0..T+78 **stündliche Ausgabestempel**, danach T+81,+84,…,+120 **dreistündliche Stempel**. Gleiche Datei-/Lead-Menge bedeutet noch keine nachgewiesene Rasteridentität.
- Weitere Feldverzeichnisse im DWD-Index: ICON-D2 `cin_ml`, `rain_gsp`, `rain_con`, `snow_gsp`, `snow_con`, `lpi`; ICON-EU `cin_ml`, `rain_gsp`, `rain_con`, `snow_gsp`, `snow_con`, `lpi_con_max`. Diese Felder sind **Inventar-Optionen**, keine erprobten Bestandteile.
- Der DWD-ICON-EU-Zyklus `2026111000` wird veralten. Eine Offline-QA darf bei entfernten Dateien kein erfolgreiches Ergebnis behaupten oder unbemerkt andere Läufe mischen. Ein neuer beobachteter Lauf benötigt neuen datierten Provenienznachweis.

**Wichtige Sperren:** D2-ikosaedrische Raster und D2-regular-lat-lon-Raster sind nicht dasselbe Koordinatenfeld; kein stilles Verschneiden. ICON-EU `TOT_PREC` ist kumuliert, stündlicher Niederschlag benötigt verifizierte Original-Endpunkte; nach +78 h keine fingierte stündliche Phase/Summe. `VMAX_10M` ist ein Maximum im **GRIB-validierten** Zeitraum. Missing Data ≠ 0, negative Akkumulationsresets und Feldausfälle maskieren, Extremwerte nicht glätten.

## Neu: reproduzierbarer, streng nicht-produktiver Inventarprüfer

`tools/ruc/qa_dwd_seasonal_source_inventory.py` prüft **nur Original-DWD-HTML-Dateinamen** als Vorstufe für die beiden Kartenfamilien. Das Werkzeug unterscheidet native/reguläre Gitter, prüft den exakt gepinnten Lauf, bildet die gemeinsame Dateiterminmenge und verlangt bei kumuliertem Niederschlag sowohl den vorherigen als auch den aktuellen Dateitermin. Im Bericht bleibt **ausnahmslos** `capability=listing-only-not-renderable`, `releaseApproved=false`, `renderable=false`, `originalBytes=false`, `gribHeader=false`, `phaseClassification=false`, `convectiveShear=false` – auch wenn alle Dateien gelistet sind.

Die synthetischen Negativregressionen in `tools/ruc/test_dwd_seasonal_source_inventory.py` prüfen D2/EU-Grid-Trennung, fehlende Lauf-/Feld-Dateien, die +78/+81-Intervallgrenze, fehlendes T-1, falsche URLs, Duplikate, Nichtfreigabe von CAPE als Scherung und NoData. **16/16 lokale Python-Tests PASS**. Es wurden keine meteorologischen GRIB-Pixel entschlüsselt, keine App-Screenshots erstellt, keine realen iOS-Abnahmen durchgeführt und kein Build/Release ausgelöst.

## Nächste Ausbaustufen (nicht als fertig melden)

**AP-W1 – Winter-Originaldaten.** Auf einem einzigen aktuellen ICON-D2-/ICON-EU-Lauf die Headers und Werte für `WW`, `H_SNOW`, `T_2M`, kumuliertes `TOT_PREC` (inkl. T0/Endpunkte) einheitlich prüfen; ValidTime, Grid/CRS, Schnee/Phase-Codebelegung, Missing und physikalische Maxima. Phase/Schneehöhe als klar **getrennte** Legenden und optionale Layer; keine künstliche gefrierende Niederschlagsart oder Schneefallgrenze. Danach erst zusätzliche Schnee-/Graupel-Originalfelder und alpine Höhenreferenzen.

**AP-S1 – Konvektives Potenzial.** Zunächst `CAPE_ML` (J/kg) + `CIN_ML` (J/kg, ggf. negatives Vorzeichen) auf genau derselben validen Originalzelle; MLCAPE und andere CAPE-Varianten ausdrücklich unterscheiden. 10-m-Böen bleiben eigene Meteorologie, aber **keine** Scherung. Nach Verifikation geeigneter Originalwind-/Höhenfelder separate 0–6-km-AGL-Bulk-Shear-Vektordifferenz (m/s oder kt), ohne 500-/850-hPa-Differenz als geometrische 6 km auszugeben. Optional LPI als modelliertes Potenzial, keine Warn-/Blitzwahrscheinlichkeit.

**AP-M – Mehrmodell-/Designintegration.** Erst nach erfolgreicher feldweiser Echt-Original-Grib-QA model_id-spezifische Backend-Adapter, Capability-Matrix, Raster-/Contour-/Export-/Ortswert-E2E und Tests zu Laufwechsel, Cache, Quellenlabels, fehlenden Stunden/Einheiten und 320/390/844/1440 px, Light/Dark, Tastatur/Touchtargets. Das bestehende Kartenlayout und Nutzerpräferenzen erhalten; keine fremden visuellen Elemente kopieren.

**Release:** Alle produktiven Kartenänderungen ausschließlich nach unabhängigen qualifizierten Originaldaten-Gates sowie MID Source-PR → SHA-Bot → serverseitiges ZIP → `install-mid.yml` → Worker-/Pages-Verifikation → Stable-Promotion. Sammel-PR #745 bleibt wegen offener Reviews und ausstehender vollständiger Gates gesperrt. Das vorliegende Dokument und die QA-Dateien **sind keine Release-Genehmigung**.
