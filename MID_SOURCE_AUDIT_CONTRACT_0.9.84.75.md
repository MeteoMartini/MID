# MID Quellenvertrag v0.9.84.75

Stand: 12.09.2026. Dieser Vertrag ergänzt bestehende MID-Quellen; OPERA, EEA und nationale Warn-/Beobachtungswege bleiben erhalten.

1. **EUMETSAT MTG FCI + LI:** FCI bleibt der europäische Satellitenpfad. Die LI-AFA-WMS-Zeitdimension wird in die Filmzeitachse übernommen. Optional kann ein serverseitiger Normalisierer Total-Lightning-L2-Punkte/Cluster liefern. Große NetCDF-Produkte werden nicht im Browser/iPhone verarbeitet.
2. **Official Observation Broker:** Nationale amtliche Direktquellen haben Vorrang. Deutschland: UBA-Luftdaten-v4-Messung vor EEA-Bezug vor CAMS/Open-Meteo-Modell. Schweiz: SwissMetNet-STAC/OGD-Adapter. Niederlande: ausschließlich `10-minute-in-situ-meteorological-observations`; stillgelegte KNMI-10-Minuten-Pfade werden abgewiesen.
3. **PEGELONLINE:** WSV REST API v2 ohne Authentifizierung; Stationen nur über UUID. `W` ist aktueller Pegel, `WV` wird – soweit vorhanden – als amtliche Pegelvorhersage ausgewiesen. Rohmesswerte werden als vorläufig/ungeprüft gekennzeichnet.
4. **ECMWF IFS 50r1:** Kein `scda`, `scwv` oder `enfo,type=cf` in ausführbarem MID-Code. 06/18 UTC verwenden ebenfalls `oper` bzw. `wave`; Control-Forecast wird nicht als alter `enfo/cf`-Sonderpfad behandelt.
5. **MeteoAlarm:** Optionaler OGC-EDR/CAP-Adapter nutzt Collection `warnings`, `active` und `language`. Nationale Warnpfade bleiben Fallback. Veraltete Query-Namen werden nicht verwendet.
6. **NOAA MRMS:** Für US-Standorte optional regionaler Primärpfad vor dem generischen Radar-Fallback. GRIB2/GeoTIFF werden vorgelagert reduziert; der Request-Worker verarbeitet nur normalisierte Punkt-/Rasterdaten.
7. **WMO WIS2:** Nur vorgelagert normalisierte Beobachtungen im Schema `mid-official-observation-v1`. Kein allgemeiner BUFR-Decoder im Cloudflare-Request-Worker. Bereits vorhandene nationale Direktquellen behalten Vorrang.
8. **Copernicus Marine:** Optionaler serverseitiger räumlich/zeitlich/variablenbezogener Subset-Pfad vor Open-Meteo Marine. Keine globalen Rohdateien auf dem Endgerät.
9. **GloFAS / EFAS:** GloFAS darf als modellierter Abflussausblick erscheinen, nie als Messung oder amtliche Hochwasserwarnung. Öffentlich verfügbare EFAS-Mittelfristprognosen besitzen für Nicht-Partner ein Embargo und dürfen deshalb nicht als aktuelle Hochwasserprognose dargestellt werden.

## Sicherheits- und Fallbackregeln

- Fehlende Adapterkonfiguration bedeutet **keinen Datenverlust**; der bestehende MID-Pfad bleibt aktiv.
- Messung, Modell, Fallback und amtliche Warnung bleiben semantisch getrennt.
- Neue Quellen dürfen etablierte nationale Direktquellen nicht allein aufgrund größerer räumlicher Abdeckung verdrängen.
- Rohformate NetCDF/GRIB2/GeoTIFF/BUFR werden nicht im mobilen Requestpfad dekodiert.
