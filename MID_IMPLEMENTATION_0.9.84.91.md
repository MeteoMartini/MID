# MID v0.9.84.91 · Navigation, Komposit und RUC-Phasenintegration

## Ziel

Der Release korrigiert drei zusammenhängende Bedien-/Darstellungsprobleme und nutzt einen bereits vorbereiteten wissenschaftlichen RUC-Datenpfad produktiver: Die schwebende Bottom-Bar soll weniger aggressiv verschwinden, Komposit/Synoptik soll als Kernfunktion direkt auffindbar sein, die im Screenshot nur beschrifteten 500-hPa-Isohypsen müssen wieder als Linien erscheinen und die native ICON-D2-RUC-Niederschlagsphase soll den Radar-Phasenlayer unterstützen.

## Bottom-Bar und Informationsarchitektur

- Primärziele auf kompakten Web-/PWA-Viewports: **Kurzfrist · 7 Tage · 14 Tage · Komposit · Mehr**.
- Das frühere experimentelle Beta-„Aktuell“-Dashboard ist vollständig aus React und CSS entfernt. Das kanonische **Aktuelle Wetter** bleibt unter **Mehr → Überblick** erreichbar.
- `Komposit` ist als eigener Primärtab direkt erreichbar.
- `Mehr` bündelt die früheren Kopfzeilen-Schnellaktionen: Favoriten/Profile, Benachrichtigungen, Einstellungen, Wetterzwilling und Updates.
- Scroll-Autohide reagiert erst nach 104 px kumulierter Abwärtsbewegung; ab 10 px Aufwärtsbewegung wird die Bar wieder vollständig eingeblendet. Oberhalb von 160 px Seitenposition bleibt sie sichtbar.
- Im minimierten Zustand bleibt ein ca. 13 px hoher Glass-Rand mit 42×4-px-Griff sichtbar und antippbar. Damit ist das Verschwinden als Navigationseffekt erkennbar und kein scheinbarer UI-Ausfall.
- Navigation zu einem Ziel oder Öffnen von **Mehr** stellt die Leiste unmittelbar wieder her.

## Synoptik / 500-hPa-Isohypsen

Die vorhandenen gpdm-Labels belegten bereits, dass Konturgeometrie und Werte geliefert wurden. Der sichtbare Fehler lag im Renderingpfad: Linien liefen über einen separat erzeugten Leaflet-SVG-Renderer, während die Beschriftungen im normalen Pane verblieben. Dieser Sonderrenderer ist entfernt.

- Polyline und Beschriftung verwenden jetzt gemeinsam `mid-model-lines`.
- Der vorgesehene geglättete MID-Vektorpfad bleibt erhalten.
- Isohypsen bleiben Gold/Amber und gestrichelt (`9 5` für Zwischenlinien, `18 7` für Hauptlinien).
- DWD-Isobaren bleiben separat/nativ nutzbar.

## Komposit-Persistenz und Textbereinigung

- Änderungen an Hauptansicht, Layern, Basiskarte, Modelllinien, Opazitäten, Zeitanzeige und Abspielgeschwindigkeit werden ohne 180-ms-Verzögerung direkt persistiert. Dadurch gehen schnelle Änderungen beim Verlassen des Moduls nicht mehr verloren.
- Die Basiskartentexte wurden auf `Standard` bzw. `OSM` verdichtet; der für Anwender unnötige Hinweis „schlüsselfrei“ ist entfernt.
- Gespeichert wird weiterhin kein Zeitstempel/Frame: Beim Wiedereinstieg wird der aktuelle Stand geladen, aber mit der zuletzt gewählten Layer-/Darstellungskonfiguration.

## Native ICON-D2-RUC-Niederschlagsphase im Radar

Der bestehende RUC-Preprocessingpfad erzeugt bereits einen 15-Minuten-Phasenblock aus `RAIN_GSP`, `SNOW_GSP` und `GRAU_GSP`. v0.9.84.91 bindet diesen Datenblock erstmals in den Radar-Phasenlayer ein.

- Worker wählt den zeitlich nächsten nativen `phase15`-Stand (Toleranz 20 min).
- Das vorhandene RUC-Lookup wird auf das 13×19-Punktgitter des Radar-Phasenlayers projiziert.
- Die Pages-Chunks werden über den vorhandenen immutable Chunk-Cache gelesen; damit entstehen trotz 247 Zielpunkten nur wenige tatsächliche Chunk-Fetches, wenn die Punkte im selben Datenblock liegen.
- Mindestens 72 % der Rasterpunkte müssen einen gültigen RUC-Phasenwert besitzen; andernfalls wird der RUC-Zusatz verworfen und der bisherige Fallback verwendet.
- `RAIN_GSP`, `SNOW_GSP` und `GRAU_GSP` priorisieren Regen/Schnee/Graupel bzw. Mischphase.
- Für potenziell gefrierende Phase bleiben Wet-Bulb-, Schneefallgrenzen- und Freezing-Level-Informationen wichtig, weil ein `RAIN_GSP`-Signal allein keinen gefrierenden Regen beweist.
- Nichtflüssige Phasensymbole werden weiterhin nur über einem realen OPERA-Echo gerendert. RUC erzeugt also keine künstlichen Niederschlagsflächen.
- Fehlt der native RUC-Block, bleibt der bisherige Rapid-/Regionalmodellpfad vollständig erhalten.

## RUC-Ausbauentscheidung

Ein pauschales Verdichten aller RUC-Felder ist nicht sinnvoll. Bei 542.040 Punkten verursacht **ein einziges** zusätzliches int16-Feld bereits ungefähr:

- +0…6 h / 15 min (25 Zeitstände): 25,85 MiB pro Lauf,
- +0…14 h / 15 min (57 Zeitstände): 58,93 MiB pro Lauf,
- +0…6 h / 5 min (73 Zeitstände): 75,47 MiB pro Lauf.

Allein die Verlängerung eines einzelnen 15-Minuten-Feldes von 6 auf 14 h kostet rund 33,08 MiB zusätzlich. Deshalb bleibt der Schwerpunkt auf parameter-nativer Auflösung statt künstlicher Gleichverdichtung.

Empfohlene nächste Kandidaten sind – nur wenn ein konkreter Nutzer-/Forecastnutzen nachgewiesen ist – `SNOWLMT`, `HZEROCL`, `CEILING` bzw. kompakte abgeleitete Klassen. Für die Niederschlagsphase wird **keine 5-Minuten-Interpolation erfunden**: die DWD-Modelldokumentation weist RAIN_GSP/SNOW_GSP/SNOWLMT und weitere Phasen-/Diagnosefelder mit 15-Minuten-Ausgabe aus, während die Niederschlagsmenge selbst auf 5-Minuten-Timing verdichtet werden kann.

## Worker

Worker-Fachlogik wurde verändert (`dwdRucStaticPhaseGrid`, Radar-Phasenpayload). Ein Worker-Upload ist für diesen Release erforderlich.
