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

## Verbindliche Präzisierung v0.9.78.16 – Mengenlesbarkeit aller Niederschlagsphasen

Die geometrische Intensitätsdarstellung gilt ausdrücklich für **alle** Niederschlagsformen, nicht nur für Regen. Leicht, mäßig und stark werden – soweit die meteorologische Codierung eine entsprechende Abstufung zulässt – über Partikelanzahl, Dichte, Größe und Strichgewicht unterschieden. Das umfasst insbesondere Regen, Sprühregen, Schnee, Schneegriesel, Schneeregen, Schneeschauer, Eiskristalle, Eiskörner, Graupel, Hagel sowie Gewitterniederschlag.

Für Forecastdaten hat die **finale kanonische MID-Niederschlagsmenge nach Fusion und Plausibilisierung** Vorrang vor einem eventuell zuvor erzeugten Intensitätscode. Die Niederschlagsphase bleibt unverändert; nur die sichtbare Intensitätsstufe wird auf die finale Menge rekalibriert. So kann ein ursprünglich leichter Regencode nach einer belastbaren finalen Starkregenmenge auch geometrisch als starker Regen erscheinen – und umgekehrt.

Niederschlagselemente müssen auch in kleinen Piktogrammen klar unterhalb der Wolkenkontur sichtbar bleiben. Die Unterscheidung darf nicht ausschließlich über Farbe erfolgen.

## Verbindliche Präzisierung v0.9.78.43 – Periodenkohärenz für Tag und Folgenacht

Zusammengefasste Piktogramme für einen ganzen Tag oder eine folgende Nacht dürfen nicht mehr aus einer beliebigen einzelnen Stunde abgeleitet werden. Für diese Einsatzorte ist `src/periodWeatherVisual.ts` der zentrale Periodenvertrag über dem gemeinsamen `WeatherPictogram`-Renderer.

- Das **Tagespiktogramm** einer 7-/14-Tage- oder vergleichbaren Tagesdarstellung folgt dem bereits aus Tageslichtfenster, Bewölkung, Sonnenscheindauer und Niederschlagsdominanz abgeleiteten `dayWeatherCharacter`. Damit darf ein als „Sonnig“ klassifizierter Tag nicht gleichzeitig nur wegen einer einzelnen stärker bewölkten Stunde als geschlossene Wolke erscheinen; ebenso darf ein dominanter Regenschauer nicht durch ein reines Sky-Symbol verdrängt werden.
- Ein zusätzliches, kleineres **Folgenacht-Piktogramm** wird ausschließlich aus den Stunden der auf den dargestellten Tag folgenden Nacht bestimmt. Es übernimmt nicht das Tagespiktogramm und verwendet auch nicht einfach den ungünstigsten Einzelstunden-Code.
- Für Nacht- und sonstige zusammengefasste Perioden werden Niederschlagsart, Dauer, Wahrscheinlichkeit und Menge gemeinsam bewertet. Ein Niederschlagsphänomen wird nur dann zum Periodenpiktogramm, wenn es zeitlich bzw. mengen-/wahrscheinlichkeitsseitig relevant ist; kurze Randereignisse dürfen den gesamten Zeitraum nicht irreführend dominieren.
- Ohne dominantes Niederschlags-/Nebelsignal wird die sichtbare Himmelsbedeckung aus der mittleren Periodenbewölkung bestimmt. Die mittleren Low-/Mid-/High-Cloud-Werte werden weiterhin als diagnostische Profilwerte an `WeatherPictogram` übergeben, verändern aber nicht den zentralen visuellen Form-Lock.
- Wo parallel eine Skybar existiert, müssen Tagescharakter, Periodenpiktogramm und Skybar denselben meteorologischen Stunden-/Phasenpfad repräsentieren. Kleine lokale Unterschiede sind nur zulässig, wenn sie aus der unterschiedlichen Semantik entstehen (Skybar = zeitlicher Verlauf, Piktogramm = zusammengefasster Charakter), nicht aus verschiedenen Datenquellen oder konkurrierenden Icon-Selektoren.

Damit gilt appweit: **ein Renderer (`WeatherPictogram`), ein Periodenaggregator (`periodWeatherVisual`), ein Tagescharakter (`dayWeatherCharacter`)**. Lokale Duplikate von Perioden-Icon-Selektoren sind nicht zulässig.

## Verbindliche Präzisierung v0.9.78.45 – Text-/Piktogramm-Kohärenz in Tageskarten

In 7-Tage-Tageskarten wird der **sichtbare Wetterbeschreibungstext** nicht mehr aus der groben Darstellungs-/Regimeklasse (`sunny`, `quiet`, `windy`, `warm` usw.) abgeleitet. Diese Klasse darf weiterhin Farbe und Kachelbetonung steuern, ist aber keine meteorologische Kurzbeschreibung.

- Sichtbarer Tagesbeschreibungstext = `dayWeatherCharacter(...).label`.
- Sichtbares Tagespiktogramm = `periodWeatherVisual(..., {preferFallbackCode:true})` mit genau demselben `dayWeatherCharacter` als führendem Signal.
- Das kleine Symbol in der Beschreibungspille verwendet denselben `dayVisual`-Code und dieselben Wolkenprofilwerte wie das große Tagespiktogramm.
- Ein Tag mit z. B. `Wolkig, oft sonnig` darf daher nicht mehr pauschal nur als `Sonnig` beschriftet werden; ebenso darf ein bedeckter, aber windiger Tag nicht allein als `Wind` erscheinen.
- Die Regimeklassifikation bleibt ausschließlich als sekundäre UI-/Farbmetadaten erhalten.

Damit gilt für Tageskarten zusätzlich: **Beschreibung und Hauptpiktogramm stammen aus demselben Tagescharakter; Regime ist nur Präsentationsmetadatum.**

## Verbindliche Präzisierung v0.9.78.46 – Niederschlags-Zeitslot und Piktogramm

Stündliche/unterstündliche Niederschlagspiktogramme müssen dieselbe Zeitbedeutung besitzen wie die daneben angezeigte Niederschlagsmenge und -wahrscheinlichkeit. Da Open-Meteo/DWD Akkumulationen intern am Intervallende liefern, gilt für die sichtbare Prognose der in `MID_PRECIPITATION_INTERVAL_CONTRACT.md` definierte Slotbeginn-Vertrag.

- Ein sichtbares Stundenfeld **08:00** beschreibt niederschlagsseitig **08:00–09:00 Uhr**.
- Menge, PoP, Regen-/Schauer-/Schneeanteile und die daraus abgeleitete Niederschlagsphase werden gemeinsam auf diesen Slot normalisiert.
- Temperatur, Wind, Bewölkung und andere instantane Felder bleiben am Zeitpunkt 08:00 verankert.
- Ein Regenpiktogramm um 08:00 darf deshalb nicht aus dem Rohintervall 07:00–08:00 stammen, während die sichtbare Menge bereits 08:00–09:00 meint – oder umgekehrt.
- Tages- und Folgenachtpiktogramme aggregieren die bereits auf sichtbare Slotbeginne normalisierten Niederschlagsstunden. Dadurch bleiben Piktogramm, Beschreibung, Skybar und Tages-/Nachtzuordnung auch über Mitternacht kohärent.

Der Roh-/Radar-/Verifikationspfad bleibt davon unberührt und arbeitet weiterhin mit den tatsächlichen endgestempelten Akkumulationsintervallen.

## Verbindliche Präzisierung v0.9.78.46 – Zeitkohärenz von Niederschlag und Piktogramm

Bei zeitpunktbeschrifteten Prognosen bedeutet ein sichtbarer Stundenzeitpunkt den **Beginn** des dargestellten Prognoseintervalls. Zeigt MID beispielsweise bei `08:00` Regen, gilt dieses Wettersignal für den Slot `08:00–09:00`. Niederschlagsmenge, Niederschlagswahrscheinlichkeit, Niederschlagsart/-phase und das daraus abgeleitete Wetterpiktogramm müssen immer dasselbe sichtbare Intervall repräsentieren. Die rückblickende Provider-Zeitstempelung darf nicht dazu führen, dass ein Niederschlagspiktogramm eine Stunde zu spät erscheint. Trockene Vorwärtsslots behalten den instantanen Himmelszustand des Slotbeginns; ein alter nasser Wettercode darf nicht ohne passende Anschlussakkumulation als zukünftiger Niederschlag weitergetragen werden. Bei 3-h-Aggregationen bezeichnet die sichtbare Zeit den Beginn des 3-h-Slots; das repräsentative Wetterpiktogramm wird aus den zum selben Slot gehörenden normalisierten Einzelstunden bestimmt.

Required Regression: `scripts/test-precipitation-forward-slot-presentation-097846.mjs`.
