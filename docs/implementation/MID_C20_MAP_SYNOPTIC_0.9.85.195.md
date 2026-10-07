# MID-C20 · Karten-Synoptik und Parametergruppen

Basis .194; ergänzter Auftrag vor Öffnung des .195-Source-PR. Keine Logo-Änderung.

## Darstellung

Verwaltungsgrenzen werden als dünne, neutrale, gestrichelte Konturen ohne weiße Doppelumrandung gezeichnet. Deutschland wird bei geladenem Länderbestand nicht ein zweites Mal überzeichnet. Die geografischen Daten und Zoomschwellen bleiben erhalten; bestehende Vektorgrundkarte, Ortsnamen und Favoriten bleiben aktiv. Der frühere Zeichentest wird bewusst von vier auf einen Strich im Überblick bzw. von 36 auf 17 im Regionalausschnitt aktualisiert: Länder und 16 Bundesländer werden je einmal gezeichnet. Ein zusätzlicher Vertrag verlangt gestrichelte Verwaltungsgrenzen.

Parametergruppen: Komposit & Synoptik; Temperatur & Feuchte; Niederschlag; Wind & Böen; Wolken & Wetter; Ensemble & Wahrscheinlichkeiten. Jeder Parameter erscheint genau einmal. Beide Auswahlrichtungen behalten dieselbe Kompatibilitätsmatrix.

## Synoptik-Komposit

Eigene Kombination freier DWD-Originalkarten, keine kopierte Kachelmannwetter-Grafik: ICON-Temperatur in 850 hPa als Farbfläche, geopotentielle Höhe in 500 hPa und MSL-Druck als beschriftete Linien. In Linien-/Beobachtungsdarstellung wird die Temperaturfläche ausgeblendet. Alle Komponenten benötigen einen gemeinsamen bestätigten Lauf und Termin, die richtigen Druckflächen und angebotene Stile. Bei fehlender Komponente gibt es kein scheinbar vollständiges Komposit. Die bestehende 90-Minuten-Toleranz gilt; der tatsächliche Termin wird angezeigt. Unpassende 500-hPa-Farbskalen werden für 850 hPa nicht verwendet. Radar/Satellit behalten ihre eigenen Termine und Deckkräfte.

## Verfügbarkeit am 07.10.2026

Quelle: https://maps.dwd.de/geoserver/wms?service=WMS&request=GetCapabilities&version=1.3.0 (direkt abgerufen). Referenzgestaltung: https://kachelmannwetter.com/de/modellkarten/german/deutschland/gwl-synoptik-komposit.html.

| Parameter | Befund / Änderung |
| --- | --- |
| Temperatur 2 m | ICON-EU-Höhenfeld ist auch in exakt 2 m bestätigt; ergänzt neben ICON-D2, ICON Global und AICON. Alias bleibt auf 2 m beschränkt. |
| Niederschlag 12 h | ICON-EU und ICON Global sind im aktuellen Katalog vorhanden; neue eigene 12-h-Kategorie, keine Verwechslung mit Summen seit Modellstart. |
| Böengeschwindigkeit / Bewölkung | Keine zusätzliche passende deterministische WMS-Karte im aktuellen Katalog. Wahrscheinlichkeiten werden nicht zu Böengeschwindigkeiten umetikettiert. |
| Freie weitere Modellraster | ICON-EU-Böen liegen als GRIB2 auf https://opendata.dwd.de/weather/nwp/icon-eu/grib/06/vmax_10m/ vor. IFS/AIFS liegen als freie GRIB2-Produkte vor: https://www.ecmwf.int/en/forecasts/datasets/open-data. Sie sind keine unmittelbar austauschbaren WMS-Karten; eine eigene geprüfte Raster-Publikationsstrecke wäre erforderlich. Daher keine nur nominellen neuen Modelloptionen. |

Die neue Regression prüft Lauf-/Termin-/Level-/Stil-Abweichungen, fehlende Komponenten, eindeutige vollständige Kategorien, ICON-EU-2m und die beiden neuen Worker-Layer. Die bestehende echte Unified-Map-Browsermatrix prüft zusätzlich das Komposit, beide Druckflächen, Laufbindung und unveränderte Map-Identität. Bestehende native Integritäts-, Einheiten-, Export- und Releaseprüfungen bleiben erhalten.

## Ergänzende freie Quelle: ECCC GDPS

https://geo.weather.gc.ca/geomet?service=WMS&version=1.3.0&request=GetCapabilities&layer=GDPS_15km_TotalCloudCover bestätigt Gesamtbewölkung, drei Originalstile sowie Zeit- und Referenzzeitdimension. Eine echte PNG für 07.10.2026 18 UTC aus dem Lauf 00 UTC wurde abgerufen und visuell geprüft. Der frühere GDPS.ETA_NT-Name ist nicht verfügbar und wird nicht verwendet. Dokumentation: https://eccc-msc.github.io/open-data/msc-geomet/wms_en/.

GDPS Global ergänzt die Bewölkung als eigene Quelle. Der Worker akzeptiert ausschließlich den konkret freigegebenen Layer und passenden Provider, verwendet eine feste HTTPS-GeoMet-Adresse und dieselben Zeit-/Lauf-/Bildtypprüfungen. GeoMet-eigene Interpolation verbessert die Rasterdarstellung, ohne Modellwerte mit ICON zu vermischen. Bestätigte Cloud-Stile werden explizit als Flächen klassifiziert; es werden keine Linien behauptet. Unbestätigte Punktwerte bleiben unbekannt; Favoriten bleiben zentrierbar. ECCC Open Government Licence – Canada wird angegeben. Die Browsertests prüfen zusätzlich die Provider-/Layer-Zuordnung und tatsächlich geladene Kacheln (statt des begrenzten Browser-Resource-Timing-Puffers); der Proxyvertrag verwirft Provider-Verwechslungen.

Die DWD-Synoptik-Farblegende wird über den vorhandenen, weiterhin freigegebenen WMS-Proxy aus dem gewählten Stil erzeugt. Ein vom Client zusätzlich übergebener fremder Legenden-Layer wird ignoriert; der tatsächliche Layer wird serverseitig aus der geprüften Allowlist abgeleitet.
