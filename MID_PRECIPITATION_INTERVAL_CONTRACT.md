# MID · Niederschlags-Intervallvertrag

Stand: v0.9.78.10 · 03.09.2026

## Zweck

Dieser Vertrag trennt appweit **Zeitpunktwerte** von **Akkumulations-/Wahrscheinlichkeitsintervallen**. Er verhindert insbesondere, dass bereits vergangene Niederschlagsmengen am linken Rand eines „ab jetzt“-Diagramms erneut als Zukunft erscheinen oder Radar-Nowcast gegen das falsche Stundenfenster geprüft wird.

## 1. Provider-Semantik

Für Open-Meteo-Stundenfelder gelten `precipitation`, `rain`, `showers`, `snowfall` als **Summe der vorangegangenen Stunde**. `precipitation_probability` bezieht sich ebenfalls auf die **vorangegangene Stunde**. Der Zeitstempel ist damit das **Intervallende**.

DWD MOSMIX `RR1c` ist analog die Gesamtniederschlagsmenge der **letzten 1 Stunde**. MID richtet Best Match, MOSMIX, RUC und Radar deshalb auf dieselben rückblickenden Intervallgrenzen aus.

Instantane Größen wie Temperatur, Taupunkt, Wind, Luftdruck, Bewölkung und Wettercode bleiben Punktwerte am jeweiligen Zeitstempel.

## 2. Kanonische Grenzen

Für einen Stundenwert mit Zeitstempel `T` gilt:

`Niederschlagsintervall = [T − 60 min, T]`

Für einen 15-Minuten-Wert entsprechend:

`Niederschlagsintervall = [T − 15 min, T]`

Die frühere zentrierte Zuordnung `[T − Δt/2, T + Δt/2]` ist für Akkumulationsfelder verboten.

## 3. „Ab jetzt“-Darstellung

Ein Wetterprofil, das um `now` beginnt, darf keinen Niederschlagswert eines bereits vollständig beendeten Intervalls als Zukunft anzeigen.

Schneidet `now` das erste Akkumulationsintervall, wird nur dessen **noch zukünftiger Anteil** bilanziert. Wo finalisierte 15-Minuten-Daten vorliegen, werden diese für das erste Nowcastfenster verwendet und anschließend zu Stundenintervallen zusammengefasst. Erst danach wird auf finalisierte Stundenwerte zurückgefallen.

Niederschlagsbalken und PoP liegen geometrisch auf ihren tatsächlichen `[Start, Ende]`-Intervallen; Temperatur-/Wind-/Druckkurven bleiben an ihren instantanen Zeitpunkten.

## 4. Radar versus NWP

Im direkten Radarhorizont besitzt die beobachtete/advectierte lokale Niederschlagslage Vorrang vor einer ungestützten deterministischen Modellmenge:

- Standorttreffer: Radar und Modell werden qualitäts-/leadtimeabhängig geblendet.
- Echo nur in unmittelbarer Umgebung, aber **kein Standorttreffer**: die PoP darf erhöht bleiben, die Standortmenge wird jedoch bei belastbarer lokaler Trockenstrecke deutlich gedämpft.
- belastbar trockene Radarstrecke: auch große NWP-Mengen >1 mm dürfen den Radar-Abgleich nicht umgehen.
- jenseits des direkten Nowcastfensters läuft das Gewicht weich zurück zum NWP; kein hartes Mengen-Capping.

Damit bleiben **Eintrittswahrscheinlichkeit** und **Menge am Standort** getrennte Größen. MID berechnet insbesondere nicht `PoP × deterministische Menge` als angezeigte Niederschlagsmenge.

## 5. Tagesaggregation

Für den laufenden Tag summiert MID nur Niederschlagsintervalle, die nach `now` liegen. Ein von `now` angeschnittenes erstes Stundenintervall geht nur mit seinem noch zukünftigen Zeitanteil in die Resttagesmenge ein. Temperatur-Minima/-Maxima werden davon nicht verändert.

## 6. Hyperlokale Assimilation

Beobachteter Niederschlag wird gegen das **Akkumulationsintervall, das `now` enthält**, verglichen. Punktwerte wie Temperatur/Wind/Druck dürfen weiterhin gegen den zeitlich nächsten/interpolierten Modellzeitpunkt geprüft werden.

## 7. Regression

Verbindliche Regression: `scripts/test-precipitation-trailing-interval-nowcast-097810.mjs`.
