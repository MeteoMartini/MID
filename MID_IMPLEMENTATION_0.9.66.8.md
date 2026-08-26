# MID 0.9.66.8 – Kartenlesbarkeit und dauerhafte Sektionsreihenfolge

## Extremwetterkarte

Die geglätteten, gradientengeformten DACH-Gefahrengebiete bleiben fachlich unverändert, werden aber nicht mehr in einem separaten DOM-Canvas über der gesamten Karte gezeichnet. MID überführt dieselben Isoplethen in native MapLibre-MultiPolygone mit gestaffelter Füllung, Schraffur und Kontur. Die CARTO-Grundkarte ist in einen unbeschrifteten Basis-Rasterlayer unter den Polygonen und einen reinen Beschriftungs-Rasterlayer darüber getrennt. Dadurch liegen Grenzen, Länder-, Regions- und Städtenamen tatsächlich oberhalb der Gefahrenflächen.

Die Interaktionsflächen bleiben transparent über der Beschriftungsebene erreichbar. Karten-Popups besitzen nun eine vollständig deckende, kontrastreiche Fläche, stärkere Typografie und einen klaren Schatten. Auch Gültigkeitsfeld, Regionsliste und diagnostische Textfelder wurden für kleine Displays lesbarer skaliert.

## Zeit und Terminologie

Wechselt das +24–48-h-Fenster den Kalendertag, nennt MID Start und Ende jeweils mit Wochentag, Datum und Uhrzeit, beispielsweise `Do. 27.08., 07:00 – Fr. 28.08., 07:00`. Bei Zeitfenstern innerhalb desselben Tages bleibt die kürzere Schreibweise erhalten. Im DACH-Ausblick heißt die meteorologische Größe einheitlich `Nullgradgrenze`; der interne Datenvertrag `freezingLevelM` bleibt kompatibel.

## Sektionsreihenfolge

Verschieben, Pfeilsteuerung und Ein-/Ausschalten der Dashboard-Sektionen verwenden jetzt funktionale Zustandsänderungen. Dadurch können schnelle Touch-/Drag-Folgen keinen älteren Reihenfolgestand mehr überschreiben. Die normalisierte Konfiguration wird im selben Änderungsaufruf synchron in den dauerhaften MID-Speicher geschrieben, statt erst auf einen späteren React-Effekt zu warten. Eine unmittelbar danach beendete und neu gestartete App stellt deshalb die zuletzt gewählte Reihenfolge wieder her.

## Absicherung

Die Regression `scripts/test-extreme-outlook-labels-layout-persistence-09668.mjs` prüft die echte Karten-Layerfolge, MultiPolygon-/Schraffurverträge, Terminologie, datumsübergreifende Gültigkeitsformatierung, Lesbarkeitsregeln sowie Schreiben und erneutes Lesen einer geänderten Sektionsreihenfolge aus dem lokalen Speicher.
