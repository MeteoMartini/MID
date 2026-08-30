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

## Wolken

- Die Reihenfolge ist von oben nach unten: Gesamt, H, M, L.
- Jede Ebene ist ein schmales, kontinuierliches horizontales Band.
- Alle vier Ebenen verwenden dasselbe neutrale Grau. Der Wert 0…100 % steuert
  ausschließlich die Opazität von weiß/transparent bis grau.
- Nachbarstunden werden in den Verlauf einbezogen, sodass Übergänge weich ein-
  und ausfaden.
- Im Diagramm gibt es keine rechte 0–100-%-Achse und keine ausgewählten
  Prozentwerte am rechten Rand.
- Exakte Prozentwerte bleiben in den Einzeldaten und Tooltips erhalten.

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

## Regression

`scripts/test-weather-profile-story-axis-09750.mjs` schützt die gemeinsame
Zeitabbildung, die durchgehenden Vertikalen, die achsenlosen Wolken-Graubänder,
die sichtbare Luftdruckspur und die Hoch-/Querformatverträge.
