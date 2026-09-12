# MID v0.9.84.75 – Quellen-Audit

## Umsetzung

Der Quellen-Audit vom 12.09.2026 wurde auf die neuere v0.9.84.74-Basis portiert. Alle UI-/Tooltip-Optimierungen aus v0.9.84.72–.74 bleiben erhalten.

- MTG-LI-AFA-Zeitachse aus der WMS-TIME-Dimension statt pauschal „latest only“; optionaler normalisierter Total-Lightning-L2-Adapter.
- UBA-v4-Luftqualitäts-Messpfad für Deutschland mit EEA- und CAMS/Open-Meteo-Fallback; SwissMetNet-STAC- und aktuelle KNMI-EDR-Verträge im Official Observation Broker.
- WSV PEGELONLINE REST v2 mit UUID, W und optional WV im Wasserbereich.
- ECMWF-50r1-Negativvertrag gegen stillgelegte Streams/Control-Requests.
- Optionaler MeteoAlarm-OGC-EDR/CAP-Adapter vor Rückfall auf bestehende nationale Warnwege.
- NOAA/NSSL MRMS optional regional für US-Standorte vor RainViewer; DWD/OPERA-Europapfad bleibt unverändert.
- WIS2 als Normalizer-Schnittstelle mit kanonischem MID-Observation-JSON, ohne BUFR-Decodierung im Cloudflare-Request-Worker.
- Copernicus-Marine-Subset vor Open-Meteo Marine; GloFAS als klar gekennzeichneter modellierter Abflussausblick.
- Quellenübersicht in der App aktualisiert und Messung/Modell/Fallback fachlich getrennt.

## Konfiguration

Neue serverseitige Adapter sind optional: `MID_EUMETSAT_LI_POINT_ENDPOINT`, `MID_UBA_AIR_QUALITY_POINT_ENDPOINT`, `MID_METEOALARM_EDR_POINT_ENDPOINT`, `MID_NOAA_MRMS_POINT_ENDPOINT`, `MID_WIS2_OBSERVATION_POINT_ENDPOINT`, `MID_COPERNICUS_MARINE_POINT_ENDPOINT`, `MID_GLOFAS_POINT_ENDPOINT`. Ohne Konfiguration bleibt das jeweilige bestehende Fallback aktiv.

## Worker

Worker-Fachlogik wurde geändert. Ein Worker-Deployment ist für v0.9.84.75 erforderlich, wenn die neuen Adapter bzw. PEGELONLINE/MRMS/WIS2/Marine/GloFAS genutzt werden sollen.
