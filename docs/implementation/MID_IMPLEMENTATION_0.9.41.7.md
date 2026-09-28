# MID v0.9.41.7 – CI-/Regressionsynchronisierung

## Ursache

Der Produktionsbuild von v0.9.41.6 war technisch erfolgreich, wurde aber anschließend durch zehn veraltete Regressionserwartungen abgebrochen. Die Tests referenzierten noch Cache-/Navigations-/Modellverträge vor v0.9.41.5/v0.9.41.6.

## Korrektur

- Forecast-Fusion-Regressionen auf den in v0.9.41.6 absichtlich migrierten Cache `mid:forecast-fusion:v7:` synchronisiert.
- Ensemble-/Szenario-/Wind-/Performance-Regressionen auf den in v0.9.41.6 absichtlich migrierten Cache `mid:ensemble:v12:` synchronisiert.
- Navigationsvertrag auf den seit v0.9.41.5 gültigen Abschnitt `Profile & Planung` aktualisiert.
- AIFS-Metadatenvertrag auf die aktuelle exakte Open-Meteo-ID `ecmwf_aifs025_single` synchronisiert; veraltete Mehrfach-Fallbackerwartung entfernt.
- Ensemble-Modelltest unterscheidet jetzt korrekt zwischen der gültigen deterministischen BOM-ACCESS-ID `bom_access_global` und Ensemble-IDs; dadurch entsteht kein Fehlalarm mehr.

## Funktionsstand

Es werden keine meteorologischen Funktionen von v0.9.41.6 zurückgenommen oder verändert. Die Korrektur betrifft ausschließlich die CI-/Regressionserwartungen und die Release-Versionssynchronisierung.
