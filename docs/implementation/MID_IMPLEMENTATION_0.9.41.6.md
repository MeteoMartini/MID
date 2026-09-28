# MID 0.9.41.6 – Gemeinsamer Wetterpfad und Modellfamilienkonsistenz

## Ziel

Der neue Bereich **Wetterplaner & Events** darf fachlich keine eigene Vorhersage erzeugen. Dieselben Eingangsdaten sollen in MID zu denselben meteorologischen Aussagen führen. Gleichzeitig werden mehrere Auflösungen, Rapid-Cycle-Läufe, Seamless-Produkte und Postprocessing-Produkte eines Anbieters nicht als mehrere unabhängige Modellstimmen gezählt.

## Wetterplaner

`EventPlannerPanel` verwendet jetzt denselben Pfad wie die übrige Anwendung:

1. Open-Meteo Best Match als primärer Anker.
2. MID-Mehrmodell-Fusion über `loadForecastFusion()`.
3. `applyForecastFusionDays()` und `applyForecastFusionHours()`.
4. Bei zeitnahen Events Radar-/Nowcast- und Gewitterkorrektur über `applyOperationalNowcastHours()` und `applyConvectiveNowcastHours()`.
5. Niederschlagsart und Wettertitel über die zentrale `precipitationParts()`-Logik.

Damit werden insbesondere Sprühregen, Schauer, konvektiver Niederschlag und Phasenwechsel nicht separat vom restlichen MID bewertet.

## Unabhängige Modellfamilien

Die Forecast-Fusion transportiert nun `independenceGroup` und `consensusRole`. Für den Konsens wird je Vorhersagehorizont nur ein geeigneter Vertreter einer Unabhängigkeitsgruppe gewertet. Höher aufgelöste bzw. schnellere Varianten werden innerhalb ihrer sinnvollen Reichweite bevorzugt; gröbere Varianten derselben Familie dienen als zeitlicher/räumlicher Fallback.

Postprocessing-Produkte wie NBM oder MOSMIX werden nicht als unabhängige zusätzliche Modellstimme behandelt.

## Rapid Cycles

Rapid-Cycle-Modelle werden bevorzugt, wenn ihr Vorhersagehorizont das Zielzeitfenster umfasst. DWD ICON-D2-RUC und RUC-EPS werden nicht numerisch simuliert: solange kein geeigneter numerischer Datenadapter existiert, bleiben sie Verfügbarkeits-/Ausbaupfade.

## Ensemble und Schneefallgrenze

Mehrere Varianten derselben Familie teilen ihr Gewicht. Modellzahlen und Szenarioanteile beziehen sich auf unabhängige Gruppen. Für die Schneefallgrenze werden beispielsweise ECMWF IFS und AIFS gemeinsam als ECMWF-Familie aggregiert, bleiben in der Detaildarstellung aber nachvollziehbar.

## Cache-Migration

- Forecast-Fusion: `mid:forecast-fusion:v7:`
- Ensemble: `mid:ensemble:v12:`

Damit werden lokal gespeicherte Ergebnisse der früheren Gewichtungslogik nicht wiederverwendet.

## Regression

`scripts/test-model-family-consistency-09416.mjs` schützt die neue Familien-/Rapid-Cycle-Logik und die gemeinsame Wetterplaner-Plausibilisierung.
