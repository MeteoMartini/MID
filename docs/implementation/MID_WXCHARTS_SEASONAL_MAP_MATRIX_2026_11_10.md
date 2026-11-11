# MID-Karten: WXCharts-Parametervergleich und unabhängige DWD-Saisonprodukte

**Datum:** 2026-11-10 · **Basis:** `main=mid-stable=d8852f672a40d26348d214dc85e9a3a1b9d79c1f`, v0.9.85.451 · **Issue:** #724 · **QA:** Draft #729 · **Freigabe:** ausschließlich nach kanonischem Source-/Installer-/Stable-Gate.

## Fremdprodukt und Rechte

WXCharts/MetDesk bietet die Kartenfamilien *Overview*, *Winter Overview*, *Convective Overview*, *Snow Depth*, *CAPE*, *Bulk Shear* und u.a. 2-m-/850-hPa-Temperatur, 500-hPa-Geopotential, Wind/Böen und Niederschlagssummen.
- Produktvergleich: https://www.wxcharts.com/ · https://wxcharts.com/
- Bedingungen: https://cdn-eu.metdesk.com/wxcharts/terms-of-use.html
- **Keine Weiterverwendung** von WXCharts-/MetDesk-Kacheln, Screenshots, Kartendaten, Code, APIs oder automatisierten Embeds in MID ohne eigenständigen nachprüfbaren Lizenzvertrag; die Bedingungen beschränken die Nutzung und verbieten kommerzielle Inhalte-/Produktverwertung. Hier werden **nur meteorologische Fachparameter und eigenständige Darstellungskonzepte verglichen**. Ein ggf. kostenpflichtiger Vertrag ist nicht genehmigt.
- Eigenständige DWD-Datenquelle: https://opendata.dwd.de/weather/nwp/icon-d2/grib/ · DWD-ICON-D2-Originalfelder, durch MID vorhandene native SHA-/ValidTime-Prüfung. Für DWD-Open-Data-Produkt und Weitergabe konkreten CC-BY-4.0-Quellenbeleg/Attribution beibehalten. Nicht vom WXCharts-Rechtebestand ableiten.
- Ergänzende Anbieterbeschreibung der modellierten Original-/abgeleiteten Parameter: https://open-meteo.com/en/docs/dwd-api (Recherche, **keine** pauschale Lizenzfreigabe für fremde Reader oder kommerzielle API-Nutzung).

## Umsetzungs- und Qualifikationsmatrix

| Fachparameter | WXCharts-Äquivalent | MID-Quelle und gegenwärtiger Produktstatus | Verbindliche Meteorologiesemantik |
|---|---|---|---|
| Niederschlag · 1 h | Overview / Winter / Convective | **Kandidat:** geprüftes ICON-D2-1-h-Derivat `precipitation` = Differenz aus zwei laufgleichen, aufeinanderfolgenden kumulativen DWD-`TOT_PREC`-Originalfeldern; gepaart mit verifiziertem Begleitfeld | Gesamtniederschlag, **nicht** ausschließlich Regen; Zeitfenster rückwärts 1 h, fehlend ≠ 0; keine künstliche Phase |
| 2-m-Temperatur / Isothermen | 2m Temperature / Winter | **Kandidat:** natives `temperature` desselben ICON-D2-Laufs, Zeitpunkts, Rasters | °C; 0 °C in 2 m ist **weder** Nullgradhöhe noch eine Bodenvereisungs-/Niederschlagsphasenanalyse |
| 10-m-Böenmaximum | Wind Gust / Sommer | **Kandidat:** natives `gust` desselben ICON-D2-Laufs, Zeitpunkts; das aktuelle `native-fields.v2`-Indexfeld `intervalHours=0` belegt keine Maximumdauer | Böen-Maximum gemäß DWD-Felddefinition; genaue Maximumdauer ohne zusätzliche originale GRIB-StepRange-Metadaten nicht aus `intervalHours=0` ableiten; keine mittlere Windgeschwindigkeit oder Gewitterwahrscheinlichkeit |
| Schneehöhe | Snow Depth / Winter Overview | **Noch nicht integriert**; DWD `H_SNOW` ist grundsätzlich im offiziellen ICON-D2-Originalinventar vorhanden | Bestands-Schneehöhe in m, nicht Neuschneesumme; keine Gleichsetzung zu SWE oder dimensionslosem Niederschlag |
| Modellierter Neuschnee | Winter Overview | **Noch nicht integriert**; DWD `SNOW_GSP`/`SNOW_CON` grundsätzlich im Inventar | Modellprodukte mit nachgewiesenem GRIB-stepType/Einheiten prüfen; SWE mm nicht ohne Dichte in cm umrechnen |
| Regen/Schnee/Graupel/Eisregen | Winter Overview | **Noch nicht integriert**; eigene DWD-Phase-/WW-Originalwerte qualifizieren | Wetbulb, vertikales Temperaturprofil, Kategoriecodes, Gefrierregen im DWD/WMO-Sinn; nicht aus 2-m-Temperatur erfinden |
| Instabilität | CAPE / Convective Overview | **Noch nicht integriert**; DWD `CAPE_ML` grundsätzlich im ICON-D2-Inventar | J/kg, spezifische CAPE-Definition und Modelllauf kennzeichnen; CAPE allein keine Gewitterwarnung |
| Vertikale Windscherung | Bulk Shear / Convective Overview | **Noch nicht integriert**; erst originale höhengebundene U/V- und Höhenreferenzprodukte nachweisen | Scherungsbetrag z.B. 0–6 km AGL mit gleicher Laufzeit, korrekt referenzierten Höhen, m/s bzw. kt, keine naive Drucklevel-Differenz |
| Blitz-/Konvektionsdiagnostik | Convective Overview | **Noch nicht integriert**; DWD `LPI`/`LPI_MAX` unter qualifizierten physikalischen und zeitlichen Annahmen | Potenzialindex ≠ Blitzanzahl, Blitzwahrscheinlichkeit oder amtliche Warnung; LPI_MAX-Intervall prüfen |
| Druck, Theta-E, Geopotential | Overview / Höhenkarten | Vorhandene MID-Synoptik- und WMS-Produkte **unverändert** | Same-run/isobars/height units und vorhandene Provenienzprüfungen beibehalten |

## Tatsächlicher implementierter Funktionsumfang

`winter-berge`: 1-h-Gesamtniederschlag + 2-m-Isothermen, kein Snow-Depth-/Phase-/Glätteprodukt.

`sommer-gewitter`: 1-h-Gesamtniederschlag + Böen-Isolinien, keine CAPE-/Bulk-Shear-/Blitz-/Gewitterwarnkarte.

Beide erscheinen ausschließlich als **einheitliche Optionen** des bestehenden MID-Karten-Parameterselektors, ohne neuen Navigationspunkt. Bestehende Modell-/Quellenlogik, Zeitleiste, Layer, Legenden, Persistenz und übrige Karten bleiben erhalten. Die Ansicht wird nur bei zwei tatsächlich lauf- und zeitsynchronen ICON-D2-Feldern angeboten. Der 1-h-Niederschlag ist aus zwei Original-`TOT_PREC`-Kumulationswerten unter den bestehenden NoData-/Reset-/Quantisierungsprüfungen abgeleitet; das Begleitfeld ist ein eigenständiges natives DWD-Produkt. Je Zelle gilt NoData-Schnittmenge, sowohl für Farbraster als auch Linien und Ortswert-/Exportdarstellung. Renderzeit, Gesten, Safe-Area, Smartphone/Tablet/Desktop/Dark und nativer iOS-WKWebView-Simulator sind gesondert im vollständigen Gate zu prüfen.

## Fail-closed Gates für echte WXCharts-tiefe Folgestufe

1. Für jeden zusätzlichen Parameter originalen Anbieter, Lizenz, DWD-Inventar-Pfad, GRIB2-Keys, physikalische Einheit, Grid/CRS, Modelllauf, Gültigkeitszeit und Akkumulation/Statistiktyp an echten Daten nachweisen.
2. Bei Paarungen exakte Run- und ValidTime-Gleichheit; interpolierte/verschobene Raster nur mit eigenständigem validiertem Resampling und expliziter Qualität. NoData ≠ 0, Extremwerte nicht glätten.
3. Schnee-/Konvektions-Schichten werden bis zur Daten- und Produktqualifikation **nicht** als bereitgestellt gekennzeichnet und nicht künstlich aus ersatzweisen Feldern errechnet. Keine amtliche DWD-Warnsymbolik für eigene Diagnostik.
4. Nutzer-Changelog, datums- und versionsgebundene Buildspiegel, alle Core-/Heavy-/Web-/iOS-Shell-/Performance-Gates, SHA-Bot-Release-ZIP, Installer, betroffene Worker/Pages und Stable-Promotion müssen unabhängig erfolgreich sein.
