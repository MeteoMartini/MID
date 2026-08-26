# MID 0.9.66.7 – belastbare Reise-Wassertemperatur

## Befund

Der Reiseplaner fragte für die historische Wassertemperatur `sea_surface_temperature` mit dem Modell `era5_ocean` bei der Open-Meteo Marine API ab. Der reale Dienst beantwortet diese Kombination zwar formal erfolgreich, liefert für alle geprüften Referenzjahre und auch für das Küstenraster beim Iberostar Waves Creta Panorama jedoch vollständig `null`. Die bisherigen Regressionen ersetzten die Antwort durch künstlich vollständige Mockdaten und konnten diesen Produktionsfehler deshalb nicht erkennen. Der 80-km-Küstenradius und die Negativcache-Reparatur aus 0.9.66.5 waren korrekt, konnten aber keine Werte aus einem inhaltlich leeren Datenfeld erzeugen.

## Fachlicher Datenweg

- MID verwendet nun NOAA OISST v2.1, das tägliche, qualitätskontrollierte Meeresoberflächentemperaturfeld auf einem globalen 0,25°-Raster.
- Grundlage ist direkt das tägliche Langzeitmittel der klimatologischen Normperiode 1991–2020. Für jeden geplanten Reisetag wird der passende Kalendertag ausgewählt; der 29. Februar wird aus 28. Februar und 1. März interpoliert.
- Aus allen vollständigen Meereszellen wird die geografisch nächstgelegene gewählt. Das fachliche Küstenlimit bleibt 80 km. Fehlt innerhalb dieses Radius ein vollständiges Meeresgitter, erscheint keine erfundene Wassertemperatur.
- Für den gemeldeten Fall `Iberostar Waves Creta Panorama`, 18.–27.10.2026, ergibt der reale NOAA-Datensatz am Gitterpunkt 35,375° N / 24,625° E in 3,6 km Entfernung ein klimatologisches Mittel von 22,66 °C.

## Architektur, Cache und Darstellung

NOAA PSL stellt den OPeNDAP-Textdienst ohne Browser-CORS-Freigabe bereit. Deshalb ruft ein neuer, eng begrenzter Worker-Modus `travel-water-climate` ausschließlich den erforderlichen Zeit-/Raumausschnitt ab, verwirft Land-/Fehlwerte und liefert den versionierten Vertrag `mid.travel-water-climate.v1`. Ein Worker-Upload von 0.9.66.7 ist für diesen Datenweg zwingend; ein älterer Worker wird von der App ausdrücklich diagnostiziert und nicht als gültige SST-Antwort akzeptiert.

Der lokale Cache ist auf `noaa-oisst-1991-2020:v5` migriert. Nur valide positive SST-Ergebnisse werden langfristig gespeichert. Sauber fehlende Küstenwerte und technische Fehler bleiben wiederholbar. Die Karte zeigt weiterhin Grad Celsius gemäß dem appweiten Temperaturvertrag; Wind- und übrige Einheiteneinstellungen bleiben unverändert. Die Metrik benennt NOAA OISST und die Normperiode transparent.

## Absicherung

Die Regression `scripts/test-travel-water-noaa-oisst-09667.mjs` führt den echten Workerparser gegen ein deterministisches OPeNDAP-Raster aus. Sie prüft den konkreten Kreta-Zeitraum mit 22,45 °C im Testfeld, die exakte Kalendertagauswahl, die Schaltjahrinterpolation, die nächste gültige Meereszelle, den 80-km-Binnenlandausschluss, Version/Schema, Worker-Gesundheitsdienst und UI-Herkunft. Die bestehende Resilienzregression prüft zusätzlich positive Clientübernahme, fehlende Langzeitpersistenz negativer Ergebnisse, Wiederherstellung und die verständliche Diagnose eines älteren Workers.
