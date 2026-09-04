# MID – 24-h-Wetterprofil: Story-Axis-Vertrag

## Zweck

Das 24-h-Wetterprofil erzählt den gesamten Verlauf auf genau einer gemeinsamen
Zeitachse. Wetterpiktogramme, Tages-/Nachtflächen, Sonnenereignisse,
Stundenraster, Messkurven, Wolkenbänder, Hazards und Auswahlcursor dürfen nicht
gegeneinander verschoben sein.

## Verbindliche Zeitgeometrie

- Das Fenster reicht gleitend von `jetzt` bis `+24 h`.
- `profileXForEpoch(epoch)` ist die einzige Abbildung von Zeit auf die
  horizontale Plotposition.
- Stundenpunkte, Sonnenauf- und -untergang verwenden diese Abbildung direkt.
- Wetterpiktogramme, Kurvenpunkte, Windpfeile und Zeitlabels verwenden die aus
  denselben Stundenpunkten abgeleitete X-Position.
- Das senkrechte Stundenraster und der aktive Auswahlcursor reichen vom oberen
  Wetterband bis einschließlich Hazards.
- 1-h- und 3-h-Modus verdichten nur die Darstellung; Zeitfenster und fachliche
  Werte bleiben unverändert.

## Temperatur und Extrema im 24-h-Fenster

- Die Temperaturkurve verwendet innerhalb des rollenden 24-h-Fensters immer die
  finale kanonische stündliche Reihe `displayHours`; die 1-h-/3-h-Umschaltung
  verändert nur die Interaktions- und Beschriftungsdichte, nicht den Verlauf der
  Temperaturkurve.
- Das sichtbare Maximum und Minimum werden direkt aus genau diesen stündlichen
  Kurvenpunkten im rollenden 24-h-Fenster bestimmt. Damit sind beide Extrema
  unabhängig von Kalendergrenzen immer an einem tatsächlich gezeichneten Punkt
  verankert.
- Direkt an der Kurve steht ausschließlich der gerundete Wert, z. B. `21°` und
  `15°`; die Begriffe Tmax/Tmin werden nicht zusätzlich in die Grafik geschrieben.
- Die fachliche Tageskonsistenz bleibt separat bestehen: `displayDays` wird bei
  vollständiger Stundenabdeckung weiterhin aus den Extrema derselben finalen
  `displayHours` abgeleitet.
- Beide Extremmarken bleiben auch im 3-h-Anzeigemodus sichtbar, weil ihre Position
  aus der vollständigen stündlichen Temperaturkurve und nicht aus dem ausgedünnten
  3-h-Raster bestimmt wird.

## Wolken

- Die Reihenfolge bleibt von oben nach unten: Gesamt, H, M, L.
- **Gesamtbewölkung wird im 24-h-Profil nicht mehr als viertes graues Zellenband gezeichnet.** An dieser Stelle steht jetzt **ein einzelner, unterschiedlich breiter Wetterstreifen** mit derselben `detailSkyBarSegments`-Grundlogik wie in der Tagesansicht: tagsüber verläuft er je nach Sonne/Wolken gelb bis grau; klare Nacht darf aussetzen, nächtliche Bewölkung erscheint grau. **Sonne und Bewölkung bilden ein farbreines Grundband:** gelb und grau schließen sich gegenseitig aus. Niederschlag verwendet fachlich passende eigene Farben auch für Schnee-, Misch- und Gewitterphasen und wird als separate, zentrierte Lage über das Grundband gezeichnet. Es findet keine Farbmischung mit Gelb/Grau statt; ist der Grundstreifen breiter als die Niederschlagslage, bleibt er seitlich sichtbar. Alle Teilstücke sind gerundet, ohne 3D-Unterlage oder seitliche Überlappung. Die Strichdicke bildet die jeweilige Ausprägung in vier abgestuften Breiten ab.
- Die Gesamt-Leiste verwendet weiterhin exakt dieselbe X-Zeitgeometrie wie alle übrigen Profilparameter; im rollenden Profil werden dafür die bereits über `profileXForEpoch` bestimmten Stundenpositionen an den gemeinsamen Helfer übergeben.
- H, M und L bleiben darunter als schmale, kontinuierliche horizontale Graubänder erhalten. Für diese drei Ebenen steuert 0…100 % ausschließlich die Opazität von weiß/transparent bis grau.
- Nachbarstunden werden in den H/M/L-Verlauf einbezogen, sodass Übergänge weich ein- und ausfaden.
- Im Diagramm gibt es keine rechte 0–100-%-Achse und keine ausgewählten Prozentwerte am rechten Rand.
- Exakte Prozentwerte bleiben in den Einzeldaten und Tooltips erhalten.
- Wertepillen am aktiven Auswahlcursor verwenden einen leicht transparenten Tooltip-Hintergrund, damit Kurven, Bänder und Raster darunter sichtbar bleiben; Textkontrast und Parameterfarben bleiben unverändert.

## Luftdruck

- Luftdruck besitzt eine eigene hPa-Bahn mit dynamischem Wertebereich.
- Die Kurve muss in beiden Themes mit mindestens 1,55 px Strichstärke und nahezu
  voller Deckkraft sichtbar sein.
- Der aktive Wert darf rechts an der Luftdruckbahn stehen; dies ist keine
  Wolkenachse.

## Responsive Darstellung

- Hochformat behält Diagramm und Einzeldaten untereinander bei.
- Kompaktes Querformat stellt Diagramm und Einzeldaten als Master-/Detailansicht
  nebeneinander dar.
- Beide Orientierungen verwenden denselben React/Vite-Fachkern; es gibt keinen
  separaten iOS-Darstellungspfad.

## Tagesansichtsbasierte grafische Hierarchie ab v0.9.76.10

- Das Profil wird in der verfügbaren Breite gezeichnet; auf Mobilgeräten wird kein
  künstlich überbreites SVG mehr auf die Bildschirmbreite herunterskaliert.
- Temperatur, thermisches Empfinden, Niederschlag, Wind/Böen, Luftdruck,
  Wolken und Hazards verwenden dieselben vertikalen Stunden-/3-h-Linien.
- Achsen besitzen eine einheitliche linke Parameter-/Einheitenspalte und sparsame
  Skalenwerte; Wolken bleiben weiterhin ohne Prozentachse.
- Der Windbereich zeigt die kanonischen `DWD_WIND_THRESHOLDS_KMH` aus der
  Tagesansicht als dezente farbige Schwellenbänder und Schwellenlinien. Die
  Skala reicht mindestens bis zur ersten DWD-Böenwarnschwelle.
- Nachtstunden werden über alle grafischen Parameterbahnen hinweg gemeinsam
  abgedunkelt. Die Nachtmarkierung verändert weder Daten noch Zeitgeometrie.
- Sonnenaufgang und Sonnenuntergang werden mit ihren exakten Epochen über
  `profileXForEpoch(event.epoch)` dezent markiert.
- `JETZT` ist die linke Kante des rollenden Fensters; eine dezente vertikale
  Jetzt-Linie und eine zweite, geometrisch identische Zeitreferenz am unteren
  Rand erleichtern das senkrechte Lesen.
- Diese Darstellung gilt unverändert im gemeinsamen Browser/PWA/iOS-React-Kern.

- Die 7-Tage-Kurvenübersicht stellt Nachtstunden wieder als zusammenhängende, themegeeignete Hintergrundbereiche dar und zeigt denselben gerundeten, farbreinen Wetterstreifen auf gemeinsamer Zeitachse. Das zuvor ergänzte P25–P75-Band um die Temperaturkurve ist ersatzlos entfernt.


### Verbindlicher Skybar-Farb-/Dickenvertrag

- Sonnenschein ist gelb, Bewölkung grau. Niederschlag verwendet eine eigene **phasenabhängige, farbreine Overlay-Farbe**: Regen/Sprühregen/Schauer blau, Schnee hellblau, Misch-/gefrierende Phase violett, Gewitter/Hagel purpur. Die Bedeutungen werden nicht über Mischfarben mit dem Grundband codiert.
- Ab **50 % Gesamtbewölkung** ist das Grundband grau. Der Bereich 50–100 % wird ausschließlich über **vier gleich definierte Dickenstufen** codiert.
- Unter 50 % Gesamtbewölkung ist das Grundband tagsüber gelb. Die vier Sonnendicken folgen der relativen Sonnenscheindauer bzw. – wenn diese nicht stärker ausfällt – dem Aufklarungsgrad 50 → 0 % Bewölkung.
- Bewölkung verwendet appweit in der Skybar einen **einheitlichen Grauton**; mehr oder weniger Bewölkung darf dort keine Grauton-/Opacity-Abstufung mehr erzeugen.
- Niederschlag liegt als eigener Overlay-Streifen über dem Grundband, übernimmt die verbindliche Niederschlagsart/-phasenfarbe und verwendet ebenfalls vier Dickenstufen nach der zeitnormalisierten Intensität. Die Dicke codiert Stärke, die Farbe Art/Phase.
- Die Dickenstufen sind gegenüber dem vorherigen Stand leicht verstärkt: `2.4 / 3.3 / 4.2 / 5.1` SVG-Einheiten. Auch auf dem iPhone wird die Tageskarten-Skybar nicht mehr auf 14 px Höhe verkleinert.
- Klare Nächte unter 50 % Bewölkung dürfen ohne Grundband bleiben. Gerundete Segmente und fugenlose Verbindung gleichartiger Nachbarsegmente bleiben verbindlich.


## Regression

`scripts/test-weather-profile-story-axis-09750.mjs` schützt die gemeinsame
Zeitabbildung, die durchgehenden Vertikalen, die achsenlose Wolkendarstellung,
die sichtbare Luftdruckspur und die Hoch-/Querformatverträge.

`scripts/test-weather-profile-skybar-pills-097723.mjs` schützt zusätzlich den einzelnen Wetterstreifen für Sonne/Bewölkung/Niederschlag, den Erhalt von H/M/L, vier Dickenstufen, farbreine Grund-/Niederschlagslagen, gerundete Teilstücke, den Verzicht auf 3D-Unterlagen sowie die themegeeigneten Nachtstunden der 7-Tage-Kurvenübersicht und die ersatzlose Entfernung des dortigen P25–P75-Bands.
