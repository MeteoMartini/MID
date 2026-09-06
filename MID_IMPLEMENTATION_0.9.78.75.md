# MID 0.9.78.75 – Kompositbild und Kartenbedienung

Basis: MID-professional-replacement(20260906-081332).zip, Version 0.9.78.74. Die dortigen Event- und Testkorrekturen wurden vollständig übernommen. Keine Änderung der 14-Tage-Konfidenzmethodik in diesem Release.

## Bedienung

- „Karte bewegen“ entfernt: direktes Verschieben innerhalb der Kompositkarte, Zoom per Pinch bzw. +/-.
- Gemeinsamer MapLibre-Kern liefert standardmäßig deutsche +/- Bedienelemente, mindestens 40 px, auf Touchgeräten 44 px. Das vereinheitlicht auch Wetterkarten, Extremwetter-Ausblick und die übrigen eingebundenen MapLibre-Karten.
- Norden bleibt oben; unbeabsichtigtes Drehen und Kippen sind deaktiviert. Mausrad-Zoom bleibt standardmäßig aus, um die Seite weiter scrollen zu können. Auf Touchgeräten die Seite außerhalb der Karte scrollen.
- Standorttaste unterhalb der Zoomtasten; Platz für Kartenstatus reserviert. Tastaturfokus sichtbar.

## Reale Satellitenhistorie

- Kompositzeitleiste bis etwa 90 Minuten vor der Referenzzeit; es werden ausschließlich veröffentlichte Quellenzeitpunkte angeboten.
- Mehrjährige WMS-TIME-Intervalle werden vom jüngsten Ende aus begrenzt aufgelöst. Zuvor blieben beim EUMETSAT-Intervall ab 2024 nur frühe historische Stände und der letzte Endpunkt übrig.
- WMS-Style-Namen überschreiben nicht länger Layernamen beim Parsen von Zeit- und Druckflächendimensionen.
- Produkte mit frischen, passenden historischen Bildern werden bevorzugt. Etwa 135 Minuten Metadatenpuffer berücksichtigt Lieferverzögerungen. Ein DWD-Live-Snapshot ohne TIME bleibt ausdrücklich nur ein Live-Snapshot.
- Beim historischen Sprung wird kein beibehaltenes Livebild unter einem historischen Zeitpunkt angezeigt. Legende und Kartenstatus nennen den dargestellten Quellenzeitpunkt.
- Lade- und Fehlerzustände werden der jeweiligen Rasterquelle zugeordnet. Ein Fehler einer anderen Kartenebene kann die Satellitenebene nicht mehr pauschal als fehlerhaft markieren.

## Synoptik: schlanker vorhandener Dienst

Primär werden beschriftete DWD-WMS-Produkte verwendet:

| Inhalt | Layer | Stil | Dimension |
|---|---|---|---|
| Auf Meereshöhe reduzierter Luftdruck | dwd:Icon_reg025_fd_sl_PMSL | icon_reg025_fd_sl_pmsl_wmc_isoline_label | hPa |
| Geopotentielle Höhe 500 hPa | dwd:Icon_reg025_fd_pl_GH | icon_reg025_fd_pl_gh_wmc_isoline_label | elevation=500, Beschriftung in geopotentiellen Dekametern |

Beide Ebenen verwenden denselben tatsächlich angebotenen ICON-Modelllauf und dieselbe Gültigkeitszeit. INIT und GÜLTIG werden angezeigt. Die 500-hPa-Dimension wird zwingend gesetzt: der Dienst hat eine andere Standarddruckfläche. Es handelt sich um Modellfelder, nicht um Satellitenbeobachtungen oder amtliche Bodenanalysen.

Capabilities werden je Worker-Isolate zehn Minuten zwischengespeichert und gleichzeitige Abrufe zusammengeführt. Im Normalfall entfällt die bisherige räumliche Mehrpunktabfrage für eigene Konturen. Bei fehlenden Metadaten oder gescheiterten Linienbildern bleiben die vorhandenen numerisch berechneten MID-Ersatzkonturen als sichtbar gekennzeichneter Fallback erhalten; sie besitzen nicht die Detailtreue nativer Modellfelder. Kein undatiertes WMS-Bild wird als historisches Modellfeld ausgegeben.

### Warum kein zusätzlicher Python-/Actions-Job?

Der vorhandene WMS liefert georeferenzierte Kartenkacheln samt Linienbeschriftung und vermeidet GRIB-Download, Projektion, Rendering, Archivbetrieb und regelmäßige Bild-Commits. Für diese interaktive Ansicht ist dies der schlankere Weg. MetPy/Cartopy bleibt eine sinnvolle spätere Option für eigene Analyseprodukte, feste druckfähige Karten oder einen unabhängigen Bildcache. Dann müssten Modelllauf, Gültigkeit, Druckfläche und Georeferenz ausdrücklich mitexportiert werden. Ein gewöhnliches PNG/SVG allein ist noch kein korrekt platzierter Kartenlayer. Ein sechsstündiger Zeitplan garantiert weder einen neuen Modelllauf noch dessen vollständige Verfügbarkeit.

## Quellen und überprüfte Dienstverträge

Prüfdatum 06.09.2026. Metadaten und echte GetMap-Antworten wurden zusätzlich zu den Codeprüfungen abgefragt.

- [DWD Geodienste](https://www.dwd.de/DE/leistungen/geodienste/geodienste.html)
- [DWD WMS GetCapabilities](https://maps.dwd.de/geoserver/ows?service=WMS&request=GetCapabilities)
- [EUMETSAT EUMETView](https://view.eumetsat.int/)
- [EUMETSAT feste Bild-URLs und Dimensionen](https://user.eumetsat.int/resources/user-guides/eumetview-image-download-by-using-fixed-urls-guide)
- [EUMETSAT WMS GetCapabilities](https://view.eumetsat.int/geoserver/wms?service=WMS&request=GetCapabilities)

## Installation

Professional-ZIP über den bestehenden MID-Installer einspielen. Der Worker muss ebenfalls auf 0.9.78.75 aktualisiert werden, weil Zeitparser und Synoptik-Metadaten dort liegen. Bei aktivem Worker-Auto-Deploy dessen erfolgreichen Lauf prüfen; sonst den beiliegenden Worker über den bisherigen Weg hochladen. Keine neuen Bindings, Secrets, kostenpflichtigen Dienste oder Workflows erforderlich. Kein Deployment wurde aus dieser Arbeitsumgebung vorgenommen.

## Prüfgrenzen

Die automatisierten Tests prüfen die Zeit-/Produktverträge, WMS-Dimensionen, Quellenauswahl, Fallbacks und Kartenbedienungsverdrahtung. Live-Dienstproben bestätigen historische Satellitenbilder sowie beide Linienprodukte. Sie ersetzen keinen Touch-/Safari-Test auf dem tatsächlichen Endgerät und garantieren keine ständige Verfügbarkeit externer Wetterdienste.
