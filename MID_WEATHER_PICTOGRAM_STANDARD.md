# MID Wetterpiktogramm-Standard 2.0

Ab MID v0.9.78.0 ist `src/WeatherPictogram.tsx` der verbindliche appweite Darstellungsstandard für meteorologische Wetterzustände. Alte Emoji-Wetterzeichen und parallele Wettericon-Renderer dürfen in Forecast-, Tages-, Stunden-, Event-, Reise-, Wasser-, Berg-, Routen- oder Ensembleansichten nicht erneut eingeführt werden.

## Fachliche Grundlage

Die Symbolfamilie orientiert sich an der Phänomen- und Intensitätslogik der synoptischen WMO-Codierung (historisch FM 12 SYNOP, heute u. a. BUFR) sowie an den dazu konsistenten METAR/TAF-Present-Weather-Kürzeln. Die App verwendet weiterhin ihre kanonischen WMO-Wettercodes; zusätzlich kann `WeatherPictogram` dekodierte present-weather-Kürzel übernehmen.

Abgedeckt werden insbesondere:

- klar, überwiegend klar, teilweise bewölkt, bedeckt;
- Dunst, Nebel, Reifnebel und trockener Dunst;
- Sprühregen `DZ` in leicht / mäßig / stark;
- gefrierender Sprühregen `FZDZ`;
- Regen `RA` in leicht / mäßig / stark;
- gefrierender Regen `FZRA`;
- Regenschauer `SHRA` in mehreren Intensitäten;
- Schnee `SN` in leicht / mäßig / stark;
- Schneegriesel / snow grains `SG` als eigenes Symbol;
- Schneeschauer `SHSN`;
- Schneeregen und Schneeregenschauer als getrennte stratiforme bzw. konvektive Symbolik;
- Eiskristalle `IC`, Eiskörner `PL`, Graupel / small hail `GS` und Hagel `GR` mit klar unterscheidbaren Partikelformen;
- Gewitter `TS`, Gewitter mit Niederschlag sowie Hagelgewitter;
- Böenlinie `SQ` und Trichterwolke `FC` für dekodierte Beobachtungsprodukte.

Die Niederschlagsstärke wird nicht primär durch eine andere Farbe vermittelt, sondern durch Anzahl, Dichte, Größe und Strichstärke der Niederschlagselemente. Dadurch bleibt die Bedeutung auch bei eingeschränkter Farbwahrnehmung und in kleinen Darstellungen erhalten.

## Tag/Nacht

Jeder Wetterzustand besitzt eine eindeutige Tag-/Nacht-Darstellung. Bei Schauern und wechselnder Bewölkung ist Sonne bzw. Mond direkt sichtbar. Bei stratiformem Niederschlag, Schnee oder geschlossener Bewölkung bleibt der Tageszeitanker bewusst dezenter hinter der Bewölkung. Die `data-day-part`-Semantik bleibt für alle Größen erhalten.

## Hell- und Dunkelmodus

Die Vektorgeometrie ist identisch. Sämtliche relevanten Farben werden über `--wx-icon-*`-Tokens gesteuert. Der Hellmodus erhöht die Konturtrennung auf weißen Flächen; der Dunkelmodus erhält helle Wolken, kontrastreiche Niederschlagsarten und eine klar erkennbare Nachtkodierung. Ein separater Bildsatz ist nicht zulässig.

## Skalierbarkeit und Einsatz

`WeatherPictogram` bleibt echtes Inline-SVG mit `viewBox="0 0 68 68"` und wird ohne Rasterassets skaliert. `compact` reduziert den visuellen Schatten für kleine Zellen; `plain` entfernt nur die Hintergrundplatte und ist für Diagramme vorgesehen. Die meteorologische Kerngeometrie bleibt gleich, damit dasselbe Wetter appweit sofort wiedererkannt wird.

Verbindliche Einsatzorte sind mindestens:

- Aktuelles Wetter;
- Kurzfrist-/Nowcast-Streifen und 24-h-Profil;
- 7- und 14-Tage-Prognose;
- Ensembleansichten;
- Tages-/Stundendetails;
- Event- und Aktivitätenplanung;
- Reise- und Routenwetter;
- Wasser- und Bergsportmatrizen;
- Widgets und weitere kompakte Forecast-Zellen, soweit sie React/den gemeinsamen Fachkern verwenden.

Nicht meteorologische Bedienicons, Warnstufensymbole und astronomische Spezialdarstellungen sind davon getrennt. Sie dürfen Lucide- bzw. semantische Hazard-/Astronomie-Symbole verwenden, dürfen aber nicht als alternative Wetterzustands-Piktogramme auftreten.

## Architekturvertrag

1. Ein Wetterzustand wird fachlich zuerst im kanonischen Forecast-/Niederschlagspfad bestimmt.
2. `WeatherPictogram` visualisiert diesen Zustand; es darf die Wetterphase nicht eigenständig umdeuten.
3. WMO-Codes bestimmen bei Forecastdaten die Intensitätsklasse. Dekodierte SYNOP/BUFR/METAR-Meldungen dürfen `phenomenon` und optional `intensity` übergeben.
4. Sprühregen, Schneegriesel, gefrierende und gemischte Phasen bleiben voneinander unterscheidbar.
5. Niederschlagsintensität bleibt in Hoch-/Querformat, Desktop und iOS bei jeder vorgesehenen Größe erkennbar.
6. Neue Wetterphänomene werden ausschließlich in diesem zentralen Standard ergänzt; parallele Emoji- oder Asset-Renderer sind nicht zulässig.
