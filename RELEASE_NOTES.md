# MID v0.9.85.133

## Niederschlag und Kurzfrist
- Radar-Zeitschritte, die technisch nicht ausgewertet werden konnten, werden nicht mehr als trockene 5-Minuten-Phasen dargestellt.
- Die Niederschlagsaussage oberhalb des Radar-Nowcasts berücksichtigt nun den gesamten 24-h-Prognoseverlauf und mehrere Niederschlagsphasen statt nur des ersten zusammenhängenden Abschnitts.
- Niederschlagsart und -intensität werden intervallgerecht bewertet: 15-Minuten-Mengen werden auf ihre tatsächliche Dauer bezogen. Ein hoher 15-Minuten-Wert kann deshalb nicht mehr als „leichter Sprühregen“ erscheinen.
- Frische lokale Niederschlagsbeobachtungen können die Niederschlagsart in der unmittelbaren Kurzfrist stützen, damit beobachtete Schauer nicht sofort durch einen widersprüchlichen Modellcode verdrängt werden.

## Pollenflug
- „Heute“ wird jetzt über das tatsächliche lokale Datum bestimmt; gestrige DWD-Zeilen können nicht mehr als heutige Prognose erscheinen.
- Angezeigt wird nach Möglichkeit der fachliche DWD-Produktstand statt lediglich der technischen Abrufzeit.
- Der Pollenabruf wird rund um Produktaktualisierungen schneller erneuert.

## Navigation
- Beim Neustart ist der zuletzt gewählte Hauptbereich maßgeblich. Ein veralteter Unterbereich darf ihn nicht mehr auf „Vorhersage“ zurücksetzen.
- Forecast-Horizon-Ereignisse dürfen nur innerhalb des tatsächlich aktiven Prognosebereichs persistieren.
