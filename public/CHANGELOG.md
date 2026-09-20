# MID v0.9.85.67

- Der in Replit vollständig abgenommene MID-18.2-Finish für Meteogramm, Warnungen, Wasser/Tide und „Mehr“ wurde in den kanonischen MID-Build übernommen.
- Meteogramm: Diagramme bleiben die dominante Instrumentfläche; dichte Zeitreihen scrollen ausschließlich innerhalb des Diagramms, Quellen- und Steuerbereiche bleiben vollständig lesbar.
- Warnungen: amtlicher Warnstatus bleibt visuell priorisiert; Ereignisspur, ergänzende MID-Hinweise, Herkunft und lange Texte können auf mobilen Geräten nicht mehr abgeschnitten oder in Ellipsen gedrückt werden.
- Wasser/Tide: Bewertung, Tide/Pegel, Wellen, Strömung und Wetterwerte bilden eine zusammenhängende responsive Instrumentfläche; dichte Matrizen scrollen nur intern.
- „Mehr“: Schnellzugriffe und Themenmodule sind als ruhige progressive Gruppen strukturiert; auf sehr schmalen Geräten wechselt die Schnellzugriffsebene in eine einspaltige Darstellung.
- Bottom-Bar-Safe-Area sowie Light/Dark bleiben geschützt.
- Replit-Abnahme: 390×844, 430×932, 834×1112, 1112×834 und 1440×900 jeweils in Light/Dark; Typecheck und Produktionsbuild erfolgreich.
- Keine Änderung an Warnlogik, Wetterdaten, Tide-/Wasserfachlogik, Forecast, Radar oder Nowcast.

# MID v0.9.85.66

- Der in Replit vollständig geprüfte MID-18.2-Redesign-Block für Vorhersage und Karten/Radar wurde in den kanonischen MID-Build übernommen.
- Die gemeinsame Desktop-Shell verwendet nun appweit eine maximale Breite von 1580 px; Prognose- und Kartenarbeitsräume folgen derselben Breiten- und Oberflächenlogik.
- Dichte 7-/14-Tage- und Kurzfrist-Zeitreihen bleiben vollständig erhalten und scrollen ausschließlich innerhalb ihrer Instrumentflächen, statt die gesamte Seite horizontal zu verbreitern.
- Karten/Radar erhalten denselben begrenzten Arbeitsraum; Layer-, Zeit-, Status- und Quellenbereiche bleiben funktional unverändert und können auf schmalen Displays nicht mehr die Seitenbreite sprengen.
- Bottom-Bar-Safe-Area und responsive Innenränder bleiben erhalten.
- Replit-Abnahme: 390×844, 430×932, 834×1112, 1112×834 und 1440×900 jeweils in Light/Dark; Typecheck und Produktionsbuild erfolgreich.
- Keine Änderung an Forecast-, Radar-, Nowcast-, Layer-, Warnungs- oder Wetterdatenlogik.

# MID v0.9.85.65

- Der mobile Bereich „Weitere aktuelle Werte“ wurde nach dem Screenshot-Audit neu verriegelt: Überschrift/Info-Schalter, Primärwert und Detailtext liegen nun in eindeutig getrennten Zeilen und können sich auf schmalen Smartphones nicht mehr überlagern.
- UVI und EU-AQI nutzen eine eigene vierzeilige Hierarchie aus Kopf, Bewertung, Skala und Detailwert; Sonnenschein sowie Sonne/Mond folgen derselben konsistenten Ordnung.
- Auf 391–620 px bleiben die kompakten Werte zweispaltig; bis 390 px wechselt der Bereich automatisch in eine einspaltige Darstellung, statt Inhalte zu quetschen.
- Sonne/Mond erhält größere, sauber ausgerichtete Auf-/Untergangswerte und eine lesbare Mondphasenzeile.
- Die Änderung ist auf den MID-Next-„Aktuell“-Mehrbereich begrenzt; Wetterlogik, RUC/Nowcast, Warnungen und Prognosedaten bleiben unverändert.
- Parallel wurde das professionelle Redesign im Replit-Projekt „MID Weather Intelligence“ mit Fokus auf dieselbe responsive Kartenhierarchie fortgesetzt.

# MID v0.9.85.64

- Die mobile Bottom-Bar startet ohne ausdrücklich gewählten Auto-Modus fixiert sichtbar. Im Auto-Modus blendet sie erst nach einer längeren Abwärtsbewegung aus und reagiert bereits auf einen kurzen Aufwärtsscroll wieder sichtbar.
- Taps auf die fünf Hauptziele wechseln den Arbeitsbereich unmittelbar statt mit verzögertem Smooth-Scroll.
- „Weitere aktuelle Werte“ ordnet auf Smartphonebreiten Beschriftung/Info-Schalter und Messwert in getrennten Zeilen an. Lange Werte wie Wind/Böen oder Luftdruck können dadurch keine Beschriftungen mehr überdecken.
- Der 12-h-Temperaturtrend besitzt eine besser erkennbare ECMWF-farbige Linie, ein dezentes farbiges Flächenband und ein klareres Hilfsraster – ohne zeitliche Glättung oder Resampling.
- Tmin und Tmax im Aktuell-Kopf verwenden jetzt jeweils die wertbasierte ECMWF-Temperaturfarbe des tatsächlichen Werts.
- Der ICON-D2-RUC-Kurzfristaudit bestätigt: CLCT/CLCL sowie verfügbare CLCM/CLCH/VIS/CEILING laufen bereits über die kanonische Forecast-Fusion in die Kurzfrist. Eine zweite RUC-Bewölkungsmischung wird deshalb bewusst vermieden; nativer 15-min-CEILING bleibt als gezielter +0…6-h-Ausbaukandidat dokumentiert.
- Wetterdaten-, Warnungs-, Niederschlags-, Skybar-, Nowcast- und 90-Minuten-Fachverträge bleiben unverändert.

# MID v0.9.85.63

- Warnungen, Extremwetter-Ausblick und Lüftungsassistent bleiben beim Öffnen im primären Bottom-Bar-Kontext „Aktuell“; „Mehr“ wird nicht mehr irreführend als aktives Hauptziel markiert.
- Die Warnlage bleibt direkt über den Ortskopf erreichbar und zusätzlich im „Mehr“-Bereich auffindbar.
- Der kanonische Navigationsvertrag benennt nun durchgängig exakt fünf Hauptziele; die widersprüchliche Formulierung „sechs Ziele“ ist korrigiert.
- Release-, PWA-, Worker- und iOS-Versionsmarker sind auf v0.9.85.63 synchronisiert. Wetterdaten, Skybar-, Niederschlags-, Warnfach-, Nowcast- und 90-Minuten-Logik bleiben unverändert.

# MID v0.9.85.62

- Der 12-h-Temperaturtrend und die darunterliegende Skybar/Stundenquadrate verwenden jetzt exakt dieselbe horizontale Zeitbasis und dieselben Plotränder.
- Die Temperaturkurve nutzt die bereits vorhandene ECMWF-inspirierte 2-m-Temperaturpalette: kühlere Werte erscheinen blau/türkis, milde gelblich und wärmere orange/rot – ohne eine zweite Farbskala einzuführen.
- Die bisher oval verzerrt wirkenden Start-/Endmarker („Linsen“) wurden im Aktuell-Trend entfernt. Sie hatten keine zusätzliche meteorologische Bedeutung.
- Die stündlichen Hilfslinien sowie die mindestens 3-stündlichen Zeitmarken bleiben erhalten und sind nun exakt zur Skybar ausgerichtet.
- Der in v0.9.85.61 korrigierte Footer-/Bottom-Bar-Abstand bleibt unverändert: Bottom-Bar-Clearance wird nur einmal reserviert.
- Skybar-/Stundenquadrate-, Niederschlags-, Warnungs- und 90-Minuten-Fachlogik bleiben unverändert.

# MID v0.9.85.61

- Der große Leerraum zwischen dem letzten Wetterinhalt und dem App-Footer auf Smartphones wurde entfernt. Die Bottom-Bar-/Safe-Area-Reserve wird nicht mehr gleichzeitig in mehreren Layout-Ebenen sichtbar addiert.
- Der letzte Inhaltsblock folgt dem Footer wieder mit normalem MID-Seitenabstand; der notwendige Sicherheitsraum für die feste Bottom-Bar liegt ausschließlich hinter dem Footer beziehungsweise als Scroll-Padding für Fokus- und Sprungziele.
- Quellen- und Aktualitätsangaben im Prognose-Footer können auf kleinen Bildschirmen vollständig umbrechen und werden nicht mehr als abgeschnittener Einzeiler dargestellt.
- Der globale Footer reagiert auf schmale Gerätebreiten mit einer ruhigeren mehrzeiligen Anordnung für Version, Impressum und Quellen.
- Wetterdaten, Warnlogik, Skybar/Stundenquadrate und die 90-Minuten-Regel bleiben fachlich unverändert.

# MID v0.9.85.60

- Der 12-h-Temperaturtrend unter „Aktuell“ besitzt jetzt stündliche vertikale Hilfslinien und beschriftete Hauptzeitpunkte mindestens alle drei Stunden. Sichtbare Temperatur- und Trendwerte werden ganzzahlig dargestellt.
- Der aufgeklappte „Mehr“-Bereich unter „Aktuell“ ist als kompakter, klar gegliederter Informationsbereich für Atmosphäre, Umwelt und Astronomie gestaltet. Einzelwerte, UVI, Luftqualität, Sonnenschein und Sonne/Mond erhalten konsistente Flächen, Abstände und Typografie statt einer großen grauen Restfläche.
- Der erste Prognose-Untertab heißt jetzt „Ab jetzt“ statt „Kurzfrist“. Damit bleibt die Bottom-Bar „Heute“ das übergeordnete Ziel, während „Ab jetzt“ eindeutig die 90-Minuten-/24-h-Linse bezeichnet.
- Skybar-/Stundenquadrate-, Niederschlags- und 90-Minuten-Verträge bleiben fachlich unverändert.

# MID v0.9.85.59

- Favoriten reagieren auf Smartphones jetzt zuverlässig mit einem einzelnen Tap. Horizontales Wischen zum Scrollen und Ziehen am separaten Griff bleiben davon getrennt; die gesamte Favoritenkarte ist ein ausreichend großes Touchziel.
- Das MID-Logo wird im App-Kopf ohne zusätzliche Hintergrundkachel oder Schatten transparent eingebettet. Auf schmalen Geräten erscheint nur das kompakte Logo, auf breiteren Flächen weiterhin die horizontale Logo-Variante aus dem LogoSet.
- Wetterquadrate sind in den kompakten 12-h- und 90-min-Bereichen deutlich größer und klarer erkennbar.
- Sonne und Bewölkung nutzen nun innerhalb der bestehenden Skybar-Stufen deutlich unterscheidbare Gelb-/Grautöne; Niederschlagsart und -intensität bleiben an die bestehende MID-/DWD-Skybar-Logik gekoppelt.
- Der bisherige kleine Punkt für klare Nacht wurde entfernt. Klare Nacht wird nun als ruhige Flächenzelle dargestellt, damit keine zusätzliche, unklare Punktkodierung entsteht.
- Die bestehenden Verträge zu Skybar/Stundenquadraten, Niederschlagsphasen und exakt sechs vollständigen 15-Minuten-Intervallen der 90-Minuten-Kurzfrist bleiben unverändert.

# MID v0.9.85.58

- Der 12-h-Temperaturtrend unter „Aktuell“ besitzt jetzt eine klar erkennbare Zeitachse mit einfachen Hilfslinien; der Wetterstreifen ist bewusst flacher und ordnet sich der Temperaturkurve unter.
- In der 90-Minuten-Kurzfrist teilen Wetterstreifen, 15-Minuten-Zeitachse und die sechs Zeitschritt-Felder denselben horizontalen Raster- und Scrollraum. Damit bleiben Zeitpositionen auch auf schmalen Smartphones exakt synchron.
- Die sieben Tagesfelder der 7-Tage-Prognose werden im Hochformat nicht mehr in sieben Mini-Spalten gequetscht, sondern als vollständige, lesbare Tageszeilen dargestellt.
- Die bestehende stündliche Skybar-/Stundenquadrate-Logik sowie die exakt sechs vollständigen 15-Minuten-Intervalle der Kurzfrist bleiben fachlich unverändert.

# MID v0.9.85.57

- Die 90-Minuten-Kurzfrist beginnt jetzt am nächsten runden 15-Minuten-Zeitpunkt und umfasst exakt sechs vollständige 15-Minuten-Intervalle. Ein zusätzlicher Endpunkt dient nur der zeitlichen Orientierung und fließt nicht als siebtes Intervall in die 90-Minuten-Bilanz ein.
- Die gewählte Stundenanzeige „Skybar“ oder „Stundenquadrate“ gilt nun auch im 12-h-Trend unter „Aktuell“, im 24-h-Wetterprofil, in der 7-Tage-Kurvenübersicht und in den einzelnen Tageskarten.
- In der 90-Minuten-Ansicht zeigt MID die Wetterzustandsentwicklung passend zur Auswahl als 15-Minuten-Wetterstreifen oder als sechs 15-Minuten-Quadrate. Sonne, Bewölkung sowie Niederschlagsart und -intensität stammen aus derselben MID-/DWD-Logik; eine zeitliche Normalisierung findet nicht statt.
- Ortszeit und Zeitzone bleiben auf schmalen Smartphone-Breiten zusammen, sodass z. B. „GMT+2“ nicht mehr isoliert in eine neue Zeile fällt.
- Stundenquadrate skalieren in längeren Mehrtagesansichten so, dass einzelne Zellen nicht überlappen; die reduzierte Wetterzustandsleiste bleibt auch auf schmalen Geräten kompakt.

# MID v0.9.85.56

- Der mobile Radar-Nowcast in „Aktuell“ wurde neu ausbalanciert: Beschreibungstexte werden nicht mehr abgeschnitten, die 5-Minuten-Grafik erhält deutlich mehr Höhe und Achsen-, Uhrzeit- sowie Quantilangaben kollidieren nicht mehr mit den Niederschlagsbalken.
- Das technische Nowcast-Detailfenster nutzt auf Smartphones die verfügbare Breite besser. Begriffe und Werte wie „Standorttreffer“, „Wachstum/Zerfall“ oder die Mengenbasis brechen nicht mehr mitten im Wort um.
- Schriftgrößen und Zeilenhöhen im Niederschlags-/Nowcast-Bereich wurden angehoben, ohne die Karte unnötig zu vergrößern.
- Unter Einstellungen gibt es neu „Stundenanzeige“ mit den Optionen „Skybar“ und „24 Stundenquadrate“. Die bisherige Skybar bleibt Standard.
- Die Stundenquadrate verwenden exakt dieselbe MID-/DWD-Logik für Sonne, Bewölkung, Niederschlagsphase und Intensität wie die Skybar. Jede verfügbare Einzelstunde bleibt eine eigene Zelle; es gibt keine Normalisierung oder Mehrstunden-Zusammenfassung.
- Die ausgewählte Stunde wird in der Quadratansicht klar markiert; Light und Dark verwenden kontrastangepasste Zellränder.
- Alle Schutzregeln aus v0.9.85.50–55 bleiben bestehen, insbesondere Taupunkt primär, Bottom-Bar/Safe-Area, Favoriten, kein horizontaler Overflow und die vollständige stündliche Wetterauflösung.
- Keine meteorologische Datenlogik, Warnsemantik oder Niederschlagsklassifikation wurde verändert.

# MID v0.9.85.55

- Die mobile Bottom-Bar erhält eine ruhigere optische Abschlusszone und mehr Scroll-/Inhaltsreserve, ohne ihre Position oder Funktion zu verändern.
- Auf schmalen Smartphones wirken lange Inhalte dadurch weniger so, als würden sie direkt unter der Navigation weiterlaufen.
- Gezeitenereignisse werden auf kleinen Phones als horizontale Snap-Reihe dargestellt statt als gedrängtes 2×2-Raster; Werte und Zeiten bleiben vollständig lesbar.
- Header und Favoritenleiste sind flacher und ruhiger gestaltet: weniger Schatten, keine starke äußere Karten-/Pillenfassung, dafür feine Trennlinien und eine dezente aktive Markierung.
- Ortsname, Suche, Favoriten-Vollständigkeit, Favoritenverwaltung und Bottom-Bar-Signatur bleiben unverändert funktionsfähig.
- Die Schutzregeln aus v0.9.85.50–54 bleiben bestehen: Niederschlagslesbarkeit, ruhiger mobiler Kartenhintergrund, Taupunkt primär, C9-Forecast-Scroll, kein horizontaler Overflow und 24-stündige nicht normalisierte Skybar.
- Keine meteorologische Datenlogik, Tide-Zeitskala oder Warnsemantik wurde verändert.

# MID v0.9.85.54

- Aktuell, Vorhersage und Tide/Wasser wurden optisch weiter an die ruhigere Hierarchie von Meteogramm, Radar und Warnungen angeglichen.
- In „Aktuell“ bleibt die Wetter-Hauptfläche klar dominant; die nachgelagerten Metriken wirken nun als flacher Instrumentstreifen statt als zweite große Karte.
- In der Vorhersage sind ausgewählter Tag, Zeitlupe und Quellen-/Diagnostikbereich als eingebettete Sekundärsektionen gestaltet und treten hinter den eigentlichen Forecast-Flow zurück.
- Im Wasser-/Tide-Bereich werden Pegel-, Messwert- und Metadatengruppen weiter entgewichtet; Gezeitenereignisse und Wasser-/Tide-Signal bleiben visuell führend.
- Auf Smartphone, Tablet und Desktop werden starke Zusatzkonturen, Schatten und übergroße Rundungen in diesen Sekundärbereichen reduziert, ohne Informationen auszublenden.
- Die Schutzregeln aus v0.9.85.50–53 bleiben bestehen: mobile Niederschlagslesbarkeit, ruhiger Kartenhintergrund, Bottom-Bar/Safe-Area, Taupunkt primär, Favoriten, kein horizontaler Overflow und 24-stündige nicht normalisierte Skybar.
- Keine meteorologische Datenlogik, fachliche Zeitskala oder Warnsemantik wurde verändert.

# MID v0.9.85.53

- App-weite Typografie überarbeitet: Mikrotexte in Labels, Quellenstatus, Warnzeitbahn, Wasser-/Meteogramm-Metadaten und Bedienelementen erhalten eine höhere, konsistente Lesbarkeitsbasis.
- Versalsatz und Zeichenabstände werden zurückgenommen, damit die Oberfläche weniger technisch und gedrängt wirkt.
- Wichtige Status- und Wetterinformationen dürfen auf schmalen Geräten umbrechen, statt durch Ellipsen oder weitere Schriftverkleinerung verloren zu gehen.
- Bedienelemente in Vorhersage, Radar/Karten, Meteogramm und Wasser erhalten einheitlichere Schriftgrößen und Zeilenhöhen.
- Auf Touch-Geräten verhindern die wichtigsten Select-Felder mit 16-px-Schrift das automatische Safari-Zoomen beim Fokussieren.
- Die Schutzregeln aus v0.9.85.50–52 bleiben bestehen: Niederschlagslesbarkeit, ruhiger mobiler Kartenhintergrund, Bottom-Bar/Safe-Area, Taupunkt primär, Favoriten, kein horizontaler Overflow und 24-stündige nicht normalisierte Skybar.
- Keine meteorologische Datenlogik, fachliche Zeitskala oder Warnsemantik wurde verändert.

# MID v0.9.85.52

- Mobile Bottom-Bar-Freistellung app-weit vereinheitlicht: Der letzte Inhalt bleibt in Aktuell, Vorhersage, Tide/Wasser, Meteogramm, Radar/Karten und Warnungen oberhalb der fixierten Navigation plus Safe-Area erreichbar.
- Die bestehende C9-Scrollarchitektur der Vorhersage bleibt unverändert; die neue Reserve wird außerhalb der gemessenen Forecast-Arbeitsfläche gesetzt.
- Quellen-, Modell- und Aktualitätsinformationen bleiben vollständig vorhanden, treten im Normalzustand aber sichtbar hinter das Wettersignal zurück. Begrenzte, ausstehende oder gestörte Quellenzustände bleiben ausdrücklich hervorgehoben.
- Sekundärflächen werden weiter entgewichtet: 24-h-Metriken, Forecast-Detail, Warnzeitbahn, Wasser-Messwertgruppen, Meteogramm-Nebenblöcke und Radar-Zusatzsteuerungen nutzen ruhigere Hintergründe und weniger dominante Konturen.
- Schutzregeln aus v0.9.85.50/51 bleiben bestehen: Niederschlagslesbarkeit, ruhiger mobiler Kartenhintergrund, Taupunkt primär, Favoriten, kein horizontaler Overflow und 24-stündige nicht normalisierte Skybar.
- Keine meteorologische Datenlogik, Warnsemantik oder fachliche Zeitskala wurde verändert.

# MID v0.9.85.51

- Der Redesign-Schwerpunkt liegt nun app-weit stärker auf einer klaren fachlichen Primärfläche statt auf vielen gleichgewichtigen Karten.
- Vorhersage: Horizontwahl kompakter, aktive Tages-/Zeitraumflächen deutlicher hervorgehoben, Kontext- und Quellenbereiche optisch nachgeordnet.
- Meteogramm: Diagramme erhalten mehr visuelles Gewicht; Steuerung, Datenquelle und einzelne Diagrammblöcke sind als zusammenhängender Analysebereich statt als Kartenstapel gestaltet.
- Radar/Karten: Die Karte wird deutlich als Hauptarbeitsfläche priorisiert; Schnellwahl, erweiterte Layersteuerung und Legende treten optisch zurück.
- Warnungen: Warnstatus und amtliche Warnungen stehen klar vor Zeitbahn und ergänzenden MID-Hinweisen; „Quelle nicht verfügbar“ bleibt sichtbar von „keine Warnung“ getrennt.
- Tide/Wasser: Eignung sowie Tide-/Wasserinformation werden priorisiert; die zahlreichen Messwertkarten werden zu ruhigeren Gruppen zusammengeführt.
- Die Schutzregeln aus v0.9.85.50 bleiben bestehen: mobile Niederschlagslesbarkeit, ruhiger Kartenhintergrund, Bottom-Bar/Safe-Area, Taupunkt primär, Favoriten, kein horizontaler Overflow und 24-stündige nicht normalisierte Skybar.
- Keine meteorologische Datenlogik, fachliche Zeitachse oder Warnsemantik wurde verändert.

# MID v0.9.85.50

- Die mobile Niederschlagsfläche in „Aktuell“ ist wieder vollständig und ruhig lesbar: Beschriftung und Hauptwert stehen klar getrennt, die Zusammenfassung erhält die volle verfügbare Breite und Quellen-/Detailtext wird nicht mehr abgeschnitten.
- Die bisherige enge 104-Pixel-Aufteilung des trockenen Niederschlagsstatus entfällt auf Smartphones; die Darstellung bleibt kompakt, ohne Text oder Werte zusammenzuquetschen.
- Die rein dekorative helle Ecke im oberen Bereich der aktuellen Wetterkarte wird auf Smartphones entfernt. Hinter Temperatur, Beschreibung und Messwerten liegt nun eine ruhige, kontrastreiche Fläche.
- Die 24-Stunden-Skybar bleibt vollständig stündlich und unverändert unnormalisiert. Bottom-Bar/Safe-Area, Favoriten sowie Taupunkt als primärer Feuchteparameter bleiben erhalten.
- Replit-Sichtprüfung: 390×844 und 430×932 jeweils Light/Dark sowie Tablet hoch/quer und Desktop bestanden.

# MID v0.9.85.49

- Die mobile Vorhersage erhält einen eigenen, sauber begrenzten Scrollbereich oberhalb der dauerhaft sichtbaren Bottom-Bar. Tageskarten und Detailinhalte werden dadurch nicht mehr von der Navigation überdeckt.
- Die verfügbare Höhe wird aus der tatsächlichen Position der Bottom-Bar berechnet und bei Größen- oder Layoutänderungen neu angepasst; iOS-Safe-Area und unterschiedliche Smartphone-Höhen werden berücksichtigt.
- Favoriten, Ortskopf und die bereits reparierte Niederschlagsdarstellung bleiben unverändert sichtbar; es entstehen keine zusätzlichen unbegründeten Leerflächen.
- Taupunkt bleibt der primäre Feuchteparameter, die relative Feuchte nachgeordnet. Die Skybar bleibt vollständig stündlich mit 24 Positionen und wird nicht normalisiert.
- Light/Dark und die bestehenden meteorologischen Datenpfade bleiben unverändert; die Korrektur betrifft die mobile Komposition und Scrollgrenze.

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
