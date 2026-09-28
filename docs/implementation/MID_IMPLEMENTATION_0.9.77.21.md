# MID 0.9.77.21 – Installer #830 API-Health-Regressionshotfix

## Ursache

Der produktive API-Healthcheck war in v0.9.77.20 bereits korrekt auf den nativen ECMWF-IFS-3-h-Min/Max-Pfad migriert. Der ältere Resilienztest `scripts/test-api-contract-health-resilience-09778.mjs` verlangte jedoch weiterhin den entfernten Anzeigenamen `Hourly Min/Max Aggregation`. Dadurch scheiterte Run #830 trotz erfolgreichem `npm ci`, Dependency-Audit, TypeScript und Vite mit 632/633 Regressionen.

## Korrektur

- Kernvertragsname auf `ECMWF IFS native 3h Min/Max` synchronisiert.
- Zusätzlich werden `models:'ecmwf_ifs'`, `forecast_hours:'24'`, `hourly:'temperature_2m_min,temperature_2m_max'` und die getrennte Plausibilisierung beider Reihen regressionsgeschützt.
- Keine Änderung der fachlichen Forecast-, Current-, KNMI-EPS- oder Workerlogik.
