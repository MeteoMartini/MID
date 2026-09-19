# MID v0.9.85.48

- MID-C9 schließt den Smartphone-Blocker aus Ortskopf und Nowcast: Standort und Warnlage konkurrieren nicht mehr mit der aktuellen Niederschlagsfläche um dieselbe Grid-Zeile; lange Ortsnamen bleiben horizontal lesbar.
- Favoriten bleiben auf schmalen Geräten vollständig horizontal erreichbar, während der Verwaltungszugang außerhalb der Scrollfläche sichtbar bleibt.
- Der echte Platzbedarf der schwebenden Bottom-Bar einschließlich iOS-Safe-Area wird reserviert. Inhalte, Skybar-Beschriftungen und Nowcast lassen sich dadurch vollständig oberhalb der Navigation erreichen, ohne horizontalen Seitenüberlauf.
- Taupunkt ist in der kompakten Hauptkarte eindeutig der Primärwert; die relative Feuchte bleibt als nachgeordnete Zusatzinformation erhalten.
- Die Änderung ist ausschließlich grafisch. MID verwendet unverändert seine kanonischen Echtzeit-, Nowcast- und Stundenreihen; Replit-Vorschauwerte wurden nicht übernommen.

# MID v0.9.85.47

## Design 2.0.1 · 12-h-Temperaturtrend wissenschaftlich nachgeschärft

- Die 12-h-Kurve unter „Aktuell“ ist nicht mehr nur beschriftet, sondern wird jetzt auch **skalentreu und zeitlich ehrlich** dargestellt.
- Der linke Punkt ist am tatsächlich angezeigten aktuellen Temperaturwert verankert; die weiteren Punkte bleiben die vorhandenen stündlichen MID-Prognosewerte.
- Zusätzlich wird die Temperaturänderung bis zum Ende des Fensters als Richtung und Delta in Kelvin angezeigt.
- Die Kurve verwendet mindestens **4 K Darstellungsbereich**. Kleine Änderungen von z. B. 0,5–1 K werden dadurch nicht mehr künstlich über die gesamte Diagrammhöhe aufgeblasen.
- Die gestrichelte Referenzlinie liegt auf dem aktuellen Temperaturwert statt auf einer bedeutungslosen geometrischen Mitte.
- Fehlende Stunden werden nicht mehr optisch überbrückt: Datenlücken unterbrechen die Linie, statt eine scheinbare Zwischenentwicklung zu erzeugen.
- Die 13 Stundenpositionen von jetzt bis +12 h bleiben erhalten; fehlende Werte werden nicht herausgefiltert und dadurch zeitlich zusammengeschoben.
- Taupunkt bleibt der primäre Feuchtewert, relative Luftfeuchte die sekundäre Zusatzinformation.
- Klassisch, Wetterlogik, Skybar, RUC/Nowcast, Warnungen und Datenquellen bleiben unverändert.

# MID v0.9.85.46

## Design 2.0.1 · kritischer iPhone-Pass und aussagekräftiger 12-h-Wetterfaden

- Der bisher nahezu dekorative 12-h-Temperaturfaden wurde fachlich und visuell aufgewertet: Er zeigt nun **Jetzt**, einen mittleren Zeitanker und das Ende des 12-Stunden-Fensters jeweils mit Temperaturwert.
- Das Fenster umfasst exakt **Jetzt bis +12 Stunden** und verwendet dafür 13 vorhandene stündliche Temperaturpunkte. Es werden keine Zwischenwerte erfunden oder zeitlich verschoben.
- Die markierte Messposition liegt jetzt korrekt am **aktuellen** Stundenwert; der frühere hervorgehobene Punkt am rechten Ende konnte fälschlich wie ein aktueller Messpunkt wirken.
- Zusätzlich werden Min/Max der nächsten 12 Stunden kompakt ausgewiesen; die Kurve bleibt bewusst schlicht und datengetreu.
- Taupunkt bleibt im Hauptbereich der primäre Feuchteparameter; relative Luftfeuchte ist die sekundäre Zusatzinformation.
- Trockene Kurzfristlagen werden als kompakte Statuszeile statt als zweite große Karte dargestellt.
- Die geöffneten Zusatzwerte wurden weiter verdichtet: UVI und Luftqualität erhalten kollisionsfreie volle Breite, Sonnenschein sowie Sonne/Mond sind kompakte Zeilen, Beschriftungen werden nicht mehr unnötig abgeschnitten.
- Der Warnstatus im Ortskopf wird auf kleinen Geräten vollständig im Viewport gehalten.
- Die Bottom-Bar blendet bei Abwärtsscrollen früher aus und erscheint erst nach einem deutlicheren Aufwärtsscrollen wieder, damit sie laufende Inhalte weniger verdeckt.
- Klassisch, Skybar, Warnlogik, Modellfusion, RUC/Nowcast und Datenquellen bleiben fachlich unverändert.

# MID v0.9.85.45

## Design 2.0.1 · iPhone-QA und Feinschliff „Aktuell“

- Die mobile Aktuell-Ansicht wurde anhand der realen iPhone-Darstellung erneut kritisch überarbeitet.
- **Taupunkt steht jetzt vor der relativen Luftfeuchte**: In den vier Kernwerten wird der Taupunkt in °C groß angezeigt, die Feuchte in % bleibt als Sekundärwert erhalten.
- Der Ortskopf wurde korrigiert: Der Warnstatus bleibt vollständig im Viewport und soll „Keine Warnung“ nicht mehr abschneiden.
- Die vier Kernwerte wurden auf normalen iPhones in eine kompakte Viererzeile verdichtet; nur auf sehr schmalen Geräten fällt MID auf 2×2 zurück.
- UVI und Luftqualität erhalten volle Breite, damit Einstufung, Info-Schaltfläche und Skalen nicht mehr miteinander kollidieren.
- Sonne/Mond und Sonnenscheindauer wurden als kompakte Zeilen neu gewichtet; der große blaugraue Leerraum der geöffneten Zusatzwerte entfällt.
- Sichtbare Info-Schaltflächen bleiben klein, die Touchfläche bleibt ausreichend groß.
- Der doppelte untere Sicherheitsabstand wurde entfernt; dadurch verschwindet der übergroße Leerraum zwischen Footer und Bottom-Bar. Die Navigation bleibt weiterhin safe-area-sicher.
- Klassisch, meteorologische Fachlogik, Warnschwellen, Modelle, Skybar und Datenquellen bleiben unverändert.

# MID v0.9.85.44

## Design 2.0.1 · mobile Aktuell-Ansicht deutlich nachpoliert

- Der erste produktive Design-2.0.1-Transfer wurde anhand der iPhone-Screenshots korrigiert: Die Aktuell-Ansicht ist jetzt als eine zusammenhängende Wetter-/Instrumentenfläche aufgebaut statt als große, fast leere Karte.
- Wetterpiktogramm, Temperatur, Wetterzustand, Tmin/Tmax und 12-h-Wetterfaden wurden enger und klarer hierarchisiert.
- Tmin/Tmax ist keine großflächige weiße Überlagerung mehr, sondern eine kompakte Inline-Angabe.
- Die vier unmittelbar sichtbaren Kernwerte sind wieder klar lesbar und in einer kompakten 2×2-Matrix angeordnet.
- Zusatzparameter wurden zu einem ruhigen Datenfeld verdichtet; sichtbare Info-Schaltflächen bleiben klein, besitzen auf Touch-Geräten aber weiterhin eine 44-px-Trefferfläche.
- Kopf, Suche und Favoritenleiste wurden mobil verkleinert und an die Materialität der Bottom-Bar angeglichen.
- Die Bottom-Bar wurde niedriger und leichter gestaltet; zugleich wurde der untere Inhaltsabstand vergrößert, damit abschließende Inhalte vollständig oberhalb der Navigation erreichbar bleiben.
- Eigene Regeln für schmale iPhones, Smartphone-Querformat und Tablet-Hochformat schützen die neue Komposition.
- Klassische Ansicht, Wetterlogik, Datenquellen, Warnschwellen und Modellfusion bleiben unverändert.

# MID v0.9.85.43

## Design 2.0.1 · Heute und 24-h-Wetterprofil

- „Heute“ erhält im neuen Designpfad eine zusammenhängende meteorologische Arbeitsfläche: 90-Minuten-Kontext oben, darunter das vollständige gleitende 24-h-Wetterprofil als dominantes Instrument.
- Das Profil läuft weiterhin exakt von jetzt bis +24 Stunden auf einer gemeinsamen Zeitachse für Wetter, Temperatur, Niederschlag, Wind/Böen, Luftdruck, Bewölkung, Sonnenereignisse und Einschränkungen.
- Die Skybar bleibt in jedem Darstellungsmodus **stündlich aufgelöst**. Die optionale 3-h-Ansicht verdichtet nur Kurven, Marker und Beschriftungen; die Skybar wird nicht gemittelt, interpoliert oder zeitlich verschoben.
- Legende, Zeit-Lupe/Einzeldaten und Signale wurden grafisch beruhigt und auf Mobil, Tablet hoch/quer und Desktop neu gewichtet.
- Die klassische Oberfläche und sämtliche meteorologischen Fachverträge bleiben unverändert.

# MID v0.9.85.42

## Design 2.0.1 · Aktuell, Kopf und Favoriten

- Die neue Oberfläche erhält einen deutlich kompakteren, professionellen Kopf mit responsivem Original-MID-Logo, ruhiger Suche und einer Favoritenleiste im gleichen Instrumentenstil.
- „Aktuell“ wird zu einer zusammenhängenden Wetterfläche: Wetterzeichen, Temperatur und Zustand stehen klar im Vordergrund; vier Kernwerte bleiben direkt sichtbar.
- Ein dezenter 12-Stunden-Temperaturfaden ergänzt die aktuelle Lage. Er verwendet ausschließlich die bereits vorhandenen stündlichen MID-Werte und verändert keine Prognosedaten.
- Niederschlags-/Gefahrenlage und Datenstatus bleiben in derselben Arbeitsfläche integriert; zusätzliche Messwerte werden als sekundäre Instrumentfläche dargestellt.
- Mobil, Tablet hoch/quer und Desktop erhalten eigene Anordnungen, ohne die klassische Oberfläche zu verändern.
- Meteorologische Logik, Warnschwellen, Skybar-Auflösung, Modellfusion und Datenquellen bleiben unverändert.

# MID v0.9.85.41

## Design 2.0.1 parallel zur klassischen Oberfläche

- MID besitzt jetzt zwei klar getrennte Darstellungswege: **Klassisch** behält die bisherige Dashboard-Struktur und Navigation, **Design 2.0.1** nutzt die neue responsive Arbeitsflächen- und Bottom-Navigation.
- Der Umschalter in den Einstellungen ändert nur Darstellung und Navigation. Ort, Favoriten, Wetterdaten und Fachlogik bleiben gemeinsam und werden nicht neu erfunden oder dupliziert.
- Die Redesign-Styles der bereits umgesetzten Arbeitsflächen sind auf Design 2.0.1 begrenzt, damit spätere grafische Änderungen die klassische Oberfläche nicht unbeabsichtigt verändern.
- Ohne bereits gespeicherte Auswahl startet MID vorerst sicher in **Klassisch**. Die neue Oberfläche kann jederzeit persistent gewählt werden.
- Meteorologische Logik, Skybar-Zeitauflösung, Warnschwellen, Modellfusion, Parameterfarben und Datenquellen bleiben fachlich unverändert.

# MID v0.9.85.40

## MID-C9 · Prognose- und Kartenflächen weiter poliert

- Die 7-Tage-Vorhersage bleibt auf Smartphones ein kompaktes horizontales Tagesband. Die frühere lange Einspaltenliste entfällt; Stundendetails öffnen weiterhin direkt im selben Arbeitsraum.
- Die Parameterwahl der 14-Tage-Ensembleansicht ist eine ruhige, zusammenhängende Instrumentleiste. Touch-Tooltips zeigen ihre vollständigen Werte mit größerer, lesbarer Schrift und sicherem Bildschirmrand.
- Karten-Layer bleiben auf kleinen Displays in einer horizontal bedienbaren Werkzeugleiste. Die Kartenhöhe passt sich in Hoch- und Querformat besser an, während Zeitachse, Legende und mindestens 44 px große Touchziele erreichbar bleiben.
- Wetterdaten, Ensemblewerte, Parameterfarben, Kartenebenen und die DWD-Georeferenzierung bleiben fachlich unverändert.

# MID v0.9.85.39

## MID-C9 · Mobile Layoutkorrektur nach Screenshots

- Aktuell: vier Kernparameter tatsächlich als 2×2-Raster; alte übergreifende Zellbelegungen zurückgesetzt. Wetterkopf, Quellenzeile und Niederschlagsinformation kompakter; doppelte Freifläche vor dem Footer reduziert.
- Kurzfrist: alle Zeitpunkte bleiben in genau einer horizontal scrollbareren Zeile. Die feste Sechs-Spalten-Begrenzung entfällt, auch der siebte Zeitpunkt bleibt oben.
- Favoriten: einzeilige Anordnung mit klarer Auswahl, separater Verwaltung und einmaliger Standard-Kennzeichnung; keine überlagerten Grid-Bereiche oder doppelte Abkürzung.
- Aktiver Kurzfrist-Schalter mit lesbarem Textkontrast. Wetterwerte, Quellen und Bedienfunktionen bleiben erhalten.

# MID v0.9.85.38

## MID-C9 · Einheitlicheres Design und ruhigere Bildsteuerung

- Die 90-Minuten-Vorschau bildet eine durchgehende Zeitleiste mit klar hervorgehobenem Zeitpunkt.
- Auf Tablets passen Seitenleiste und Inhaltsabstand zusammen; auf großen Bildschirmen sind die Navigationsziele wieder beschriftet. Lange Ortsnamen bleiben lesbar.
- „Mehr“ erhält übersichtliche Einstellungszeilen und einen beim Scrollen erreichbaren Kopf. Flächen und Abstände sind ruhiger und einheitlicher.
- Das DWD-Originalbild lässt sich in feineren Schritten von 50 bis 500 Prozent zoomen. Der betrachtete Ausschnitt bleibt beim Zoomen erhalten; „Standort“ und „100 %“ führen gezielt zurück.
- Verzögerte Zentrierungssprünge entfallen. Die eingebettete Originallegende wird nicht mehr durch allgemeine Bildgrößenregeln verkleinert.
- Wetterwerte, Warnschwellen, Parameterfarben und die bisherige geografische Bildkalibrierung bleiben unverändert.

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
