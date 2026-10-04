# MID – verbindlicher Parameter-Farbvertrag

Stand: v0.9.85.160

## Vorrangiger Zusatzvertrag v0.9.85.160

Die in Einstellungen gespeicherte Option ECMWF-Temperaturfarben gilt für 7d-Tageswerte, Wertebereich und stündliche Temperaturkurve. Ausgeschaltet: Tmin blau, Tmax rot, Kurve Temperaturrot aus den 24h-Parametertokens. Eingeschaltet: dieselbe zentrale wertbasierte ECMWF-Palette für Werte und Kurve; keine Klimadelta-Beschriftung. Widget und URL/PNG behalten ihren expliziten Farbschalter und verwenden denselben Renderer. 14d bleibt unverändert.

Der zentrale Linienvertrag src/parameterLineStyle.ts bestimmt bei 24h-Profil und aufgeklapptem 7d-Tagesdetail Farbe, Strichmuster, Linienstärke, Rundung und Deckkraft. Die temperaturbezogene ECMWF-Option färbt keine anderen Parameter um. Quantilband, Skybar und astronomische Nachtflächen bleiben unabhängig von der Farboption erhalten.

UTCI behält den vor MID-C15 vorhandenen 24h-Goldton (#d6c7a4 dunkel, #8a6d3d hell) über den gemeinsamen --apparent-line-Token. Dies korrigiert die unbeabsichtigte Temperatur-/Textmischung aus .157; die ältere Aussage „Keine Gold-Ersatzpalette“ ist hiermit ersetzt. Linie, Auswahlpunkt und Legende konsumieren denselben Token.

Dieser Vertrag ist appweit verbindlich. Er gilt für Browser/PWA und den gemeinsamen iOS-/Capacitor-Fachkern, auf Desktop, Tablet und Smartphone sowie im Hoch- und Querformat. Ein meteorologischer Parameter behält in Karten, Diagrammen, Tageswerten, Legenden, Tooltips, Selektoren und kompakten Übersichten dieselbe visuelle Grundidentität.

## Kanonische Parameterfarben

Die alleinigen Basisfarben liegen in `src/styles-src/00-foundation.css`:

- Temperatur allgemein: `--param-temperature`
- Tmin: `--param-temperature-min`
- Tmax: `--param-temperature-max`
- Niederschlag: `--param-precipitation`
- Luftdruck: `--param-pressure`
- Wind: `--param-wind`
- Böen: `--param-gust`
- Bewölkung: `--param-cloud`
- Sonnenscheindauer: `--param-sunshine`
- relative Feuchte: `--param-humidity`
- Taupunkt: `--param-dewpoint`
- Schnee: `--param-snow`

Hell-/Dunkelmodus dürfen die Werte dieser zentralen Tokens ändern, nicht jedoch Komponenten eigene Ersatzpaletten definieren.

## Verbindliche Verwendung

1. Linien, Punkte, Balken, Zahlen, Icons, Legendenmuster und Tooltip-Marker eines Parameters verwenden den zugehörigen Token oder eine über `color-mix()` daraus abgeleitete Variante.
2. Ein Modul darf für denselben meteorologischen Parameter keine lokale Basisfarbe einführen. Lokale Aliasvariablen sind nur zulässig, wenn sie unmittelbar auf den kanonischen `--param-*`-Token zeigen.
3. Temperaturidentität bleibt an die Parameterrolle gebunden: Tmin verwendet ausschließlich Blautöne aus `--param-temperature-min`, Tmax ausschließlich Rottöne aus `--param-temperature-max`, eine allgemeine Temperaturkurve `--param-temperature`. Bei einzelnen Tmin-/Tmax-Werten dürfen Zahlfarbe, kleiner Hintergrund und Rahmen innerhalb der jeweils festen Blau-/Rot-Familie anhand der Abweichung vom zugehörigen Klimamittel variieren; die Farbfamilie darf niemals wechseln. Kurzfristige und aktuelle Einzeltemperaturen (einschließlich „Nächste 90 Minuten“ und stündlicher Tagesdetails) werden neutral in `var(--text)` dargestellt, also im Hellmodus dunkel/schwarz und im Dunkelmodus hell/weiß. Blau/Rot bleibt ausschließlich den Tagesextrema Tmin/Tmax vorbehalten.
4. Klimaabweichung, thermisches Empfinden, Wetterregime, Niederschlagsphase und Warnstufe sind eigene semantische Kanäle. Sie dürfen eigene Farben verwenden, wenn die Darstellung diesen Zusatzinhalt ausdrücklich kennzeichnet und dadurch die Parameteridentität nicht ersetzt.
5. Windpfeile verwenden ohne Warnschwelle `--param-wind`. Sobald die jeweils geltende DWD-/MID-Böenwarnschwelle erreicht ist, codiert der Pfeil verbindlich I1–I4 über die zugehörige Warnfarbe. Diese Warnfarbübersteuerung gilt appweit in Kurzfrist, Tagesdetail, 7d, 14d, 24-h-Profil, Karten-/Kompaktansichten und Tooltips.
6. Niederschlagsart wird bevorzugt über Symbolik/Text unterschieden. Eine generische Niederschlagsmenge bzw. -wahrscheinlichkeit bleibt in der Niederschlagsfarbe.
7. Responsive Layout, Geräteausrichtung, Export und Touch-/Hover-Zustand dürfen die Parameteridentität nicht verändern.

## Verbindliche Referenzansichten

Insbesondere geschützt sind das 24-h-Wetterprofil, die 7-Tage-Tagesansichten samt aufgeklappten Tagesdetails, das 14-Tage-Ensemble, Trend 14d+, Meteogramm und Prognose-Cockpit.

## Zusatzvertrag v0.9.77.12

- 24-h- und Tagesdetaildiagramme dürfen keine hart codierten Ersatzfarben für Temperatur, Taupunkt, Niederschlag, Wind, Böen oder Luftdruck verwenden.
- Die blaue Auswahl-/Zeitlinie ist eine Interaktionsfarbe und verändert die Parameterfarbe der Werte nicht. Werte an dieser Linie müssen durch kontrastierte, parametergleich eingefärbte Beschriftungsflächen lesbar sein.
- Temperaturkurven zeigen nicht an jedem Stundenwert einen Punkt. Sichtbare Marker sind auf Auswahlpunkt sowie meteorologisch sinnvolle Extrema/Interaktionspunkte zu begrenzen.

## Zusatzvertrag v0.9.77.15

- Aktuelle/stündliche Temperaturwerte besitzen keine klimatologische Blau-/Rot-Tönung mehr. Ihre Zahlendarstellung ist neutral; Klimainformation darf dort nur textlich oder in ausdrücklich separat gekennzeichneten Klimaelementen erscheinen.
- Tmin bleibt ausschließlich in der blauen Farbfamilie. Zahl, kleiner Hintergrund und Rahmen folgen der signierten Abweichung vom klimatologischen Tmin: kälter = kräftiger/dunkler, Klimamittel = mittlere Referenzstufe, milder = hellere/entsättigte Blautönung.
- Tmax bleibt ausschließlich in der roten Farbfamilie. Zahl, kleiner Hintergrund und Rahmen folgen der signierten Abweichung vom klimatologischen Tmax: kühler = hellere/entsättigte Rottönung, Klimamittel = mittlere Referenzstufe, wärmer = kräftiger/dunkler.
- Die Skala wird kontinuierlich zwischen den Referenzpunkten interpoliert und bleibt in Hell-/Dunkelmodus sowie Hoch-/Querformat identisch semantisch.


## Zusatzvertrag v0.9.77.25

- Die 7-/14-Tage-Übersichten stellen Tmin/Tmax weiterhin in kompakten farblich unterscheidbaren Kästchen dar. Die Hintergrundflächen sind bewusst schwach getönt, damit die Zahlen auch bei thermischen Extremen klar lesbar bleiben; die Kästchen dürfen die Tageskarten nicht verbreitern.
- Im 14-Tage-/Ensemblebereich müssen bereits kleine signierte Klimaabweichungen von etwa ±0,5 bis ±1 K sichtbar auf Zahl-, Hintergrund- und Rahmenintensität reagieren. Die Hintergrund- und Rahmenreaktion bleibt gegenüber v0.9.77.25 bewusst gedämpft; eine nichtlineare Kennlinie darf große Abweichungen sanft sättigen. Im 7-Tage-Modus gilt stattdessen ausschließlich die absolute ECMWF-Temperaturfarbskala ohne Klimadelta.
- Tmin bleibt unabhängig vom Vorzeichen ausschließlich blau, Tmax ausschließlich rot. Kurzfristige/stündliche Einzeltemperaturen bleiben weiterhin neutral und erhalten keine Tmin-/Tmax-Kästchen.


## Zusatzvertrag v0.9.78.1 – 7-Tage-ECMWF-Temperaturskala

Dieser Absatz **ersetzt für die 7-Tage-Ansicht** die ältere v0.9.77.25-/v0.9.77.28-Regel, nach der Tmin/Tmax dort als klimaabweichungsabhängige Blau-/Rot-Kästchen dargestellt wurden. Die 14-Tage-/Ensemble-Klimaabweichungsdarstellung bleibt davon unberührt.

- Die 7-Tage-Kurvenübersicht und die 7-Tage-Tageskarten zeigen **keine Abweichungen zum Klimamittel** und keine `±K`-/`Δ`-Werte.
- Temperaturfarbe ist dort eine Funktion der **absoluten 2-m-Temperatur** nach der zentral in `src/temperatureTone.ts` definierten ECMWF-inspirierten Skala: kalt violett/blau, kühl cyan/grün, mild gelb, warm orange, heiß rot/dunkelrot.
- Die stündliche 7-Tage-Temperaturkurve erhält ihre Farbe punktweise aus derselben Skala. Tmin/Tmax-Werte und der Temperaturbereich jeder 7-Tage-Tageskarte verwenden dieselbe wertbasierte Farbidentität.
- Niederschlag bleibt `--param-precipitation`; Temperatur- und Niederschlagsdarstellung besitzen im 7-Tage-Kurvenblock eine **gemeinsame Stundenachse** und sind zeitlich deckungsgleich ausgerichtet.
- Die Regel gilt identisch für Hell/Dunkel, iPhone/iPad und Desktop sowie Hoch-/Querformat.

Required Regression: `scripts/test-seven-day-ecmwf-hourly-09781.mjs`.

## Zusatzvertrag v0.9.84.35 – Niederschlagsphase in der Tagesansicht

- Die **Parameteridentität Niederschlag** bleibt `--param-precipitation`. Insbesondere Niederschlagswahrscheinlichkeit, generische Niederschlagsmengen und nicht phasencodierte Niederschlagsindikatoren bleiben in dieser Blau-Familie.
- Wird die **Niederschlagsart ausdrücklich codiert** (Tagesdetail/Skybar/phasenspezifische Legende), ist dies ein zusätzlicher semantischer Kanal nach Regel 4. Dafür gelten zentral: Regen/Sprühregen/Schauer = `--param-precipitation`, Schnee/Graupel = `--param-precipitation-snow`, Misch-/gefrierende Phase = `--param-precipitation-mixed`, Gewitter/Graupel/Hagel = `--param-precipitation-storm`.
- Diese Phasenfarben liegen ausschließlich in `src/styles-src/00-foundation.css`; Diagramme, SVG-Muster und Legenden dürfen dafür keine konkurrierenden lokalen Basisfarben definieren.
- Intensität wird weiterhin primär über Balkenhöhe und ergänzend über Deckkraft/Kontur vermittelt. Die Farbfamilie darf sich mit der Intensität nicht ändern.
- Schauer bleiben in der **blauen Niederschlagsfamilie** und dürfen nicht als eigenständiger cyan/türkiser Parameter erscheinen. Gefrierender Regen/Schneeregen bleiben violett. Reine Schnee-/Eisphasen (einschließlich Eisnadeln, vereinzelten Schneesternen und Eiskörnern) bleiben hellblau. Hagel ist purpur und wird nicht wie Schnee hellblau dargestellt; Graupel ohne Gewitter bleibt hellblau und wird geometrisch/patternbasiert von Hagel unterschieden. Gewitter mit Graupel/Hagel bleibt als Gefahrenfamilie purpur, die Partikelform differenziert die feste Phase.
- Die gestrichelte Niederschlagswahrscheinlichkeitskurve bleibt unabhängig von der Niederschlagsphase in `--param-precipitation`, damit Wahrscheinlichkeit und beobachtete/erwartete Phase nicht miteinander verwechselt werden.

Required Regression: `scripts/test-day-precipitation-color-contract-098435.mjs`.

## Zusatzvertrag v0.9.85.148 – quantitative Rasterkarten

- Native DWD-Modellfelder und Niederschlagssummen dürfen als ausdrücklich beschriftete **relative Farbskala (Wertebereich)** ihre vorhandenen zentralen Paletten kontinuierlich über die gültigen Werte des vollständigen dargestellten Rasterfelds verteilen. Keine Quantilabschneidung, keine künstlichen Unterschiede bei konstanten Feldern. Dies ist keine Warnstufencodierung und ändert keine Parameterfarben in Prognosen oder Diagrammen.
- **Feste Skala** behält die absoluten Wert-Farb-Anker; Temperatur verwendet dafür die kanonische ECMWF-inspirierte Temperaturskala. Animationen verwenden verbindlich die feste Skala, damit gleiche Farben zwischen Terminen gleiche Werte bedeuten.
- Raster, sichtbare Legende und PNG-/SVG-Export verwenden dieselbe Skala und dieselbe kontinuierliche sRGB-Interpolation. Ab v0.9.85.149 werden die Grenzen in der gewählten Einheit nach außen gerundet. Dabei bleiben die unveränderlichen Feldwerte und alle absoluten Farb-Anker erhalten; im Wertebereich kann sich durch die gerundeten Grenzen die relative Farbzuordnung ändern. Die gemeinsame Skala gilt stets auch für Legende und Export.
- Kategoriale Wettercodes bleiben diskret. Trockene Niederschlagszellen bleiben transparent; fehlende Beobachtungszellen bleiben grau und dürfen weder den Wertebereich beeinflussen noch als trocken erscheinen.
- Originale WMS-Bilder behalten ihre Anbieterpalette, sofern keine verifizierten numerischen Rasterwerte vorliegen. Meteorologische Windfiedern behalten ihre standardisierte Symbolbedeutung; die erklärenden Zahlen folgen der gewählten Windeinheit.

Required Regression: `scripts/test-adaptive-native-maps-0985141.mjs` einschließlich der eingebundenen Einheiten-/Skalen- und Browserprüfung.

## Zusatzvertrag v0.9.85.157 – aufgeklappte 7d-Tagesdetails

Die gefühlte Temperatur/UTCI verwendet in 24h-Profil, Tagesdetail, Auswahlpunkt und Legende denselben zentralen `--apparent-line`-Token, abgeleitet aus Temperatur und Theme-Textfarbe. Keine lokale Gold-/Orange-Ersatzpalette, auch nicht im Kontrastmodus. Temperatur, Taupunkt, Druck, Niederschlagswahrscheinlichkeit, Wind und Böen behalten ihre vorhandenen kanonischen Tokens.

## v0.9.85.158 · sichtbarer 7d-/24h-Farbabgleich
Der ausdrückliche MID-C15-Auftrag ersetzt die ältere ECMWF-Sonderpalette der 7d-Tagesübersicht: Temperaturkurve und Legende verwenden --param-temperature, Tmin --param-temperature-min, Tmax --param-temperature-max. Tageskarten, klassische Liste und Kurvenkopf verwenden diese Rollen unabhängig vom Zahlenwert. Kartenprodukte und 14d-Farbkonventionen bleiben bestehen. Historische Strukturprüfungen werden auf diesen bewusst geänderten Vertrag aktualisiert; der Browservergleich prüft tatsächlich berechnete Farben, nicht nur SVG-Stopps.

7d-Tageszeilen: mittlerer Wind --param-wind; Böen ohne Warnstufe --param-gust; Niederschlagssymbol, -menge und Wahrscheinlichkeit --param-precipitation. DWD-Warnstufen behalten ihre semantischen Warnfarben. Die nicht gerenderte Wochenkurven-Halo-Regel entfällt; Bundle-Budgets bleiben unverändert. Die explizite ECMWF-Badgeoption des Präsentationsexports bleibt erhalten.

## v0.9.85.159 · mehrfach verwendete Diagramme
App, Widget und PNG-/URL-Export verwenden denselben SevenDayCurveOverview-Renderer, dieselben stündlichen Ensemble-Mitglieder und dieselbe Skybar-Einstellung. P25–P75 gilt nur mit mindestens sechs Mitgliedern aus mindestens zwei Modellfamilien; Datenlücken werden nicht überbrückt. Nachtflächen verwenden den gemeinsamen astronomischen Renderer mit eindeutigen Gradient-IDs. Die 90-Minuten-Skybar rendert die unveränderten `2.4 / 3.6 / 4.8 / 6.0` SVG-Einheiten jetzt ohne vertikale CSS-Stauchung ebenso dick wie das 24h-Profil.

Bei schmalen Geräten berücksichtigt der gemeinsame Skybar-Renderer zusätzlich den effektiven Skalierungsfaktor des 24h-SVGs. Die 90-Minuten-Ansicht erhält denselben Faktor; die vier physikalischen Stufen und alle übrigen Verbraucher bleiben unverändert. PNG-Aktionen warten in der Kurvenansicht auf den Ensembleabruf.
