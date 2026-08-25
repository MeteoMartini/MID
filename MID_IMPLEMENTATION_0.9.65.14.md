# MID 0.9.65.14

## Reiseplaner – klimatologische Wassertemperatur

- Ursache der fehlenden Wassertemperatur behoben: Die SST-Klimatologie wurde irrtümlich über die atmosphärische Open-Meteo Historical Weather API (`archive-api`) mit `models=era5` angefragt. Diese Schnittstelle stellt die benötigte historische `sea_surface_temperature` nicht als reguläre Historical-Weather-Variable bereit.
- Historische SST wird jetzt über die Open-Meteo Marine API mit `models=era5_ocean`, `hourly=sea_surface_temperature` und `cell_selection=sea` geladen.
- Die acht Referenzjahre 1991–2020 sowie die exakte Bindung an die Kalendertage des geplanten Reisezeitraums bleiben erhalten.
- Der negative/fehlerhafte alte Wasserklima-Cache wird durch Cache-Version `v3` invalidiert.
- Der Reiseplaner verwendet weiterhin keine aktuellen Marinewerte für die klimatologische Wassertemperatur.
