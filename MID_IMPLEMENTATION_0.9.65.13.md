# MID 0.9.65.13 – Reise-SST und Event-Sonnenschein

## Reiseplaner

Die bisherige SST-Nachladung konnte bei Küstenzielen unsichtbar bleiben, weil ein sehr großer stündlicher ERA5-Abruf für die komplette Referenzperiode 1991–2020 nach dem eigentlichen Reiseergebnis ausgeführt wurde. Außerdem konnten negative Ergebnisse des ersten Wasserklimacaches langfristig erhalten bleiben.

MID verwendet nun eine kompakte historische Klimastichprobe: Für die Kalendertage des gewählten Reisezeitraums werden kleine `sea_surface_temperature`-Ausschnitte aus acht gleichmäßig über 1991–2020 verteilten ERA5-Referenzjahren am bevorzugten Meeresgitter geladen. Mindestens vier erfolgreiche Referenzjahre sind für eine Anzeige erforderlich. Aktuelle Marinewerte werden nicht verwendet. Der Cachevertrag wurde auf `v2` angehoben, damit alte negative v1-Ergebnisse nicht weiterwirken.

Beim ersten Ergebnis wird die SST-Auswertung vor dem Rendern des Reiseergebnisses abgeschlossen. Alternative flexible Zeitfenster werden weiterhin bei Auswahl nachgeladen und gecacht.

## Events / Aktivitäten

Die in 0.9.65.5 eingeführte fachliche Sonnenscheindauer bleibt vollständig erhalten, wird aber wieder an die Informationshierarchie angepasst. Die kompakte Event-Center-Zeile zeigt wie zuvor nur Temperatur, Niederschlagsart/-wahrscheinlichkeit, Wind und Böen. Sonnenscheindauer bleibt in den ausführlicheren Wetter-/Ratansichten.

Der Einheitenvertrag wird präzisiert: Ein stündliches oder auf eine Teilstunde zugeschnittenes Event-Zeitfenster zeigt Sonnenscheindauer in `min`. Die über das gesamte mehrstündige Ereignis summierte Sonnenscheindauer ist dagegen ein Zeitraumaggregat und wird in `h` mit höchstens einer Nachkommastelle ausgegeben.

## Regression

`scripts/test-travel-water-event-sunshine-096513.mjs` schützt die SST-Cachemigration, die historische Meeresgitterquelle, das Rendern der Wassertemperatur mit dem ersten Reiseergebnis sowie die Trennung zwischen kompakter Eventübersicht und Detaildarstellung einschließlich Minuten-/Stundenvertrag.
