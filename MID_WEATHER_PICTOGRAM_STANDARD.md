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

Jeder Wetterzustand besitzt eine eindeutige Tag-/Nacht-Darstellung. Sonne bzw. Mond wird dort sichtbar kombiniert, wo der Himmelzustand fachlich Teil des Symbols ist – insbesondere bei wechselnder Bewölkung und Schauern. Bei stratiformem Regen/Schnee, Nebel oder geschlossener Bewölkung wird kein künstlicher Sonnen-/Mondrest hinter das Phänomen gelegt; die Tageszeit bleibt technisch über `data-day-part` erhalten und wird nur dort grafisch gezeigt, wo sie meteorologisch sinnvoll unterscheidet.

## Hell- und Dunkelmodus

Die Vektorgeometrie ist identisch. Sämtliche relevanten Farben werden über `--wx-icon-*`-Tokens gesteuert. Der Hellmodus erhöht die Konturtrennung auf weißen Flächen; der Dunkelmodus erhält helle Wolken, kontrastreiche Niederschlagsarten und eine klar erkennbare Nachtkodierung. Ein separater Bildsatz ist nicht zulässig.

## Skalierbarkeit und Einsatz

`WeatherPictogram` bleibt echtes Inline-SVG mit `viewBox="0 0 68 68"` und wird ohne Rasterassets skaliert. Der verbindliche Standard ist **standalone**: Das Wetterzeichen selbst besitzt keine eingebaute quadratische/abgerundete Sky-Plate. `plain=true` ist deshalb der Default; zusätzlich unterdrückt das appweite CSS jede alte `mid-weather-skyplate`. Falls eine Oberfläche einen Chip oder eine Kachel benötigt, stammt deren Hintergrund ausschließlich vom umgebenden UI-Container und niemals aus einer zweiten Wettericon-Grafik. `compact` reduziert nur Schatten/Detailgrad für kleine Zellen. Die meteorologische Kerngeometrie bleibt gleich, damit dasselbe Wetter appweit sofort wiedererkannt wird.

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


## Verbindliche Präzisierung v0.9.78.1 – Screenshot-3-Lock und Phasenkohärenz

Das in MID 17.7.14 freigegebene **Weather Icon System 2.0** ist die verbindliche visuelle Referenz für die gesamte App. Daraus folgen zusätzlich:

1. Hauptwetterglyphen werden ohne eingebettete quadratische Hintergrundplatte dargestellt. Ein umgebender UI-Chip darf existieren, darf aber nicht Teil des Wetterzeichens sein.
2. Tages-/Nacht-, Hell-/Dunkel- und Größenvarianten verwenden dieselbe zentrale SVG-Geometrie und dieselben `--wx-icon-*`-Tokens. Separate alte Bildsätze sind unzulässig.
3. Tagescharakter, Regimebezeichnung und Piktogramm müssen fachlich kohärent sein. `Regenschauer` darf beispielsweise nicht aus einem rohen, nur bewölkten `hour.code` ein identisches Wolkensymbol wie ein trockener Tag erhalten. Repräsentative Forecast-Piktogramme verwenden deshalb die kanonische Niederschlagsphase aus `precipitationParts(...).displayCode`; der fachliche Tages-Fallback darf eine reine Sky-Code-Repräsentation übersteuern.
4. Sprühregen, Regen, Schauer, Schnee, Schneegriesel, Schneeschauer, gefrierende/mischförmige Niederschläge, Graupel, Hagel und Gewitter bleiben eigenständige Symbolfamilien. Intensität wird geometrisch über Dichte/Anzahl/Strichgewicht transportiert.
5. Neue Komponenten dürfen Wetterzustände ausschließlich über `WeatherPictogram` darstellen. Wird eine neue Wetterquelle eingebunden, wird ihre Semantik zuerst in den kanonischen Forecast-/Niederschlagspfad übersetzt und erst danach gerendert.

Required Regression: `scripts/test-weather-pictogram-ui-lock-09781.mjs`.

## Verbindliche Präzisierung v0.9.78.9 – visueller Form-Lock gegen Legacy-Anmutung

Die diagnostische Wolkenhöhen-/Wolkenformanalyse bleibt fachlich erhalten, darf aber die **primäre Wetterzustands-Glyphe nicht mehr in eine andere Symbolfamilie umformen**. Genau dies hatte dazu geführt, dass z. B. ein regnerischer oder bedeckter Tag je nach H/M/L-Bewölkung als wellige Cirrus-/Schichtwolkenform erschien und dadurch trotz zentralem Renderer wie ein altes Piktogramm wirkte.

Ab v0.9.78.9 gilt deshalb zusätzlich:

- `data-cloud-layer` und `data-cloud-form` bleiben reine meteorologische Diagnostik.
- Die sichtbare Hauptform wird über einen zentralen **visuellen Form-Lock** bestimmt.
- Bedeckt verwendet die klare geschlossene Wolkenform des Weather Icon System 2.0.
- Stratiformer Regen, Sprühregen, Schnee, Schneeregen, gefrierender Niederschlag, Schneegriesel, Eiskörner, Graupel und Hagel verwenden eine einheitliche Niederschlagswolke mit jeweils eigenständigen Partikeln und Intensitäten.
- Schauer verwenden eine konvektive Haufenwolke mit Tag-/Nacht-Himmelskörper, Gewitter die Cumulonimbus-Familie.
- Dunst, Nebel und Reifnebel werden als eigenständige Linien-/Eissymbolik **ohne zusätzliche Wolke** dargestellt.
- Höhenwolken-Diagnostik darf in Detail-/Wolkenprofilen weiterhin ausgewertet werden, aber niemals die primäre Forecast-Glyphe in 7/14 Tagen, Kurzfrist, Ensemble, Event, Reise, Route, Wasser oder Widget ersetzen.
- Bedien- und Parametericons werden aus dem MID/Lucide-Designsystem bezogen; Emoji-basierte alternative Wetterzustandsrenderer bleiben verboten.

Damit ist Screenshot 1 („Weather Icon System 2.0“) nicht nur als Renderername, sondern als sichtbare, appweit wiedererkennbare Symbolfamilie festgeschrieben.
