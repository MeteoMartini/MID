# MID v0.9.85.37

## DWD Wolken/Niederschlagsart wieder standorttreu zentriert

- Der zoombare Ausschnitt des amtlichen DWD-Originalbilds wird nach Öffnen, Größenänderung und Bildladen wieder zuverlässig auf den tatsächlich gewählten Standort zentriert.
- Die seit v0.9.76.11 an 17 sichtbaren DWD-Stadtankern kalibrierte Georeferenzierung bleibt unverändert; korrigiert wurde die mobile Darstellungs- und Zentrierungslogik.
- Der Standortmarker besitzt jetzt einen eindeutigen exakten Ankerpunkt statt eines plattformabhängigen Emoji-Pins. Zusätzlich gibt es einen direkten „Standort“-Knopf zum erneuten Zentrieren, ohne den gewählten Zoom zu verlieren.
- Der Bildausschnitt wird während der Zentrierung nicht mehr durch eine Breitenanimation verschoben. Die Originallegende bleibt erhalten, nimmt auf kleinen Displays aber weniger Kartenfläche ein.

# MID v0.9.85.36

## Heute: 24-h-Diagramm wieder in passenden Proportionen

- Das 24-h-Wetterprofil war auf schmalen Smartphone-Displays zuletzt sichtbar zu hoch gestreckt. Die vertikale Diagrammgeometrie wird jetzt responsiv verdichtet, während alle Wetterspuren, Skalen, Zeitbezüge und Warnschwellen erhalten bleiben.
- Überschrift und Kurzfristtexte umbrechen wieder sauber statt am rechten Rand abgeschnitten zu werden. Der Zusatztext der 90-Minuten-Leiste entfällt auf sehr schmalen Displays, wenn er nur bereits sichtbare Informationen wiederholt.
- Das amtliche DWD-Originalprodukt bleibt vollständig verfügbar, startet in „Heute“ jetzt aber zuverlässig geschlossen und öffnet die große Bildfläche nur nach einer bewussten Nutzeraktion. Die Klappzeile bleibt auch im Dark Mode auf der regulären dunklen MID-Fläche statt in eine helle Ersatzfläche zu kippen.
- Smartphone, Tablet und Desktop verwenden weiterhin dieselben meteorologischen Daten und dieselbe 24-h-Zeitlogik; geändert wurden ausschließlich Proportionen, Textfluss und progressive Darstellung.

# MID v0.9.85.35

## Heute ruhiger und kompakter

- Das amtliche DWD-Bild „Wolken + Niederschlagsart“ bleibt vollständig verfügbar, öffnet sich in „Heute“ aber erst auf Wunsch. Dadurch dominiert das Originalbild nicht mehr den 24-Stunden-Verlauf und lädt erst beim Öffnen.
- Das 24-h-Wetterprofil benötigt auf Smartphones weniger Höhe oberhalb des Diagramms: Drucktrend und weitere Signale liegen kompakt in einer horizontalen Leiste; Auflösung, Legende und Info bleiben erreichbar.
- Breite Diagramme, Hilfetexte und das geöffnete DWD-Original bleiben an ihren eigenen Viewport gebunden. Die fachlichen Wetterspuren, DWD-Warnschwellen, Parameterfarben, Quellen und Zeitlogik wurden nicht verändert.

# MID v0.9.85.34

## Karten nutzen den Bildschirm als Arbeitsraum

- Radar, Satellit, Nowcast und Synoptik bekommen auf Smartphones, Tablets und Desktop deutlich mehr zusammenhängende Kartenfläche. Überschriften, Umschalter und Zeitleiste treten gegenüber der Karte zurück.
- Die Kartenzeit bleibt eine gemeinsame, durchgehende Steuerung. Beobachtungen, Nowcast und Modelltermine werden weiterhin fachlich getrennt gekennzeichnet, ohne zusätzliche doppelte Zeitauswahl.
- In den DWD-Wetterkarten bleiben nur Modell und Kartenprodukt direkt sichtbar. Druckfläche beziehungsweise Höhe, Kartenbasis, Deckkraft sowie Quellen- und Laufdetails sind bei Bedarf einklappbar erreichbar.
- Der Startbereich auf Smartphones ist nochmals verdichtet: Kopf, Suche, Favoriten, Ortskopf und aktuelle Kernwerte folgen jetzt tatsächlich der Redesign-Hierarchie statt von älteren Layoutregeln wieder vergrößert zu werden.
- Das Impressum bleibt auch im Smartphone-Hochformat vollständig innerhalb des Displays; der Schließen-Button bleibt jederzeit erreichbar.
- Zoombare DWD-Originalbilder und breite Diagramme dürfen nur noch innerhalb ihrer eigenen Darstellungsfläche wachsen oder scrollen und nicht mehr die gesamte App über den Displayrand hinaus verbreitern.
- Die gemeinsame Kartenzeitachse ist für einen späteren fachlich gekennzeichneten Übergang von echten Satellitenbeobachtungen zu modellbasierten Pseudo-Satellitenbildern vorbereitet. Solche Zukunftsbilder werden erst angezeigt, wenn dafür reale Modellprodukte angebunden sind; MID erzeugt keine künstlichen Zwischenbilder.
- Datenquellen, Modell-/Nowcastlogik, Warnregeln, meteorologische Ebenen und Farbcodierungen wurden dabei nicht verändert.

# MID v0.9.85.33

## Kompakter Startbereich auf Smartphones

- Ort und Warnstatus stehen wieder direkt vor dem aktuellen Wetter statt am Ende des Abschnitts.
- Der mobile Kopf ist deutlich kleiner und scrollt mit der Seite. Suche und Favoriten bleiben am Seitenanfang verfügbar, während die kompakte Bottom-Navigation dauerhaft erreichbar bleibt.
- „Mehr“ blendet ergänzende aktuelle Werte jetzt tatsächlich ein und aus. Geöffnete Zusatzwerte erscheinen als ruhige Detailliste statt als Kachelmatrix.
- Aktuelles Wetter, Radar-Nowcast und Quellenhinweis benötigen auf kleinen Displays weniger Höhe. Meteorologische Daten, Parameterfarben, Warnlogik und Quellenbewertung bleiben fachlich unverändert.

# MID v0.9.85.32

## Vorhersage als zusammenhängender Arbeitsraum

- Die 7-Tage-Vorhersage führt nun zuerst den Wetterverlauf; die Tage bilden darunter ein zusammenhängendes Band statt einzelner gleichgewichteter Karten.
- Stündliche Details erscheinen direkt beim gewählten Tag und bleiben Teil derselben Vorhersagefläche.
- Die 14-Tage-Ansicht bleibt ensemblegestützt, zeigt die Tage aber als fortlaufende Spalten. Unsicherheit, Modellkonsistenz, Wetterpiktogramme und Parameterfarben bleiben erhalten.
- Smartphone-, Querformat-, Tablet- und Desktopansichten wurden so abgestimmt, dass Auswahl, Texte und Detailbereiche ohne abgeschnittene Inhalte bedienbar bleiben.

# MID v0.9.85.31

## Heute als durchgehender 24-h-Wetterfaden

- Wetterfaden und 24-h-Zeitmatrix bilden eine zusammenhängende Wetterfläche.
- Einzelne Zeitpunkte zeigen zusätzliche Details erst nach Auswahl; auf Mobilgeräten bleibt die Detailansicht oberhalb der schwebenden Navigation.
- Nowcast-/RUC-Zeitlogik, DWD-Niederschlagsart, Warnungen, Wetterpiktogramme und Parameterfarben bleiben fachlich unverändert.

# MID v0.9.85.30

## Aktuell klarer gegliedert

- Der Ortsbereich ist nun ein kompakter Kontextkopf statt einer zusätzlichen Wetterkarte.
- Die aktuelle Wetterfläche bleibt die fachliche Primärdarstellung; doppelte Niederschlags- und Hazard-Angaben im Ortskopf wurden entfernt.
- Vier Kernparameter stehen sichtbar im Vordergrund. Ergänzende Messwerte bleiben erreichbar, wiederholen die Kernwerte aber nicht noch einmal gleichrangig.
- Mobile Safe-Areas, Bottom-Bar-Abstände, Suche und Favoriten wurden für die kompakte Darstellung weiter abgesichert.

# MID v0.9.85.29

## Durchgehender Kartenzeitraum

- Bestätigte Radar- und Satellitenbeobachtungen, amtliche Nowcast-Stände und vorhandene Modelltermine liegen auf einer durchgehenden Kartenzeitachse.
- Der Übergang zum Modell erfolgt ohne zusätzlichen Ansichtsschalter. Modelltermine werden eindeutig als solche gekennzeichnet.
- Radar, Satellit und Blitze enden an ihren echten Produktzeiten; MID erzeugt keine künstlichen Übergangsbilder.

# MID v0.9.85.28

## Sichtbarer Konzeptumbau

- Der Startbereich ist als zusammenhängende Wetterbühne aufgebaut: Ortslage, Wetterkern und Messwerte sind klar getrennte Ebenen statt einer Folge gleichrangiger Kacheln.
- Kopf, Ortsschnellzugriff und Navigation sind kompakter; die schwebende Bottom-Bar bleibt auf Mobilgeräten erreichbar.
- Kurzfrist, Vorhersage und Karten erscheinen als durchgehende Arbeitsflächen statt als gestapelte Einzelkarten.

# MID v0.9.85.27

## Navigation und Kurzfristdarstellung

- Die Bottom-Bar markiert immer genau einen Hauptbereich; „Heute“ und „Vorhersage“ können nicht gleichzeitig aktiv sein.
- Eine lokale Speicherquota wird datenerhaltend bereinigt, ohne technische Browsermeldungen zwischen Wetterinhalten anzuzeigen.
- Die Kurzfristdarstellung ist eine fortlaufende Zeitmatrix mit gemeinsamer Hierarchie für Zeit, Wetter, Temperatur, Niederschlag und Wind.

---

Der Changelog beschreibt bewusst die sichtbaren Änderungen für Anwendende. Meteorologische Fachlogik, Datenquellen und Warnschwellen werden nur genannt, wenn sie sich tatsächlich geändert haben.
