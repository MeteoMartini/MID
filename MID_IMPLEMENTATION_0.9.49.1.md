# MID Implementation v0.9.49.1

## Anlass

Plausibilitätsprüfung der in v0.9.49.0 eingeführten Event-Zeitraum-PoP anhand der Eventdetailanzeige.

## Ergebnis der Prüfung

Die große Event-PoP war bereits korrekt eine eigenständige Ensemble-Ereigniswahrscheinlichkeit für den vollständigen Start-/Endzeitraum. Sie wird aus den Niederschlagssummen der einzelnen Ensemblemitglieder im Eventfenster und der MID/DWD-nahen Schwelle >0,2 mm abgeleitet. Sie ist deshalb nicht das Maximum oder der Mittelwert der angezeigten Best-Match-Stunden-PoP.

Die Prüfung zeigte jedoch eine semantische Inkonsistenz in der Stundenanzeige: Open-Meteo weist `precipitation`, `rain`, `showers`, `snowfall` und `precipitation_probability` als Werte der vorangehenden Stunde aus. Die bisherige Eventzeitleiste behandelte den Zeitstempel dagegen wie einen Punktwert und nahm zusätzlich ±30 Minuten um Start und Ende auf. Dadurch konnte beispielsweise die bei 12:00 Uhr gelieferte PoP für 11–12 Uhr noch in einem Event ab 12:00 Uhr erscheinen.

## Korrektur

- Die Eventzeitleiste arbeitet nun mit echten Zeitintervallen `[vorheriger Zeitstempel, Zeitstempel]`.
- Nur die tatsächliche Überdeckung dieses Intervalls mit Start und Ende des Events wird berücksichtigt.
- Niederschlagsmengen, Regen, Schauer, Schnee und Sonnenscheindauer werden bei Teilstunden proportional zur zeitlichen Überdeckung zugeschnitten; die Stunden-PoP bleibt die Wahrscheinlichkeit des ausgewiesenen Teil-/Stundenintervalls.
- Die Karten werden als Intervalle (z. B. `12:00–13:00`) beschriftet.
- Die große PoP wird sichtbar als `Zeitraum` gekennzeichnet und die Niederschlagskachel zeigt Start und Ende des ausgewerteten Events.
- Der Niederschlagssummen-/Fallbackpfad verwendet dadurch dieselben Eventgrenzen wie die Ensemble-Zeitraumwahrscheinlichkeit.

## Interpretation

Ein Wert wie `Zeitraum 25 %` bei stündlichen Best-Match-PoPs von beispielsweise 24 % und 20 % ist weiterhin möglich, weil Zeitraum-PoP und Stunden-PoP aus unterschiedlichen probabilistischen Datenbasen stammen. Die Oberfläche macht diesen Unterschied nun explizit.

## Worker

Keine funktionale Worker-Änderung; lediglich Versionssynchronisierung auf v0.9.49.1.
