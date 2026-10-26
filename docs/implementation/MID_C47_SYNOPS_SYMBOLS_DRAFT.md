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
