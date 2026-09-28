# MID v0.9.53.36

- Ensembleauswahl von vorab begrenzten Abrufslots auf success-driven Modellunits umgestellt.
- ECMWF IFS ENS Europe → Global und AIFS ENS Europe → Global als intra-family Fallback eingeführt.
- Nicht konfigurierte KNMI/ECCC-Punktadapter reduzieren die Zahl erfolgreicher Ensemblequellen nicht mehr.
- Modellstanddiagnose zeigt numerisch aktive Modelle auch ohne Metadaten sowie Aktiv/Fallback/Fehler/Adapter/Reserve-Status.
- Open-Meteo Mean/Spread-Reserve um NOAA AIGEFS, UKMO Global/UK, MeteoSwiss CH1/CH2 und BOM ACCESS ergänzt.
- Worker-Diagnose `ensemble-capabilities` ergänzt.
- Dauerhafte Verträge/Dokumentation: `MID_MODEL_SOURCE_CONTRACT.md`, `MID_REGIONAL_ENSEMBLE_ADAPTER_SETUP.md`.
