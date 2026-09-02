# MID 0.9.77.21 – Testnachweis

## Installer-#830-Blocker

Der zuvor fehlgeschlagene Test `scripts/test-api-contract-health-resilience-09778.mjs` besteht nach der Vertragsmigration. Er schützt nun den bereits produktiv implementierten Kerncheck `ECMWF IFS native 3h Min/Max` samt `models=ecmwf_ifs`, `forecast_hours=24`, `temperature_2m_min` und `temperature_2m_max`.

## Gezielte Prüfungen

Bestanden: API-Health-Resilienz, Open-Meteo-Update-Audit, Nightly-Dependency-Vertrag, Aggregate-Version, Versionsschema sowie Worker-Syntax für Aggregat und Deploydatei.

## Portable Gesamtsuite

`run-regressions.mjs` erkennt 633 Tests. In der Transportumgebung bestehen 528/528 ohne lokale Projekttoolchain ausführbare Tests. 105 bleiben ausschließlich toolchaingebunden: 86 `typescript-strada`, 17 lokale TypeScript-CLI/TypeScript-7-Grenzen und 2 `esbuild`. Der alte #830-Fehlertext tritt nicht mehr auf.

Der GitHub-Installer bleibt das autoritative Vollgate für reproduzierbares `npm ci`, Dependency-Audit, TypeScript 7.0.2, Vite-Produktionsbuild, alle 633 Regressionen, Capacitor-iOS-Kopie, Worker-Deployment und Stable-Promotion.
