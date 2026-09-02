# MID – verbindlicher Parameter-Farbvertrag

Stand: v0.9.77.15

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

- Die 7-/14-Tage-Übersichten stellen Tmin wieder in einem kleinen bläulichen und Tmax in einem kleinen rötlichen Kästchen dar. Die Kästchen bleiben kompakt und dürfen die Tageskarten nicht verbreitern.
- Bereits kleine signierte Klimaabweichungen von etwa ±0,5 bis ±1 K müssen sichtbar auf Zahl-, Hintergrund- und Rahmenintensität reagieren. Eine nichtlineare Kennlinie darf große Abweichungen sanft sättigen, damit kleinere Abweichungen nicht optisch untergehen.
- Tmin bleibt unabhängig vom Vorzeichen ausschließlich blau, Tmax ausschließlich rot. Kurzfristige/stündliche Einzeltemperaturen bleiben weiterhin neutral und erhalten keine Tmin-/Tmax-Kästchen.
