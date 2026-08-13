# MID v0.9.52.0 – Hyperlocal Downscaling / Realtime Quality

## Ziel

Die hyperlokale Analyse wird von einer groben Standortklassifikation zu einer parameterbezogenen Kombination aus hochfrequenten amtlichen Beobachtungen, hochaufgelöstem Modellhintergrund und lokaler Gelände-/Oberflächenrepräsentation weiterentwickelt.

## Umsetzung

- DWD CDC: native 10-Minuten-Lufttemperatur/Feuchte, Mittelwind, Windrichtung, Böenspitzen und Niederschlag direkt aus den `now`-ZIP-Produkten.
- DWD Stadtklima: zusätzliche 10-Minuten-Temperatur-/Feuchtestationen mit expliziter urbaner Standortklasse.
- Kleine ZIP-Dateien werden im Cloudflare Worker ohne schwere ZIP-Bibliothek über den zentralen Verzeichnisdatensatz und `DecompressionStream('deflate-raw')` gelesen.
- Copernicus DEM GLO-90 über Open-Meteo Elevation API: 5-Punkt-Mikroreliefprofil (Zentrum sowie N/S/E/W in 350 m Entfernung) für Ziel und relevante Stationspunkte.
- Daraus: Hangneigung, Hangaspekt, Relief, relative Gelände-/Kuppen-/Senkenposition und Exposition.
- Restfeldgewichte werden parameterabhängig um topografische Ähnlichkeit ergänzt.
- Oberflächenkontext über optionalen `MID_SURFACE_CONTEXT_POINT_ENDPOINT` für echte GIS-Felder: Versiegelung, LCZ, Bebauungsanteil, Rauigkeitslänge und Oberflächenklasse.
- Ohne GIS-Adapter: ausschließlich ein als Proxy gekennzeichnetes OSM-Morphologieprofil; keine Ausgabe einer erfundenen Versiegelungszahl.
- Thermische GIS-Kompatibilität gewichtet Versiegelungsunterschiede nachts/bei schwachem Wind strenger; UHI wird nicht als fixer Zuschlag erfunden.
- Windkompatibilität nutzt Rauigkeits- und Reliefunterschiede zur Dämpfung nicht übertragbarer Restfelder, ohne ein nicht abgesichertes direktes Log-Windprofil anzuwenden.
- Der Modellhintergrund erhält `is_day`, damit das thermische Regime für die Repräsentativitätsbewertung verfügbar ist.
- Die initiale schnelle Analyse triggert eine vollständige Anreicherung, solange Oberflächenkontext fehlt.

## Doppelkorrekturschutz

Open-Meteo verarbeitet die Zielhöhe bereits im Forecast-/Modellpfad. MID wendet daher **keine zweite pauschale −0,65 K/100 m-Korrektur** auf den Zielwert an. Das DEM bewertet stattdessen, ob ein an einer Station beobachtetes Modellrestfeld topografisch auf den Zielort übertragbar ist.

## Qualitätsvertrag

`MID_HYPERLOCAL_DOWNSCALING_CONTRACT.md` ist ab dieser Version verbindlich. Der Required-Test `scripts/test-hyperlocal-downscaling-09520.mjs` schützt Realtime-Quellen, DEM-/Oberflächenlogik, Rauigkeit, UHI-Repräsentativität und den Doppelkorrekturschutz.

## Worker

Worker-Deployment ist erforderlich, da DWD-CDC-ZIP-Decoding, DWD-Stadtklimanetz und der Oberflächenkontext-Endpoint neu im Worker liegen.
