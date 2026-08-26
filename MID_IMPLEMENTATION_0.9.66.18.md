# MID 0.9.66.18

## DACH-Gefahrenflächen: Karte, Popup und Regionsliste synchron

Die Karte zeichnete bereits getrennte Isoplethenkomponenten, während „Stärkste
Regionen“ weiterhin nach dem groben Regionsnamen deduplizierte. Zwei räumlich
getrennte Flächen mit derselben bisherigen Bezeichnung konnten deshalb als zwei
Kartenfelder, aber nur als ein Listeneintrag erscheinen.

Konturen, Marker, Popup und Regionsliste verwenden nun denselben
flächenbezogenen Datensatz. Jede dargestellte, räumlich getrennte
Gefahrenfläche erhält eine stabile ID, eine eigene Wahrscheinlichkeit und einen
eigenen Listeneintrag. Die Auswahl wird über die Flächen-ID statt über den
Regionsnamen geführt. Das Marker-Popup nennt wieder zuerst die zugeordnete
Region und danach Prognosestufe sowie Wahrscheinlichkeit.

Die regionale Zuordnung im Alpenraum wurde verfeinert: Wallis,
Zentralschweiz, Tessin, Graubünden, Vorarlberg und Tirol werden nicht mehr in
zu groben Sammelregionen zusammengezogen. Worker und Browser-Direktweg werden
aus derselben kanonischen Regionsdefinition erzeugt.

Für die vollständige Korrektur sind Professional-App und Worker gemeinsam zu
aktualisieren.
