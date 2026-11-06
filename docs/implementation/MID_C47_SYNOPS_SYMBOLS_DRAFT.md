# MID-C47 · Niederschlagsart-Layer mit SYNOP/ww-Symbolbezug (Diagnose-Draft)
Basis v0.9.85.335 SHA `3908e1c7e6c8475278ae07e5cfbd5a4780822e95`; PR #479 (.336) integriert parallel RUC/EPS +27h und bleibt eigenständig. Kein Versionswechsel, solange Draft.

DWDs ICON-Wetterinterpretation WW basiert auf einer eingeschränkten WMO-Codeauswahl. WMO-FM-12-SYNOP ww ist ein **Beobachtungscode**; die Radar-/Modellklassifikation MID ist **keine** SYNOP-Stationsmeldung. Der existierende Layer im Radar-/Kompositbereich bleibt an OPERA-CIRRUS-Echos und passende regionale Modellwerte (bei Verfügbarkeit RUC-Regen/Schnee/Graupel) gebunden. Reiner Regen bleibt im Radar, nicht als zusätzliche Symbolfläche. Null/fehlende Werte oder unsichere Thermodynamik erzeugen keine künstlichen Codes.

Nur wenn ein expliziter, gültiger Modell-Wettercode aus dem Phasenraster derselben Phase wie die bereits validierte Radar-/Modellentscheidung entspricht, wird die passende ww-bezogene SVG-Plotform benutzt und der vorhandene Modell-Wettercode beschriftet. Bei abgeleiteter Phase bleibt die vorhandene schematische Form **ohne** fiktive ww-Kennung. 21 gruppierte ww-Codes: Gefrieren 56/57/66/67, Mischphase 68/69/83/84, Schnee 71/73/75/85/86, Eis-/Schneekörner 77/78/79, Graupel 87/88, Hagel 89/90, Gewitter mit Hagel/Graupel 96/99. Kein Symbol für trockene, unbekannte oder unklassifizierte Codes.

Die 32×24-SVG-Plotzeichen sind lokal und ohne Schrift-/Remoteabhängigkeit. Es handelt sich um **an WMO-Plotgrundformen angelehnte Implementierungszeichen**, keine unbelegte pixelgenaue Faksimile jedes amtlichen Zeichens. Ein offizieller visueller Referenzvergleich sowie Browser-/Widget-/Exportparität fehlen und sind vor einem Release zwingend. Medizinische/meteorologische Warnungen werden aus dem Symbol allein nicht abgeleitet.

Referenzen:
- WMO present weather symbol collection: https://wis.wmo.int/wxsymbols/
- DWD ICON Modell-Dokumentation, WW-Subset: https://rcccm.dwd.de/SharedDocs/downloads/DE/modelldokumentationen/nwv/icon_d2/icon_d2_dbbeschr_aktuell.pdf
- DWD native RUC-Parameter-Listing: https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/WW/

Ohne Freigabe durch neuen vollständigen Source-/Heavy-/Installer-/Pages-/Stable-Gate keine Produktion. Es ist kein full-domain-Kartenfix.

## Quellenherkunft des räumlichen Phasenrasters – zwingende Unterscheidung

Quellprüfung am 26.10.2026 auf Stable .335: `worker-src/20-composite-models.js::precipitationPhaseGridData` bezieht `weather_code` aus einem selektierten Open-Meteo-Rapid-/Regionalmodell. Das explizite Modell-Metadatum und dessen Gültigkeitszeit müssen auf dem Symbolkontext erhalten bleiben. Der separate native DWD-ICON-D2-RUC-Pfad liefert bei rechtzeitiger Verfügbarkeit `rucRain`, `rucSnowfallWaterEquivalent`, `graupelWaterEquivalent`; dies sind **keine originären nativen WW-Codes**. Daher impliziert das SVG-Attribut `ww` nur den numerischen **Modell-Wetterinterpretationscode der gewählten räumlichen Quelle**, nicht SYNOP-Stationsbeobachtung oder DWD-Original-WW. Die tatsächliche native RUC-`WW`-Karte ist noch kein freigegebener Vollgebiets-Layer (#446/#449).

Offener fachlicher NoData-Befund im bestehenden Worker: `Math.round(value('weather_code')||0)` und `Math.max(0,value('precipitation')||0)` reduzieren nicht verfügbare Antworten auf 0. Der neue Layer leitet aus 0 **keine** Niederschlagszeichen ab, aber dieser Worker-Vertrag muss vor einer produktiven Freigabe fachgerecht auf missing/null/NaN mit vollständig überprüfter Client-, Cache- und Sensorverträglichkeit geändert werden; nicht in dieser parallelen .336-Produktionspipeline improvisieren.

Unterschiedliche ww-Intensitäten für 71/73/75 werden über 1/2/3 Sternzeichen repräsentiert; stärkere Mischphase 69/84 und Schnee-/Graupelschauer erhalten differenzierte Zeichen. Das ist eine konservative schematische Plot-Annäherung, keine unverifizierte Zusage originalgetreuer WMO-Grafik.

Quellenstand vor Auslieferung erneut mit den offiziellen WMO-Zeichenbildern und dem Open-Meteo-Codevokabular vergleichen. Erst mit gesicherter Nutzungs-/Lizenzgrundlage amtliche Originalglyphen übernehmen; keinesfalls angeblich offizielle Zeichen nach eigener Rekonstruktion ausgeben.
