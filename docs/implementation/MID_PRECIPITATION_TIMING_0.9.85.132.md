# MID v0.9.85.132 · Kanonische Niederschlags-Zeitsemantik

## Befund
Die Textaussage oberhalb des Radar-Nowcast-Diagramms konnte eine Niederschlags-Endzeit stündlich um eine Stunde nach hinten verschieben. Die Ursache lag nicht im Radar, sondern in einer separaten Stundenheuristik in `App.tsx`.

Open-Meteo liefert stündliche Niederschlagsakkumulationen am Zeitstempel T als Menge des vorangegangenen Intervalls `[T-1h,T]`. MID besitzt dafür bereits den Darstellungsvertrag `precipitationPresentationHours`, der diese Menge für sichtbare Stundenansichten auf den Slotbeginn legt. Die bisherige Fortsetzungslogik verwendete dagegen die rohen Stundenwerte und berechnete das Ende als `letzter nasser Zeitstempel + 1 h`. Dadurch wurde ein bereits am Zeitstempel endendes Intervall nochmals verlängert.

## Umsetzung
1. `canonicalPrecipitationTimeline` normalisiert die Intervallsemantik zentral.
2. Die finalisierte 15-Minuten-Reihe wird verwendet, wenn sie den gesamten betrachteten 6-h-Kurzfristhorizont abdeckt. Diese Reihe enthält bereits die operative RUC-/Radar-/Best-Match-Fusion.
3. Fehlt diese Abdeckung, wird vollständig auf die normalisierte Stundenreihe zurückgefallen; innerhalb eines Ereignisses werden keine Auflösungen vermischt.
4. Ereignisbeginn und -ende werden aus den tatsächlichen Intervallgrenzen gebildet.
5. Ein hoher Wahrscheinlichkeitswert ohne messbare Niederschlagsmenge definiert keine scheinbar sichere Dauer.
6. Die Radarzusammenfassung kann für den Bereich jenseits von +2 h weiterhin einen Modellhinweis ergänzen, nutzt dafür aber dieselbe kanonische Zeitreihe.

## App-weite Konsistenz
- Aktuell: Textzusammenfassung und Fortsetzung hinter +2 h.
- Kurzfrist: dieselben finalisierten `displayMinutes15`/`displayHours`.
- 24-h-/Forecast-Darstellungen: bestehende `precipitationPresentation*`-Normalisierung.
- Widgets/Tagesbewertung: dieselbe Intervallnormalisierung bleibt aktiv.

## Regression
`scripts/test-precipitation-timing-consistency-0985132.mjs` prüft funktional, dass ein nasser Rohstundenwert mit Ende 10:00 nicht zu „bis 11:00“ wird, dass 15-Minuten-Phasen exakt enden und dass Wahrscheinlichkeit ohne Menge keine Dauer erzeugt.
